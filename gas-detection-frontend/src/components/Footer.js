import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import './Footer.css';

const Footer = () => {
  const { sensorData } = useWebSocket();

  const getLastUpdateTime = () => {
    if (!sensorData.lastUpdate) return '--';
    const date = new Date(sensorData.lastUpdate);
    return date.toLocaleString('vi-VN');
  };

  return (
    <footer className="footer">
      <div className="footer-info">
        <span>© 2025 Gas Detection System - IoT Dashboard</span>
      </div>
      <div className="footer-time">
        <span>Cập nhật lần cuối: </span>
        <span>{getLastUpdateTime()}</span>
      </div>
    </footer>
  );
};

export default Footer;
