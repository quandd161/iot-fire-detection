package com.iot.gasdetection.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FcmNotificationRequest {
    private String title;
    private String body;
    private String token; // Optional: nếu muốn gửi đến device cụ thể
    private String topic; // Optional: nếu muốn gửi đến topic
    private Map<String, String> data; // Optional: custom data
}
