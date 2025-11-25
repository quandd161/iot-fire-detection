package com.iot.gasdetection.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "mqtt")
public class MqttProperties {

    private Broker broker = new Broker();
    private Client client = new Client();
    private Topics topics = new Topics();

    @Data
    public static class Broker {

        private String url;
        private String username;
        private String password;
    }

    @Data
    public static class Client {

        private String id;
    }

    @Data
    public static class Topics {

        private String sensor;
        private String status;
        private String notification;
    }
}
