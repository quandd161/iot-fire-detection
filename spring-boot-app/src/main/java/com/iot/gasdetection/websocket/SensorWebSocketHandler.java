package com.iot.gasdetection.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot.gasdetection.model.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArraySet;

@Slf4j
@Component
@RequiredArgsConstructor
public class SensorWebSocketHandler extends TextWebSocketHandler {
    
    private final ObjectMapper objectMapper;
    private final CopyOnWriteArraySet<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        log.info("🔌 New WebSocket client connected: {}", session.getId());
        log.info("📊 Total active connections: {}", sessions.size());
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.info("🔌 WebSocket client disconnected: {}", session.getId());
        log.info("📊 Total active connections: {}", sessions.size());
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Handle incoming messages if needed
        log.debug("Received message from {}: {}", session.getId(), message.getPayload());
    }
    
    public void broadcast(WebSocketMessage message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(json);
            
            sessions.forEach(session -> {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        log.error("Error sending message to session {}", session.getId(), e);
                    }
                }
            });
        } catch (Exception e) {
            log.error("Error broadcasting message", e);
        }
    }
    
    public void sendToSession(WebSocketSession session, WebSocketMessage message) {
        try {
            if (session.isOpen()) {
                String json = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException e) {
            log.error("Error sending message to session {}", session.getId(), e);
        }
    }
    
    public int getActiveConnectionCount() {
        return sessions.size();
    }
}
