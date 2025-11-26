import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../services/api';
import './Header.css';

const Header = () => {
  const { connected, sensorData } = useWebSocket();

  const handleModeToggle = async () => {
    try {
      const newMode = sensorData.mode === 'AUTO' ? 'MANUAL' : 'AUTO';
      await api.changeMode(newMode);
    } catch (error) {
      console.error('Error changing mode:', error);
      alert('Lỗi khi thay đổi chế độ: ' + error.message);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1>🔥 Gas Detection System</h1>
      </div>
      <div className="header-right">
        <div className="connection-status">
          <span className={`status-indicator ${connected ? 'connected' : ''}`}></span>
          <span>{connected ? 'Đã kết nối' : 'Mất kết nối'}</span>
        </div>
        <div className="mode-switch-header">
          <span className="mode-label">Chế độ:</span>
          <button 
            className={`mode-btn ${sensorData.mode.toLowerCase()}`}
            onClick={handleModeToggle}
          >
            <span className="mode-text">{sensorData.mode}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
