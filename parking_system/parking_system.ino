#include <WiFi.h>
#include <WiFiClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <EEPROM.h>
#include "def.h"
#include "config.h"
#include "mybutton.h"
#include <SimpleKalmanFilter.h>
#include <ESP32Servo.h>

//-------------------- Khai báo Kalman Filter----------------------
SimpleKalmanFilter kfilter(2, 2, 0.1);
//-------------------- Khai báo Button-----------------------------
// Khai báo chân các nút nhấn
#define buttonPinMENU 5
#define buttonPinDOWN 18
#define buttonPinUP 19
#define buttonPinONOFF 21
#define BUTTON1_ID 1
#define BUTTON2_ID 2
#define BUTTON3_ID 3
#define BUTTON4_ID 4
Button buttonMENU;
Button buttonDOWN;
Button buttonUP;
Button buttonONOFF;
void button_press_short_callback(uint8_t button_id);
void button_press_long_callback(uint8_t button_id);

//----------------------Khai báo LCD1602---------------------------------
// Create An LCD Object. Signals: [ RS, EN, D4, D5, D6, D7 ]
#define LCD_RS 15
#define LCD_EN 13
#define LCD_D4 12
#define LCD_D5 14
#define LCD_D6 27
#define LCD_D7 26
LiquidCrystal My_LCD(15, 13, 12, 14, 27, 26);

//------------------------- Khai báo cảm biến ---------------------------
#define SENSOR_MQ2 35
#define SENSOR_FIRE 34
#define SENSOR_FIRE_ON 0
#define SENSOR_FIRE_OFF 1
//-------------------------Khai báo còi ---------------------------------
#define BUZZER 23
#define BUZZER_ON 1
#define BUZZER_OFF 0
//------------------------- Khai báo relay ------------------------------
#define ON 1
#define OFF 0
#define AUTO 1
#define MANUAL 0
bool relay1State = OFF;
bool relay2State = OFF;
bool autoManual = AUTO; // luu vao eeprom
int mq2Thresshold = 40; // luu vao epprom
#define THRESSHOLD 4000

// ------------------------ Khai báo servo -----------------------------
Servo myservo1;
Servo myservo2;
int windowState = OFF;
//------------------------- Khai báo wifi -------------------------------
WebServer server(80); // Specify port
WiFiClient espClient;
PubSubClient mqttClient(espClient);

#define AP_MODE 0
#define STA_MODE 1
bool AP_STA_MODE = 1;

#define MODE_WIFI 0
#define MODE_NOWIFI 1
bool modeWIFI = MODE_NOWIFI;
bool tryCbWIFI = MODE_NOWIFI;

//------------------------- MQTT Topics ----------------------------------
#define TOPIC_MQ2 "gas/sensor/mq2"
#define TOPIC_FIRE "gas/sensor/fire"
#define TOPIC_RELAY1 "gas/status/relay1"
#define TOPIC_RELAY2 "gas/status/relay2"
#define TOPIC_WINDOW "gas/status/window"
#define TOPIC_MODE "gas/status/mode"
#define TOPIC_THRESHOLD "gas/status/threshold"
#define TOPIC_CTRL_RELAY1 "gas/control/relay1"
#define TOPIC_CTRL_RELAY2 "gas/control/relay2"
#define TOPIC_CTRL_WINDOW "gas/control/window"
#define TOPIC_CTRL_MODE "gas/control/mode"
#define TOPIC_CTRL_THRESHOLD "gas/control/threshold"
#define TOPIC_NOTIFICATION "gas/notification"

//---------------------- Nguyên mẫu hàm  ---------------------------------
void TaskButton(void *pvParameters);
void TaskMQTT(void *pvParameters);
void TaskMainDisplay(void *pvParameters);
void TaskSwitchAPtoSTA(void *pvParameters);
void mqttCallback(char *topic, byte *payload, unsigned int length);
void connectMQTT();
void publishMQTT();
void sendNotificationMQTT(String message);
void D_AP_SER_Page();
void Get_Req();
void readEEPROM();
void ClearEeprom();
void connectSTA();
int readMQ2();
void sendDatatoBlynk();
void LCD1602_Init();
void LCDPrint(int hang, int cot, char *text, int clearOrNot);
void controlRelay(int relay, int state);
void closeWindow();
void openWindow();
void printRelayState();
void printMode();
void controlWindow(int onoff);

//-------------------- Khai báo biến freeRTOS ----------------------------
TaskHandle_t TaskMainDisplay_handle = NULL;
TaskHandle_t TaskButton_handle = NULL;

void setup()
{
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n========================================");
  Serial.println("GAS DETECTION SYSTEM - ESP32");
  Serial.println("========================================");

  EEPROM.begin(512);

  // XÓA EEPROM lần đầu để tránh đọc dữ liệu rác (đã chạy rồi - đã comment)
  // for (int i = 0; i < 512; ++i) { EEPROM.write(i, 0); }
  // EEPROM.commit();
  // Serial.println("EEPROM cleared!");

  LCD1602_Init();
  delay(2000);
  My_LCD.clear();
  //---------- Khai báp WiFi ---------
  Serial.println("Configuring access point...");
  WiFi.mode(WIFI_AP_STA);      // Both in Station and Access Point Mode
  WiFi.setAutoReconnect(true); // Tự động kết nối lại
  WiFi.persistent(true);       // Lưu cấu hình WiFi

  //---------- Khai báo relay --------
  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);
  controlRelay(RELAY1, OFF);
  controlRelay(RELAY2, OFF);

  //---------- Khai báo BUZZER --------
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, BUZZER_OFF);

  //----------- Khai báo cảm biến lửa -------
  pinMode(SENSOR_FIRE, INPUT_PULLUP);
  digitalWrite(SENSOR_FIRE, BUZZER_OFF);
  // ---------- Khai báo Servo --------------
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  myservo1.setPeriodHertz(50);
  myservo2.setPeriodHertz(50);
  myservo1.attach(SERVO1, 500, 2400);
  myservo2.attach(SERVO2, 500, 2400);
  closeWindow();
  // ---------- Kết nối WiFi ---------
  // Không cần readEEPROM() vì đã cấu hình sẵn trong config.h (Essid = WIFI_SSID, Epass = WIFI_PASS)
  connectSTA();

  //----------- Read thresshold from EEPROM --------
  mq2Thresshold = EEPROM.read(202) * 100 + EEPROM.read(203);
  Serial.print("mq2Thresshold: ");
  Serial.println(mq2Thresshold);

  if (mq2Thresshold > 9999 || mq2Thresshold < 100)
  {
    mq2Thresshold = THRESSHOLD;
    Serial.print("Reset to default: ");
    Serial.println(mq2Thresshold);
  }

  //----------- Read AUTO/MANUAL EEPROM --------
  autoManual = EEPROM.read(201);
  if (autoManual > 1)
    autoManual = AUTO;
  Serial.print("Auto/Manual mode: ");
  Serial.println(autoManual);

  Serial.println("=== Starting MQTT setup ===");
  // ---------- Setup MQTT ---------
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(60);
  mqttClient.setSocketTimeout(30);
  Serial.println("MQTT configured");

  // ---------- Khai báo hàm FreeRTOS ---------
  xTaskCreatePinnedToCore(TaskMainDisplay, "TaskMainDisplay", 1024 * 4, NULL, 5, &TaskMainDisplay_handle, 0);
  xTaskCreatePinnedToCore(TaskSwitchAPtoSTA, "TaskSwitchAPtoSTA", 1024 * 4, NULL, 5, NULL, 0);
  xTaskCreatePinnedToCore(TaskBuzzer, "TaskBuzzer", 1024 * 2, NULL, 5, NULL, 0);
  xTaskCreatePinnedToCore(TaskButton, "TaskButton", 1024 * 4, NULL, 5, &TaskButton_handle, 0);
  xTaskCreatePinnedToCore(TaskMQTT, "TaskMQTT", 1024 * 4, NULL, 5, NULL, 0);
}
void loop()
{
  vTaskDelete(NULL);
}

//------------------------------------------------------------------------------
//---------------------------Task Switch AP to STA -----------------------------

//---------------------------If IP is Hitted in Browser ------------------------
void D_AP_SER_Page()
{
  int Tnetwork = 0, i = 0, len = 0;
  String st = "", s = "";
  Tnetwork = WiFi.scanNetworks(); // Scan for total networks available
  st = "<ul>";
  for (int i = 0; i < Tnetwork; ++i)
  {
    // Print SSID and RSSI for each network found
    st += "<li>";
    st += i + 1;
    st += ": ";
    st += WiFi.SSID(i);
    st += " (";
    st += WiFi.RSSI(i);
    st += ")";
    st += (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? " " : "*";
    st += "</li>";
  }
  st += "</ul>";
  IPAddress ip = WiFi.softAPIP(); // Get ESP IP Address
  s = "<!DOCTYPE html>\r\n";
  s += "<html lang='en'>\r\n";
  s += "<head>\r\n";
  s += "<meta charset='UTF-8'>\r\n";
  s += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>\r\n";
  s += "<title>GAS DETECTION SYSTEM</title>\r\n";
  s += "<style>\r\n";
  s += "body { font-family: Arial, sans-serif; background-color: #f2f2f2; text-align: center; padding: 20px; }\r\n";
  s += "h1 { color: #333; }\r\n";
  s += "form { background: #fff; display: inline-block; padding: 40px; border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }\r\n";
  s += "label { font-size: 24px; display: block; margin: 15px 0 5px; text-align: left; }\r\n";
  s += "input[type='text'], input[type='password'] { width: 100%; padding: 15px; font-size: 24px; border: 1px solid #ccc; border-radius: 8px; }\r\n";
  s += "input[type='submit'] { margin-top: 20px; font-size: 24px; padding: 15px 30px; background-color: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; }\r\n";
  s += "input[type='submit']:hover { background-color: #45a049; }\r\n";
  s += "</style>\r\n";
  s += "</head>\r\n";
  s += "<body>\r\n";
  s += "<h1>GAS DETECTION SYSTEM</h1>\r\n";
  s += "<p>" + st + "</p>\r\n";
  s += "<h1>Configure WiFi and Blynk Token</h1>\r\n";
  s += "<form method='get' action='a'>\r\n";
  s += "<label for='ssid'>SSID:</label>\r\n";
  s += "<input type='text' id='ssid' name='ssid' maxlength='32'>\r\n";
  s += "<label for='pass'>Password:</label>\r\n";
  s += "<input type='text' id='pass' name='pass' maxlength='64'>\r\n";
  s += "<label for='token'>Token:</label>\r\n";
  s += "<input type='text' id='token' name='token' maxlength='64'>\r\n";
  s += "<input type='submit' value='Save'>\r\n";
  s += "</form>\r\n";
  s += "</body>\r\n";
  s += "</html>\r\n";

  server.send(200, "text/html", s);
}
//--------------------------- Get SSID & Password  ---------------------------
void Get_Req()
{
  vTaskSuspend(TaskMainDisplay_handle);
  if (server.hasArg("ssid") && server.hasArg("pass") && server.hasArg("token"))
  {
    sssid = server.arg("ssid");  // Get SSID
    passs = server.arg("pass");  // Get Password
    token = server.arg("token"); // Get token
    Serial.println(sssid);
    Serial.println(passs);
    Serial.println(token);
  }
  LCDPrint(0, 0, "config Wifi STA", 1);
  LCDPrint(1, 0, " please check ", 0);
  delay(2000);
  LCDPrint(0, 0, (char *)sssid.c_str(), 1);
  LCDPrint(1, 0, (char *)passs.c_str(), 0);
  delay(5000);
  if (sssid.length() > 1 && passs.length() > 1 && token.length() > 1)
  {
    ClearEeprom(); // First Clear Eeprom
    delay(10);
    for (int i = 0; i < sssid.length(); ++i)
      EEPROM.write(i, sssid[i]);
    for (int i = 0; i < passs.length(); ++i)
      EEPROM.write(32 + i, passs[i]);
    for (int i = 0; i < token.length(); ++i)
      EEPROM.write(64 + i, token[i]);

    EEPROM.commit();

    String s = "\r\n\r\n<!DOCTYPE HTML>\r\n<html><h1>GAS DETECTION SYSTEM</h1> ";
    s += "<p>Password Saved... Reset to boot into new wifi</html>\r\n\r\n";
    server.send(200, "text/html", s);
  }
  LCDPrint(0, 1, " RESTART ", 1);
  delay(2000);
  LCDPrint(1, 1, "   DONE ", 0);
  delay(2000);
  ESP.restart();
}

//--------------------------- connect STA mode and switch AP Mode if connect fail ---------------------------
void connectSTA()
{
  Serial.println("=== connectSTA() called ===");
  Serial.print("Essid length: ");
  Serial.println(Essid.length());
  Serial.print("Essid value: '");
  Serial.print(Essid);
  Serial.println("'");

  if (Essid.length() >= 1)
  { // Sửa từ > 1 thành >= 1 để hỗ trợ SSID 1 ký tự như "q"
    Serial.println("Starting WiFi connection...");
    Serial.print("SSID: ");
    Serial.println(Essid); // Print SSID
    Serial.print("Password: ");
    Serial.println(Epass); // Print Password
    Etoken = Etoken.c_str();

    Serial.println("Calling WiFi.begin()...");
    WiFi.begin(Essid.c_str(), Epass.c_str()); // c_str()
    int countConnect = 0;
    String dotConnect = "";
    while (WiFi.status() != WL_CONNECTED)
    {
      Serial.print(".");
      LCDPrint(0, 0, "WiFi connecting ", 0);
      delay(500);
      dotConnect += ".";
      if (dotConnect.length() > 15)
      {
        dotConnect = "";
        My_LCD.clear();
      }
      LCDPrint(1, 0, (char *)dotConnect.c_str(), 0);
      if (countConnect++ == 60)
      { // Tăng từ 20 lên 60 (30 giây) cho mạng 4G
        Serial.println("\n=== WiFi Connection FAILED ===");
        Serial.print("WiFi status: ");
        Serial.println(WiFi.status());
        Serial.println("Connect fail, please check ssid and pass");
        LCDPrint(0, 0, "Disconnect Wifi", 1);
        LCDPrint(1, 0, " check again", 0);
        delay(2000);
        LCDPrint(0, 0, "connect WF:ESP32", 1);
        LCDPrint(1, 0, "192.168.4.1", 0);
        delay(2000);
        break;
      }
    }
    Serial.println("");
    if (WiFi.status() == WL_CONNECTED)
    {
      Serial.println("\n=== WiFi CONNECTED ===");
      Serial.println("WiFi connected.");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
      LCDPrint(0, 1, "WiFi Connected", 1);
      LCDPrint(1, 0, (char *)Essid.c_str(), 0);
      delay(2000);

      // Connect to MQTT
      My_LCD.clear();
      LCDPrint(0, 0, "Connecting MQTT", 0);
      connectMQTT();

      if (mqttClient.connected())
      {
        My_LCD.clear();
        LCDPrint(0, 0, "MQTT connected", 0);
        delay(2000);
      }
      else
      {
        My_LCD.clear();
        LCDPrint(0, 0, "MQTT disconnect", 0);
        LCDPrint(1, 0, " check server", 0);
        delay(3000);
      }

      AP_STA_MODE = STA_MODE;
    }
    else
      switchAPMode();
  }
}

//--------------------------- switch AP Mode ---------------------------
void switchAPMode()
{
  WiFi.softAP(ssid, pass); // AP SSID and Password(Both in Ap and Sta Mode-According to Library)
  delay(100);              // Stable AP
  server.on("/", D_AP_SER_Page);
  server.on("/a", Get_Req);
  Serial.println("In Ap Mode");
  server.begin();
  delay(300);
}
//--------------------------- Read Eeprom  ------------------------------------
void readEEPROM()
{
  Essid = "";
  Epass = "";
  Etoken = "";

  // Reading SSID - dừng khi gặp ký tự null hoặc 0xFF
  for (int i = 0; i < 32; ++i)
  {
    char c = char(EEPROM.read(i));
    if (c == '\0' || c == (char)0xFF)
      break;
    Essid += c;
  }

  // Reading Password - dừng khi gặp ký tự null hoặc 0xFF
  for (int i = 32; i < 64; ++i)
  {
    char c = char(EEPROM.read(i));
    if (c == '\0' || c == (char)0xFF)
      break;
    Epass += c;
  }

  // Reading Token - dừng khi gặp ký tự null hoặc 0xFF
  for (int i = 64; i < 96; ++i)
  {
    char c = char(EEPROM.read(i));
    if (c == '\0' || c == (char)0xFF)
      break;
    Etoken += c;
  }
}
//--------------------------- Clear Eeprom  ----------------------------------
void ClearEeprom()
{
  Serial.println("Clearing Eeprom");
  for (int i = 0; i < 96; ++i)
  {
    EEPROM.write(i, 0);
  }
}
void writeThresHoldEEPROM(int mq2Thresshold)
{
  int firstTwoDigits = mq2Thresshold / 100; // lấy 2 số hàng nghìn và trăm
  int lastTwoDigits = mq2Thresshold % 100;  // lấy 2 số hàng chục và đơn vị
  EEPROM.write(202, firstTwoDigits);        // lưu 2 số hàng nghìn và trăm vào flash
  EEPROM.write(203, lastTwoDigits);         // lưu 2 số hàng chục và đơn vị vào flash
  EEPROM.commit();
  Serial.println(mq2Thresshold);
}
//---------------------------Task TaskSwitchAPtoSTA---------------------------
void TaskSwitchAPtoSTA(void *pvParameters)
{
  while (1)
  {
    server.handleClient();
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
}

//-----------------------------------------------------------------------------
//---------------------------MQTT Functions------------------------------------

// MQTT Callback - Nhận lệnh điều khiển từ server
void mqttCallback(char *topic, byte *payload, unsigned int length)
{
  String message = "";
  for (int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  Serial.print("[MQTT] Received [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  // Xử lý lệnh điều khiển
  if (String(topic) == TOPIC_CTRL_RELAY1)
  {
    relay1State = (message == "1" || message == "ON") ? ON : OFF;
    controlRelay(RELAY1, relay1State);
    printRelayState();
    autoManual = MANUAL;
    EEPROM.write(201, MANUAL);
    EEPROM.commit();
    printMode();
  }
  else if (String(topic) == TOPIC_CTRL_RELAY2)
  {
    relay2State = (message == "1" || message == "ON") ? ON : OFF;
    controlRelay(RELAY2, relay2State);
    printRelayState();
    autoManual = MANUAL;
    EEPROM.write(201, MANUAL);
    EEPROM.commit();
    printMode();
  }
  else if (String(topic) == TOPIC_CTRL_WINDOW)
  {
    windowState = (message == "1" || message == "OPEN") ? 1 : 0;
    controlWindow(windowState);
    printWindowState(windowState);
    autoManual = MANUAL;
    EEPROM.write(201, MANUAL);
    EEPROM.commit();
    printMode();
  }
  else if (String(topic) == TOPIC_CTRL_MODE)
  {
    autoManual = (message == "1" || message == "AUTO") ? AUTO : MANUAL;
    EEPROM.write(201, autoManual);
    EEPROM.commit();
    printMode();
  }
  else if (String(topic) == TOPIC_CTRL_THRESHOLD)
  {
    mq2Thresshold = message.toInt();
    writeThresHoldEEPROM(mq2Thresshold);

    vTaskSuspend(TaskMainDisplay_handle);
    My_LCD.clear();
    delay(100);
    LCDPrint(0, 0, "  Thresshold ", 0);
    char str[20];
    sprintf(str, "%d", mq2Thresshold);
    LCDPrint(1, 6, str, 0);
    delay(1000);
    My_LCD.clear();
    delay(100);
    printRelayState();
    printMQ2();
    printMode();
    delay(100);
    vTaskResume(TaskMainDisplay_handle);
  }
}

// Kết nối MQTT Broker
void connectMQTT()
{
  int retryCount = 0;
  while (!mqttClient.connected() && retryCount < 3)
  { // Giảm từ 5 xuống 3 lần thử
    Serial.print("Connecting to MQTT...");
    String clientId = MQTT_CLIENT_ID;
    clientId += "-";
    clientId += String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS))
    {
      Serial.println("connected");

      // Subscribe các topics điều khiển
      mqttClient.subscribe(TOPIC_CTRL_RELAY1);
      mqttClient.subscribe(TOPIC_CTRL_RELAY2);
      mqttClient.subscribe(TOPIC_CTRL_WINDOW);
      mqttClient.subscribe(TOPIC_CTRL_MODE);
      mqttClient.subscribe(TOPIC_CTRL_THRESHOLD);

      Serial.println("Subscribed to control topics");
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 2s");
      vTaskDelay(2000 / portTICK_PERIOD_MS); // Dùng vTaskDelay thay vì delay
      retryCount++;
    }
  }

  if (!mqttClient.connected())
  {
    Serial.println("[MQTT] Connection failed after 3 attempts. Will retry later.");
  }
}

// Publish dữ liệu lên MQTT
void publishMQTT()
{
  if (mqttClient.connected())
  {
    // Publish sensor data
    mqttClient.publish(TOPIC_MQ2, String(readMQ2()).c_str(), true);
    mqttClient.publish(TOPIC_FIRE, String(readFireSensor()).c_str(), true);

    // Publish status
    mqttClient.publish(TOPIC_RELAY1, relay1State ? "1" : "0", true);
    mqttClient.publish(TOPIC_RELAY2, relay2State ? "1" : "0", true);
    mqttClient.publish(TOPIC_WINDOW, windowState ? "1" : "0", true);
    mqttClient.publish(TOPIC_MODE, autoManual ? "1" : "0", true);
    mqttClient.publish(TOPIC_THRESHOLD, String(mq2Thresshold).c_str(), true);
  }
}

// Gửi thông báo cảnh báo qua MQTT
void sendNotificationMQTT(String message)
{
  if (mqttClient.connected())
  {
    StaticJsonDocument<200> doc;
    doc["type"] = "warning";
    doc["message"] = message;
    doc["timestamp"] = millis();

    String jsonString;
    serializeJson(doc, jsonString);

    mqttClient.publish(TOPIC_NOTIFICATION, jsonString.c_str());
    Serial.print("[MQTT] Notification sent: ");
    Serial.println(message);
  }
}

//----------------------- Task MQTT (thay thế TaskBlynk) ------------------------
void TaskMQTT(void *pvParameters)
{
  // Đợi WiFi kết nối
  Serial.println("[TaskMQTT] Waiting for WiFi...");
  while (WiFi.status() != WL_CONNECTED)
  {
    vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
  Serial.println("[TaskMQTT] WiFi connected, starting MQTT...");

  // Kết nối MQTT lần đầu
  connectMQTT();

  // Publish dữ liệu ban đầu
  if (mqttClient.connected())
  {
    Serial.println("[TaskMQTT] Publishing initial data...");
    publishMQTT();
  }
  else
  {
    Serial.println("[TaskMQTT] MQTT not connected. Running in offline mode.");
  }

  unsigned long lastPublish = 0;
  unsigned long lastReconnect = 0;

  while (1)
  {
    // Reconnect nếu mất kết nối (mỗi 10 giây thử 1 lần)
    if (!mqttClient.connected())
    {
      if (millis() - lastReconnect > 10000)
      { // Chỉ thử reconnect mỗi 10s
        Serial.println("[TaskMQTT] Reconnecting...");
        connectMQTT();
        lastReconnect = millis();
      }
    }
    else
    {
      mqttClient.loop();

      // Publish data mỗi 2 giây (chỉ khi connected)
      if (millis() - lastPublish > 2000)
      {
        publishMQTT();
        lastPublish = millis();
      }
    }

    vTaskDelay(100 / portTICK_PERIOD_MS); // Nhả CPU cho task khác
  }
}

//----------------------------------------------------------------
//----------------------------LCD1602 Init------------------------
void LCDPrint(int hang, int cot, char *text, int clearOrNot)
{
  if (clearOrNot == 1)
    My_LCD.clear();
  My_LCD.setCursor(cot, hang);
  My_LCD.print(text);
}

void LCD1602_Init()
{
  My_LCD.begin(16, 2);
  My_LCD.clear();
  LCDPrint(0, 2, "Gas Detection", 0);
  LCDPrint(1, 5, "System", 0);
}

void printMode()
{
  if (autoManual == AUTO)
    LCDPrint(0, 15, "A", 0);
  else
    LCDPrint(0, 15, "M", 0);
}
void printWindow()
{
  if (autoManual == AUTO)
    LCDPrint(0, 15, "A", 0);
  else
    LCDPrint(0, 15, "M", 0);
}
//-----------------------  Print Relay State LCD ---------------------------
void printRelayState()
{
  if (relay1State == 0)
    LCDPrint(1, 0, "RL1:OFF ", 0);
  else
    LCDPrint(1, 0, "RL1:ON ", 0);
  if (relay2State == 0)
    LCDPrint(1, 9, "RL2:OFF ", 0);
  else
    LCDPrint(1, 9, "RL2:ON ", 0);
}

//-----------------------  Read MQ2 value ---------------------------
int readMQ2()
{
  float MQ2_Value = analogRead(SENSOR_MQ2);
  // MQ2_Value = kfilter.updateEstimate(MQ2_Value);
  // MQ2_Value = constrain(MQ2_Value, 400 , 4095);
  MQ2_Value = map(MQ2_Value, 0, 4095, 0, 10000);
  return MQ2_Value;
}

//-----------------------  Read Fire sensor value ---------------------------
int readFireSensor()
{
  int Fire_Value = digitalRead(SENSOR_FIRE);
  return Fire_Value;
}
//-----------------------Print MQ2 value LCD-------------------------
void printMQ2()
{
  float MQ2_Value = readMQ2();
  LCDPrint(0, 0, (char *)("GAS:" + String((int)MQ2_Value) + "ppm ").c_str(), 0);
}

void printWindowState(int windowState)
{
  vTaskSuspend(TaskMainDisplay_handle);
  My_LCD.clear();
  if (windowState == 1)
    LCDPrint(0, 2, "OPEN WINDOW", 0);
  else
    LCDPrint(0, 2, "CLOSE WINDOW", 0);
  delay(1000);
  My_LCD.clear();
  printMode();
  printRelayState();
  printMQ2();
  vTaskResume(TaskMainDisplay_handle);
}

//-----------------------Task Main Display and Control Device----------
int checkSensor = 0;
int buzzerON = 0;
int sendNotificationsOnce = 0;
void TaskMainDisplay(void *pvParameters)
{
  //----------- Khởi tạo LCD ------------------
  delay(10000);
  // My_LCD.clear();
  // LCDPrint(0,0, "WAIT FOR SENSORS",0 );
  // LCDPrint(1,0, "TO START",0 );
  // for(int i = 60; i >= 10 ; i --) {
  //     My_LCD.setCursor(12, 1);
  //     My_LCD.print(" ");
  //     My_LCD.setCursor(13, 1);
  //     My_LCD.print(i);
  //     delay(1000);
  // }

  // LCDPrint(0,0, "WAIT FOR SENSOR",0 );
  // LCDPrint(1,0, "TO START",0 );
  // for(int i = 9; i >= 0 ; i --) {
  //     My_LCD.setCursor(13, 1);
  //     My_LCD.print(" ");
  //     My_LCD.setCursor(14, 1);
  //     My_LCD.print(i);
  //     delay(1000);
  // }

  My_LCD.clear();
  printRelayState();
  printMode();
  printMQ2();

  while (1)
  {
    if (autoManual == AUTO)
    {

      if (readMQ2() > mq2Thresshold)
      {
        buzzerON = 1;
        relay1State = ON;
        relay2State = OFF;
        controlRelay(RELAY1, relay1State);
        controlRelay(RELAY2, relay2State);
        windowState = 1;
        controlWindow(windowState);
        publishMQTT();
        delay(3000);
      }
      else if (readFireSensor() == SENSOR_FIRE_ON)
      {
        buzzerON = 1;
        relay1State = OFF;
        relay2State = ON;
        controlRelay(RELAY1, relay1State);
        controlRelay(RELAY2, relay2State);
        publishMQTT();
        delay(3000);
      }
      else if (readMQ2() < mq2Thresshold - 100 && readFireSensor() == SENSOR_FIRE_OFF)
      {
        relay1State = OFF;
        relay2State = OFF;
        controlRelay(RELAY1, relay1State);
        controlRelay(RELAY2, relay2State);
        windowState = 0;
        controlWindow(windowState);
        publishMQTT();
      }
    }
    if (readMQ2() > mq2Thresshold && readFireSensor() == SENSOR_FIRE_ON)
    {
      if (sendNotificationsOnce == 0)
        sendNotificationMQTT("DANGER: Fire & Gas detected!");
      sendNotificationsOnce = 1;
      My_LCD.clear();
      LCDPrint(0, 4, "WARNING", 0);
      LCDPrint(1, 2, "GAS DETECTED", 0);
      buzzerON = 1;
      delay(500);
      My_LCD.clear();
      Serial.println("WARNING Fire & Gas detected");
      LCDPrint(0, 4, "WARNING", 0);
      LCDPrint(1, 2, "FIRE DETECTED", 0);
      delay(500);
    }
    else if (readMQ2() > mq2Thresshold && readFireSensor() == SENSOR_FIRE_OFF)
    {
      if (sendNotificationsOnce == 0)
        sendNotificationMQTT("WARNING: Gas exceeds permissible limits");
      sendNotificationsOnce = 1;
      Serial.println("WARNING Gas exceeds permissible limits");
      My_LCD.clear();
      delay(500);
      LCDPrint(0, 4, "WARNING", 0);
      LCDPrint(1, 2, "GAS DETECTED", 0);
      buzzerON = 1;
    }
    else if (readMQ2() < mq2Thresshold - 100 && readFireSensor() == SENSOR_FIRE_ON)
    {
      if (sendNotificationsOnce == 0)
        sendNotificationMQTT("DANGER: Fire detected!");
      sendNotificationsOnce = 1;
      My_LCD.clear();
      delay(500);
      Serial.println("WARNING Fire Fire");
      LCDPrint(0, 4, "WARNING", 0);
      LCDPrint(1, 2, "FIRE DETECTED", 0);
      buzzerON = 1;
    }
    else if (readMQ2() < mq2Thresshold - 100 && readFireSensor() == SENSOR_FIRE_OFF)
    {
      My_LCD.clear();
      delay(20);
      printRelayState();
      delay(20);
      printMode();
      delay(20);
      printMQ2();
      delay(20);
      buzzerON = 0;
      sendNotificationsOnce = 0;
    }
    delay(2000);
  }
}
void TaskBuzzer(void *pvParameters)
{
  while (1)
  {
    if (buzzerON == 1)
      buzzerWarning();
    else
      digitalWrite(BUZZER, BUZZER_OFF);
    delay(10);
  }
}

//----------------------------------------------------------------
//----------------------Task Button-------------------------------
void TaskButton(void *pvParameters)
{
  pinMode(buttonPinMENU, INPUT);
  pinMode(buttonPinDOWN, INPUT);
  pinMode(buttonPinUP, INPUT);
  pinMode(buttonPinONOFF, INPUT);
  // ---------- Khởi tạo BUTTON --------------
  button_init(&buttonMENU, buttonPinMENU, BUTTON1_ID);
  button_init(&buttonDOWN, buttonPinDOWN, BUTTON2_ID);
  button_init(&buttonUP, buttonPinUP, BUTTON3_ID);
  button_init(&buttonONOFF, buttonPinONOFF, BUTTON4_ID);
  button_pressshort_set_callback((void *)button_press_short_callback);
  button_presslong_set_callback((void *)button_press_long_callback);

  while (1)
  {
    handle_button(&buttonMENU);
    handle_button(&buttonDOWN);
    handle_button(&buttonUP);
    handle_button(&buttonONOFF);
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
}

//-----------------------Hàm điều khiển relay -------------------------
void controlRelay(int relay, int state)
{
  digitalWrite(relay, state);
}

//----------------------- Hàm điều khiển servo ----------------------------

void openWindow()
{
  myservo1.write(0);
  myservo2.write(180);
}
void closeWindow()
{
  myservo1.write(90);
  myservo2.write(90);
}
void controlWindow(int onoff)
{
  if (onoff == 0)
    closeWindow();
  else
    openWindow();
}

// ---------------------- Hàm điều khiển còi -----------------------------
void buzzerBip()
{
  // digitalWrite(BUZZER, BUZZER_ON);delay(300);
  // digitalWrite(BUZZER, BUZZER_OFF);
}

void buzzerWarning()
{
  digitalWrite(BUZZER, BUZZER_ON);
  delay(2000);
  digitalWrite(BUZZER, BUZZER_OFF);
  delay(500);
}

void sendRelayStateToMQTT(int relay1State, int relay2State)
{
  mqttClient.publish(TOPIC_RELAY1, relay1State ? "1" : "0", true);
  mqttClient.publish(TOPIC_RELAY2, relay2State ? "1" : "0", true);
}
//----------------------- Hàm xử lí nút nhấn nhả -------------------------
int modeSetThresHold = 0;

void button_press_short_callback(uint8_t button_id)
{
  switch (button_id)
  {
  case BUTTON1_ID: // Menu
    Serial.println("bt1 press short");
    buzzerBip();
    modeSetThresHold = 1 - modeSetThresHold;
    if (modeSetThresHold == 1)
    {
      vTaskSuspend(TaskMainDisplay_handle);
      My_LCD.clear();
      delay(100);
      LCDPrint(0, 0, " SET Thresshold ", 0);
      char str[20];
      sprintf(str, "%d", mq2Thresshold);
      LCDPrint(1, 6, str, 0);
      delay(100);
    }
    else
    {
      LCDPrint(1, 1, " SUCCESSFULLY ", 0);
      delay(1000);
      My_LCD.clear();
      delay(100);
      printMQ2();
      delay(20);
      printRelayState();
      delay(20);
      printMode();
      delay(20);
      mqttClient.publish(TOPIC_THRESHOLD, String(mq2Thresshold).c_str(), true);
      writeThresHoldEEPROM(mq2Thresshold);
      vTaskResume(TaskMainDisplay_handle);
    }
    break;
  case BUTTON2_ID:
    Serial.println("bt2 press short");
    buzzerBip();
    if (modeSetThresHold == 1)
    {
      My_LCD.clear();
      delay(100);
      LCDPrint(0, 0, " SET Thresshold ", 0);
      char str[20];
      mq2Thresshold += 50;
      if (mq2Thresshold > 9999)
        mq2Thresshold = 9999;
      sprintf(str, "%d", mq2Thresshold);
      LCDPrint(1, 6, str, 0);
    }
    else
    {
      if (autoManual == AUTO)
        autoManual = MANUAL;
      EEPROM.write(201, MANUAL);
      EEPROM.commit();
      relay1State = 1 - relay1State;
      controlRelay(RELAY1, relay1State);
      sendRelayStateToMQTT(relay1State, relay2State);
      mqttClient.publish(TOPIC_MODE, "0", true);
      My_LCD.clear();
      delay(20);
      printRelayState();
      delay(20);
      printMode();
      delay(20);
      printMQ2();
      delay(20);
    }

    break;
  case BUTTON3_ID:
    Serial.println("bt3 press short");
    buzzerBip();
    if (modeSetThresHold == 1)
    {
      My_LCD.clear();
      delay(100);
      LCDPrint(0, 0, " SET Thresshold ", 0);
      char str[20];
      mq2Thresshold -= 50;
      if (mq2Thresshold < 200)
        mq2Thresshold = 200;
      sprintf(str, "%d", mq2Thresshold + 100);
      LCDPrint(1, 6, str, 0);
    }
    else
    {
      if (autoManual == AUTO)
        autoManual = MANUAL;
      EEPROM.write(201, MANUAL);
      EEPROM.commit();
      relay2State = 1 - relay2State;
      controlRelay(RELAY2, relay2State);
      sendRelayStateToMQTT(relay1State, relay2State);
      mqttClient.publish(TOPIC_MODE, "0", true);
      My_LCD.clear();
      delay(20);
      printRelayState();
      delay(20);
      printMode();
      delay(20);
      printMQ2();
      delay(20);
    }
    break;
  case BUTTON4_ID:
    Serial.println("bt4 press short");
    buzzerBip();
    if (modeSetThresHold == 0)
    {
      if (autoManual == AUTO)
        autoManual = MANUAL;
      mqttClient.publish(TOPIC_MODE, "0", true);
      windowState = 1 - windowState;
      mqttClient.publish(TOPIC_WINDOW, windowState ? "1" : "0", true);
      controlWindow(windowState);
      printWindowState(windowState);
    }

    break;
  }
}

//-----------------Hàm xử lí nút nhấn giữ ----------------------
void button_press_long_callback(uint8_t button_id)
{
  switch (button_id)
  {
  case BUTTON1_ID:
    buzzerBip();
    if (modeSetThresHold == 0)
    {
      AP_STA_MODE = 1 - AP_STA_MODE;
      switch (AP_STA_MODE)
      {
      case AP_MODE:
        vTaskSuspend(TaskMainDisplay_handle);
        LCDPrint(0, 1, "WiFi AP Mode", 1);
        delay(2000);
        LCDPrint(0, 0, "connect WF:ESP32", 1);
        LCDPrint(1, 1, "192.168.4.1", 0);
        // Switch to AP mode
        switchAPMode();
        break;
      case STA_MODE:
        ESP.restart();
        break;
      }
    }
    break;
  case BUTTON2_ID:
    buzzerBip();
    break;
  case BUTTON3_ID:
    buzzerBip();
    break;
  case BUTTON4_ID:
    buzzerBip();
    if (modeSetThresHold == 0)
    {
      autoManual = 1 - autoManual;
      mqttClient.publish(TOPIC_MODE, autoManual ? "1" : "0", true);
      EEPROM.write(201, autoManual);
      EEPROM.commit();
      printMode();
    }
    break;
  }
}