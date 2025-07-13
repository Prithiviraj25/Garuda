
# Garuda – AI-Powered Threat & Business Continuity Platform

An AI-driven platform for real-time threat analysis, business continuity management (BCM), and executive-level decision support. Powered by Bun, FastAPI, Pinecone, Supabase, and Astro-based ETL pipelines.

---

## Prerequisites

Ensure the following are installed and configured:

- [**Bun**](https://bun.sh/) – JavaScript runtime (alternative to Node.js)
- **Python 3.11+**
- **Docker** and **Astro CLI** (optional – for running the ETL pipeline)
- Environment files from Google Drive:
  - Download `*.env.main*`, rename it to `.env`, and place it in the **project root**
  - Download `*.env.python-backend*` and place it in the **`python-backend/` folder**

---

## Frontend Setup (Bun)

To run the frontend:

### First-time setup:
```bash
bun install
```

### Start the development server:
```bash
bun run dev
```

> Default frontend URL: [http://localhost:3000](http://localhost:3000)

---

## Backend Setup (FastAPI + Python)

### 1. Navigate to the backend folder:
```bash
cd python-backend
```

### 2. Create a virtual environment (first time only):
```bash
python -m venv venv
```

### 3. Activate the virtual environment:

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 4. Install dependencies:
```bash
pip install -r requirements.txt
```

### 5. Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

> You can change the port if needed.

> Default backend URL: [http://localhost:8000](http://localhost:8000)

---

## Optional: ETL Pipeline (Astro + Docker)

To run the ETL pipeline:

1. Make sure Docker is running.
2. Navigate to the `ETL/` folder.
3. Run the following command:
```bash
astro dev start
```

> Airflow will be available at: [http://localhost:8080](http://localhost:8080)

---

## Summary

| Component       | Command                | Location           | Default Port     |
|----------------|------------------------|--------------------|------------------|
| Frontend        | `bun run dev`          | Project root       | `3000`           |
| Backend         | `uvicorn main:app`     | `python-backend/`  | `8000`           |
| ETL (optional)  | `astro dev start`      | `ETL/`             | `8080`           |

---
