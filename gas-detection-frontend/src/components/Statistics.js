import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import './Statistics.css';

const Statistics = () => {
  const { sensorData } = useWebSocket();
  const [allDataPoints, setAllDataPoints] = useState([]);
  const [stats, setStats] = useState({
    avg: 0,
    max: 0,
    min: 0,
    alertCount: 0
  });

  const MAX_DATA_POINTS = 180; // 30 minutes * 6 updates/min

  // Add all incoming data to statistics
  useEffect(() => {
    setAllDataPoints(prev => {
      const newPoint = {
        mq2: sensorData.mq2,
        threshold: sensorData.threshold,
        timestamp: Date.now()
      };
      
      const updated = [...prev, newPoint];
      
      // Keep only last MAX_DATA_POINTS
      if (updated.length > MAX_DATA_POINTS) {
        updated.shift();
      }
      
      return updated;
    });
  }, [sensorData.mq2, sensorData.threshold]);

  // Calculate statistics whenever data points change
  useEffect(() => {
    if (allDataPoints.length === 0) {
      setStats({
        avg: sensorData.mq2 || 0,
        max: sensorData.mq2 || 0,
        min: sensorData.mq2 || 0,
        alertCount: 0
      });
      return;
    }

    const mq2Values = allDataPoints.map(point => point.mq2);
    const sum = mq2Values.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / mq2Values.length);
    const max = Math.max(...mq2Values);
    const min = Math.min(...mq2Values);
    const alertCount = allDataPoints.filter(point => point.mq2 > point.threshold).length;

    setStats({ avg, max, min, alertCount });
  }, [allDataPoints, sensorData.mq2]);

  return (
    <section className="stats-section">
      <h2>📈 Thống kê (30 phút)</h2>
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-label">Trung bình</div>
            <div className="stat-value">{stats.avg}</div>
            <div className="stat-unit">ppm</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">⬆️</div>
          <div className="stat-info">
            <div className="stat-label">Cao nhất</div>
            <div className="stat-value">{stats.max}</div>
            <div className="stat-unit">ppm</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">⬇️</div>
          <div className="stat-info">
            <div className="stat-label">Thấp nhất</div>
            <div className="stat-value">{stats.min}</div>
            <div className="stat-unit">ppm</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-label">Vượt ngưỡng</div>
            <div className="stat-value">{stats.alertCount}</div>
            <div className="stat-unit">lần</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;
