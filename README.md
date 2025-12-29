# ResQ - Safety Alert & Accident Report System

ResQ is a robust, real-time safety alert system designed to streamline accident reporting and emergency response. Built with a Spring Boot backend and React frontend, it empowers reporters to submit critical incidents and administrators to manage and resolve them efficiently.

## 🚀 Key Features

*   **Real-time Reporting**: Instant submission of accidents/hazards with geolocation support.
*   **Live Dashboard**: Interactive map (Leaflet) and Kanban-style board for tracking active alerts.
*   **Role-Based Access**:
    *   **Viewers**: Can see public alerts.
    *   **Reporters**: Can submit new reports and manage their own submissions.
    *   **Admins**: Full control to approve users, edit/delete reports, and manage system status.
*   **Granular Permissions**:
    *   Reporters can delete their own reports and comments.
    *   Admins can delete any content.
    *   Admins can edit Reporter Names for anonymity or correction.
*   **Secure Authentication**: JWT-based auth with "Forgot Password" flow (OTP via Email).
*   **Evidence Handling**: Image upload support for incident verification.

## 🛠️ Tech Stack

### Backend
*   **Java 24** (OpenJDK)
*   **Spring Boot 4.0** (Web, WebSocket, Data JPA, Security, Mail)
*   **Database**: PostgreSQL (Production) / H2 (Dev/Test)
*   **Build Tool**: Maven

### Frontend
*   **React 18** (Vite)
*   **Styling**: Bootstrap 5 + Custom CSS
*   **Maps**: React Leaflet (OpenStreetMap)
*   **Charts**: Recharts
*   **Icons**: Bootstrap Icons

## ⚙️ Setup & Installation

### Prerequisites
*   Java JDK 24
*   Node.js (LTS)
*   Docker (for PostgreSQL)

### 1. Database Setup
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
mvn clean install
mvn spring-boot:run
```
*Server runs at: `http://localhost:8080`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*App runs at: `http://localhost:5173`*

## 🔒 Security Note
This repository excludes sensitive configuration files (`application.properties`). Please request the `.env` or config file from the administrator for local development credentials.

## 🤝 Contributing
1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
