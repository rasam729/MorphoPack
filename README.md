# 🌿 Morpho-Pack // PaaS
### *AI-Driven Sustainable Packaging Intelligence Platform*

[![Deploy Frontend](https://github.com/your-org/morpho-pack/actions/workflows/deploy-frontend.yml/badge.svg)](/.github/workflows/deploy-frontend.yml)
[![Deploy Backend](https://github.com/your-org/morpho-pack/actions/workflows/deploy-backend.yml/badge.svg)](/.github/workflows/deploy-backend.yml)
[![CAD Regression](https://github.com/your-org/morpho-pack/actions/workflows/cad-regression.yml/badge.svg)](/.github/workflows/cad-regression.yml)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

---

## 🎯 What is Morpho-Pack?

Morpho-Pack is a **cloud-native Packaging-as-a-Service (PaaS)** platform that transforms raw 3D product geometry into perfectly optimized, eco-material-specific packaging designs. Upload a `.STEP` or `.OBJ` file, select a sustainable material profile, and the system outputs:

- 📦 A **tight-fit 3D shell** (`.glb`) generated via Fusion 360 headless automation
- 🗺️ A **manufacturing-ready 2D blueprint** (`.svg`) with cut/fold/score lines
- 📊 A **real-time ESG dashboard** scoring CO₂ reduction, void fill eliminated, and logistical efficiency

---

## 🗂️ Repository Architecture

```
morpho-pack/                          # Monorepo root
│
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml       # Vite → Azure Static Web Apps
│       ├── deploy-backend.yml        # Python → Azure Functions
│       └── cad-regression.yml        # Fusion 360 script linting
│
├── frontend/                         # Vite + React + Tailwind CSS
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── App.jsx                   # Root dashboard (3-column grid)
│   │   ├── main.jsx                  # React DOM entry point
│   │   └── index.css                 # Tailwind directives + custom classes
│   ├── index.html                    # SEO-optimized HTML shell
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── backend/                          # Python — Azure Functions microservices
│   ├── function_app.py               # AzFunc app + health check route
│   ├── morpho_pipeline.py            # Core scoring API: /analyze /materials
│   ├── requirements.txt
│   └── tests/
│       └── test_pipeline.py
│
├── CAD-automation/                   # Fusion 360 headless Python scripts
│   ├── morpho_fit_core.py            # Main geometry + export pipeline
│   ├── svg_unfold.py                 # 3D→2D net flattening logic
│   ├── material_rules/
│   │   ├── mycelium.json             # Agricultural Mycelium config
│   │   ├── cardboard.json            # Corrugated Cardboard config
│   │   └── kraft.json                # Recycled Kraft Fibers config
│   └── outputs/                      # Generated SVGs + GLBs (gitignored)
│
├── data-mock/                        # Pre-baked public data for judges
│   ├── mock_assets.json              # CDN-hosted 3D model URLs + results
│   └── mock_telemetry.json           # Live telemetry stream + Power BI config
│
└── README.md
```

---

## 🚀 Quick Start

### Running the Complete Application

**1. Frontend (Dashboard)**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

The frontend now features the complete Morpho-Pack dashboard UI with:
- 3-column grid layout (Sidebar | Viewport | Analytics)
- Material selection and degradation timeline controls
- Real-time pipeline status visualization
- Live sustainability metrics and gauge cards
- Power BI integration placeholder
- Backend API integration for morpho analysis

**2. Backend (Flask Development Server)**
```bash
cd backend
pip install -r requirements.txt
python simple_server.py
# → http://localhost:7071/api/health
# → http://localhost:7071/api/analyze (POST)
# → http://localhost:7071/api/materials (GET)
```

The backend provides REST endpoints for:
- `/api/health` - Health check endpoint
- `/api/analyze` - POST endpoint for packaging analysis (accepts material_id, volume_m3, degradation_months)
- `/api/materials` - GET endpoint for material catalog

**Note:** For production deployment, use Azure Functions. For local development, use the Flask server (`simple_server.py`).

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vite 6 · React 19 · Tailwind CSS 3 · Lucide React |
| **Backend** | Python 3.11 · Azure Functions v4 · Flask |
| **CAD Engine** | Autodesk Fusion 360 Headless · Python API |
| **Analytics** | Microsoft Power BI Embedded |
| **Hosting** | Azure Static Web Apps · Azure Functions |
| **CI/CD** | GitHub Actions |
| **Storage** | Azure Blob Storage CDN |

---

## 🌱 ESG Impact Metrics (Demo)

| Metric | Industry Baseline | Morpho-Pack |
|---|---|---|
| CO₂ per unit | 5.2 kg | **0.8 kg** (−85%) |
| Void fill | 42% | **4%** (−90%) |
| Container efficiency | 58% | **83%** (+43%) |

---

## 📄 License

MIT © 2026 Morpho-Pack Team — GitHub DevDays Hackathon
