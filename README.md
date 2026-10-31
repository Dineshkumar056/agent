# StudyAgent – AI-Powered Adaptive College Academic Planning System

StudyAgent is a LocalStorage-based academic planning platform for colleges. It gives each role a dedicated dashboard while using browser storage for authentication, student records, and AI-driven schedule planning.

## Features
- Role-based login for Student, Tech, App Admin, Management, and Main Admin
- Student registration and protected dashboards
- LocalStorage persistence for demo-ready data storage
- AI-powered study plan generation and what-if scenario simulation
- Adaptive rescheduling for holidays, deadline changes, missed classes, and timetable updates
- Notifications, announcements, charts, and export actions
- Blue-and-white glassmorphism dashboard design

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the frontend app

```bash
npm run dev --workspace frontend
```

The app runs in the browser with LocalStorage-based persistence at http://localhost:5173.

## Demo login credentials

- Student: student@college.edu / student123
- Tech: tech@college.edu / tech123
- App Admin: appadmin@college.edu / appadmin123
- Management: mgmt@college.edu / mgmt123
- Main Admin: superadmin@college.edu / admin123

## Project structure

- frontend/src/App.jsx – main application UI and LocalStorage logic
- frontend/src/styles.css – premium academic dashboard styling
- backend/data/studyagent.json – sample data retained for demo reference

## Notes

This app intentionally uses LocalStorage for the contained demo, matching the requirement for a self-contained academic planning system without a backend dependency.
