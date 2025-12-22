# ResQ - Advanced Safety Alert & Dispatch System

![ResQ Dashboard](https://via.placeholder.com/1200x600.png?text=ResQ+Live+Incident+Dashboard)

## 🚀 Overview

**ResQ** is a next-generation, real-time emergency response coordination platform. It aggregates incident reports from various sources, prioritizes them based on severity using a custom algorithm, and broadcasts actionable alerts to a live command dashboard.

Designed for efficiency and speed, ResQ ensures that critical incidents (like "High Hazard" events) are processed and displayed immediately, alerting dispatchers with visual and audio cues.

## ✨ Key Features

### 📡 Real-Time Command Center
- **Live Incident Board**: Kanban-style board (Critical, Warning, Info) that updates instantly via WebSockets (`STOMP`).
- **Priority Queueing**: Backend algorithms ensure high-severity alerts are processed before others.
- **Audio & Visual Alerts**: Critical incidents trigger browser notifications and audio alarms along with a visual "Pulse" effect.

### 🗺️ Interactive Geospatial Map
- **Live Tracking**: Incidents pinned on a real-time Leaflet map.
- **Heatmap Layer**: Visualize high-density incident zones (toggleable).
- **Satellite View**: High-resolution imagery for precise location tracking.
- **Location Services**: "Use My Location" integrated with Reverse Geocoding to auto-fill addresses.

### 📊 Analytics & Insights
- **KPI Dashboard**: Real-time stats on Total Users, Open Reports, and Critical Cases.
- **Data Visualizations**: Interactive charts showing Incident Severity Distribution and Weekly Activity Trends.

### 🔐 Secure Role-Based Access
- **Admin**: Full access to Dashboard, Analytics, User Management, and Incident Resolution.
- **Reporter**: Can submit incidents and view the board.
- **Viewer**: Read-only access to the public safety feed.
- **Security Check**: Email verification and Admin approval workflows for new reporter accounts.

## 🛠️ Technology Stack

### Backend (Java Spring Boot)
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL (Dockerized)
- **Communication**: WebSocket (STOMP), REST API
- **Security**: Spring Security + JWT
- **Architecture**: Service-Layer Pattern with PriorityBlockingQueue

### Frontend (React)
- **Framework**: React + Vite
- **Styling**: Bootstrap 5 + Custom CSS (Glassmorphism, Dark UI)
- **Map Integration**: Leaflet + OpenStreetMap + Esri Satellite
- **Charts**: Recharts
- **State**: React Hooks + Local Storage

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js & npm
- Docker (for PostgreSQL)

### 1. Database Setup
Spin up the PostgreSQL container:
```bash
docker-compose up -d
```

### 2. Backend Launch
Navigate to the root directory and run the Spring Boot application:
```bash
mvn spring-boot:run
```
*Server runs on `http://localhost:8080`*

### 3. Frontend Launch
Open a new terminal, navigate to `frontend`, and start the dev server:
```bash
cd frontend
npm install
npm run dev
```
*Client runs on `http://localhost:5173`*

## 📖 Usage Guide

### Logging In
- **Admin**: Use the seeded admin credentials (or create a new account and manually promote via DB if needed).
- **Reporter/Viewer**: Sign up directly via the "Create Account" page. Reporters require admin approval to post.

### Reporting an Incident
1. Click **Report** tab (Mobile) or use the Sidebar (Desktop).
2. Enter Title, Description, and Severity.
3. Click "Use My Location" or pick a point on the mini-map.
4. (Optional) Attach an image.
5. Click **Submit Report**.

### Managing Incidents (Admin)
- **Resolve**: Click the "Identify" button on a card to Mark as Resolved.
- **Edit**: Update incident details or severity.
- **Map View**: Switch to Map tab to see spatial distribution.
- **Analytics**: Check the Analytics tab for system health.

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user |
| `POST` | `/accidents` | Submit new report |
| `GET` | `/accidents` | Fetch all reports |
| `PATCH` | `/accidents/{id}/resolve` | Mark incident as resolved |
| `GET` | `/analytics/dashboard` | Fetch KPI stats |
| `WS` | `/ws/alerts` | WebSocket Endpoint |

## 🤝 Contributing
1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit changes (`git commit -m 'Add amazing feature'`).
4. Push to branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---
&copy; 2025 ResQ Systems. Built for robustness and speed.
