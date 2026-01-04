# LSOS Project

This repository contains a **full‑stack application** with:

* **Backend**: Django + Django REST Framework
* **Frontend**: React (TypeScript) + TailwindCSS

The project is structured as a monorepo with separate `backend` and `frontend` directories.

---

## Project Structure

```
LSOS-main/
│
├── backend/        # Django backend
│   ├── api/        # API apps
│   ├── backend/    # Django project settings
│   ├── manage.py
│   ├── db.sqlite3
│   ├── create_admin.py
│   ├── create_sample_data.py
│   └── assign_teacher_school.py
│
└── frontend/       # React frontend
    ├── src/
    ├── public/
    ├── package.json
    └── tailwind.config.js
```

---

## Prerequisites

Make sure you have the following installed:

* **Python 3.10+**
* **Node.js 18+** (with npm)
* **Git**

---

## Backend (Django) Setup

### 1. Navigate to backend directory

```bash
cd backend
```

### 2. Create and activate virtual environment

```bash
python -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies

```bash
pip install django djangorestframework
```

### 4. Apply database migrations

```bash
python manage.py migrate
```

### 5. Run the development server

```bash
python manage.py runserver
```

Backend will be available at:

```
http://127.0.0.1:8000/
```

---

## Frontend (React) Setup

### 1. Navigate to frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm start
```

Frontend will be available at:

```
http://localhost:3000/
```

---

## Running Backend Tests

The backend uses Django's built‑in test framework.

### Run all tests

```bash
cd backend
python manage.py test
```

### Run tests for a specific app

```bash
python manage.py test api
```

---

## Creating Admin User

To create an admin (superuser) account:

```bash
cd backend
python create_admin.py
```

Follow the prompts or use predefined credentials if configured.

You can then access the Django admin panel at:

```
http://127.0.0.1:8000/admin/
```

---

## Adding Sample Data

The project includes scripts to quickly populate the database with test data.

### Create sample data

```bash
cd backend
python create_sample_data.py
```

This will create:

* Sample users (admin, teachers, students)
* Schools
* Olympiads and related data

### Assign teacher to school (optional)

```bash
python assign_teacher_school.py
```

---

## API Authentication

Most API endpoints require authentication.

* Use **admin**, **teacher**, or **normal user** credentials created via sample data
* Authentication is handled via Django REST Framework

---

## Development Notes

* SQLite is used by default (`db.sqlite3`)
* CORS / proxy configuration may be needed for frontend ↔ backend communication
* Update API base URL in frontend if backend port is changed

---

## Common Issues

### Backend not reachable from frontend

* Ensure Django server is running
* Check API base URL in frontend configuration
* Verify CORS settings if enabled

### Database issues

If things break during development:

```bash
rm db.sqlite3
python manage.py migrate
python create_sample_data.py
```
