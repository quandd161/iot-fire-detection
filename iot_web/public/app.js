// Configuration
const API_URL = window.location.origin;
const WS_URL = `ws://${window.location.hostname}:8081`;

// WebSocket connection
let ws = null;
let reconnectInterval = null;

// Current data
let currentData = {
    mq2: 0,
    fire: 0,
    relay1: false,
    relay2: false,
    window: false,
    mode: 'AUTO',
    threshold: 4000,
    connected: false
};

// Chart data
let chartData = {
    labels: [],
    mq2Values: [],
    thresholdValues: [],
    maxPoints: 30 // 30 data points
};

// Statistics
let stats = {
    avg: 0,
    max: 0,
    min: 0,
    alertCount: 0
};

// Chart instance
let gasChart = null;

// DOM Elements
const elements = {
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    gasValue: document.getElementById('gasValue').querySelector('.value'),
    gasStatus: document.getElementById('gasStatus'),
    fireValue: document.getElementById('fireValue').querySelector('.value'),
    fireStatus: document.getElementById('fireStatus'),
    thresholdValue: document.getElementById('thresholdValue').querySelector('.value'),
    thresholdSlider: document.getElementById('thresholdSlider'),
    setThresholdBtn: document.getElementById('setThresholdBtn'),
    modeBtn: document.getElementById('modeBtn'),
    relay1Btn: document.getElementById('relay1Btn'),
    relay2Btn: document.getElementById('relay2Btn'),
    windowBtn: document.getElementById('windowBtn'),
    notificationsList: document.getElementById('notificationsList'),
    lastUpdate: document.getElementById('lastUpdate'),
    avgValue: document.getElementById('avgValue'),
    maxValue: document.getElementById('maxValue'),
    minValue: document.getElementById('minValue'),
    alertCount: document.getElementById('alertCount')
};

// ============================================================================
// WebSocket Functions
// ============================================================================

function connectWebSocket() {
    console.log('Connecting to WebSocket...');
    updateConnectionStatus(false);

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('✅ WebSocket connected');
        updateConnectionStatus(true);
        clearInterval(reconnectInterval);
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        updateConnectionStatus(false);

        // Auto reconnect after 3 seconds
        reconnectInterval = setInterval(() => {
            console.log('Attempting to reconnect...');
            connectWebSocket();
        }, 3000);
    };
}

function handleWebSocketMessage(message) {
    if (message.type === 'data') {
        currentData = message.data;
        updateUI();
    } else if (message.type === 'notification') {
        addNotification(message.data);
    } else if (message.type === 'notifications') {
        // Load recent notifications
        message.data.forEach(notif => addNotification(notif, false));
    }
}

// ============================================================================
// API Functions
// ============================================================================

async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        alert('Lỗi kết nối đến server: ' + error.message);
        throw error;
    }
}

async function controlRelay1(state) {
    await apiRequest('/api/control/relay1', 'POST', { state });
}

async function controlRelay2(state) {
    await apiRequest('/api/control/relay2', 'POST', { state });
}

async function controlWindow(state) {
    await apiRequest('/api/control/window', 'POST', { state });
}

async function changeMode(mode) {
    await apiRequest('/api/control/mode', 'POST', { mode });
}

async function setThreshold(threshold) {
    await apiRequest('/api/control/threshold', 'POST', { threshold });
}

// ============================================================================
// UI Update Functions
// ============================================================================

function updateConnectionStatus(connected) {
    currentData.connected = connected;

    if (connected) {
        elements.statusIndicator.classList.add('connected');
        elements.statusText.textContent = 'Đã kết nối';
    } else {
        elements.statusIndicator.classList.remove('connected');
        elements.statusText.textContent = 'Mất kết nối';
    }
}

function updateUI() {
    // Update gas sensor
    elements.gasValue.textContent = currentData.mq2;

    const gasCard = document.querySelector('.gas-card');
    elements.gasStatus.className = 'sensor-status';

    if (currentData.mq2 > currentData.threshold) {
        elements.gasStatus.textContent = 'NGUY HIỂM!';
        elements.gasStatus.classList.add('danger');
        gasCard.style.borderLeft = '5px solid var(--danger-color)';
    } else if (currentData.mq2 > currentData.threshold * 0.8) {
        elements.gasStatus.textContent = 'Cảnh báo';
        elements.gasStatus.classList.add('warning');
        gasCard.style.borderLeft = '5px solid var(--warning-color)';
    } else {
        elements.gasStatus.textContent = 'Bình thường';
        elements.gasStatus.classList.add('safe');
        gasCard.style.borderLeft = '5px solid var(--primary-color)';
    }

    // Update fire sensor
    const fireCard = document.querySelector('.fire-card');
    elements.fireStatus.className = 'sensor-status';

    if (currentData.fire === 0) {
        elements.fireValue.textContent = 'PHÁT HIỆN LỬA!';
        elements.fireStatus.textContent = 'NGUY HIỂM!';
        elements.fireStatus.classList.add('danger');
        fireCard.style.borderLeft = '5px solid var(--danger-color)';
    } else {
        elements.fireValue.textContent = 'Bình thường';
        elements.fireStatus.textContent = 'An toàn';
        elements.fireStatus.classList.add('safe');
        fireCard.style.borderLeft = '5px solid var(--primary-color)';
    }

    // Update threshold
    elements.thresholdValue.textContent = currentData.threshold;
    elements.thresholdSlider.value = currentData.threshold;

    // Update mode
    elements.modeBtn.className = `mode-btn ${currentData.mode.toLowerCase()}`;
    elements.modeBtn.querySelector('.mode-text').textContent = currentData.mode;

    // Update relay 1
    updateControlButton(elements.relay1Btn, currentData.relay1, 'ON', 'OFF');

    // Update relay 2
    updateControlButton(elements.relay2Btn, currentData.relay2, 'ON', 'OFF');

    // Update window
    updateControlButton(elements.windowBtn, currentData.window, 'MỞ', 'ĐÓNG');

    // Update chart and statistics
    updateChartData();
    updateStatistics();

    // Update last update time
    if (currentData.lastUpdate) {
        const date = new Date(currentData.lastUpdate);
        elements.lastUpdate.textContent = date.toLocaleString('vi-VN');
    }
}

function updateControlButton(button, state, onText, offText) {
    button.setAttribute('data-state', state ? 'on' : 'off');
    button.querySelector('.btn-text').textContent = state ? onText : offText;
}

function addNotification(notification, animate = true) {
    // Remove "no notifications" message
    const noNotif = elements.notificationsList.querySelector('.no-notifications');
    if (noNotif) {
        noNotif.remove();
    }

    const notifElement = document.createElement('div');
    notifElement.className = `notification-item ${notification.type}`;
    if (!animate) {
        notifElement.style.animation = 'none';
    }

    const message = document.createElement('div');
    message.className = 'notification-message';
    message.textContent = notification.message;

    const time = document.createElement('div');
    time.className = 'notification-time';
    const date = new Date(notification.receivedAt || notification.timestamp);
    time.textContent = date.toLocaleTimeString('vi-VN');

    notifElement.appendChild(message);
    notifElement.appendChild(time);

    // Insert at the top
    elements.notificationsList.insertBefore(notifElement, elements.notificationsList.firstChild);

    // Keep max 50 notifications
    const notifications = elements.notificationsList.querySelectorAll('.notification-item');
    if (notifications.length > 50) {
        notifications[notifications.length - 1].remove();
    }
}

// ============================================================================
// Event Listeners
// ============================================================================

// Threshold slider
elements.thresholdSlider.addEventListener('input', (e) => {
    elements.thresholdValue.textContent = e.target.value;
});

// Set threshold button
elements.setThresholdBtn.addEventListener('click', async () => {
    const threshold = parseInt(elements.thresholdSlider.value);
    try {
        await setThreshold(threshold);
        alert(`Đã đặt ngưỡng cảnh báo: ${threshold} ppm`);
    } catch (error) {
        console.error('Error setting threshold:', error);
    }
});

// Mode button
elements.modeBtn.addEventListener('click', async () => {
    const newMode = currentData.mode === 'AUTO' ? 'MANUAL' : 'AUTO';
    try {
        await changeMode(newMode);
    } catch (error) {
        console.error('Error changing mode:', error);
    }
});

// Relay 1 button
elements.relay1Btn.addEventListener('click', async () => {
    try {
        await controlRelay1(!currentData.relay1);
    } catch (error) {
        console.error('Error controlling relay 1:', error);
    }
});

// Relay 2 button
elements.relay2Btn.addEventListener('click', async () => {
    try {
        await controlRelay2(!currentData.relay2);
    } catch (error) {
        console.error('Error controlling relay 2:', error);
    }
});

// Window button
elements.windowBtn.addEventListener('click', async () => {
    try {
        await controlWindow(!currentData.window);
    } catch (error) {
        console.error('Error controlling window:', error);
    }
});

// ============================================================================
// Chart Functions
// ============================================================================

function initChart() {
    const ctx = document.getElementById('gasChart');
    if (!ctx) return;

    gasChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'MQ2 (ppm)',
                    data: chartData.mq2Values,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Ngưỡng',
                    data: chartData.thresholdValues,
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nồng độ (ppm)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Thời gian'
                    }
                }
            }
        }
    });
}

function updateChartData() {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Add new data point
    chartData.labels.push(timeLabel);
    chartData.mq2Values.push(currentData.mq2);
    chartData.thresholdValues.push(currentData.threshold);

    // Keep only last maxPoints
    if (chartData.labels.length > chartData.maxPoints) {
        chartData.labels.shift();
        chartData.mq2Values.shift();
        chartData.thresholdValues.shift();
    }

    // Update chart
    if (gasChart) {
        gasChart.data.labels = chartData.labels;
        gasChart.data.datasets[0].data = chartData.mq2Values;
        gasChart.data.datasets[1].data = chartData.thresholdValues;
        gasChart.update('none'); // Update without animation for better performance
    }
}

function updateStatistics() {
    if (chartData.mq2Values.length === 0) return;

    // Calculate average
    const sum = chartData.mq2Values.reduce((a, b) => a + b, 0);
    stats.avg = Math.round(sum / chartData.mq2Values.length);

    // Calculate max and min
    stats.max = Math.max(...chartData.mq2Values);
    stats.min = Math.min(...chartData.mq2Values);

    // Count alerts
    stats.alertCount = chartData.mq2Values.filter(val => val > currentData.threshold).length;

    // Update UI
    if (elements.avgValue) elements.avgValue.textContent = stats.avg;
    if (elements.maxValue) elements.maxValue.textContent = stats.max;
    if (elements.minValue) elements.minValue.textContent = stats.min;
    if (elements.alertCount) elements.alertCount.textContent = stats.alertCount;
}

// ============================================================================
// Initialize
// ============================================================================

async function init() {
    console.log('🚀 Initializing Gas Detection Dashboard...');

    // Initialize chart
    initChart();

    // Load initial data
    try {
        const response = await apiRequest('/api/data');
        currentData = response.data;
        updateUI();
    } catch (error) {
        console.error('Failed to load initial data:', error);
    }

    // Connect WebSocket for realtime updates
    connectWebSocket();
}

// Start application
init();
