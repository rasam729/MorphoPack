# 🚀 Morpho-Pack Quick Reference

## 🌐 Application URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend Dashboard** | http://localhost:5173 | ✅ Running |
| **Backend API** | http://localhost:7071 | ✅ Running |
| **Health Check** | http://localhost:7071/api/health | ✅ Available |

## 🎮 How to Use the Dashboard

### 1. Upload a 3D Mesh
- Drag & drop a file (.STEP, .OBJ, .STL, .GLB) onto the upload zone
- Or click to browse and select a file
- Watch the progress bar fill as the file uploads

### 2. Select Material
Choose from 3 sustainable materials:
- **Agricultural Mycelium** - 97% circularity, 30-day degradation
- **Corrugated Cardboard** - 74% circularity, mechanical recycling
- **Recycled Kraft Fibers** - 80% circularity, mixed end-of-life

The analytics panel updates instantly with material-specific metrics.

### 3. Set Degradation Timeline
- Use the slider to set degradation period (0-24 months)
- Watch the degradation bar change from green → yellow → orange
- Metrics adjust based on timeline selection

### 4. Run the Pipeline
Click "Run Pipeline" to:
1. Mesh import & validation ✓
2. Convex hull generation ◐
3. GPT-4o seam advisor ○
4. SVG dieline export ○

Watch the pipeline status update in real-time!

### 5. View Analytics
Monitor sustainability metrics:
- **Integrated Score:** Overall sustainability rating (0-100)
- **Void Fill Eliminated:** Cubic metres saved per unit
- **Container Efficiency:** Fleet-wide improvement percentage
- **CO₂ Reduction:** Kilograms saved per shipment
- **Carbon Ripple:** Annual tonnes CO₂ savings

## 🔌 API Endpoints

### GET /api/health
```bash
curl http://localhost:7071/api/health
```

### GET /api/materials
```bash
curl http://localhost:7071/api/materials
```

### POST /api/analyze
```bash
curl -X POST http://localhost:7071/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "mycelium",
    "volume_m3": 0.05,
    "degradation_months": 6
  }'
```

## 🛠️ Development Commands

### Start Frontend
```bash
cd frontend
npm run dev
```

### Start Backend
```bash
cd backend
python simple_server.py
```

### Stop Servers
Press `Ctrl+C` in each terminal window

## 📁 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Main React component with all UI logic |
| `frontend/src/App.css` | Complete styling matching design system |
| `backend/simple_server.py` | Flask development server |
| `backend/morpho_pipeline.py` | Core analysis logic and material database |
| `README.md` | Full project documentation |

## 🎨 Design Tokens

### Colors
```css
--g500: #22c55e  /* Primary green */
--g700: #15803d  /* Dark green */
--s800: #1e293b  /* Text primary */
--s400: #94a3b8  /* Text secondary */
```

### Fonts
```css
--font-head: 'Fraunces'    /* Headings */
--font-body: 'DM Sans'     /* Body text */
--font-mono: 'DM Mono'     /* Code/data */
```

## 🔍 Troubleshooting

### Frontend not loading?
- Check if port 5173 is available
- Run `npm install` in frontend folder
- Clear browser cache and reload

### Backend not responding?
- Check if port 7071 is available
- Verify Python dependencies: `pip install -r requirements.txt`
- Check console for error messages

### API CORS errors?
- Ensure flask-cors is installed
- Backend should show CORS headers in response
- Check browser console for specific error

## 📊 Material Database

| Material | CO₂/kg | Score | Circularity | Degradation |
|----------|--------|-------|-------------|-------------|
| Mycelium | 0.8 | 73 | 0.97 | 30 days |
| Cardboard | 2.4 | 58 | 0.74 | 360 days |
| Kraft | 1.6 | 65 | 0.80 | 180 days |

---

**🎉 You're all set! Access the dashboard at http://localhost:5173**
