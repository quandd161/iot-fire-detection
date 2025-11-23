# 🚀 QUICK START GUIDE

## Khởi động nhanh trong 3 bước

### 🖥️ Windows
```bash
# Bước 1: Mở terminal trong thư mục iot_web
cd c:\Users\admin\Desktop\iot_web

# Bước 2: Chạy script khởi động
start.bat

# Hoặc thủ công:
npm install
npm start
```

### 🐧 Linux/Mac
```bash
# Bước 1: Mở terminal trong thư mục iot_web
cd ~/Desktop/iot_web

# Bước 2: Cấp quyền thực thi
chmod +x start.sh

# Bước 3: Chạy script
./start.sh

# Hoặc thủ công:
npm install
npm start
```

---

## 🌐 Truy cập hệ thống

Sau khi server khởi động thành công:

1. **Dashboard chính:** http://localhost:3000
2. **Test Panel:** http://localhost:3000/test.html

---

## 📡 Cấu hình MQTT (Tùy chọn)

Mặc định hệ thống sử dụng public broker: `broker.hivemq.com`

Để sử dụng broker khác, chỉnh sửa file `.env`:

```env
MQTT_BROKER=mqtt://your-broker.com
MQTT_USER=your_username
MQTT_PASS=your_password
```

**Popular MQTT Brokers:**
- `mqtt://broker.hivemq.com` (Default)
- `mqtt://test.mosquitto.org`
- `mqtt://broker.emqx.io`

---

## 🔌 Kết nối ESP32/Arduino

### 1. Cài đặt Arduino code
Xem chi tiết trong: **MQTT_GUIDE.md**

### 2. Cấu hình WiFi & MQTT
```cpp
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* MQTT_SERVER = "broker.hivemq.com";
```

### 3. Upload code lên ESP32

### 4. Kiểm tra kết nối
- Mở Serial Monitor (115200 baud)
- Kiểm tra dashboard tại http://localhost:3000

---

## ✅ Kiểm tra hệ thống

### Test không cần phần cứng:

1. Truy cập: http://localhost:3000/test.html
2. Nhấn các nút test để kiểm tra:
   - ✅ Server connection
   - ✅ WebSocket connection
   - ✅ API endpoints

### Test với MQTT Client (không cần ESP32):

Sử dụng **MQTT Explorer** hoặc **MQTT.fx**:

1. Kết nối đến broker: `broker.hivemq.com:1883`
2. Publish test data:
   - Topic: `gas/sensor/mq2`
   - Message: `3500`
3. Xem kết quả trên dashboard

---

## 📚 Tài liệu đầy đủ

- **README.md** - Hướng dẫn chi tiết dự án
- **MQTT_GUIDE.md** - Tích hợp ESP32/Arduino
- **CHANGELOG.md** - Lịch sử phiên bản

---

## 🆘 Gặp vấn đề?

### Server không khởi động
```bash
# Kiểm tra Node.js đã cài đặt chưa
node --version

# Cài đặt lại dependencies
npm install
```

### Không kết nối được MQTT
- Kiểm tra internet connection
- Thử broker khác trong file `.env`
- Kiểm tra firewall

### Dashboard không hiển thị dữ liệu
- Kiểm tra ESP32 đã kết nối WiFi chưa
- Kiểm tra MQTT topics có đúng không
- Mở browser console (F12) để xem lỗi

---

## 🎯 Checklist hoàn thành

- [ ] Server đã khởi động (http://localhost:3000)
- [ ] Dashboard hiển thị đúng
- [ ] WebSocket connected (màu xanh)
- [ ] Test Panel hoạt động
- [ ] ESP32 đã upload code
- [ ] ESP32 kết nối WiFi thành công
- [ ] Dữ liệu hiển thị trên dashboard
- [ ] Điều khiển relay/servo hoạt động

---

**🎉 Chúc mừng! Hệ thống của bạn đã sẵn sàng!**

Need help? Check README.md for detailed documentation.
