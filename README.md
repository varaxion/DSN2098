<div align="center">
  
  # ✦ SmartSpend v1.0 ✦
  
  *A minimal, elegant, and secure expense-tracking application.*
  
  <br />
</div>

## 🌌 Overview

**SmartSpend** was originally developed for Project Exhibition - 1. It has now been transformed into a fully modern web application, shedding its legacy prototype roots. Version 1.0 features a completely decoupled architecture with a blazing fast REST API backend and a beautifully crafted Vanilla JS SPA frontend. 

The design embraces **glassmorphism** and dynamic **gradients** within a rich Dark Mode environment, offering a premium and immersive user experience.

---

## ✨ Features

- **Decoupled Architecture**: A robust Python/Flask REST API powering a lightweight Vite frontend.
- **Immersive Dark UI**: Smooth background orbs, frosted glass components (`backdrop-filter: blur`), and clean data tables.
- **Visual Insights**: Interactive, animated pie charts powered by Chart.js to break down category spending.
- **Dynamic Dashboard & History**: Track recent spending instantly, or navigate to a dedicated History view to filter transactions by custom date periods.
- **Dev Mode**: A quick toggle switch on the login screen to entirely bypass the database and explore the UI instantly.
- **Complete Auth System**: Secure User Registration and Login with session handling.
- **Legacy Support**: Original `v0` codebase preserved securely in the `v0Archive/` folder.

---

## 🛠️ Technology Stack

| Layer       | Technology                               |
|-------------|------------------------------------------|
| **Frontend**| HTML5, Vanilla JavaScript, CSS3 (Vite)   |
| **Backend** | Python, Flask, Flask-Cors, PyMySQL       |
| **Database**| MySQL                                    |
| **Styling** | Custom Glassmorphism, Google Outfit Font |

---

## 📂 Project Structure

```text
📦 SmartSpend
 ┣ 📂 backend/         # Flask REST API Server
 ┃ ┣ 📜 app.py         # Main API Application
 ┃ ┣ 📜 config.py      # App Configurations
 ┃ ┣ 📜 db.yaml        # Database Credentials (Local)
 ┃ ┗ 📜 requirements.txt
 ┣ 📂 frontend/        # Vite SPA Frontend
 ┃ ┣ 📂 src/
 ┃ ┃ ┣ 📜 main.js      # App Logic and UI Components
 ┃ ┃ ┗ 📜 style.css    # UI Styling, Glassmorphism, Animations
 ┃ ┣ 📜 index.html     # App Entry
 ┃ ┗ 📜 package.json
 ┗ 📂 v0Archive/       # Original V0 Codebase & Prototype Files
```

---

## 🚀 Getting Started

### 1. Database Setup
1. Create a MySQL database and load the schema from `v0Archive/database/schema.sql`.
2. Ensure your `backend/db.yaml` has the correct `mysql_host`, `mysql_user`, `mysql_password`, and `mysql_db` values.

### 2. Run the Backend API
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```
> The API will be available on `http://localhost:5000`

### 3. Run the Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
> The UI will be available on `http://localhost:5173`

---

## 🎨 Design Philosophy

SmartSpend uses carefully chosen HSL colors, dynamic gradients (`#8b5cf6` to `#3b82f6`), and soft micro-animations. It removes any visual clutter to focus purely on what matters: **Your Finances.** 

---

<br />

<div align="center">
  
  ---
  
  ### ✦ Engineered by Varaxion ✦
  
  *[@varaxion on GitHub](https://github.com/varaxion)*
  
  ---
  
</div>
