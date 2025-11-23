// Your WiFi credentials - Cấu hình sẵn WiFi của bạn
#define WIFI_SSID "Quan"       // WiFi nhà
#define WIFI_PASS "1593572486" // Mật khẩu WiFi nhà

#define ssid "ESP32" // AP SSID
#define pass ""      // AP Password

String Essid = WIFI_SSID; // EEPROM Network SSID - Đã cấu hình sẵn
String Epass = WIFI_PASS; // EEPROM Network Password - Đã cấu hình sẵn
String Etoken = "";       // EEPROM Network token (keep for backward compatibility)

String sssid = ""; // Read SSID From Web Page
String passs = ""; // Read Password From Web Page
String token = ""; // Read token From Web Page (keep for backward compatibility)

// MQTT Configuration - Dùng broker local trên máy tính
#define MQTT_SERVER "192.168.1.13" // IP máy tính trong mạng nhà (cập nhật đúng)
#define MQTT_PORT 1883
#define MQTT_USER "" // Không cần user/pass
#define MQTT_PASS "" // Không cần user/pass
#define MQTT_CLIENT_ID "ESP32-GasDetection"

String Emqtt_server = ""; // EEPROM MQTT Server
String Emqtt_user = "";   // EEPROM MQTT User
String Emqtt_pass = "";   // EEPROM MQTT Pass

String mqtt_server = ""; // Read MQTT Server From Web Page
String mqtt_user = "";   // Read MQTT User From Web Page
String mqtt_pass = "";   // Read MQTT Pass From Web Page