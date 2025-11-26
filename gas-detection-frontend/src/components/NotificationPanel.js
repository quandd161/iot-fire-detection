import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const { notifications, clearNotifications } = useWebSocket();

  return (
    <section className="notifications-section">
      <div className="section-header">
        <h2>🔔 Thông báo</h2>
        <button className="btn-clear" onClick={clearNotifications}>
          Xóa tất cả
        </button>
      </div>
      <div className="notifications-wrapper">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="empty-state">
              <span className="empty-icon">🔕</span>
              <p>Chưa có thông báo nào</p>
            </div>
          </div>
        ) : (
          notifications.map((notif, index) => (
            <div
              key={index}
              className={`notification-item ${notif.type || 'danger'}`}
            >
              <div className="notification-message">{notif.message}</div>
              <div className="notification-time">
                {new Date(notif.receivedAt || notif.timestamp).toLocaleTimeString('vi-VN')}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default NotificationPanel;
