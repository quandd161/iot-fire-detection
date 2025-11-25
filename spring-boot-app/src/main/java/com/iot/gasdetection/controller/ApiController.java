package com.iot.gasdetection.controller;

import com.iot.gasdetection.model.*;
import com.iot.gasdetection.service.MqttService;
import com.iot.gasdetection.service.WebSocketService;
import com.iot.gasdetection.service.FcmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApiController {

    private final MqttService mqttService;
    private final WebSocketService webSocketService;
    private final FcmService fcmService;

    // Get current sensor data
    @GetMapping("/data")
    public ApiResponse<SensorData> getData() {
        return ApiResponse.success(mqttService.getSensorData());
    }

    // Get notifications history
    @GetMapping("/notifications")
    public ApiResponse<List<Notification>> getNotifications(
            @RequestParam(defaultValue = "50") int limit) {
        List<Notification> notifications = mqttService.getNotifications();
        int endIndex = Math.min(limit, notifications.size());
        return ApiResponse.success(notifications.subList(0, endIndex));
    }

    // Control Relay 1 (Quạt hút)
    @PostMapping("/control/relay1")
    public ApiResponse<Map<String, Boolean>> controlRelay1(@RequestBody Map<String, Boolean> request) {
        try {
            Boolean state = request.get("state");
            String value = state ? "1" : "0";
            mqttService.publish("gas/control/relay1", value);
            log.info("🎛️ Relay 1 set to {}", state ? "ON" : "OFF");

            Map<String, Boolean> response = new HashMap<>();
            response.put("state", state);
            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("Error controlling relay1", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    // Control Relay 2 (Máy bơm)
    @PostMapping("/control/relay2")
    public ApiResponse<Map<String, Boolean>> controlRelay2(@RequestBody Map<String, Boolean> request) {
        try {
            Boolean state = request.get("state");
            String value = state ? "1" : "0";
            mqttService.publish("gas/control/rela                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 y2", value);
            log.info("🎛️ Relay 2 set to {}", state ? "ON" : "OFF");

            Map<String, Boolean> response = new HashMap<>();
            response.put("state", state);
            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("Error controlling relay2", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    // Control Window (Cửa sổ)
    @PostMapping("/control/window")
    public ApiResponse<Map<String, Boolean>> controlWindow(@RequestBody Map<String, Boolean> request) {
        try {
            Boolean state = request.get("state");
            String value = state ? "1" : "0";
            mqttService.publish("gas/control/window", value);
            log.info("🪟 Window set to {}", state ? "OPEN" : "CLOSED");

            Map<String, Boolean> response = new HashMap<>();
            response.put("state", state);
            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("Error controlling window", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    // Control Buzzer (Còi báo động)
    @PostMapping("/control/buzzer")
    public ApiResponse<Map<String, Boolean>> controlBuzzer(@RequestBody Map<String, Boolean> request) {
        try {
            Boolean state = request.get("state");
            String value = state ? "1" : "0";
            mqttService.publish("gas/control/buzzer", value);
            log.info("🔊 Buzzer set to {}", state ? "ON" : "OFF");

            Map<String, Boolean> response = new HashMap<>();
            response.put("state", state);
            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("Error controlling buzzer", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    // Change Mode (AUTO/MANUAL)
    @PostMapping("/control/mode")
    public ApiResponse<Map<String, String>> changeMode(@RequestBody Map<String, String> request) {
        try {
            String mode = request.get("mode");
            String value = "AUTO".equals(mode) ? "1" : "0";
            mqttService.publish("gas/control/mode", value);
            log.info("🔧 Mode set to {}", mode);

            Map<String, String> response = new HashMap<>();
            response.put("mode", mode);
            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("Error changing mode", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    // Set Threshold
    @PostMapping("/control/threshold")
    public ApiResponse<Map<String, Integer>> setThreshold(@RequestBody Map<String, Integer> request) {
        try {
            Integer threshold = request.get("threshold");

            if (threshold < 200 || threshold > 9999) {
                return ApiResponse.error("Threshold must be between 200 and 9999");
            }

            mqttService.publish("gas/control/threshold", threshold.toString());
            log.info("📊 Threshold set to {}", threshold);

            Map<String, Integer> response = new HashMap<>();
            response.put("threshold", threshold);
            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("Error setting threshold", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    // Health check
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("mqtt", mqttService.getSensorData().isConnected());
        health.put("websocket", webSocketService.getActiveConnections());
        health.put("uptime", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
        health.put("fcm_registered_devices", fcmService.getRegisteredTokens().size());
        return ApiResponse.success(health);
    }

    // ==================== FCM Endpoints ====================

    /**
     * Đăng ký FCM token từ mobile app
     * POST /api/fcm/register
     * Body: { "token": "device_fcm_token" }
     */
    @PostMapping("/fcm/register")
    public ApiResponse<String> registerFcmToken(@RequestBody FcmTokenRequest request) {
        try {
            if (request.getToken() == null || request.getToken().isEmpty()) {
                return ApiResponse.error("Token is required");
            }
            fcmService.registerToken(request.getToken());
            log.info("📱 FCM token registered successfully");
            return ApiResponse.success("Token registered successfully");
        } catch (Exception e) {
            log.error("Error registering FCM token", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * Hủy đăng ký FCM token
     * POST /api/fcm/unregister
     * Body: { "token": "device_fcm_token" }
     */
    @PostMapping("/fcm/unregister")
    public ApiResponse<String> unregisterFcmToken(@RequestBody FcmTokenRequest request) {
        try {
            if (request.getToken() == null || request.getToken().isEmpty()) {
                return ApiResponse.error("Token is required");
            }
            fcmService.unregisterToken(request.getToken());
            log.info("📱 FCM token unregistered successfully");
            return ApiResponse.success("Token unregistered successfully");
        } catch (Exception e) {
            log.error("Error unregistering FCM token", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * Test gửi notification (for testing purposes)
     * POST /api/fcm/test
     * Body: {
     *   "title": "Test Title",
     *   "body": "Test Message",
     *   "token": "optional_specific_token",
     *   "topic": "optional_topic",
     *   "data": { "key": "value" }
     * }
     */
    @PostMapping("/fcm/test")
    public ApiResponse<String> sendTestNotification(@RequestBody FcmNotificationRequest request) {
        try {
            if (request.getTitle() == null || request.getBody() == null) {
                return ApiResponse.error("Title and body are required");
            }

            String result;
            if (request.getToken() != null && !request.getToken().isEmpty()) {
                // Gửi đến device cụ thể
                result = fcmService.sendToDevice(request.getToken(), request.getTitle(), 
                        request.getBody(), request.getData());
            } else if (request.getTopic() != null && !request.getTopic().isEmpty()) {
                // Gửi đến topic
                result = fcmService.sendToTopic(request.getTopic(), request.getTitle(), 
                        request.getBody(), request.getData());
            } else {
                // Gửi đến tất cả devices đã đăng ký
                fcmService.sendToAllDevices(request.getTitle(), request.getBody(), request.getData());
                result = "Sent to all registered devices";
            }

            if (result != null) {
                return ApiResponse.success(result);
            } else {
                return ApiResponse.error("Failed to send notification");
            }
        } catch (Exception e) {
            log.error("Error sending test notification", e);
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * Lấy số lượng devices đã đăng ký
     * GET /api/fcm/devices/count
     */
    @GetMapping("/fcm/devices/count")
    public ApiResponse<Map<String, Integer>> getRegisteredDevicesCount() {
        Map<String, Integer> response = new HashMap<>();
        response.put("count", fcmService.getRegisteredTokens().size());
        return ApiResponse.success(response);
    }
}
