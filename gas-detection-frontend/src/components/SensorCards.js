import React, { useState, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../services/api';
import './SensorCards.css';

const SensorCards = () => {
  const { sensorData } = useWebSocket();
  const [localThreshold, setLocalThreshold] = useState(sensorData.threshold);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const handleSliderChange = (e) => {
    setLocalThreshold(parseInt(e.target.value));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => {
    setTimeout(() => setIsDragging(false), 100);
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

  // Update local threshold when server data changes (but not when dragging)
  React.useEffect(() => {
    if (!isDragging) {
      setLocalThreshold(sensorData.threshold);
    }
  }, [sensorData.threshold, isDragging]);

  const getGasStatus = () => {
    if (sensorData.mq2 > sensorData.threshold) {
      return { text: 'Nguy hiểm', className: 'danger' };
    } else if (sensorData.mq2 > sensorData.threshold * 0.8) {
      return { text: 'Cảnh báo', className: 'warning' };
    } else {
      return { text: 'An toàn', className: 'safe' };
    }
  };

  const getFireStatus = () => {
    if (sensorData.fire === 0) {
      return { value: 'CHÁY!', status: 'Nguy hiểm', className: 'danger' };
    } else {
      return { value: 'OK', status: 'An toàn', className: 'safe' };
    }
  };

  const gasStatus = getGasStatus();
  const fireStatus = getFireStatus();

  return (
    <section className="sensors-row">
      {/* Gas Sensor */}
      <div className="sensor-card">
        <div className="sensor-header">
          <span className="sensor-icon">💨</span>
          <h3>Nồng độ Gas</h3>
        </div>
        <div className="sensor-body">
          <div className="sensor-value">
            <span className="value">{sensorData.mq2}</span>
            <span className="unit">ppm</span>
          </div>
          <div className={`sensor-status ${gasStatus.className}`}>
            {gasStatus.text}
          </div>
        </div>
      </div>

      {/* Fire Sensor */}
      <div className="sensor-card">
        <div className="sensor-header">
          <span className="sensor-icon">🔥</span>
          <h3>Cảm biến Lửa</h3>
        </div>
        <div className="sensor-body">
          <div className="sensor-value">
            <span className="value">{fireStatus.value}</span>
          </div>
          <div className={`sensor-status ${fireStatus.className}`}>
            {fireStatus.status}
          </div>
        </div>
      </div>

      {/* Threshold Setting */}
      <div className="sensor-card">
        <div className="sensor-header">
          <span className="sensor-icon">⚠️</span>
          <h3>Ngưỡng cảnh báo</h3>
        </div>
        <div className="sensor-body">
          <div className="sensor-value">
            <span className="value">{isDragging ? localThreshold : sensorData.threshold}</span>
            <span className="unit">ppm</span>
          </div>
          <input
            ref={sliderRef}
            type="range"
            min="200"
            max="9999"
            step="50"
            value={isDragging ? localThreshold : sensorData.threshold}
            onChange={handleSliderChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className="threshold-slider"
          />
        </div>
      </div>
    </section>
  );
};

export default SensorCards;
