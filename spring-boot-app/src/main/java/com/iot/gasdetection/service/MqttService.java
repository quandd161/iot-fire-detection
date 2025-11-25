package com.iot.gasdetection.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot.gasdetection.config.MqttProperties;
import com.iot.gasdetection.model.Notification;
import com.iot.gasdetection.model.SensorData;
import com.iot.gasdetection.model.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MqttService {
    
    private final MqttProperties mqttProperties;
    private final WebSocketService webSocketService;
    private final ObjectMapper objectMapper;
    
    private MqttClient mqttClient;
    private final SensorData sensorData = new SensorData();
    private final List<Notification> notifications = new ArrayList<>();
    private static final int MAX_NOTIFICATIONS = 100;
    
    @PostConstruct
    public void connect() {
        try {
            String clientId = mqttProperties.getClient().getId() + "-" + UUID.randomUUID().toString();
            mqttClient = new MqttClient(mqttProperties.getBroker().getUrl(), clientId);
            
            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(30);
            options.setKeepAliveInterval(60);
            
            if (mqttProperties.getBroker().getUsername() != null && !mqttProperties.getBroker().getUsername().isEmpty()) {
                options.setUserName(mqttProperties.getBroker().getUsername());
                options.setPassword(mqttProperties.getBroker().getPassword().toCharArray());
            }
            
            mqttClient.setCallback(new MqttCallback() {
                @Override
                public void connectionLost(Throwable cause) {
                    log.error("❌ MQTT Connection lost", cause);
                    sensorData.setConnected(false);
                }
                
                @Override
                public void messageArrived(String topic, MqttMessage message) {
                    handleMessage(topic, new String(message.getPayload()));
                }
                
                @Override
                public void deliveryComplete(IMqttDeliveryToken token) {
                    // Not used
                }
            });
            
            mqttClient.connect(options);
            log.info("✅ Connected to MQTT Broker: {}", mqttProperties.getBroker().getUrl());
            sensorData.setConnected(true);
            
            // Subscribe to topics
            mqttClient.subscribe(mqttProperties.getTopics().getSensor(), 1);
            mqttClient.subscribe(mqttProperties.getTopics().getStatus(), 1);
            mqttClient.subscribe(mqttProperties.getTopics().getNotification(), 1);
            
            log.info("📡 Subscribed to topics: {}, {}, {}",
                    mqttProperties.getTopics().getSensor(),
                    mqttProperties.getTopics().getStatus(),
                    mqttProperties.getTopics().getNotification());
            
        } catch (MqttException e) {
            log.error("❌ Failed to connect to MQTT Broker", e);
        }
    }
    
    @PreDestroy
    public void disconnect() {
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                mqttClient.disconnect();
                mqttClient.close();
                log.info("🔌 Disconnected from MQTT Broker");
            }
        } catch (MqttException e) {
            log.error("Error disconnecting MQTT client", e);
        }
    }
    
    private void handleMessage(String topic, String value) {
        log.debug("📨 [MQTT] {}: {}", topic, value);
        
        try {
            if (topic.equals("gas/sensor/mq2")) {
                sensorData.setMq2(Integer.parseInt(value));
            } else if (topic.equals("gas/sensor/fire")) {
                sensorData.setFire(Integer.parseInt(value));
            } else if (topic.equals("gas/status/relay1")) {
                sensorData.setRelay1("1".equals(value));
            } else if (topic.equals("gas/status/relay2")) {
                sensorData.setRelay2("1".equals(value));
            } else if (topic.equals("gas/status/window")) {
                sensorData.setWindow("1".equals(value));
            } else if (topic.equals("gas/status/buzzer")) {
                sensorData.setBuzzer("1".equals(value));
            } else if (topic.equals("gas/status/mode")) {
                sensorData.setMode("1".equals(value) ? "AUTO" : "MANUAL");
            } else if (topic.equals("gas/status/threshold")) {
                sensorData.setThreshold(Integer.parseInt(value));
            } else if (topic.equals("gas/notification")) {
                handleNotification(value);
                return; // Don't update lastUpdate for notifications
            }
            
            sensorData.setLastUpdate(LocalDateTime.now());
            
            // Broadcast to WebSocket clients
            WebSocketMessage wsMessage = new WebSocketMessage("data", sensorData);
            webSocketService.broadcast(wsMessage);
            
        } catch (Exception e) {
            log.error("Error handling MQTT message", e);
        }
    }
    
    private void handleNotification(String value) {
        try {
            Notification notification = objectMapper.readValue(value, Notification.class);
            notification.setReceivedAt(LocalDateTime.now());
            
            notifications.add(0, notification);
            
            // Keep max notifications
            if (notifications.size() > MAX_NOTIFICATIONS) {
                notifications.subList(MAX_NOTIFICATIONS, notifications.size()).clear();
            }
            
            // Broadcast notification
            WebSocketMessage wsMessage = new WebSocketMessage("notification", notification);
            webSocketService.broadcast(wsMessage);
            
        } catch (Exception e) {
            log.error("Error parsing notification", e);
        }
    }
    
    public void publish(String topic, String message) {
        try {
            if (mqttClient != null && mqttClient.isConnected()) {
                mqttClient.publish(topic, new MqttMessage(message.getBytes()));
                log.debug("📤 Published to {}: {}", topic, message);
            } else {
                log.warn("⚠️ Cannot publish, MQTT client not connected");
            }
        } catch (MqttException e) {
            log.error("Error publishing MQTT message", e);
        }
    }
    
    public SensorData getSensorData() {
        return sensorData;
    }
    
    public List<Notification> getNotifications() {
        return notifications;
    }
}
