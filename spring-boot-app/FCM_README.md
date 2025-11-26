# 🔔 Firebase Cloud Messaging (FCM) Integration

## ✅ Tính năng đã được tích hợp

Backend Spring Boot hiện đã có khả năng gửi **Push Notification** đến mobile app ngay cả khi app **không chạy** hoặc **đang ở background**.

---

## 📋 API Endpoints

### 1. Đăng ký Device Token
**Endpoint:** `POST /api/fcm/register`

**Request Body:**
```json
{
  "token": "your_fcm_device_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Token registered successfully",
  "timestamp": "2025-11-26T10:30:00"
}
```

**Mô tả:** Mobile app gọi API này khi khởi động để đăng ký FCM token.

---

### 2. Hủy Đăng ký Token
**Endpoint:** `POST /api/fcm/unregister`

**Request Body:**
```json
{
  "token": "your_fcm_device_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": "Token unregistered successfully",
  "timestamp": "2025-11-26T10:35:00"
}
```

---

### 3. Test Gửi Notification
**Endpoint:** `POST /api/fcm/test`

**Request Body (Gửi đến 1 device):**
```json
{
  "title": "Test Notification",
  "body": "This is a test message",
  "token": "specific_device_token",
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Request Body (Gửi đến topic):**
```json
{
  "title": "🔥 CẢNH BÁO CHÁY",
  "body": "Phát hiện cháy tại khu vực A",
  "topic": "fire_alerts",
  "data": {
    "type": "fire_alert",
    "sensor_value": "850",
    "priority": "high"
  }
}
```

**Request Body (Gửi đến tất cả devices):**
```json
{
  "title": "Thông báo hệ thống",
  "body": "Bảo trì hệ thống lúc 23:00"
}
```

---

### 4. Lấy Số Lượng Devices Đã Đăng Ký
**Endpoint:** `GET /api/fcm/devices/count`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  },
  "timestamp": "2025-11-26T10:40:00"
}
```

---

### 5. Health Check (đã cập nhật)
**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "mqtt": true,
    "websocket": 3,
    "uptime": 12345,
    "fcm_registered_devices": 5
  },
  "timestamp": "2025-11-26T10:45:00"
}
```

---

## 🔥 Tự động gửi Push Notification

Hệ thống sẽ **TỰ ĐỘNG** gửi FCM notification khi:

### 1. Phát hiện Cháy (Fire Alert)
- **Trigger:** Nhận MQTT message với level = "critical" hoặc "warning" và chứa từ khóa "cháy", "fire", "lửa"
- **Notification:**
  - **Title:** "🔥 CẢNH BÁO CHÁY!"
  - **Body:** Nội dung từ MQTT message
  - **Data:**
    ```json
    {
      "type": "fire_alert",
      "message": "Phát hiện cháy! Fire Sensor: 850",
      "sensor_value": "850",
      "timestamp": "1732596000000",
      "priority": "high"
    }
    ```

### 2. Phát hiện Gas (Gas Alert)
- **Trigger:** Nhận MQTT message với level = "critical" hoặc "warning" và chứa từ khóa "gas", "MQ2"
- **Notification:**
  - **Title:** "⚠️ CẢNH BÁO KHÍ GAS!"
  - **Body:** Nội dung từ MQTT message
  - **Data:**
    ```json
    {
      "type": "gas_alert",
      "message": "Phát hiện khí gas! MQ2: 1250",
      "sensor_value": "1250",
      "timestamp": "1732596000000",
      "priority": "high"
    }
    ```

---

## 📱 Mobile App Integration

### Bước 1: Cài đặt Firebase SDK
```gradle
// Android app/build.gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

### Bước 2: Lấy FCM Token
```kotlin
// Kotlin
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val token = task.result
        // Gửi token lên backend
        registerTokenToBackend(token)
    }
}
```

```java
// Java
FirebaseMessaging.getInstance().getToken()
    .addOnCompleteListener(task -> {
        if (task.isSuccessful()) {
            String token = task.getResult();
            // Gửi token lên backend
            registerTokenToBackend(token);
        }
    });
```

### Bước 3: Đăng ký Token với Backend
```kotlin
fun registerTokenToBackend(token: String) {
    val request = mapOf("token" to token)
    
    apiService.registerFcmToken(request)
        .enqueue(object : Callback<ApiResponse> {
            override fun onResponse(call: Call<ApiResponse>, response: Response<ApiResponse>) {
                Log.d("FCM", "Token registered successfully")
            }
            override fun onFailure(call: Call<ApiResponse>, t: Throwable) {
                Log.e("FCM", "Failed to register token", t)
            }
        })
}
```

### Bước 4: Subscribe vào Topic
```kotlin
// Subscribe vào topic "fire_alerts" để nhận tất cả cảnh báo
FirebaseMessaging.getInstance().subscribeToTopic("fire_alerts")
    .addOnCompleteListener { task ->
        if (task.isSuccessful) {
            Log.d("FCM", "Subscribed to fire_alerts topic")
        }
    }
```

### Bước 5: Handle Notification
```kotlin
class MyFirebaseMessagingService : FirebaseMessagingService() {
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Nhận được notification
        val title = remoteMessage.notification?.title
        val body = remoteMessage.notification?.body
        val data = remoteMessage.data
        
        // Hiển thị notification hoặc xử lý logic
        when (data["type"]) {
            "fire_alert" -> handleFireAlert(data)
            "gas_alert" -> handleGasAlert(data)
            else -> showDefaultNotification(title, body)
        }
    }
    
    override fun onNewToken(token: String) {
        // Token mới được tạo -> gửi lên backend
        registerTokenToBackend(token)
    }
    
    private fun handleFireAlert(data: Map<String, String>) {
        // Show high priority notification
        // Play alarm sound
        // Vibrate
        // Open app to fire alert screen
    }
}
```

### Bước 6: AndroidManifest.xml
```xml
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>

<!-- Notification channel for high priority alerts -->
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="fire_alert_channel" />
```

---

## 🧪 Testing với Postman

### Test 1: Đăng ký Token
```bash
POST http://localhost:8080/api/fcm/register
Content-Type: application/json

{
  "token": "test_device_token_12345"
}
```

### Test 2: Gửi Test Notification
```bash
POST http://localhost:8080/api/fcm/test
Content-Type: application/json

{
  "title": "🔥 TEST CẢNH BÁO CHÁY",
  "body": "Đây là test notification",
  "topic": "fire_alerts",
  "data": {
    "type": "fire_alert",
    "sensor_value": "999"
  }
}
```

### Test 3: Check Devices Count
```bash
GET http://localhost:8080/api/fcm/devices/count
```

---

## 🔍 Logs để Debug

Khi backend gửi FCM notification, bạn sẽ thấy logs:

```
2025-11-26 10:50:15 - 📱 Registered device token: test_device_token_1...
2025-11-26 10:50:15 - ✅ Subscribed to topic 'fire_alerts'. Success: 1, Failure: 0
2025-11-26 10:51:20 - 🔔 FCM notification sent to topic 'fire_alerts'. Response: projects/iot-fire-detecion/messages/...
2025-11-26 10:51:20 - 🔥 FCM Fire Alert sent: Phát hiện cháy! Fire Sensor: 850
```

---

## 📝 Notes

1. **Google Services JSON**: File `firebase-credentials.json` đã được copy vào `src/main/resources/`
2. **Firebase Admin SDK**: Version 9.3.0 đã được thêm vào `pom.xml`
3. **Auto-reconnect**: Firebase sẽ tự động retry nếu gửi thất bại
4. **Topic-based**: Recommend sử dụng topic `fire_alerts` thay vì gửi riêng từng device (hiệu quả hơn)
5. **High Priority**: Android notification được set priority = MAX để đảm bảo hiển thị ngay cả khi app không chạy

---

## ⚠️ Quan trọng

- Mobile app **PHẢI** gọi `/api/fcm/register` mỗi khi app khởi động
- Mobile app **NÊN** subscribe vào topic `fire_alerts` để nhận tất cả cảnh báo
- Token có thể expire → handle `onNewToken()` callback
- Test trên thiết bị thật, emulator có thể không nhận được notification

---

## 🎯 Kết luận

✅ Backend đã hoàn thành tích hợp FCM
✅ Tự động gửi push notification khi có cảnh báo cháy/gas
✅ API endpoints sẵn sàng cho mobile app
✅ Hỗ trợ cả individual device và topic-based notification

Mobile team chỉ cần implement phần nhận notification là xong! 🚀
