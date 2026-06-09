# MorphoPack

MorphoPack is a full-stack sustainable packaging platform combining a React + Vite dashboard with a Python Flask backend for model uploads, pipeline execution, user login, and upload history tracking.

## ✅ What this repo contains

- `frontend/` — Vite + React + Tailwind UI, built for workspace, history, and analytics flows
- `MorphoPackEngine/` — Python Flask backend, upload/job state, PostgreSQL history, and Blender/mesh pipeline integration
- `CAD-automation/` — Fusion 360 / mesh-folding scripts and material rule configuration
- `data-mock/` — sample mock assets and telemetry JSON used for demo content
- `.env.example` — local environment variables template

## 🚀 Local development

### 1) Install all project dependencies

From the repository root, run:

```powershell
npm install
```

This installs frontend dependencies and runs the bootstrap script that prepares the backend environment.

### 2) Frontend

```powershell
npm run install:frontend
npm run dev --prefix frontend -- --host 0.0.0.0
```

Open `http://localhost:5173` in your browser.

### 3) Backend

```powershell
python -m pip install -r MorphoPackEngine/requirements.txt
python MorphoPackEngine/server.py
```

The backend starts on `http://localhost:5050` with CORS enabled and reads environment variables from `.env`.

If you prefer containerized execution, use the root Docker helper:

```powershell
npm run docker:up
```

### 4) Environment setup

Copy the template and fill in your values:

```powershell
copy .env.example .env
```

Required values:
- `DATABASE_URL` — PostgreSQL URL for login and upload history
- `VITE_API_BASE` — frontend API base (e.g. `http://localhost:5050/api`)
- `ENGINE_BASE` — backend engine base if needed (e.g. `http://localhost:5050/api`)

Optional:
- `AZURE_STORAGE_CONNECTION_STRING` if you want blob upload support
- `BLENDER_PATH` — optional local Blender executable path for direct backend execution

If `BLENDER_PATH` is not set, the backend will try to find `blender` on your PATH or use a common default install location. If that fails, it will fall back to the Python SVG fallback mode, but Docker is recommended for a Blender-native test environment.

## 🧩 Main features

- User registration and login with hashed passwords
- Upload history recording in PostgreSQL
- Job state tracking for uploads and pipeline execution
- Frontend sections for `Workspace`, `History`, and `Analytics`
- Backend pipeline orchestration with Blender-ready export support
- Clean local dev experience with Vite hot reload

## 📁 Relevant directories

- `frontend/` — UI code, app entry, styles, and Vite config
- `MorphoPackEngine/` — Flask app, upload/history models, mesh pipeline, outputs/uploads directories
- `CAD-automation/` — reusable CAD material and export scripts
- `data-mock/` — mock JSON assets and telemetry
- `backend/` — older Azure Functions support microservice code

## 🔧 Deployment readiness

### Frontend
- The `frontend/` app is deployment-ready for Vercel as a static site
- Use `npm run build` to generate production assets
- Set `VITE_API_BASE` in Vercel environment settings to your backend URL

### Backend
- The current backend is implemented as a Python Flask app and is not directly deployable as a Vercel static app
- Recommended deployment options:
  - Render
  - Railway
  - Azure App Service / Azure Functions with Python
  - AWS Elastic Beanstalk or ECS
- Keep the frontend and backend deployed separately, with the frontend calling the backend through `VITE_API_BASE`

## 📝 Notes

- `MorphoPackEngine/server.py` is the primary backend entry point used by the current full-stack app
- `MorphoPackEngine/requirements.txt` contains the Python dependencies for running the backend
- `frontend/package.json` contains the frontend dependencies and dev scripts

## 📌 Run checklist

1. `npm install` from the repository root
2. `copy .env.example .env` and configure `DATABASE_URL`, `VITE_API_BASE`, `ENGINE_BASE`
3. Optional: set `BLENDER_PATH` to your local Blender executable for direct backend execution
4. Start backend with `python MorphoPackEngine/server.py`
5. Start frontend with `npm run dev --prefix frontend -- --host 0.0.0.0`
6. Visit `http://localhost:5173`

## 💡 Deployment guidance

- Deploy `frontend/` to Vercel as a static site
- Deploy `MorphoPackEngine/` to a Python-capable host
- In Vercel, configure environment variable `VITE_API_BASE` to point at your deployed backend API

---

## License

MIT
