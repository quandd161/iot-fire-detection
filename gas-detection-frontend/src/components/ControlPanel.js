import React, { useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../services/api';
import './ControlPanel.css';

const ControlPanel = () => {
  const { sensorData } = useWebSocket();
  const [localThreshold, setLocalThreshold] = useState(sensorData.threshold);
  const [isDragging, setIsDragging] = useState(false);

  React.useEffect(() => {
    if (!isDragging) {
      setLocalThreshold(sensorData.threshold);
    }
  }, [sensorData.threshold, isDragging]);

  const handleSliderChange = (e) => {
    setLocalThreshold(parseInt(e.target.value));
  };

  const handleSetThreshold = async () => {
    try {
      await api.setThreshold(localThreshold);
      alert(`Đã đặt ngưỡng cảnh báo: ${localThreshold} ppm`);
    } catch (error) {
      console.error('Error setting threshold:', error);
      alert('Lỗi khi đặt ngưỡng: ' + error.message);
    }
  };

  const handleControl = async (controlFn, newState, deviceName) => {
    try {
      await controlFn(newState);
    } catch (error) {
      console.error(`Error controlling ${deviceName}:`, error);
      alert(`Lỗi khi điều khiển ${deviceName}: ` + error.message);
    }
  };

  const getButtonText = (state, onText, offText) => {
    return state ? onText : offText;
  };

  return (
    <>
      {/* Controls Section */}
      <section className="controls-section">
        <h2>🎛️ Điều khiển thiết bị</h2>
        <div className="control-group">
          <div className="control-item">
            <div className="control-info">
              <span className="control-icon">💨</span>
              <div className="control-text">
                <h4>Quạt hút</h4>
                <p>Làm sạch không khí</p>
              </div>
            </div>
            <button
              className="control-toggle"
              data-state={sensorData.relay1 ? 'off' : 'on'}
              onClick={() => handleControl(api.controlRelay1, !sensorData.relay1, 'Quạt hút')}
            >
              <span className="toggle-text">
                {getButtonText(sensorData.relay1, 'TẮT', 'BẬT')}
              </span>
            </button>
          </div>

          <div className="control-item">
            <div className="control-info">
              <span className="control-icon">💧</span>
              <div className="control-text">
                <h4>Máy bơm</h4>
                <p>Hệ thống chữa cháy</p>
              </div>
            </div>
            <button
              className="control-toggle"
              data-state={sensorData.relay2 ? 'off' : 'on'}
              onClick={() => handleControl(api.controlRelay2, !sensorData.relay2, 'Máy bơm')}
            >
              <span className="toggle-text">
                {getButtonText(sensorData.relay2, 'TẮT', 'BẬT')}
              </span>
            </button>
          </div>

          <div className="control-item">
            <div className="control-info">
              <span className="control-icon">🪟</span>
              <div className="control-text">
                <h4>Cửa sổ</h4>
                <p>Thông gió tự động</p>
              </div>
            </div>
            <button
              className="control-toggle"
              data-state={sensorData.window ? 'off' : 'on'}
              onClick={() => handleControl(api.controlWindow, !sensorData.window, 'Cửa sổ')}
            >
              <span className="toggle-text">
                {getButtonText(sensorData.window, 'ĐÓNG', 'MỞ')}
              </span>
            </button>
          </div>

          <div className="control-item">
            <div className="control-info">
              <span className="control-icon">🔊</span>
              <div className="control-text">
                <h4>Còi báo động</h4>
                <p>Cảnh báo âm thanh</p>
              </div>
            </div>
            <button
              className="control-toggle"
              data-state={sensorData.buzzer ? 'off' : 'on'}
              onClick={() => handleControl(api.controlBuzzer, !sensorData.buzzer, 'Còi báo động')}
            >
              <span className="toggle-text">
                {getButtonText(sensorData.buzzer, 'TẮT', 'BẬT')}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Threshold Settings */}
      <section className="settings-section">
        <h2>⚙️ Cài đặt ngưỡng</h2>
        <div className="settings-box">
          <div className="setting-display">
            <span className="setting-label">Ngưỡng hiện tại</span>
            <span className="setting-value">
              {isDragging ? localThreshold : sensorData.threshold} ppm
            </span>
          </div>
          <button className="btn-primary btn-block" onClick={handleSetThreshold}>
            ✓ Áp dụng ngưỡng mới
          </button>
        </div>
      </section>
    </>
  );
};

export default ControlPanel;
