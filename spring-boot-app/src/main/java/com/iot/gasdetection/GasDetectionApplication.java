package com.iot.gasdetection;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GasDetectionApplication {

    public static void main(String[] args) {
        System.out.println("========================================");
        System.out.println("🚀 Gas Detection System - Spring Boot");
        System.out.println("========================================");
        SpringApplication.run(GasDetectionApplication.class, args);
    }
}
