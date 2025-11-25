# Gas Detection System - Spring Boot Backend

Hệ thống backend Java Spring Boot cho giám sát khí gas & lửa với **MQTT + WebSocket + REST API**.

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                      ESP32 IoT Device                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  MQ2 Gas │  │   Fire   │  │  Relay   │  │  Servo   │       │
│  │  Sensor  │  │  Sensor  │  │  Module  │  │  Window  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       └─────────────┴─────────────┴─────────────┘              │
│                         │                                       │
│                    MQTT Client                                  │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │ MQTT Broker  │
                  │ (Mosquitto)  │
                  │ Port: 1883   │
                  └──────┬───────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Spring Boot Backend (Port 8080)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  REST API Controllers                                     │  │
│  │  • GET  /api/data         - Lấy dữ liệu sensor           │  │
│  │  • POST /api/control/*    - Điều khiển thiết bị          │  │
│  │  • GET  /api/notifications - Lấy thông báo               │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                             │
│  ┌────────────────┴─────────────────────────────────────────┐  │
│  │  MQTT Service (Eclipse Paho)                            │  │
│  │  • Subscribe: gas/sensor/*, gas/status/*                │  │
│  │  • Publish: gas/control/*, gas/notification             │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                             │
│  ┌────────────────┴─────────────────────────────────────────┐  │
│  │  WebSocket Service (/ws)                                │  │
│  │  • Broadcast real-time data to clients                  │  │
│  │  • Send notifications to all connected clients          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼ WebSocket + REST API
               ┌──────────────────────────┐
               │  React Frontend (Port 3000)  │
               │  - Độc lập, riêng biệt       │
               │  - Connect qua API & WS      │
               └──────────────────────────────┘
```

## 📁 Cấu trúc dự án

```
spring-boot-app/
├── src/main/java/com/iot/gasdetection/
│   ├── GasDetectionApplication.java       # Main application
│   ├── config/
│   │   ├── MqttProperties.java            # MQTT configuration
│   │   └── WebSocketConfig.java           # WebSocket configuration
│   ├── controller/
│   │   └── ApiController.java             # REST API endpoints
│   ├── model/
│   │   ├── SensorData.java                # Sensor data model
│   │   ├── Notification.java              # Notification model
│   │   ├── ApiResponse.java               # API response wrapper
│   │   └── WebSocketMessage.java          # WebSocket message model
│   ├── service/
│   │   ├── MqttService.java               # MQTT client service
│   │   └── WebSocketService.java          # WebSocket broadcast service
│   ├── websocket/
│   │   └── SensorWebSocketHandler.java    # WebSocket handler
│   └── listener/
│       └── WebSocketEventListener.java    # WebSocket event listener
├── src/main/resources/
│   └── application.properties             # Spring Boot configuration
├── pom.xml                                # Maven configuration
└── README.md
```

> **Lưu ý**: Frontend React là project riêng biệt tại `../gas-detection-frontend/`

## 🚀 Công nghệ sử dụng

### Backend
- **Java 17** - Programming language
- **Spring Boot 3.2.0** - Backend framework
- **Spring WebSocket** - Real-time communication
- **Eclipse Paho MQTT** - MQTT client library
- **Spring Integration MQTT** - MQTT integration
- **Lombok** - Boilerplate code reduction
- **Maven** - Build tool

### Frontend
- **React 18** - UI framework
- **Chart.js 4.4** - Data visualization
- **react-chartjs-2** - React wrapper for Chart.js
- **WebSocket API** - Real-time connection
- **Context API** - State management
- **CSS Modules** - Component styling

### IoT Hardware
- **ESP32** - Microcontroller
- **MQ2 Gas Sensor** - Gas detection
- **Flame Sensor** - Fire detection
- **2-Channel Relay Module** - Fan & pump control
- **Servo Motor** - Window automation
- **Active Buzzer** - Sound alarm
- **LCD1602 I2C** - Display

## 📋 Yêu cầu hệ thống

- **JDK 17+** - Java Development Kit
- **Maven 3.6+** - Build tool
- **Node.js 18+** - For React development
- **npm 9+** - Package manager
- **MQTT Broker** (Mosquitto) - Running on `192.168.1.19:1883`
- **ESP32** với firmware đã flash

## 🔧 Cài đặt & Chạy

### 1. Clone repository

```bash
git clone <repository-url>
cd spring-boot-app
```

### 2. Cấu hình MQTT Broker

Cập nhật file `src/main/resources/application.properties`:

```properties
# MQTT Configuration
mqtt.broker.url=tcp://192.168.1.19:1883
mqtt.client.id=spring-boot-gas-detection
mqtt.username=
mqtt.password=
mqtt.topics.subscribe=gas/#
mqtt.topics.notification=gas/notification
```

### 3. Build & Run (Production)

**Bước 1: Build React frontend**

```bash
# Windows PowerShell
.\build-frontend.ps1

# Hoặc build manual
cd frontend
npm run build
cd ..
```

**Bước 2: Run Spring Boot**

```bash
# Build Spring Boot
mvn clean install -DskipTests

# Run ứng dụng
mvn spring-boot:run

# Hoặc run file JAR
java -jar target/gas-detection-system-1.0.0.jar
```

Truy cập: **http://localhost:8080**

**Cách 2: Development mode**

**Terminal 1 - Spring Boot Backend:**
```bash
mvn spring-boot:run
```

**Terminal 2 - React Frontend:**
```bash
cd frontend
npm install
npm start
```

- Backend: http://localhost:8080
- Frontend dev: http://localhost:3000 (auto proxy to backend)

### 4. Quá trình Build

**Script build-frontend.ps1 sẽ:**

1. ✅ Build React app: `npm run build` trong `frontend/`
2. ✅ Copy `frontend/build/` vào `src/main/resources/static/`
3. ✅ Spring Boot sẽ serve React từ `/static` khi chạy

**Lưu ý:**
- React development server: Port **3000**
- Spring Boot backend: Port **8080**
- Production: Chỉ cần port **8080** (React build served từ Spring Boot)

## 🎯 API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data` | Lấy dữ liệu sensor hiện tại |
| GET | `/api/notifications` | Lấy danh sách thông báo |
| POST | `/api/control/relay1` | Bật/tắt quạt hút |
| POST | `/api/control/relay2` | Bật/tắt máy bơm |
| POST | `/api/control/window` | Mở/đóng cửa sổ |
| POST | `/api/control/buzzer` | Bật/tắt còi |
| POST | `/api/control/mode` | Đổi chế độ AUTO/MANUAL |
| POST | `/api/control/threshold` | Đặt ngưỡng cảnh báo |
| GET | `/api/health` | Kiểm tra health status |

### WebSocket

- **Endpoint**: `ws://localhost:8080/ws`
- **Message Types**:
  - `data` - Dữ liệu sensor real-time
  - `notification` - Thông báo mới
  - `notifications` - Danh sách thông báo

## 📊 MQTT Topics

### Subscribe (Backend)
- `gas/sensor/mq2` - Giá trị MQ2 sensor
- `gas/sensor/fire` - Trạng thái cảm biến lửa
- `gas/status/relay1` - Trạng thái relay 1
- `gas/status/relay2` - Trạng thái relay 2
- `gas/status/window` - Trạng thái cửa sổ
- `gas/status/buzzer` - Trạng thái còi
- `gas/status/mode` - Chế độ hoạt động
- `gas/status/threshold` - Ngưỡng cảnh báo

### Publish (Backend → ESP32)
- `gas/control/relay1` - Điều khiển relay 1
- `gas/control/relay2` - Điều khiển relay 2
- `gas/control/window` - Điều khiển cửa sổ
- `gas/control/buzzer` - Điều khiển còi
- `gas/control/mode` - Thay đổi chế độ
- `gas/control/threshold` - Cập nhật ngưỡng

### Publish (ESP32 → Backend)
- `gas/notification` - Thông báo cảnh báo

## 🎨 Tính năng Frontend (React)

### Components

1. **Header**
   - Hiển thị trạng thái kết nối WebSocket
   - Toggle chế độ AUTO/MANUAL
   - Animation shimmer effect

2. **SensorCards**
   - 3 cards: Gas sensor, Fire sensor, Threshold
   - Real-time value updates
   - Status indicators (Safe/Warning/Danger)
   - Draggable threshold slider

3. **GasChart**
   - Line chart với Chart.js
   - 30 data points (5 phút)
   - Update throttle: 10 giây
   - Dual axis: Gas value & Threshold

4. **Statistics**
   - Thống kê 30 phút (180 data points)
   - Trung bình, Max, Min
   - Số lần vượt ngưỡng
   - Auto-calculate từ all data points

5. **ControlPanel**
   - 4 thiết bị: Quạt, Bơm, Cửa sổ, Còi
   - Action-based buttons (hiển thị hành động sẽ thực hiện)
   - Threshold setting
   - Hover effects

6. **NotificationPanel**
   - Scrollable notification list
   - Max 50 notifications
   - Clear all function
   - Slide-in animation

### State Management

- **WebSocketContext**: Quản lý kết nối WebSocket & state toàn ứng dụng
- **Auto-reconnect**: Tự động kết nối lại sau 3 giây
- **Local state**: Component-level state cho dragging, local threshold

## 🔍 So sánh với phiên bản cũ

| Feature | Node.js (Cũ) | Spring Boot + React (Mới) |
|---------|--------------|---------------------------|
| **Backend** | Express.js | Spring Boot 3.2 |
| **Frontend** | Vanilla JS | React 18 |
| **State Management** | Global variables | React Context API |
| **Chart** | Chart.js trực tiếp | react-chartjs-2 |
| **WebSocket** | ws package | Spring WebSocket |
| **MQTT** | mqtt.js | Eclipse Paho |
| **Type Safety** | Không | Java strongly typed |
| **Build Process** | Manual copy | Maven integrated build |
| **Production Deploy** | Separate servers | Single JAR file |
| **Hot Reload** | nodemon | Spring DevTools + React HMR |
| **Component Reuse** | Copy-paste | React components |
| **Testing** | Manual | JUnit + React Testing Library |

## 🐛 Troubleshooting

### MQTT không kết nối được

```bash
# Kiểm tra MQTT broker
mosquitto -v

# Test kết nối
mosquitto_sub -h 192.168.1.19 -t gas/#
```

### WebSocket không kết nối

- Kiểm tra backend đã chạy: `http://localhost:8080/api/health`
- Kiểm tra CORS configuration trong `WebSocketConfig.java`
- Xem console browser để check lỗi WebSocket

### React build lỗi

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Maven build lỗi Lombok

- Lombok errors trong IDE là false positive
- Build vẫn thành công với Maven
- Install Lombok plugin cho IDE nếu cần

### Port 3000 đã được sử dụng

```properties
# Đổi port trong application.properties
server.port=8080
```

Cập nhật WebSocket URL trong `frontend/src/context/WebSocketContext.js`:
```javascript
const wsUrl = `ws://${window.location.hostname}:8080/ws`;
```

## 📝 Development Workflow

### Thêm component mới

```bash
cd frontend/src/components
# Tạo MyComponent.js và MyComponent.css
# Import vào App.js
```

### Thêm API endpoint mới

1. Thêm method trong `ApiController.java`
2. Thêm function trong `frontend/src/services/api.js`
3. Gọi từ component

### Deploy Production

```bash
# Build full stack
mvn clean package

# Copy JAR đến server
scp target/gas-detection-system-1.0.0.jar user@server:/opt/app/

# Run trên server
java -jar gas-detection-system-1.0.0.jar
```

## 📄 License

MIT License - Free to use for educational purposes

## 👨‍💻 Author

IoT Gas Detection System - 2025

---

**🔥 Happy Coding! 🔥**
