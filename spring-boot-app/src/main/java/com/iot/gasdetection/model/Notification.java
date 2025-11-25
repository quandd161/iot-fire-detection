package com.iot.gasdetection.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    private String type;
    private String message;
    private long timestamp;
    
    @JsonProperty("receivedAt")
    private LocalDateTime receivedAt;
    
    public Notification(String type, String message, long timestamp) {
        this.type = type;
        this.message = message;
        this.timestamp = timestamp;
        this.receivedAt = LocalDateTime.now();
    }
}
