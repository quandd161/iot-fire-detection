package com.iot.gasdetection.controller;

import com.iot.gasdetection.model.ApiResponse;
import com.iot.gasdetection.model.SensorData;
import com.iot.gasdetection.model.Notification;
import com.iot.gasdetection.service.MqttService;
import com.iot.gasdetection.service.WebSocketService;
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
        return ApiResponse.success(health);
    }
}
