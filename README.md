# College Sports Tournament Management System (minicap)

A complete, production-ready **College Sports Tournament Management System** built with a modern full-stack architecture. The system supports multi-role workflows, live match tracking using WebSockets, automated fixture scheduling (League and Knockout brackets), branding customization, and PDF/Excel report exporting.

---

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):**
    *   **SuperAdmin:** Oversees entire operations, manages sports, venues, tournaments, branding settings, and deletes records.
    *   **Coordinator:** Represents a college department. Registers/submits athletes, forms teams, and tracks statistics.
    *   **Scorer:** Official referee or supervisor who uses the live panel to post match event timelines and adjust counters.
    *   **Public/Guest:** Browses active tournaments, views points tables, knockout brackets, live score updates, and rosters.
*   **Automatic Fixture Scheduling:**
    *   **Knockout Bracket Generator:** Auto-generates bracket tiers, supporting dummy slots for matches (TBD inputs) and auto-progresses winners to the next rounds.
    *   **League Table Compiler:** Schedules round-robin schedules where everyone plays each other, compiling standard points tables (Wins, Draws, Losses, Goals/Points difference, and overall Standing points).
*   **Real-time Score Updates:** Powered by **Socket.IO** rooms to push timeline notifications and scores from the scorer panel to public dashboards.
*   **Media & Reports Export Hub:**
    *   Generates printable PDF reports using **PDFKit** streams.
    *   Generates spreadsheet workbooks using **ExcelJS**.
    *   Media gallery with image and video grids for highlight logs.
    *   Automated Player QR identity badge generation.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS | Single Page App rendering with dynamic tailwind dark mode support. |
| | React Router v6, Axios | App routing logic with silent refresh token interceptors. |
| | Lucide React, Chart.js | Icon rendering and dashboard performance stats. |
| **Backend** | Node.js, Express.js | Main REST API service + Socket.IO Server. |
| | Mongoose (MongoDB) | NoSQL Object modeling with 15 interconnected schemas. |
| | JWT (Double Token Rotation) | Access and Refresh Tokens stored securely. |
| **Utilities** | PDFKit, ExcelJS | Server-side PDF and spreadsheet compilers. |
| | QR Code Generator, Multer | Base64 QR code builder + file storage. |

---

## 📂 System Architecture & Schema Registry

The database is built on **15 interconnected models** mapping the college sports domain:

```
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│    College    │◄───────│  Department   │◄───────│    Player     │ (QR Card generated)
└───────────────┘        └───────────────┘        └───────────────┘
        ▲                        ▲                        ▲
        │                        │                        │
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│   Settings    │        │     Team      │◄───────│  Tournament   │ (League / Knockout)
└───────────────┘        └───────────────┘        └───────────────┘
                                 ▲                        │
                                 │                        ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│     Venue     │◄───────│     Match     │◄───────│    Fixture    │
└───────────────┘        └───────────────┘        └───────────────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │ Event / Score │ (Live WebSockets)
                         └───────────────┘
```

---

## ⚙️ Quick Start Installation Guide

### Prerequisites
*   [Node.js (v18 or v20)](https://nodejs.org)
*   [MongoDB (Local or Atlas Instance)](https://mongodb.com)

---

### Method A: Running Locally (Development Mode)

#### 1. Setup Backend Server
1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables. Copy `.env.example` to `.env` and fill in details:
    ```bash
    cp .env.example .env
    ```
4.  Seed the database with sample colleges, departments, sports, and active tournaments:
    ```bash
    npm run seed
    ```
5.  Start the Express server:
    ```bash
    npm run dev
    ```
    *The API server will listen on `http://localhost:5000`.*

#### 2. Setup Frontend Client
1.  Navigate to the `client` directory:
    ```bash
    cd ../client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm run dev
    ```
    *The client app will launch at `http://localhost:3000`.*

---

### Method B: Running via Docker Compose (Single Command)

Orchestrate the entire platform (Client, Server, MongoDB) instantly using Docker:

1.  From the root directory, run:
    ```bash
    docker-compose up --build
    ```
2.  Wait for dependencies to compile and initialize.
    *   Frontend Client: `http://localhost:3000`
    *   Backend Server: `http://localhost:5000`
    *   MongoDB Port: `27017`

To seed database instances while running inside Docker container:
```bash
docker exec -it minicap-server npm run seed
```

---

## 🔑 Demo Access Credentials

The database seeder compiles the following preconfigured user profiles for testing:

*   **SuperAdmin Profile:**
    *   Email: `admin@nec.edu`
    *   Password: `Admin@123`
*   **Department Coordinator (CSE):**
    *   Email: `cse@nec.edu`
    *   Password: `Coordinator@123`
*   **Official Scorer:**
    *   Email: `scorer@nec.edu`
    *   Password: `Scorer@123`

---

## 🔌 API Route Map

### 1. Authentication (`/api/v1/auth`)
*   `POST /login` - User login. Returns access token + sets refresh token cookie.
*   `POST /refresh-token` - Renew expired access tokens.
*   `POST /logout` - Clear user tokens.
*   `GET /me` - Get profile metadata of logged-in user.

### 2. Tournament Engine (`/api/v1`)
*   `GET /tournaments` - List active tournaments.
*   `POST /tournaments/:id/fixtures` - Automatically schedule all matches/rounds.
*   `GET /matches/live` - Fetch real-time live events.
*   `PATCH /matches/:id/score` - Set score goals/runs.
*   `POST /matches/:id/events` - Inject timeline events.
*   `GET /reports/tournament/:id/pdf` - Compiles printable match scoresheet.
