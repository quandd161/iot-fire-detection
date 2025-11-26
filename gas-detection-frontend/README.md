# Gas Detection System - React Frontend

React frontend application cho hệ thống giám sát khí gas IoT.

## 🚀 Công nghệ

- **React 18.2.0** - UI Framework
- **Chart.js 4.4.0** - Data visualization
- **react-chartjs-2** - React wrapper for Chart.js
- **WebSocket API** - Real-time communication
- **Context API** - State management

## 📁 Cấu trúc Project

```
gas-detection-frontend/
├── src/
│   ├── components/        # React components
│   ├── context/           # Context providers
│   ├── services/          # API services
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## 🔧 Cài đặt & Chạy

```bash
# Install dependencies
npm install

# Run development server
npm start
```

Truy cập: **http://localhost:3000**

## 🔌 Backend Connection

- **REST API**: `http://localhost:8080/api/*`
- **WebSocket**: `ws://localhost:8080/ws`
- **Auto proxy**: Tất cả `/api/*` requests → backend

## 📦 Production Build

```bash
npm run build
```

Deploy thư mục `build/` lên server tĩnh (Nginx, Apache, etc.)

---

**Frontend độc lập - Kết nối Spring Boot qua REST API & WebSocket**
