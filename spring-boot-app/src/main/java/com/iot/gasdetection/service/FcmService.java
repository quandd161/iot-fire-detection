package com.iot.gasdetection.service;

import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FcmService {

    private static final Logger logger = LoggerFactory.getLogger(FcmService.class);
    
    // In-memory storage for device tokens (sử dụng ConcurrentHashMap để thread-safe)
    private final Set<String> deviceTokens = ConcurrentHashMap.newKeySet();
    
    // Topic name cho fire alerts
    private static final String FIRE_ALERT_TOPIC = "fire_alerts";

    /**
     * Đăng ký device token
     */
    public void registerToken(String token) {
        if (token != null && !token.isEmpty()) {
            deviceTokens.add(token);
            logger.info("📱 Registered device token: {}", token.substring(0, Math.min(20, token.length())) + "...");
            
            // Subscribe token to topic
            subscribeToTopic(token, FIRE_ALERT_TOPIC);
        }
    }

    /**
     * Hủy đăng ký device token
     */
    public void unregisterToken(String token) {
        if (token != null) {
            deviceTokens.remove(token);
            logger.info("📱 Unregistered device token");
            
            // Unsubscribe from topic
            unsubscribeFromTopic(token, FIRE_ALERT_TOPIC);
        }
    }

    /**
     * Lấy danh sách tokens đã đăng ký
     */
    public Set<String> getRegisteredTokens() {
        return new HashSet<>(deviceTokens);
    }

    /**
     * Gửi notification đến 1 device cụ thể
     */
    public String sendToDevice(String token, String title, String body, Map<String, String> data) {
        try {
            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data != null ? data : new HashMap<>())
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .setNotification(AndroidNotification.builder()
                                    .setSound("default")
                                    .setChannelId("fire_alert_channel")
                                    .setPriority(AndroidNotification.Priority.MAX)
                                    .build())
                            .build())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            logger.info("🔔 FCM notification sent successfully to device. Response: {}", response);
            return response;
        } catch (FirebaseMessagingException e) {
            logger.error("❌ Failed to send FCM notification to device: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Gửi notification đến tất cả devices đã đăng ký
     */
    public void sendToAllDevices(String title, String body, Map<String, String> data) {
        if (deviceTokens.isEmpty()) {
            logger.warn("⚠️ No registered devices to send notification");
            return;
        }

        int successCount = 0;
        int failureCount = 0;

        for (String token : deviceTokens) {
            String result = sendToDevice(token, title, body, data);
            if (result != null) {
                successCount++;
            } else {
                failureCount++;
            }
        }

        logger.info("📊 FCM batch notification completed. Success: {}, Failure: {}", successCount, failureCount);
    }

    /**
     * Gửi notification đến topic (hiệu quả hơn cho nhiều devices)
     */
    public String sendToTopic(String topic, String title, String body, Map<String, String> data) {
        try {
            Message message = Message.builder()
                    .setTopic(topic)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data != null ? data : new HashMap<>())
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .setNotification(AndroidNotification.builder()
                                    .setSound("default")
                                    .setChannelId("fire_alert_channel")
                                    .setPriority(AndroidNotification.Priority.MAX)
                                    .build())
                            .build())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            logger.info("🔔 FCM notification sent to topic '{}'. Response: {}", topic, response);
            return response;
        } catch (FirebaseMessagingException e) {
            logger.error("❌ Failed to send FCM notification to topic: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Subscribe token vào topic
     */
    public void subscribeToTopic(String token, String topic) {
        try {
            TopicManagementResponse response = FirebaseMessaging.getInstance()
                    .subscribeToTopic(Collections.singletonList(token), topic);
            logger.info("✅ Subscribed to topic '{}'. Success: {}, Failure: {}", 
                    topic, response.getSuccessCount(), response.getFailureCount());
        } catch (FirebaseMessagingException e) {
            logger.error("❌ Failed to subscribe to topic: {}", e.getMessage());
        }
    }

    /**
     * Unsubscribe token khỏi topic
     */
    public void unsubscribeFromTopic(String token, String topic) {
        try {
            TopicManagementResponse response = FirebaseMessaging.getInstance()
                    .unsubscribeFromTopic(Collections.singletonList(token), topic);
            logger.info("✅ Unsubscribed from topic '{}'. Success: {}, Failure: {}", 
                    topic, response.getSuccessCount(), response.getFailureCount());
        } catch (FirebaseMessagingException e) {
            logger.error("❌ Failed to unsubscribe from topic: {}", e.getMessage());
        }
    }

    /**
     * Gửi Fire Alert notification (high priority)
     */
    public void sendFireAlert(String message, String sensorValue) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "fire_alert");
        data.put("message", message);
        data.put("sensor_value", sensorValue);
        data.put("timestamp", String.valueOf(System.currentTimeMillis()));
        data.put("priority", "high");

        // Gửi đến topic (recommend)
        sendToTopic(FIRE_ALERT_TOPIC, "🔥 CẢNH BÁO CHÁY!", message, data);
        
        // Hoặc gửi đến tất cả devices (backup)
        // sendToAllDevices("🔥 CẢNH BÁO CHÁY!", message, data);
    }

    /**
     * Gửi Gas Alert notification (high priority)
     */
    public void sendGasAlert(String message, String sensorValue) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "gas_alert");
        data.put("message", message);
        data.put("sensor_value", sensorValue);
        data.put("timestamp", String.valueOf(System.currentTimeMillis()));
        data.put("priority", "high");

        sendToTopic(FIRE_ALERT_TOPIC, "⚠️ CẢNH BÁO KHÍ GAS!", message, data);
    }
}
