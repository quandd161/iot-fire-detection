const aedes = require('aedes')();
const net = require('net');

const port = 1883;

const server = net.createServer(aedes.handle);

server.listen(port, function () {
    console.log('🚀 ========================================');
    console.log('🚀 Local MQTT Broker Started');
    console.log('🚀 ========================================');
    console.log(`📡 MQTT Broker running on port ${port}`);
    console.log(`📍 Connect to: mqtt://192.168.1.19:${port}`);
    console.log('🚀 ========================================\n');
});

aedes.on('client', function (client) {
    console.log(`📱 Client Connected: ${client.id}`);
});

aedes.on('clientDisconnect', function (client) {
    console.log(`📴 Client Disconnected: ${client.id}`);
});

aedes.on('publish', function (packet, client) {
    if (client) {
        console.log(`📨 [${packet.topic}]: ${packet.payload.toString()}`);
    }
});

aedes.on('subscribe', function (subscriptions, client) {
    console.log(`📡 Client ${client.id} subscribed to:`, subscriptions.map(s => s.topic).join(', '));
});
