import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [sensorData, setSensorData] = useState({
    mq2: 0,
    fire: 0,
    relay1: false,
    relay2: false,
    window: false,
    buzzer: false,
    mode: 'AUTO',
    threshold: 4000,
    lastUpdate: null
  });
  const [notifications, setNotifications] = useState([]);
  
  const wsRef = useRef(null);
  const reconnectIntervalRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    const wsUrl = `ws://${window.location.hostname}:8080/ws`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'data') {
          setSensorData(prevData => ({
            ...prevData,
            ...message.data,
            lastUpdate: new Date().toISOString()
          }));
        } else if (message.type === 'notification') {
          setNotifications(prev => [
            {
              ...message.data,
              receivedAt: new Date().toISOString()
            },
            ...prev
          ].slice(0, 50)); // Keep max 50 notifications
        } else if (message.type === 'notifications') {
          setNotifications(message.data.map(notif => ({
            ...notif,
            receivedAt: notif.receivedAt || new Date().toISOString()
          })));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
      
      // Auto reconnect after 3 seconds
      if (!reconnectIntervalRef.current) {
        reconnectIntervalRef.current = setInterval(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      }
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
    };
  }, [connectWebSocket]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    connected,
    sensorData,
    notifications,
    clearNotifications
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
