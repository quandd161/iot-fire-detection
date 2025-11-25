const API_URL = window.location.origin;

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
    throw error;
  }
}

export const api = {
  getData: () => apiRequest('/api/data'),
  
  controlRelay1: (state) => apiRequest('/api/control/relay1', 'POST', { state }),
  
  controlRelay2: (state) => apiRequest('/api/control/relay2', 'POST', { state }),
  
  controlWindow: (state) => apiRequest('/api/control/window', 'POST', { state }),
  
  controlBuzzer: (state) => apiRequest('/api/control/buzzer', 'POST', { state }),
  
  changeMode: (mode) => apiRequest('/api/control/mode', 'POST', { mode }),
  
  setThreshold: (threshold) => apiRequest('/api/control/threshold', 'POST', { threshold }),
  
  getNotifications: () => apiRequest('/api/notifications')
};
