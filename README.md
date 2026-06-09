<!-- ═══════════════════════════════════════════════════════════════════════════════════ -->

<div align="center">

# 🌱 **Morpho-Pack**

### **AI-Powered Sustainable Packaging Intelligence Platform**

*Generative geometry optimization meets environmental impact modeling.*

[![Stars](https://img.shields.io/github/stars/rasam729/MorphoPack?style=flat-square&color=22c55e)](https://github.com/rasam729/MorphoPack)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/status-beta-22c55e?style=flat-square)](.)

---

**[Features](#-features)** · **[Tech Stack](#-technology-stack)** · **[Getting Started](#-quick-start)** · **[Deployment](#-deployment)** · **[Contributing](#-contributing)**

</div>

---

## 📋 **Overview**

Morpho-Pack is an enterprise-grade **full-stack SaaS platform** for automated packaging optimization. Upload any 3D mesh and the system:

- ✅ Generates **convex hull geometry** using Blender
- ✅ Exports **manufactureable 2D dielines** (SVG)
- ✅ Renders **3D packaging previews** (GLB)
- ✅ Calculates **sustainability metrics** (CO₂, material efficiency, waste avoidance)
- ✅ Tracks **upload history** with PostgreSQL persistence
- ✅ Provides **real-time analytics dashboard** with material degradation modeling

**Aligns with UN SDG 12 (Responsible Consumption) and SDG 13 (Climate Action).**

---

## ✨ **Features**

### **Workspace Dashboard**
- 🎯 **Smart mesh upload** with drag-and-drop and progress tracking
- 📦 **Material selection** (Agricultural Mycelium, Corrugated Cardboard, Recycled Kraft)
- ⏱️ **Degradation timeline** (0–24 month slider) for lifecycle modeling
- 🔄 **Real-time pipeline polling** with job state tracking

### **Interactive Dieline Viewer**
- 🖼️ **SVG rendering** with full pan & zoom controls
- 🎨 **Fit-to-view** reset for easy navigation
- ⬇️ **Direct download** of dieline SVG for manufacturing

### **3D Mesh Preview**
- 🔴 **Model-viewer integration** for GLB preview
- 🎭 **Full-screen support** for detailed inspection
- ⬇️ **Download GLB** for CAD workflows

### **History & Traceability**
- 📜 **Upload history** with metadata (file name, material, degradation months, timestamp)
- 🔍 **Detailed asset review** (pipeline status, SVG/GLB availability)
- 🏷️ **Material-based filtering** for quick retrieval

### **Executive Analytics**
- 📊 **Dynamic pie chart** — Material mix breakdown (Volume, Circularity, CO₂ Index)
- 📈 **Monthly trend bar chart** — Packaging efficiency uplift across fleet
- 📉 **Dieline trend line chart** — Geometry evolution across degradation timeline
- 🎚️ **Real-time updates** — Charts respond to material changes and timeline adjustments
- 💡 **Sustainability gauge** — Integrated Score (Sₛ) combining volumetric, circularity, and carbon metrics

### **Measurement Insights**
- 📏 **Estimated dieline dimensions** (width, height, area)
- 📐 **Fold line length** calculation for manufacturing precision
- 🔄 **Auto-derivation from SVG geometry** without backend latency

### **Authentication & Security**
- 🔐 **User registration & login** with bcrypt password hashing
- 👤 **Session persistence** with JWT-like token handling
- 🛡️ **CORS-protected API** endpoints

---

## 🛠️ **Technology Stack**

| **Layer** | **Technology** | **Purpose** |
|-----------|---|---|
| **Frontend UI** | React 19 + Vite | Ultra-fast SPA with hot reload |
| **Styling** | Tailwind CSS + PostCSS | Responsive, utility-first design system |
| **3D Rendering** | Google Model-Viewer | WebGL-based GLB preview |
| **SVG Interaction** | Native DOM APIs | Pan, zoom, fit-to-view controls |
| **State Management** | React Hooks (useState, useEffect) | Local component state & side effects |
| **HTTP Client** | Fetch API | RESTful API integration |
| **Type Safety** | JSX + PropTypes | Component validation |
| | | |
| **Backend Framework** | Python Flask | Lightweight, production-grade REST API |
| **WSGI Server** | Werkzeug (dev) | Built-in Flask dev server |
| **3D Geometry** | Blender Python API | Convex hull generation, mesh processing |
| **Geometry Library** | Trimesh + Shapely | Computational geometry & topology |
| **SVG Generation** | CAD-automation scripts | Dieline export from Blender mesh |
| **Image Processing** | Pillow | Thumbnail generation & image ops |
| | | |
| **Database** | PostgreSQL | User auth, upload history, metadata |
| **ORM** | SQLAlchemy | Schema definition & queries |
| **Password Hashing** | bcrypt | Secure credential storage |
| **Database Driver** | psycopg2-binary | PostgreSQL adapter |
| | | |
| **Testing** | pytest + pytest-mock | Unit & integration tests |
| **Containerization** | Docker + Docker Compose | Reproducible deployment |
| **Build Tool** | npm + Vite | Frontend bundling & asset optimization |
| **Version Control** | Git + GitHub | Source control & CI/CD |

---

## 🚀 **Quick Start**

### **Prerequisites**

- **Node.js** ≥ 18 (for frontend build)
- **Python** ≥ 3.9 (for backend)
- **PostgreSQL** ≥ 13 (for user & history persistence)
- **Blender** ≥ 3.6 (for convex hull generation; or use Docker)
- **Git** (for cloning the repository)

### **1. Clone Repository**

```bash
git clone https://github.com/rasam729/MorphoPack.git
cd MorphoPack
```

### **2. Configure Environment**

```bash
# Copy the template
cp .env.example .env

# Edit .env with your values:
# - DATABASE_URL=postgresql://user:password@localhost:5432/morphopack
# - VITE_API_BASE=http://localhost:7071/api
# - BLENDER_PATH=/usr/bin/blender  (or C:\Program Files\Blender\blender.exe on Windows)
```

### **3. Setup Backend (Python)**

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### **4. Setup Frontend (Node.js)**

```bash
cd frontend
npm install
cd ..
```

### **5. Initialize Database**

```bash
# Create PostgreSQL database
createdb morphopack

# (Optional) Run migrations if using SQLAlchemy
python -c "from backend.morpho_pipeline import init_db; init_db()"
```

### **6. Start Backend Server**

```bash
python backend/simple_server.py
```

Expected output:
```
🌿 Morpho-Pack Backend API Starting...
📍 Health check: http://localhost:7071/api/health
📍 Analyze endpoint: http://localhost:7071/api/analyze
 * Running on http://127.0.0.1:7071
```

### **7. Start Frontend Dev Server** (in a new terminal)

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v8.0.16  ready in 725 ms

  ➜  Local:   http://localhost:5176/
  ➜  Network: use --host to expose
```

### **8. Open in Browser**

Navigate to: **http://localhost:5176**

You should see the Morpho-Pack landing page. Use the **Sign In** or **View Demo** button to access the dashboard.

---

## 📂 **Project Structure**

```
MorphoPack/
├── frontend/                      # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx               # Main app component (landing, login, dashboard)
│   │   ├── main.jsx              # React entry point
│   │   ├── index.css             # Global styles
│   │   └── assets/               # Images, icons
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite build configuration
│   └── index.html                # HTML template
│
├── backend/                       # Python Flask API
│   ├── simple_server.py          # Flask app entry point (primary)
│   ├── function_app.py           # Legacy Azure Functions support
│   ├── morpho_pipeline.py        # Core material & scoring logic
│   ├── requirements.txt          # Python dependencies
│   └── tests/
│       └── test_pipeline.py      # Unit tests
│
├── MorphoPackEngine/             # Advanced backend services
│   ├── server.py                 # Production Flask server
│   ├── pipeline.py               # Enhanced mesh processing
│   ├── test_dieline.py           # Dieline generation tests
│   ├── test_svg.html             # SVG preview tests
│   ├── uploads/                  # Temporary upload directory
│   ├── outputs/                  # Generated assets (GLB, SVG, metrics)
│   └── material_rules/           # Material property configurations
│       ├── mycelium.json
│       ├── cardboard.json
│       └── kraft.json
│
├── CAD-automation/               # Blender & geometry scripts
│   ├── morpho_fit_core.py        # Core Blender integration
│   └── material_rules/           # Material database (duplicate for CAD)
│
├── data-mock/                    # Demo data & fixtures
│   ├── mock_assets.json
│   └── mock_telemetry.json
│
├── .env.example                  # Environment variables template
├── README.md                      # This file
└── docker-compose.yml            # Docker orchestration (optional)
```

---

## 🎯 **Core Workflows**

### **Upload & Process a Mesh**

1. **Sign in** to the dashboard (use demo credentials if testing)
2. **Select material** from dropdown (Mycelium, Cardboard, or Kraft)
3. **Adjust degradation timeline** slider (0–24 months)
4. **Upload STL/OBJ/GLB/STEP** file via drag-and-drop
5. **Click "Run Pipeline"** to trigger Blender convex hull generation
6. **Monitor status** (polling updates every 1.5 seconds)
7. **Preview outputs**:
   - **Dieline tab**: SVG with pan/zoom/fit controls
   - **3D Mesh tab**: GLB preview with model-viewer
8. **Download assets** (SVG for manufacturing, GLB for CAD)

### **View Analytics**

1. Navigate to **Analytics tab** in the topbar
2. Observe real-time charts:
   - **Pie chart**: Material property distribution
   - **Bar chart**: Monthly packaging efficiency trend
   - **Line chart**: Dieline geometry evolution across degradation timeline
3. Adjust **degradation timeline** slider to see charts update in real-time
4. Compare **Estimated CO₂ Savings**, **Efficiency**, **Waste Avoidance**, and **Lifecycle**

### **Review Upload History**

1. Navigate to **History tab**
2. Filter by material (if needed)
3. Click a history item to view:
   - Upload metadata (filename, material, degradation months)
   - Pipeline status
   - Asset availability (SVG, GLB)
4. Download any past asset

---

## 🔐 **Authentication & Database**

### **User Model**

Users are stored in PostgreSQL with:
- `id` (UUID primary key)
- `email` (unique, lowercase)
- `password_hash` (bcrypt SHA-256)
- `created_at` (timestamp)

### **Login Flow**

1. User enters email + password on login page
2. Backend validates credentials against `password_hash`
3. User object returned to frontend (no JWT; simple session model)
4. Frontend stores user data in React state
5. Subsequent API calls include `user_id` in request body

### **Upload History**

- Stored per user with metadata (file name, material, degradation months)
- Linked to job output (GLB URL, SVG URL, pipeline status)
- Auto-populated in history tab upon pipeline completion

---

## 🐳 **Docker Deployment**

If you prefer containerized execution:

```bash
# Build and start both backend and frontend
docker-compose up -d

# Backend will be available at http://localhost:7071
# Frontend will be available at http://localhost:3000
```

Docker Compose handles:
- PostgreSQL initialization
- Backend Flask server
- Frontend Vite dev server
- Blender binary mounting (if available locally)

---

## 📦 **Production Deployment**

### **Frontend (Vercel / Netlify)**

```bash
# Build production bundle
cd frontend
npm run build

# Output: dist/ directory (static files)
```

Then deploy `dist/` to:
- **Vercel** (recommended for Next.js-like SPA)
- **Netlify**
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**

Set environment variable in deployment platform:
```
VITE_API_BASE=https://your-backend-api.com/api
```

### **Backend (Render / Railway / Azure)**

Deploy the entire `MorphoPack/` directory with `requirements.txt`:

```bash
# Example: Railway
railway up

# Or: Render
# - Connect GitHub repo
# - Set build command: `pip install -r requirements.txt`
# - Set start command: `python MorphoPackEngine/server.py`
```

Ensure environment variables are set on your deployment platform:
```
DATABASE_URL=postgresql://...
BLENDER_PATH=/opt/blender/blender  (or similar in your container)
```

---

## 🧪 **Testing**

### **Run Backend Unit Tests**

```bash
pytest backend/tests/ -v
```

### **Run Frontend Dev (with hot reload)**

```bash
cd frontend
npm run dev
```

### **Check Linting**

```bash
cd frontend
npm run lint
```

---

## 🤝 **Contributing**

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes with clear messages (`git commit -m "feat: add amazing feature"`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a pull request

---

## 📋 **Roadmap**

- [ ] Real-time Blender streaming for live preview
- [ ] Multi-format packaging generation (folding boxes, pouches, mailers)
- [ ] Advanced material library with compliance data (FDA, EU regulations)
- [ ] Cost estimation & supply chain integration
- [ ] Carbon tracking & ESG reporting API
- [ ] Batch processing & API webhooks
- [ ] White-label SaaS offering

---

## 📄 **License**

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 🙋 **Support & Contact**

- 📧 **Email**: support@morphopack.ai
- 🐛 **Issues**: [GitHub Issues](https://github.com/rasam729/MorphoPack/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/rasam729/MorphoPack/discussions)

---

<div align="center">

### **Built with ❤️ for Sustainable Packaging**

*Morpho-Pack — Making Every Shape Zero Waste.*

SDG 12 · SDG 13 · SDG 9

</div>
