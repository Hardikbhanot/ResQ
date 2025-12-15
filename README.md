# Neighborhood Safety Alert System

## Overview
A real-time backend system that processes accident reports and broadcasts them to a live dashboard based on severity. The system uses a **Priority Queue** to ensure high-severity alerts are processed and broadcast before lower-priority ones.

## Architecture
- **Backend**: Java 17, Spring Boot 3.2.0 (Web, WebSocket, Data JPA)
- **Database**: PostgreSQL (Dockerized)
- **Frontend**: React + Vite (Bootstrap for styling)
- **Communication**: REST API (Submission) + STOMP over WebSockets (Broadcasting)

## Priority Algorithm
The core requirement is to broadcast HIGH severity alerts immediately. We utilize a `PriorityBlockingQueue` with a custom `Comparator`:
1. **Primary Sort key**: Severity (HIGH < MEDIUM < LOW). `HIGH` has the highest priority.
2. **Secondary Sort key**: Timestamp (Earlier events first).

**Time Complexity**:
- **Insertion (Offer)**: O(log n)
- **Retrieval (Poll)**: O(log n)

This ensures that even if a burst of alerts comes in, the system always processes the most critical ones first.

## Project Structure
```
├── pom.xml                   # Maven dependencies
├── docker-compose.yml        # PostgreSQL container config
├── src/main/java             # Spring Boot Backend
│   └── com.safety.alert
│       ├── model             # AccidentReport Entity
│       ├── repository        # JPA Repository
│       ├── service           # Priority Logic Service
│       ├── controller        # REST Controllers
│       └── config            # WebSocket Configuration
└── frontend                  # React Frontend
    ├── src/App.jsx           # Main Dashboard Logic
    └── src/components        # UI Components
```

## Running the Project

### Prerequisites
- Java 17+
- Maven
- Docker & Docker Compose
- Node.js & npm

### Steps
1. **Start the Database**:
   ```sh
   docker-compose up -d
   ```

2. **Run the Backend**:
   ```sh
   mvn spring-boot:run
   ```
   The backend runs on `http://localhost:8080`.

3. **Run the Frontend**:
   ```sh
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (or similar).

## API Endpoints
- **POST** `/accidents`: Submit a new report.
  ```json
  {
    "title": "Car Crash",
    "description": "Severe collision at main intersection",
    "severity": "HIGH",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
  ```
- **GET** `/accidents`: Retrieve all reports.
- **WebSocket**: Connect to `/ws/alerts`, Subscribe to `/topic/alerts`.

## Minimal Test Scenarios
1. **Submit Accident**: Open the dashboard. Use Postman/Curl to POST a High severity report. It should appear instantly in the HIGH column.
2. **Priority Test**: Post LOW, then HIGH, then MEDIUM in quick succession. The Dashboard (and WebSocket stream) should receive HIGH first.
