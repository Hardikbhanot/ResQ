# ResQ Setup & Deployment Guide

This guide provides step-by-step instructions to set up the **ResQ Safety Alert System** on a new machine.

## 1. Software Installation (Prerequisites)

Since this is a fresh laptop, please follow these steps in order:

### A. Install Java (JDK 24)
Required to run the backend server.
1.  Download **OpenJDK 24** from [jdk.java.net/24](https://jdk.java.net/24/).
2.  **Windows**: Download the `.zip` file, extract it to `C:\Program Files\Java\`, and set your `JAVA_HOME` environment variable to this path.
    *   *Alternative (Easier)*: Download the **Oracle JDK 24 Installer** (if available) or use a package manager like `winget install Microsoft.OpenJDK.24`.
3.  **Mac**: Download the `.tar.gz` and extract it, or use Homebrew: `brew install openjdk@24`.
4.  **Verify**: Open a terminal (Command Prompt) and run:
    ```bash
    java -version
    ```
    *Output should say "openjdk version 24..."*

### B. Install Node.js
Required to build and run the frontend.
1.  Go to [nodejs.org](https://nodejs.org/).
2.  Download the **LTS (Long Term Support)** version (v22.x or v24.x).
3.  Run the installer and click "Next" through all defaults.
4.  **Verify**: Open a terminal and run:
    ```bash
    node -v
    npm -v
    ```

### C. Install Docker Desktop
Required for the database (PostgreSQL).
1.  Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).
2.  Download and install Docker Desktop.
3.  Start Docker Desktop and wait for the engine to start (green icon).

### D. Install Git
Required to download the code and manage versions.
1.  Go to [git-scm.com/downloads](https://git-scm.com/downloads).
2.  **Windows**: Download "64-bit Git for Windows Setup" and install.
3.  **Mac**: Should be pre-installed. If not, running `git` in terminal will prompt to install XCode command line tools.
4.  **Verify**: `git --version`.

### E. Install Maven (Required)
1.  Download **Apache Maven** from [maven.apache.org/download.cgi](https://maven.apache.org/download.cgi).
2.  **Windows**: Download the `Binary zip archive`. Extract it to `C:\Program Files\Maven`.
    *   Search for "Edit the system environment variables".
    *   Click "Environment Variables".
    *   Under "System Variables", find `Path` -> Edit -> New -> Add the path to the `bin` folder (e.g., `C:\Program Files\Maven\apache-maven-3.9.6\bin`).
    *   Click OK until closed.
3.  **Mac/Linux**: Use Homebrew: `brew install maven`.
4.  **Verify**: Open a new terminal and run: `mvn -version`.

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
2.  **Install Dependencies & Build** (Run this once):
    ```bash
    mvn clean install
    ```
    *This downloads all the required libraries (jars) from the internet. It might take a few minutes. If it says "BUILD SUCCESS", proceed.*
3.  **Run the Server**:
    ```bash
    mvn spring-boot:run
    ```
4.  Wait for the logs to show: `Started AccidentReportSystemApplication in ... seconds`.
5.  The backend API is now running at `http://localhost:8080`.

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

## 6. Daily Startup Routine (After Restart)
If you restart your computer, just do this:

1.  **Start Docker Desktop**: Open the app and wait for the green light.
2.  **Start Backend**:
    *   Open Terminal -> `cd accident-report-system`
    *   Run: `mvn spring-boot:run`
3.  **Start Frontend**:
    *   Open New Terminal -> `cd accident-report-system/frontend`
    *   Run: `npm run dev`

## Troubleshooting
-   **"git" command not found**:
    *   **Restart Terminal**: Close and reopen your Command Prompt window. It won't see the new installation until you do.
    *   **Use Git Bash**: Open the "Git Bash" application installed with Git instead of the standard CMD.
    *   **Re-install**: Run the installer again and make sure to select *"Git from the command line and also from 3rd-party software"* when asked about PATH environment.
-   **Port Conflicts**: If port 8080 or 5173 is taken, close other applications or check `application.properties` (backend) / `vite.config.js` (frontend) to change ports.
-   **Database Error**: Ensure Docker is running. If `docker-compose` fails, check if the ports are free.
-   **Resetting Database (Delete Postgres Data)**:
    If you want to clear all data and start fresh:
    1.  Stop the container: `docker-compose down`
    2.  Remove the volume: `docker volume prune` (Warning: deletes ALL unused Docker data) 
        *   *Safer*: `docker-compose down -v` (Deletes only this project's volumes).
    3.  Restart: `docker-compose up -d`
