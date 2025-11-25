package com.iot.gasdetection.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SensorData {

    private int mq2 = 0;
    private int fire = 0;
    private boolean relay1 = false;
    private boolean relay2 = false;
    private boolean window = false;
    private boolean buzzer = false;
    private String mode = "AUTO";
    private int threshold = 4000;
    private LocalDateTime lastUpdate = LocalDateTime.now();
    private boolean connected = false;
}
