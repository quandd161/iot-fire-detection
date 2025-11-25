package com.iot.gasdetection.listener;

import com.iot.gasdetection.model.WebSocketMessage;
import com.iot.gasdetection.service.MqttService;
import com.iot.gasdetection.websocket.SensorWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.messaging.SessionConnectedEvent;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {
    
    private final MqttService mqttService;
    private final SensorWebSocketHandler webSocketHandler;
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        log.info("Received a new web socket connection");
        
        // Note: This is handled in SensorWebSocketHandler.afterConnectionEstablished
        // But keeping this for potential future use
    }
}
