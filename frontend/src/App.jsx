import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

// Material database
const MATERIALS = {
  mycelium: { label: 'Agricultural Mycelium', dot: '#22c55e', desc: 'Circularity: 0.97 · 30-day soil degradation', ss: 73, v: 82, c: 97, co: 56, void: 0.49, eff: 38, co2: 0.28, ann: 1.7 },
  cardboard: { label: 'Corrugated Cardboard', dot: '#f59e0b', desc: 'Circularity: 0.74 · Mechanical recycling pathway', ss: 58, v: 65, c: 74, co: 42, void: 0.41, eff: 29, co2: 0.19, ann: 1.1 },
  kraft: { label: 'Recycled Kraft Fibers', dot: '#78716c', desc: 'Circularity: 0.80 · Mixed EoL — compost + paper recycle', ss: 65, v: 74, c: 80, co: 48, void: 0.44, eff: 33, co2: 0.23, ann: 1.4 }
};

function App() {
  const [material, setMaterial] = useState('mycelium');
  const [degradation, setDegradation] = useState(6);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState([
    { id: 's1', label: 'Mesh import & validation', status: 'done', icon: '✓' },
    { id: 's2', label: 'Convex hull generation', status: 'wait', icon: '○' },
    { id: 's3', label: 'GPT-4o seam advisor', status: 'wait', icon: '○' },
    { id: 's4', label: 'SVG dieline export', status: 'wait', icon: '○' }
  ]);

  const selectedMat = MATERIALS[material];

  // Handle file upload
  const handleFileAccepted = (file) => {
    setFileName(file);
    setUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const next = Math.min(prev + Math.random() * 11 + 4, 100);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploading(false);
            setUploadProgress(0);
          }, 500);
        }
        return next;
      });
    }, 75);
  };

  // Run pipeline
  const runPipeline = async () => {
    if (pipelineRunning) return;
    setPipelineRunning(true);

    const steps = ['s2', 's3', 's4'];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1100));
      setPipelineSteps(prev => prev.map(step => {
        if (steps[i - 1] && step.id === steps[i - 1]) return { ...step, status: 'done', icon: '✓' };
        if (step.id === steps[i]) return { ...step, status: 'run', icon: '◐' };
        return step;
      }));
    }
    
    // Final step complete
    setPipelineSteps(prev => prev.map(step => step.id === 's4' ? { ...step, status: 'done', icon: '✓' } : step));
    setPipelineRunning(false);
    
    // Call backend API
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: material,
          volume_m3: 0.05,
          degradation_months: degradation
        })
      });
      const result = await response.json();
      console.log('Analysis result:', result);
    } catch (error) {
      console.error('Pipeline error:', error);
    }
  };

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <div className="brand-name">
              Morpho<em>-Pack</em>{' '}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--s400)', fontWeight: 300 }}>
                // PaaS
              </span>
            </div>
            <div className="brand-sub">Generative Geometric Sustainability</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="status-pill">
            <div className="pulse"></div>
            Pipeline Active
          </div>
          <div className="tb-badge">GitHub DevDays Hackathon</div>
          <div className="tb-badge">v0.9.1-beta</div>
        </div>
      </div>

      {/* SIDEBAR */}
      <Sidebar
        material={material}
        setMaterial={setMaterial}
        degradation={degradation}
        setDegradation={setDegradation}
        fileName={fileName}
        onFileAccepted={handleFileAccepted}
        uploading={uploading}
        uploadProgress={uploadProgress}
        pipelineSteps={pipelineSteps}
      />

      {/* VIEWPORT */}
      <Viewport fileName={fileName} pipelineRunning={pipelineRunning} runPipeline={runPipeline} />

      {/* ANALYTICS */}
      <Analytics material={selectedMat} degradation={degradation} />
    </div>
  );
}

// Sidebar Component
function Sidebar({ material, setMaterial, degradation, setDegradation, fileName, onFileAccepted, uploading, uploadProgress, pipelineSteps }) {
  const selectedMat = MATERIALS[material];

  return (
    <div className="sidebar">
      <div className="sb-section" style={{ marginTop: '15px' }}>
        <div className="section-label">3D Mesh Input</div>
        <UploadZone fileName={fileName} onFileAccepted={onFileAccepted} uploading={uploading} uploadProgress={uploadProgress} />
      </div>

      <div className="sb-section" style={{ marginTop: '14px' }}>
        <div className="section-label">Material Profile</div>
        <div className="sel-wrap">
          <select id="matSel" value={material} onChange={e => setMaterial(e.target.value)}>
            <option value="mycelium">Agricultural Mycelium</option>
            <option value="cardboard">Corrugated Cardboard</option>
            <option value="kraft">Recycled Kraft Fibers</option>
          </select>
        </div>
        <div className="mat-badge">
          <div className="mat-dot" style={{ background: selectedMat.dot }}></div>
          <div>
            <div className="mat-label">{selectedMat.label}</div>
            <div className="mat-desc">{selectedMat.desc}</div>
          </div>
        </div>
      </div>

      <div className="sb-section" style={{ marginTop: '14px' }}>
        <div className="section-label">Degradation Timeline</div>
        <div className="slider-header">
          <span className="slider-title">Material Degradation Timeline</span>
          <span className="slider-val">{degradation} mo</span>
        </div>
        <input
          type="range"
          className="sl"
          min="0"
          max="24"
          value={degradation}
          onChange={e => setDegradation(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, var(--g500) 0%, var(--g500) ${(degradation / 24) * 100}%, var(--s200) ${(degradation / 24) * 100}%, var(--s200) 100%)`
          }}
        />
        <div className="ticks">
          <span>0</span>
          <span>6</span>
          <span>12</span>
          <span>18</span>
          <span>24 mo</span>
        </div>
        <div className="deg-bar">
          <div className="deg-fill" style={{ width: `${(degradation / 24) * 100}%` }}></div>
        </div>
        <div className="deg-lbs">
          <span style={{ color: 'var(--g600)' }}>Fresh</span>
          <span style={{ color: '#eab308' }}>Breaking</span>
          <span style={{ color: '#f97316' }}>Composting</span>
        </div>
      </div>

      <PipelineStatus steps={pipelineSteps} />

      <div className="sb-section" style={{ marginTop: '14px' }}>
        <div style={{ padding: '11px', background: 'var(--g50)', border: '1px solid var(--g100)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--g800)', marginBottom: '6px' }}>Active Job</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8.5px', color: 'var(--s500)', lineHeight: 1.9 }}>
            <div>ID: <span style={{ color: 'var(--g700)' }}>job_3f8a1c2d</span></div>
            <div>File: <span style={{ color: 'var(--s700)' }}>{fileName || 'bicycle_frame.obj'}</span></div>
            <div>User: <span style={{ color: 'var(--s700)' }}>demo-user-001</span></div>
            <div>Blender: <span style={{ color: 'var(--s700)' }}>/usr/bin/blender</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Upload Zone Component
function UploadZone({ fileName, onFileAccepted, uploading, uploadProgress }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileAccepted(file.name);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileAccepted(file.name);
  };

  return (
    <div
      className={`upload-zone ${dragging ? 'drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".step,.obj,.glb,.stl" style={{ display: 'none' }} onChange={handleChange} />
      <div className="upload-icon">
        <svg viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="upload-t">Drop mesh file here</div>
      <div className="upload-s">or click to browse</div>
      <div className="fmt-row">
        <span className="fmt-tag">.STEP</span>
        <span className="fmt-tag">.OBJ</span>
        <span className="fmt-tag">.STL</span>
        <span className="fmt-tag">.GLB</span>
      </div>
      {uploading && (
        <div className="prog-wrap show">
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <div className="prog-meta">
            <span>{fileName}</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Pipeline Status Component
function PipelineStatus({ steps }) {
  return (
    <div className="pipeline-box">
      <div className="section-label" style={{ marginBottom: '10px' }}>Pipeline Status</div>
      {steps.map(step => (
        <div key={step.id} className="pipeline-row">
          <div className="pipe-ic" style={{ background: step.status === 'done' ? 'var(--g100)' : step.status === 'run' ? '#fef9c3' : 'var(--s100)' }}>
            {step.icon}
          </div>
          <span className="pipe-txt">{step.label}</span>
          <span className={`pipe-state st-${step.status}`}>{step.status === 'run' ? 'running' : step.status === 'done' ? 'done' : 'queued'}</span>
        </div>
      ))}
    </div>
  );
}

// Viewport Component
function Viewport({ fileName, pipelineRunning, runPipeline }) {
  return (
    <div className="viewport">
      <div className="vp-header">
        <div className="vp-tabs">
          <button className="vp-tab active">3D Mesh</button>
          <button className="vp-tab">Dieline</button>
          <button className="vp-tab">Wireframe</button>
        </div>
        <div className="vp-actions">
          <button className="act-btn">
            <svg viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export SVG
          </button>
          <button className="act-btn primary" onClick={runPipeline} disabled={pipelineRunning}>
            <svg viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Run Pipeline
          </button>
        </div>
      </div>

      <div className="mesh-viewer">
        <canvas id="mc"></canvas>
        <div className={`mesh-badge ${pipelineRunning ? 'proc' : ''}`}>
          {pipelineRunning ? '● PROCESSING' : '● READY'}
        </div>
        <div className="mesh-label">{fileName || 'bicycle_frame.obj'} · 12,847 verts · Blender 3.6</div>
        <div className="mesh-ctrls">
          <div className="mc-btn">+</div>
          <div className="mc-btn">⊙</div>
          <div className="mc-btn">−</div>
        </div>
      </div>

      <Dieline />
    </div>
  );
}

// Dieline Component
function Dieline() {
  return (
    <div className="dieline-panel">
      <div className="dl-header">
        <div className="dl-title">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          2D Manufacturing Canvas (.svg)
        </div>
        <div className="dl-legend">
          <div className="leg-item">
            <div className="leg-cut"></div>Cut line
          </div>
          <div className="leg-item">
            <div className="leg-fold"></div>Score/fold
          </div>
        </div>
      </div>
      <div className="dl-body">
        <svg id="dlSVG" width="100%" viewBox="0 0 500 175" style={{ maxWidth: '500px', maxHeight: '175px' }}>
          {/* Sample dieline pattern */}
          <rect x="30" y="20" width="360" height="140" rx="2" fill="none" stroke="#047857" strokeWidth="1.5" />
          <line x1="120" y1="20" x2="120" y2="160" stroke="#34d399" strokeWidth="1" strokeDasharray="6,4" />
          <line x1="210" y1="20" x2="210" y2="160" stroke="#34d399" strokeWidth="1" strokeDasharray="6,4" />
          <line x1="300" y1="20" x2="300" y2="160" stroke="#34d399" strokeWidth="1" strokeDasharray="6,4" />
        </svg>
      </div>
    </div>
  );
}

// Analytics Component
function Analytics({ material, degradation }) {
  const [bars, setBars] = useState({ v: 0, c: 0, co: 0 });

  useEffect(() => {
    setTimeout(() => {
      setBars({ v: material.v, c: material.c, co: material.co });
    }, 100);
  }, [material]);

  return (
    <div className="analytics">
      <div className="an-section" style={{ marginTop: '15px' }}>
        <div className="an-title">Fleet Telemetry &amp;<br />Carbon Ripple Tracking</div>
        <div className="an-sub">Azure Cosmos DB · Power BI · Live sync</div>
      </div>

      <GaugeCard score={material.ss} bars={bars} />
      <MetricsGrid material={material} />
      <PowerBICard />

      <div className="sdg-row">
        <span className="sdg-tag" style={{ color: 'var(--g800)', background: 'var(--g50)', border: '1px solid var(--g200)' }}>
          SDG 12 · Responsible Consumption
        </span>
        <span className="sdg-tag" style={{ color: 'var(--g800)', background: 'var(--g50)', border: '1px solid var(--g200)' }}>
          SDG 13 · Climate Action
        </span>
        <span className="sdg-tag" style={{ color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          SDG 9 · Innovation
        </span>
      </div>
    </div>
  );
}

// Gauge Card Component
function GaugeCard({ score, bars }) {
  const circ = 214;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="gauge-card">
      <div className="gauge-top">
        <div>
          <div className="gauge-lbl">Integrated Sustainability Score</div>
          <div className="gauge-sub">Sₛ = α·Vol + β·Circ + γ·CO₂</div>
        </div>
        <div className="gauge-score">
          {score}<span>/100</span>
        </div>
      </div>
      <div className="ring-wrap">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle className="ring-track" cx="48" cy="48" r="34" />
          <circle className="ring-arc" cx="48" cy="48" r="34" style={{ strokeDashoffset: offset }} />
          <text x="48" y="44" textAnchor="middle" dominantBaseline="central" fontFamily="Fraunces,serif" fontSize="17" fontWeight="600" fill="#1e293b">
            {score}
          </text>
          <text x="48" y="60" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7.5" fill="#94a3b8">
            out of 100
          </text>
        </svg>
      </div>
      <div className="g-bars">
        <div className="g-bar-row">
          <span className="g-bar-lbl">Volumetric</span>
          <div className="g-bar-track">
            <div className="g-bar-fill" style={{ background: 'var(--g500)', width: `${bars.v}%` }}></div>
          </div>
          <span className="g-bar-val">{bars.v}%</span>
        </div>
        <div className="g-bar-row">
          <span className="g-bar-lbl">Circularity</span>
          <div className="g-bar-track">
            <div className="g-bar-fill" style={{ background: '#22d3ee', width: `${bars.c}%` }}></div>
          </div>
          <span className="g-bar-val">{bars.c}%</span>
        </div>
        <div className="g-bar-row">
          <span className="g-bar-lbl">CO₂ Index</span>
          <div className="g-bar-track">
            <div className="g-bar-fill" style={{ background: '#a78bfa', width: `${bars.co}%` }}></div>
          </div>
          <span className="g-bar-val">{bars.co}%</span>
        </div>
      </div>
    </div>
  );
}

// Metrics Grid Component
function MetricsGrid({ material }) {
  return (
    <div className="metric-grid">
      <div className="mc">
        <div className="mc-lbl">Void Fill Volume Eliminated</div>
        <div className="mc-val">{material.void.toFixed(2)}</div>
        <div className="mc-unit">cubic metres · per unit</div>
        <div className="mc-trend">↑ 23% vs standard box</div>
      </div>
      <div className="mc" style={{ borderLeftColor: 'var(--g300)' }}>
        <div className="mc-lbl">Container Efficiency Boost</div>
        <div className="mc-val" style={{ color: 'var(--g700)' }}>+{material.eff}%</div>
        <div className="mc-unit">fleet-wide improvement</div>
        <div className="mc-trend">↑ cube utilisation</div>
      </div>
      <div className="mc" style={{ borderLeftColor: '#22d3ee' }}>
        <div className="mc-lbl">CO₂ Saved per Shipment</div>
        <div className="mc-val">{material.co2.toFixed(2)}</div>
        <div className="mc-unit">kg CO₂ per dispatch</div>
        <div className="mc-trend">↑ Li &amp; Wang 2026</div>
      </div>
      <div className="mc" style={{ borderLeftColor: '#a78bfa' }}>
        <div className="mc-lbl">Carbon Ripple · Annual</div>
        <div className="mc-val">{material.ann.toFixed(1)}</div>
        <div className="mc-unit">tonnes CO₂ · 500/mo fleet</div>
        <div className="mc-trend">↑ SDG 12 + 13 aligned</div>
      </div>
    </div>
  );
}

// Power BI Card Component
function PowerBICard() {
  const chartData = [55, 72, 61, 88, 76, 94, 83];

  return (
    <div className="pbi-card">
      <div className="pbi-hd">
        <div className="pbi-ttl">
          <svg viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Microsoft Power BI — Carbon Ripple
        </div>
        <span className="pbi-badge">EMBED SLOT</span>
      </div>
      <div className="pbi-body">
        <div className="mini-chart">
          {chartData.map((h, i) => (
            <div key={i} className="bar" style={{ height: `${h * 0.56}px` }}></div>
          ))}
        </div>
        <div className="chart-lbs">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map(label => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="pbi-stats">
          <div className="pbi-stat">
            <div className="pbi-sv">6,200</div>
            <div className="pbi-sl">Fleet shipments</div>
          </div>
          <div className="pbi-stat">
            <div className="pbi-sv">2.1t</div>
            <div className="pbi-sl">CO₂ avoided</div>
          </div>
          <div className="pbi-stat">
            <div className="pbi-sv">A+</div>
            <div className="pbi-sl">ESG grade</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
