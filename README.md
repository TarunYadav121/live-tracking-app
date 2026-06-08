# Live Tracking System

## Overview

Live Tracking System is a real-time location tracking web application that enables users to share their live location with vendors through a unique Tracking ID. Vendors can monitor user movement on an interactive map, save completed tracking sessions, and view historical routes.

The project is built using the MERN stack with Socket.IO for real-time communication and Leaflet for map visualization.

---

## Features

### Authentication & Authorization

* User Registration
* User Login
* JWT Authentication
* Protected Routes
* Role-Based Access Control (User / Vendor)
* Logout Functionality

### Live Tracking

* Real-Time Location Sharing
* Unique Tracking ID Based Sessions
* Live Location Updates Using Socket.IO
* User Connection Status Monitoring
* Interactive Map Integration with Leaflet
* Route Visualization with Polyline

### Tracking History

* Stop & Save Tracking Session
* Store Tracking Data in MongoDB
* Vendor-Specific Tracking History
* Search Tracking History by Tracking ID
* View Saved Routes on Map
* Route Replay Visualization

---

## Tech Stack

### Frontend

* React.js
* React Router DOM
* Socket.IO Client
* React Leaflet
* Leaflet
* Vite

### Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication
* Mongoose

### Database

* MongoDB Atlas

---

## Project Structure

```text
client/
│
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
│
└── public/

backend/
│
├── controllers/
├── middleware/
├── models/
├── routes/
├── config/
└── server.js
```

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd live-tracking-system
```

### Install Frontend Dependencies

```bash
cd client
npm install
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

---

## Environment Variables

Create a `.env` file inside the backend folder:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
```

---

## Running the Project

### Start Backend

```bash
cd backend
npm run dev
```

### Start Frontend

```bash
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

---

## Workflow

### User

1. Register/Login
2. Enter Tracking ID
3. Join Tracking Session
4. Share Live Location
5. Location updates are sent in real time

### Vendor

1. Register/Login
2. Enter Same Tracking ID
3. Monitor User Location
4. View Route on Map
5. Stop & Save Tracking Session
6. Access Tracking History
7. View Saved Routes

---

## API Endpoints

### Authentication

```http
POST /api/auth/register
```

```http
POST /api/auth/login
```

### Tracking

```http
POST /api/tracking/save
```

```http
GET /api/tracking/history
```

```http
GET /api/tracking/history/:id
```

---

## Future Enhancements

* Date-Based History Filter
* Dashboard Analytics
* Mobile Responsive Improvements
* Route Export (PDF/CSV)
* Notifications and Alerts

---

## Author

Tarun

B.Tech Student

Live Tracking System – MERN Stack Project
