# ResQ Setup & Deployment Guide

This guide provides step-by-step instructions to set up the **ResQ Safety Alert System** on a new machine.

## 1. Prerequisites
Ensure the following software is installed on the laptop:
1.  **Java Development Kit (JDK) 25**: [Download Here](https://jdk.java.net/25/)
2.  **Node.js (LTS Version)**: [Download Here](https://nodejs.org/) (includes `npm`)
3.  **Docker Desktop**: [Download Here](https://www.docker.com/products/docker-desktop/) (Required for the database)
4.  **Maven** (Optional, usually included with IDEs, but `mvn` command line is used below).

## 2. Database Setup
The application uses **PostgreSQL**. The easiest way to run it is via Docker.

1.  Open a terminal/command prompt.
2.  Navigate to the project root folder (where `docker-compose.yml` is located).
    ```bash
    cd "path/to/accident report system"
    ```
3.  Start the database:
    ```bash
    docker-compose up -d
    ```
    *This will start a PostgreSQL container on port 5433 with username `postgres` and password `password`.*

## 3. Backend Setup (Spring Boot)
1.  Open a terminal in the project root folder.
2.  Run the application:
    ```bash
    mvn spring-boot:run
    ```
3.  Wait for the logs to show: `Started AccidentReportSystemApplication in ... seconds`.
4.  The backend API is now running at `http://localhost:8080`.

## 4. Frontend Setup (React)
1.  Open a **new** terminal window.
2.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
3.  Install dependencies (only needed the first time):
    ```bash
    npm install
    ```
4.  Start the web application:
    ```bash
    npm run dev
    ```
5.  Usually, it will run at `http://localhost:5173`. Open this URL in Chrome or Edge.

## 5. Verification
-   **Dashboard**: Go to `http://localhost:5173`. You should see the login/home page.
-   **API**: Go to `http://localhost:8080/accidents`. It should return a JSON response (likely empty list `[]` initially).

## Troubleshooting
-   **Port Conflicts**: If port 8080 or 5173 is taken, close other applications or check `application.properties` (backend) / `vite.config.js` (frontend) to change ports.
-   **Database Error**: Ensure Docker is running. If `docker-compose` fails, check if the ports are free.
