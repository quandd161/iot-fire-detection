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
    buzzer: false,
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

// Chart update control
let lastChartUpdate = 0;
const CHART_UPDATE_INTERVAL = 10000; // Update chart every 10 seconds

// All data for statistics (keep last 30 minutes of data)
let allDataPoints = [];
const MAX_DATA_POINTS = 180; // 30 minutes * 6 updates/min = 180 points

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
    gasValue: document.getElementById('gasValue'),
    gasStatus: document.getElementById('gasStatus'),
    fireValue: document.getElementById('fireValue'),
    fireStatus: document.getElementById('fireStatus'),
    thresholdDisplay: document.getElementById('thresholdDisplay'),
    thresholdValue: document.getElementById('thresholdValue'),
    thresholdSlider: document.getElementById('thresholdSlider'),
    setThresholdBtn: document.getElementById('setThresholdBtn'),
    modeBtn: document.getElementById('modeBtn'),
    relay1Btn: document.getElementById('relay1Btn'),
    relay2Btn: document.getElementById('relay2Btn'),
    windowBtn: document.getElementById('windowBtn'),
    buzzerBtn: document.getElementById('buzzerBtn'),
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

async function controlBuzzer(state) {
    await apiRequest('/api/control/buzzer', 'POST', { state });
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
    if (elements.gasValue) {
        elements.gasValue.textContent = currentData.mq2;
    }

    if (elements.gasStatus) {
        elements.gasStatus.className = 'mini-status';

        if (currentData.mq2 > currentData.threshold) {
            elements.gasStatus.textContent = 'Nguy hiểm';
            elements.gasStatus.classList.add('danger');
        } else if (currentData.mq2 > currentData.threshold * 0.8) {
            elements.gasStatus.textContent = 'Cảnh báo';
            elements.gasStatus.classList.add('warning');
        } else {
            elements.gasStatus.textContent = 'An toàn';
            elements.gasStatus.classList.add('safe');
        }
    }

    // Update fire sensor
    if (elements.fireValue && elements.fireStatus) {
        elements.fireStatus.className = 'mini-status';

        if (currentData.fire === 0) {
            elements.fireValue.textContent = 'CHÁY!';
            elements.fireStatus.textContent = 'Nguy hiểm';
            elements.fireStatus.classList.add('danger');
        } else {
            elements.fireValue.textContent = 'OK';
            elements.fireStatus.textContent = 'An toàn';
            elements.fireStatus.classList.add('safe');
        }
    }

    // Update threshold (only if not currently being dragged)
    const isDragging = elements.thresholdSlider && elements.thresholdSlider.dataset.dragging === 'true';

    if (!isDragging) {
        if (elements.thresholdDisplay) {
            elements.thresholdDisplay.textContent = currentData.threshold;
        }
        if (elements.thresholdValue) {
            elements.thresholdValue.textContent = currentData.threshold + ' ppm';
        }
        if (elements.thresholdSlider) {
            elements.thresholdSlider.value = currentData.threshold;
        }
    }

    // Update mode
    if (elements.modeBtn) {
        elements.modeBtn.className = `mode-btn compact ${currentData.mode.toLowerCase()}`;
        const modeText = elements.modeBtn.querySelector('.mode-text');
        if (modeText) {
            modeText.textContent = currentData.mode;
        }
    }

    // Update relay 1 (Quạt) - Show action to take (if OFF, show BẬT button)
    updateControlButton(elements.relay1Btn, currentData.relay1, 'TẮT', 'BẬT');

    // Update relay 2 (Máy bơm) - Show action to take (if OFF, show BẬT button)
    updateControlButton(elements.relay2Btn, currentData.relay2, 'TẮT', 'BẬT');

    // Update window - Show action to take (if CLOSED, show MỞ button)
    updateControlButton(elements.windowBtn, currentData.window, 'ĐÓNG', 'MỞ');

    // Update buzzer - Show action to take (if OFF, show BẬT button)
    updateControlButton(elements.buzzerBtn, currentData.buzzer, 'TẮT', 'BẬT');

    // Always add data point for statistics calculation
    allDataPoints.push({
        mq2: currentData.mq2,
        threshold: currentData.threshold,
        timestamp: Date.now()
    });

    // Keep only last MAX_DATA_POINTS
    if (allDataPoints.length > MAX_DATA_POINTS) {
        allDataPoints.shift();
    }

    // Update chart and statistics - only add chart point every 10 seconds
    const now = Date.now();
    if (now - lastChartUpdate >= CHART_UPDATE_INTERVAL) {
        updateChartData();
        lastChartUpdate = now;
    }

    // Always update statistics (based on all data points)
    updateStatistics();

    // Update last update time
    if (currentData.lastUpdate && elements.lastUpdate) {
        const date = new Date(currentData.lastUpdate);
        elements.lastUpdate.textContent = date.toLocaleString('vi-VN');
    }
} function updateControlButton(button, state, onText, offText) {
    // When device is ON, show OFF button (red) - user can click to turn OFF
    // When device is OFF, show ON button (green) - user can click to turn ON
    button.setAttribute('data-state', state ? 'off' : 'on');
    const textElement = button.querySelector('.toggle-text') || button.querySelector('.btn-text');
    if (textElement) {
        textElement.textContent = state ? onText : offText;
    }
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

// Threshold slider - mark as dragging when user interacts
elements.thresholdSlider.addEventListener('mousedown', () => {
    elements.thresholdSlider.dataset.dragging = 'true';
});

elements.thresholdSlider.addEventListener('touchstart', () => {
    elements.thresholdSlider.dataset.dragging = 'true';
});

elements.thresholdSlider.addEventListener('mouseup', () => {
    setTimeout(() => delete elements.thresholdSlider.dataset.dragging, 100);
});

elements.thresholdSlider.addEventListener('touchend', () => {
    setTimeout(() => delete elements.thresholdSlider.dataset.dragging, 100);
});

// Also remove dragging flag when slider loses focus or user stops interacting
elements.thresholdSlider.addEventListener('blur', () => {
    setTimeout(() => delete elements.thresholdSlider.dataset.dragging, 100);
});

elements.thresholdSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    if (elements.thresholdValue) {
        elements.thresholdValue.textContent = val + ' ppm';
    }
    if (elements.thresholdDisplay) {
        elements.thresholdDisplay.textContent = val;
    }
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

// Buzzer button
elements.buzzerBtn.addEventListener('click', async () => {
    try {
        await controlBuzzer(!currentData.buzzer);
    } catch (error) {
        console.error('Error controlling buzzer:', error);
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
                    borderColor: '#0EA5E9',
                    backgroundColor: 'rgba(14, 165, 233, 0.15)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0EA5E9',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Ngưỡng',
                    data: chartData.thresholdValues,
                    borderColor: '#F97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderWidth: 2,
                    borderDash: [8, 4],
                    tension: 0,
                    fill: false,
                    pointRadius: 0
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
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#F0F9FF',
                    bodyColor: '#F0F9FF',
                    borderColor: '#0EA5E9',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nồng độ (ppm)',
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        color: '#64748B'
                    },
                    grid: {
                        color: 'rgba(100, 116, 139, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748B',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Thời gian',
                        font: {
                            size: 13,
                            weight: '600'
                        },
                        color: '#64748B'
                    },
                    grid: {
                        color: 'rgba(100, 116, 139, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748B',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
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
    console.log('📊 Updating statistics, total data points:', allDataPoints.length, 'chart points:', chartData.mq2Values.length);

    // Use all data points for accurate statistics
    const dataSource = allDataPoints.length > 0 ? allDataPoints : [];

    if (dataSource.length === 0) {
        // If no data yet, show current value
        const currentValue = currentData.mq2 || 0;
        console.log('No historical data, using current value:', currentValue);
        if (elements.avgValue) elements.avgValue.textContent = currentValue;
        if (elements.maxValue) elements.maxValue.textContent = currentValue;
        if (elements.minValue) elements.minValue.textContent = currentValue;
        if (elements.alertCount) elements.alertCount.textContent = 0;
        return;
    }

    // Extract MQ2 values from data points
    const mq2Values = dataSource.map(point => point.mq2);

    // Calculate average
    const sum = mq2Values.reduce((a, b) => a + b, 0);
    stats.avg = Math.round(sum / mq2Values.length);

    // Calculate max and min
    stats.max = Math.max(...mq2Values);
    stats.min = Math.min(...mq2Values);

    // Count alerts
    stats.alertCount = dataSource.filter(point => point.mq2 > point.threshold).length;

    console.log('Stats calculated:', { avg: stats.avg, max: stats.max, min: stats.min, alerts: stats.alertCount });

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
