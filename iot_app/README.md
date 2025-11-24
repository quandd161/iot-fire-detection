# 📱 IoT Fire Detection App

Ứng dụng di động Flutter dành cho hệ thống phát hiện khí gas và cảnh báo cháy nổ IoT. Ứng dụng này kết nối với Backend Server để giám sát dữ liệu thời gian thực từ các cảm biến và điều khiển các thiết bị ngoại vi.

## ✨ Tính năng chính

*   **Giám sát thời gian thực**:
    *   Hiển thị nồng độ khí Gas (MQ2) theo thời gian thực.
    *   Cảnh báo trạng thái Lửa (Fire Sensor).
    *   Biểu đồ nồng độ khí Gas trực quan.
*   **Điều khiển thiết bị**:
    *   Bật/Tắt Relay 1 & Relay 2 (Quạt, Còi báo động...).
    *   Đóng/Mở cửa sổ tự động.
    *   Chuyển đổi chế độ hoạt động: **Tự động (AUTO)** hoặc **Thủ công (MANUAL)**.
*   **Cài đặt ngưỡng**:
    *   Thiết lập ngưỡng cảnh báo nồng độ khí Gas (ppm).
    *   Thanh trượt điều chỉnh trực quan.
*   **Thông báo & Lịch sử**:
    *   Nhận thông báo cảnh báo tức thời.
    *   Xem lịch sử các cảnh báo gần nhất.
*   **Giao diện hiện đại**:
    *   Thiết kế đẹp mắt, thân thiện người dùng.
    *   Hiệu ứng Loading và phản hồi trạng thái rõ ràng.

## 🛠️ Công nghệ sử dụng

*   **Framework**: [Flutter](https://flutter.dev/) (Dart)
*   **State Management**: [Provider](https://pub.dev/packages/provider)
*   **Giao tiếp mạng**:
    *   HTTP REST API (`http` package)
    *   WebSocket (`web_socket_channel` package)
*   **Biểu đồ**: [fl_chart](https://pub.dev/packages/fl_chart)
*   **Font chữ**: [google_fonts](https://pub.dev/packages/google_fonts)

## 🚀 Cài đặt và Chạy ứng dụng

### 1. Yêu cầu tiên quyết

*   Đã cài đặt **Flutter SDK** (phiên bản mới nhất).
*   Đã cài đặt **Backend Server** (Node.js) và đang chạy (xem hướng dẫn trong thư mục `iot_web`).
*   Một thiết bị Android/iOS hoặc máy ảo (Emulator).

### 2. Cấu hình địa chỉ IP

Trước khi chạy, bạn **BẮT BUỘC** phải cấu hình địa chỉ IP của Server để App có thể kết nối được.

1.  Mở file `lib/constants.dart`.
2.  Tìm dòng `baseUrl` và `wsUrl`.
3.  Thay thế `192.168.73.103` bằng địa chỉ IP LAN của máy tính chạy Server của bạn.

```dart
class AppConstants {
  // Thay thế bằng IP máy tính của bạn
  static const String baseUrl = 'http://YOUR_IP_ADDRESS'; 
  static const String wsUrl = 'ws://YOUR_IP_ADDRESS:8080';
}
```

> **Lưu ý**: Nếu chạy trên máy ảo Android, bạn có thể dùng `10.0.2.2` để trỏ về máy host. Tuy nhiên, nếu test trên điện thoại thật, cả điện thoại và máy tính phải bắt chung một mạng Wifi và dùng IP LAN (ví dụ: `192.168.1.x`).

### 3. Cài đặt thư viện

Mở terminal tại thư mục `iot_app` và chạy:

```bash
flutter pub get
```

### 4. Chạy ứng dụng

Kết nối thiết bị hoặc bật máy ảo, sau đó chạy:

```bash
flutter run
```

## 📂 Cấu trúc thư mục

```
lib/
├── models/             # Các mô hình dữ liệu (SensorData, v.v.)
├── providers/          # Quản lý trạng thái (SensorProvider)
├── screens/            # Các màn hình giao diện (DashboardScreen)
├── services/           # Các dịch vụ giao tiếp (ApiService, WebSocketService)
├── constants.dart      # Các hằng số và cấu hình (IP, Port)
└── main.dart           # Điểm khởi chạy ứng dụng
```

## ❓ Xử lý sự cố thường gặp

**1. App báo "Connection error" hoặc không hiện dữ liệu?**
*   Kiểm tra xem Server (`npm start`) có đang chạy không.
*   Kiểm tra xem địa chỉ IP trong `lib/constants.dart` có đúng là IP máy tính của bạn không.
*   Đảm bảo điện thoại và máy tính đang kết nối cùng một mạng Wifi.
*   Tắt tường lửa (Firewall) trên máy tính nếu cần thiết.

**2. Nút bấm xoay Loading mãi không dừng?**
*   Điều này có nghĩa là App đã gửi lệnh nhưng chưa nhận được xác nhận từ Server.
*   Kiểm tra xem thiết bị phần cứng (ESP32) có đang kết nối và hoạt động không. Hệ thống được thiết kế để chỉ cập nhật trạng thái khi có xác nhận từ phần cứng.

**3. Biểu đồ không chạy?**
*   Biểu đồ chỉ chạy khi có dữ liệu mới từ Server gửi về qua WebSocket.
*   Kiểm tra kết nối WebSocket và đảm bảo thiết bị đang gửi dữ liệu lên.
