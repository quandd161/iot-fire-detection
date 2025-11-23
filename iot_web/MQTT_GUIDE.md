# 📡 MQTT Integration Guide - ESP32/Arduino

Hướng dẫn tích hợp hệ thống IoT Gas Detection với ESP32/Arduino qua MQTT.

## 📋 Yêu cầu phần cứng

### Cảm biến
- **MQ2 Gas Sensor** (Analog pin)
- **Fire Sensor** (Digital pin)

### Thiết bị điều khiển
- **2x Relay Module** (Digital pins)
- **1x Servo Motor** (PWM pin cho cửa sổ)

### Vi điều khiển
- **ESP32** hoặc **ESP8266**
- Kết nối WiFi

## 🔌 Sơ đồ kết nối

```
ESP32/ESP8266          Sensors & Actuators
    GPIO34 ──────────── MQ2 (Analog Output)
    GPIO25 ──────────── Fire Sensor (Digital)
    GPIO26 ──────────── Relay 1
    GPIO27 ──────────── Relay 2
    GPIO14 ──────────── Servo Motor (PWM)
    3.3V   ──────────── Sensors VCC
    GND    ──────────── Sensors GND
```

## 📚 Thư viện cần thiết

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <Servo.h>
#include <ArduinoJson.h>
```

### Cài đặt thư viện (Arduino IDE)
1. Mở **Tools > Manage Libraries**
2. Tìm và cài đặt:
   - `PubSubClient` by Nick O'Leary
   - `ArduinoJson` by Benoit Blanchon
   - `ESP32Servo` (cho ESP32)

## 🔧 Code mẫu đầy đủ

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// MQTT Configuration
const char* MQTT_SERVER = "broker.hivemq.com";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "ESP32_GasDetector_001";

// Pin Configuration
#define PIN_MQ2        34    // Analog pin for MQ2
#define PIN_FIRE       25    // Digital pin for Fire Sensor
#define PIN_RELAY1     26    // Relay 1
#define PIN_RELAY2     27    // Relay 2
#define PIN_SERVO      14    // Servo motor

// System Variables
int gasThreshold = 4000;
bool autoMode = true;
bool relay1State = false;
bool relay2State = false;
bool windowOpen = false;

unsigned long lastPublish = 0;
const long publishInterval = 2000; // Publish every 2 seconds

WiFiClient espClient;
PubSubClient mqtt(espClient);
Servo windowServo;

// ============================================================================
// Setup Functions
// ============================================================================

void setup() {
    Serial.begin(115200);
    Serial.println("🚀 Gas Detection System Starting...");
    
    // Initialize pins
    pinMode(PIN_FIRE, INPUT_PULLUP);
    pinMode(PIN_RELAY1, OUTPUT);
    pinMode(PIN_RELAY2, OUTPUT);
    
    // Initialize servo
    windowServo.attach(PIN_SERVO);
    windowServo.write(0); // Closed position
    
    // Initialize relay states
    digitalWrite(PIN_RELAY1, LOW);
    digitalWrite(PIN_RELAY2, LOW);
    
    // Connect to WiFi
    connectWiFi();
    
    // Setup MQTT
    mqtt.setServer(MQTT_SERVER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);
    mqtt.setBufferSize(512);
    
    Serial.println("✅ Setup Complete!");
}

// ============================================================================
// WiFi Connection
// ============================================================================

void connectWiFi() {
    Serial.print("Connecting to WiFi");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println();
    Serial.print("✅ WiFi Connected! IP: ");
    Serial.println(WiFi.localIP());
}

// ============================================================================
// MQTT Functions
// ============================================================================

void connectMQTT() {
    while (!mqtt.connected()) {
        Serial.print("Connecting to MQTT...");
        
        if (mqtt.connect(MQTT_CLIENT_ID)) {
            Serial.println(" ✅ Connected!");
            
            // Subscribe to control topics
            mqtt.subscribe("gas/control/relay1");
            mqtt.subscribe("gas/control/relay2");
            mqtt.subscribe("gas/control/window");
            mqtt.subscribe("gas/control/mode");
            mqtt.subscribe("gas/control/threshold");
            
            Serial.println("📡 Subscribed to all topics");
            
            // Publish initial status
            publishAllStatus();
        } else {
            Serial.print(" ❌ Failed, rc=");
            Serial.print(mqtt.state());
            Serial.println(" Retrying in 5s...");
            delay(5000);
        }
    }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String message = "";
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    
    Serial.print("📨 [");
    Serial.print(topic);
    Serial.print("] ");
    Serial.println(message);
    
    // Handle control commands
    if (String(topic) == "gas/control/relay1") {
        relay1State = (message == "1");
        digitalWrite(PIN_RELAY1, relay1State ? HIGH : LOW);
        mqtt.publish("gas/status/relay1", relay1State ? "1" : "0");
        Serial.println(relay1State ? "Relay 1 ON" : "Relay 1 OFF");
    }
    else if (String(topic) == "gas/control/relay2") {
        relay2State = (message == "1");
        digitalWrite(PIN_RELAY2, relay2State ? HIGH : LOW);
        mqtt.publish("gas/status/relay2", relay2State ? "1" : "0");
        Serial.println(relay2State ? "Relay 2 ON" : "Relay 2 OFF");
    }
    else if (String(topic) == "gas/control/window") {
        windowOpen = (message == "1");
        windowServo.write(windowOpen ? 90 : 0);
        mqtt.publish("gas/status/window", windowOpen ? "1" : "0");
        Serial.println(windowOpen ? "Window OPEN" : "Window CLOSED");
    }
    else if (String(topic) == "gas/control/mode") {
        autoMode = (message == "1");
        mqtt.publish("gas/status/mode", autoMode ? "1" : "0");
        Serial.println(autoMode ? "Mode: AUTO" : "Mode: MANUAL");
    }
    else if (String(topic) == "gas/control/threshold") {
        gasThreshold = message.toInt();
        if (gasThreshold < 200) gasThreshold = 200;
        if (gasThreshold > 9999) gasThreshold = 9999;
        mqtt.publish("gas/status/threshold", String(gasThreshold).c_str());
        Serial.print("Threshold set to: ");
        Serial.println(gasThreshold);
    }
}

// ============================================================================
// Sensor Reading
// ============================================================================

int readMQ2() {
    int rawValue = analogRead(PIN_MQ2);
    // Convert to ppm (simplified formula, adjust based on your sensor)
    int ppm = map(rawValue, 0, 4095, 0, 9999);
    return ppm;
}

bool readFireSensor() {
    // Fire sensor returns LOW when fire detected
    return digitalRead(PIN_FIRE) == LOW;
}

// ============================================================================
// Auto Control Logic
// ============================================================================

void autoControl(int gasValue, bool fireDetected) {
    if (!autoMode) return;
    
    bool shouldActivate = gasValue > gasThreshold || fireDetected;
    
    // Auto control relays
    if (shouldActivate && !relay1State) {
        relay1State = true;
        digitalWrite(PIN_RELAY1, HIGH);
        mqtt.publish("gas/status/relay1", "1");
        Serial.println("AUTO: Relay 1 ON");
    } else if (!shouldActivate && relay1State) {
        relay1State = false;
        digitalWrite(PIN_RELAY1, LOW);
        mqtt.publish("gas/status/relay1", "0");
        Serial.println("AUTO: Relay 1 OFF");
    }
    
    // Auto open window
    if (shouldActivate && !windowOpen) {
        windowOpen = true;
        windowServo.write(90);
        mqtt.publish("gas/status/window", "1");
        Serial.println("AUTO: Window OPEN");
    } else if (!shouldActivate && windowOpen) {
        windowOpen = false;
        windowServo.write(0);
        mqtt.publish("gas/status/window", "0");
        Serial.println("AUTO: Window CLOSED");
    }
}

// ============================================================================
// Publish Functions
// ============================================================================

void publishSensorData(int gasValue, bool fireDetected) {
    mqtt.publish("gas/sensor/mq2", String(gasValue).c_str());
    mqtt.publish("gas/sensor/fire", fireDetected ? "0" : "1");
}

void publishAllStatus() {
    mqtt.publish("gas/status/relay1", relay1State ? "1" : "0");
    mqtt.publish("gas/status/relay2", relay2State ? "1" : "0");
    mqtt.publish("gas/status/window", windowOpen ? "1" : "0");
    mqtt.publish("gas/status/mode", autoMode ? "1" : "0");
    mqtt.publish("gas/status/threshold", String(gasThreshold).c_str());
}

void sendNotification(String type, String message) {
    StaticJsonDocument<200> doc;
    doc["type"] = type;
    doc["message"] = message;
    doc["timestamp"] = millis();
    
    char buffer[200];
    serializeJson(doc, buffer);
    mqtt.publish("gas/notification", buffer);
}

// ============================================================================
// Main Loop
// ============================================================================

void loop() {
    // Ensure WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected! Reconnecting...");
        connectWiFi();
    }
    
    // Ensure MQTT connection
    if (!mqtt.connected()) {
        connectMQTT();
    }
    mqtt.loop();
    
    // Read sensors and publish periodically
    unsigned long now = millis();
    if (now - lastPublish >= publishInterval) {
        lastPublish = now;
        
        int gasValue = readMQ2();
        bool fireDetected = readFireSensor();
        
        // Publish sensor data
        publishSensorData(gasValue, fireDetected);
        
        // Auto control logic
        autoControl(gasValue, fireDetected);
        
        // Send notifications if danger detected
        static bool lastDangerState = false;
        bool currentDanger = gasValue > gasThreshold || fireDetected;
        
        if (currentDanger && !lastDangerState) {
            if (fireDetected) {
                sendNotification("danger", "CẢNH BÁO: Phát hiện lửa!");
            } else {
                sendNotification("danger", "CẢNH BÁO: Phát hiện khí gas vượt ngưỡng! (" + String(gasValue) + " ppm)");
            }
        }
        lastDangerState = currentDanger;
        
        // Debug print
        Serial.print("Gas: ");
        Serial.print(gasValue);
        Serial.print(" ppm | Fire: ");
        Serial.print(fireDetected ? "DETECTED" : "OK");
        Serial.print(" | Mode: ");
        Serial.println(autoMode ? "AUTO" : "MANUAL");
    }
}
```

## 📡 MQTT Topics Summary

### Publish (ESP32 → Server)
```cpp
mqtt.publish("gas/sensor/mq2", String(gasValue).c_str());
mqtt.publish("gas/sensor/fire", fireDetected ? "0" : "1");
mqtt.publish("gas/status/relay1", relay1State ? "1" : "0");
mqtt.publish("gas/status/relay2", relay2State ? "1" : "0");
mqtt.publish("gas/status/window", windowOpen ? "1" : "0");
mqtt.publish("gas/status/mode", autoMode ? "1" : "0");
mqtt.publish("gas/status/threshold", String(gasThreshold).c_str());
```

### Subscribe (Server → ESP32)
```cpp
mqtt.subscribe("gas/control/relay1");    // "1" or "0"
mqtt.subscribe("gas/control/relay2");    // "1" or "0"
mqtt.subscribe("gas/control/window");    // "1" or "0"
mqtt.subscribe("gas/control/mode");      // "1"=AUTO, "0"=MANUAL
mqtt.subscribe("gas/control/threshold"); // 200-9999
```

## 🔧 Tùy chỉnh

### Điều chỉnh độ nhạy MQ2
```cpp
int readMQ2() {
    int rawValue = analogRead(PIN_MQ2);
    // Thay đổi công thức này dựa trên datasheet của MQ2
    int ppm = map(rawValue, 0, 4095, 0, 9999);
    return ppm;
}
```

### Thay đổi tần suất publish
```cpp
const long publishInterval = 2000; // 2 giây
// Hoặc
const long publishInterval = 5000; // 5 giây
```

## 🐛 Troubleshooting

### ESP32 không kết nối WiFi
- Kiểm tra SSID và password
- Đảm bảo router WiFi ở chế độ 2.4GHz

### MQTT không kết nối
- Kiểm tra MQTT broker có hoạt động không
- Thử broker khác: `test.mosquitto.org`, `broker.emqx.io`

### Không nhận được dữ liệu
- Kiểm tra Serial Monitor để xem log
- Đảm bảo topic names chính xác
- Kiểm tra QoS settings

## 📝 Notes

- MQ2 sensor cần **warm-up** 20-30 giây khi khởi động
- Fire sensor có thể nhạy với ánh sáng mặt trời, cần test kỹ
- Servo motor có thể gây nhiễu, dùng capacitor nếu cần

---
**Created by:** IoT Gas Detection Team  
**Updated:** Nov 2025
