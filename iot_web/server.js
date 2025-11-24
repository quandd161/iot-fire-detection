const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const mqtt = require('mqtt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// WebSocket Server
const wss = new WebSocket.Server({ port: process.env.WS_PORT || 8080 });

// MQTT Client
const mqttClient = mqtt.connect(process.env.MQTT_BROKER, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    keepalive: 60,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000
});

// Data storage (in-memory)
let sensorData = {
    mq2: 0,
    fire: 0,
    relay1: false,
    relay2: false,
    window: false,
    buzzer: false,
    mode: 'AUTO',
    threshold: 4000,
    lastUpdate: new Date(),
    connected: false
};

// Notification history
let notifications = [];

// MQTT Connect
mqttClient.on('connect', () => {
    console.log('✅ Connected to MQTT Broker');
    sensorData.connected = true;
    
    // Subscribe topics
    const topics = [
        'gas/sensor/#',
        'gas/status/#',
        'gas/notification'
    ];
    
    topics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
            if (!err) {
                console.log(`📡 Subscribed to ${topic}`);
            } else {
                console.error(`❌ Failed to subscribe to ${topic}:`, err);
            }
        });
    });
});

// MQTT Disconnect
mqttClient.on('disconnect', () => {
    console.log('⚠️ Disconnected from MQTT Broker');
    sensorData.connected = false;
});

// MQTT Error
mqttClient.on('error', (error) => {
    console.error('❌ MQTT Error:', error);
    sensorData.connected = false;
});

// MQTT Message Handler
mqttClient.on('message', (topic, message) => {
    const value = message.toString();
    console.log(`📨 [MQTT] ${topic}: ${value}`);
    
    // Update data
    if (topic === 'gas/sensor/mq2') {
        sensorData.mq2 = parseInt(value) || 0;
    }
    else if (topic === 'gas/sensor/fire') {
        sensorData.fire = parseInt(value) || 0;
    }
    else if (topic === 'gas/status/relay1') {
        sensorData.relay1 = value === '1';
    }
    else if (topic === 'gas/status/relay2') {
        sensorData.relay2 = value === '1';
    }
    else if (topic === 'gas/status/window') {
        sensorData.window = value === '1';
    }
    else if (topic === 'gas/status/buzzer') {
        sensorData.buzzer = value === '1';
    }
    else if (topic === 'gas/status/mode') {
        sensorData.mode = value === '1' ? 'AUTO' : 'MANUAL';
    }
    else if (topic === 'gas/status/threshold') {
        sensorData.threshold = parseInt(value) || 4000;
    }
    else if (topic === 'gas/notification') {
        try {
            const notif = JSON.parse(value);
            notif.receivedAt = new Date();
            notifications.unshift(notif);
            // Giữ tối đa 100 notifications
            if (notifications.length > 100) {
                notifications = notifications.slice(0, 100);
            }
            // Broadcast notification
            broadcastToClients({
                type: 'notification',
                data: notif
            });
        } catch (e) {
            console.error('Error parsing notification:', e);
        }
        return; // Không update lastUpdate cho notification
    }
    
    sensorData.lastUpdate = new Date();
    
    // Broadcast to all WebSocket clients
    broadcastToClients({
        type: 'data',
        data: sensorData
    });
});

// WebSocket Connection
wss.on('connection', (ws) => {
    console.log('🔌 New WebSocket client connected');
    
    // Send current data immediately
    ws.send(JSON.stringify({
        type: 'data',
        data: sensorData
    }));
    
    // Send recent notifications
    if (notifications.length > 0) {
        ws.send(JSON.stringify({
            type: 'notifications',
            data: notifications.slice(0, 10)
        }));
    }
    
    ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Broadcast to all WebSocket clients
function broadcastToClients(message) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

// ============================================================================
// REST API Endpoints
// ============================================================================

// Get current data
app.get('/api/data', (req, res) => {
    res.json({
        success: true,
        data: sensorData
    });
});

// Get notifications history
app.get('/api/notifications', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({
        success: true,
        data: notifications.slice(0, limit)
    });
});

// Control Relay 1
app.post('/api/control/relay1', (req, res) => {
    const { state } = req.body;
    const value = state ? '1' : '0';
    
    mqttClient.publish('gas/control/relay1', value, { qos: 1 }, (err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        console.log(`🎛️ Relay 1 set to ${state ? 'ON' : 'OFF'}`);
        res.json({ success: true, state });
    });
});

// Control Relay 2
app.post('/api/control/relay2', (req, res) => {
    const { state } = req.body;
    const value = state ? '1' : '0';
    
    mqttClient.publish('gas/control/relay2', value, { qos: 1 }, (err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        console.log(`🎛️ Relay 2 set to ${state ? 'ON' : 'OFF'}`);
        res.json({ success: true, state });
    });
});

// Control Window
app.post('/api/control/window', (req, res) => {
    const { state } = req.body;
    const value = state ? '1' : '0';
    
    mqttClient.publish('gas/control/window', value, { qos: 1 }, (err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        console.log(`🪟 Window set to ${state ? 'OPEN' : 'CLOSED'}`);
        res.json({ success: true, state });
    });
});

// Control Buzzer
app.post('/api/control/buzzer', (req, res) => {
    const { state } = req.body;
    const value = state ? '1' : '0';
    
    mqttClient.publish('gas/control/buzzer', value, { qos: 1 }, (err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        console.log(`🔊 Buzzer set to ${state ? 'ON' : 'OFF'}`);
        res.json({ success: true, state });
    });
});

// Change Mode (AUTO/MANUAL)
app.post('/api/control/mode', (req, res) => {
    const { mode } = req.body;
    const value = mode === 'AUTO' ? '1' : '0';
    
    mqttClient.publish('gas/control/mode', value, { qos: 1 }, (err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        console.log(`🔧 Mode set to ${mode}`);
        res.json({ success: true, mode });
    });
});

// Set Threshold
app.post('/api/control/threshold', (req, res) => {
    const { threshold } = req.body;
    
    if (threshold < 200 || threshold > 9999) {
        return res.status(400).json({ 
            success: false, 
            error: 'Threshold must be between 200 and 9999' 
        });
    }
    
    mqttClient.publish('gas/control/threshold', threshold.toString(), { qos: 1 }, (err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        console.log(`📊 Threshold set to ${threshold}`);
        res.json({ success: true, threshold });
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        mqtt: mqttClient.connected,
        websocket: wss.clients.size,
        uptime: process.uptime()
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🚀 ============================================');
    console.log(`🚀 Gas Detection Backend Server`);
    console.log(`🚀 ============================================`);
    console.log(`🌐 HTTP Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Server running on ws://localhost:${process.env.WS_PORT || 8080}`);
    console.log(`📡 MQTT Broker: ${process.env.MQTT_BROKER}`);
    console.log('🚀 ============================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️ Shutting down gracefully...');
    mqttClient.end();
    wss.close();
    process.exit(0);
});
