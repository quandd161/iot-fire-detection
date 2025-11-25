import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { useWebSocket } from '../context/WebSocketContext';
import './GasChart.css';

Chart.register(...registerables);

const GasChart = () => {
  const { sensorData } = useWebSocket();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [chartData, setChartData] = useState({
    labels: [],
    mq2Values: [],
    thresholdValues: []
  });
  const lastUpdateRef = useRef(0);
  const CHART_UPDATE_INTERVAL = 10000; // 10 seconds
  const MAX_POINTS = 30;

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    
    chartInstanceRef.current = new Chart(ctx, {
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

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    
    // Only update chart every CHART_UPDATE_INTERVAL
    if (now - lastUpdateRef.current >= CHART_UPDATE_INTERVAL) {
      const timeLabel = new Date().toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      setChartData(prev => {
        const newLabels = [...prev.labels, timeLabel];
        const newMq2 = [...prev.mq2Values, sensorData.mq2];
        const newThreshold = [...prev.thresholdValues, sensorData.threshold];

        // Keep only last MAX_POINTS
        if (newLabels.length > MAX_POINTS) {
          newLabels.shift();
          newMq2.shift();
          newThreshold.shift();
        }

        // Update chart instance
        if (chartInstanceRef.current) {
          chartInstanceRef.current.data.labels = newLabels;
          chartInstanceRef.current.data.datasets[0].data = newMq2;
          chartInstanceRef.current.data.datasets[1].data = newThreshold;
          chartInstanceRef.current.update('none');
        }

        return {
          labels: newLabels,
          mq2Values: newMq2,
          thresholdValues: newThreshold
        };
      });

      lastUpdateRef.current = now;
    }
  }, [sensorData.mq2, sensorData.threshold]);

  return (
    <section className="chart-section">
      <div className="section-header">
        <h2>📊 Biểu đồ theo dõi</h2>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="dot" style={{ background: '#0EA5E9' }}></span> Gas (ppm)
          </span>
          <span className="legend-item">
            <span className="dot" style={{ background: '#F97316' }}></span> Ngưỡng
          </span>
        </div>
      </div>
      <div className="chart-wrapper">
        <canvas ref={chartRef}></canvas>
      </div>
    </section>
  );
};

export default GasChart;
