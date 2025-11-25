import React, { useEffect } from 'react';
import { WebSocketProvider } from './context/WebSocketContext';
import Header from './components/Header';
import SensorCards from './components/SensorCards';
import GasChart from './components/GasChart';
import Statistics from './components/Statistics';
import ControlPanel from './components/ControlPanel';
import NotificationPanel from './components/NotificationPanel';
import Footer from './components/Footer';
import './App.css';
import { api } from './services/api';

function AppContent() {
  useEffect(() => {
    // Load initial data
    const loadInitialData = async () => {
      try {
        await api.getData();
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };
    
    loadInitialData();
  }, []);

  return (
    <div className="container">
      <Header />
      
      <div className="main-grid">
        {/* Left Column: Monitoring */}
        <div className="left-col">
          <SensorCards />
          <GasChart />
          <Statistics />
        </div>

        {/* Right Column: Controls & Notifications */}
        <div className="right-col">
          <ControlPanel />
          <NotificationPanel />
        </div>
      </div>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <WebSocketProvider>
      <AppContent />
    </WebSocketProvider>
  );
}

export default App;
