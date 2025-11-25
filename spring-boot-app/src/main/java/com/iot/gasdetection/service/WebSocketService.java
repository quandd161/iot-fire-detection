package com.iot.gasdetection.service;

import com.iot.gasdetection.model.WebSocketMessage;
import com.iot.gasdetection.websocket.SensorWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebSocketService {
    
    private final SensorWebSocketHandler webSocketHandler;
    
    public void broadcast(WebSocketMessage message) {
        webSocketHandler.broadcast(message);
    }
    
    public int getActiveConnections() {
        return webSocketHandler.getActiveConnectionCount();
    }
}
