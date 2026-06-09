import React, { useState, useRef, useEffect } from 'react';
import { Download, Play, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:5050/api';

const MATS = {
  mycelium: {lbl:'Agricultural Mycelium',dot:'#22c55e',desc:'Circularity: 0.97 · 30-day soil degradation',ss:73,v:82,c:97,co:56,void:0.49,eff:38,co2:0.28,ann:1.7},
  cardboard:{lbl:'Corrugated Cardboard',dot:'#f59e0b',desc:'Circularity: 0.74 · Mechanical recycling pathway',ss:58,v:65,c:74,co:42,void:0.41,eff:29,co2:0.19,ann:1.1},
  kraft:    {lbl:'Recycled Kraft Fibers',dot:'#78716c',desc:'Circularity: 0.80 · Mixed EoL — compost + paper recycle',ss:65,v:74,c:80,co:48,void:0.44,eff:33,co2:0.23,ann:1.4}
};

function App() {
  const [activeTab, setActiveTab] = useState('3d');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [error, setError] = useState(null);
  const [outputs, setOutputs] = useState({ glb: null, svg: null });
  const [svgContent, setSvgContent] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [matKey, setMatKey] = useState('mycelium');
  const [degMonth, setDegMonth] = useState(6);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const dielineRef = useRef(null);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      dielineRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable full-screen mode:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const mat = MATS[matKey];

  useEffect(() => {
    let interval;
    if (pipelineRunning) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/pipeline-status`);
          const data = await res.json();
          if (data.status === 'done' || data.status === 'error') {
            setPipelineRunning(false);
            if (data.error) setError(data.error);
            const newOutputs = { ...outputs };
            if (data.outputs?.glb_ready) {
              newOutputs.glb = `${API_BASE.replace('/api', '')}${data.outputs.glb_url}?t=${Date.now()}`;
            }
            if (data.outputs?.svg_ready) {
              const svgUrl = `${API_BASE.replace('/api', '')}${data.outputs.svg_url}?t=${Date.now()}`;
              newOutputs.svg = svgUrl;
              fetch(svgUrl).then(r => r.text()).then(text => setSvgContent(text)).catch(console.error);
            }
            setOutputs(newOutputs);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [pipelineRunning, outputs]);

  useEffect(() => {
    const ensureScript = () => {
      if (!document.querySelector('script[src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"]')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
        document.head.appendChild(script);
      }
    };
    ensureScript();
  }, []);

  const handleFileUpload = async (selectedFile) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError(null);
    setOutputs({ glb: null, svg: null });
    setSvgContent(null);
    setUploadProgress(0);

    const iv = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) { clearInterval(iv); return 100; }
        return p + Math.random() * 11 + 4;
      });
    }, 75);

    const formData = new FormData();
    formData.append('mesh', selectedFile);
    try {
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
    } catch (err) {
      setError(err.message);
    }
  };

  const runPipeline = async () => {
    if (!file || pipelineRunning) return;
    setError(null);
    setPipelineRunning(true);
    setOutputs({ glb: null, svg: null });
    setSvgContent(null);
    try {
      const res = await fetch(`${API_BASE}/run-pipeline`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start pipeline');
    } catch (err) {
      setError(err.message);
      setPipelineRunning(false);
    }
  };

  const downloadAsset = async (url, filename) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const renderGauge = () => {
    const circ = 214;
    const offset = circ - (mat.ss / 100) * circ;
    return (
      <div className="gauge-card">
        <div className="gauge-top">
          <div>
            <div className="gauge-lbl">Integrated Sustainability Score</div>
            <div className="gauge-sub">Sₛ = α·Vol + β·Circ + γ·CO₂</div>
          </div>
          <div className="gauge-score">{mat.ss}<span>/100</span></div>
        </div>
        <div className="ring-wrap">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle className="ring-track" cx="48" cy="48" r="34" />
            <circle className="ring-arc" cx="48" cy="48" r="34" style={{ strokeDashoffset: offset }} />
            <text x="48" y="44" textAnchor="middle" dominantBaseline="central" fontFamily="Fraunces,serif" fontSize="17" fontWeight="600" fill="#1e293b">{mat.ss}</text>
            <text x="48" y="60" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7.5" fill="#94a3b8">out of 100</text>
          </svg>
        </div>
        <div className="g-bars">
          <div className="g-bar-row">
            <span className="g-bar-lbl">Volumetric</span>
            <div className="g-bar-track"><div className="g-bar-fill" style={{ width: `${mat.v}%`, background: 'var(--g500)' }}></div></div>
            <span className="g-bar-val">{mat.v}%</span>
          </div>
          <div className="g-bar-row">
            <span className="g-bar-lbl">Circularity</span>
            <div className="g-bar-track"><div className="g-bar-fill" style={{ width: `${mat.c}%`, background: '#22d3ee' }}></div></div>
            <span className="g-bar-val">{mat.c}%</span>
          </div>
          <div className="g-bar-row">
            <span className="g-bar-lbl">CO₂ Index</span>
            <div className="g-bar-track"><div className="g-bar-fill" style={{ width: `${mat.co}%`, background: '#a78bfa' }}></div></div>
            <span className="g-bar-val">{mat.co}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {/* Topbar */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div>
            <div className="brand-name">Morpho<em>-Pack</em> <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--s400)', fontWeight: 300 }}>// PaaS</span></div>
            <div className="brand-sub">Generative Geometric Sustainability</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="status-pill"><div className="pulse"></div>Pipeline Active</div>
          <div className="tb-badge">v0.9.1-beta</div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sb-section" style={{ marginTop: '15px' }}>
          <div className="section-label">3D Mesh Input</div>
          <div 
            className="upload-zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('drag')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag');
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
          >
            <div className="upload-icon">
              <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div className="upload-t">Drop mesh file here</div>
            <div className="upload-s">or click to browse</div>
            <div className="fmt-row">
              <span className="fmt-tag">.STEP</span>
              <span className="fmt-tag">.OBJ</span>
              <span className="fmt-tag">.STL</span>
              <span className="fmt-tag">.GLB</span>
            </div>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".obj,.stl,.step,.glb" 
              style={{ display: 'none' }} 
              onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} 
            />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="prog-wrap show">
                <div className="prog-bar"><div className="prog-fill" style={{ width: `${uploadProgress}%` }}></div></div>
                <div className="prog-meta"><span>{fileName}</span><span>{Math.round(uploadProgress)}%</span></div>
              </div>
            )}
          </div>
        </div>

        <div className="sb-section" style={{ marginTop: '14px' }}>
          <div className="section-label">Material Profile</div>
          <div className="sel-wrap">
            <select value={matKey} onChange={(e) => setMatKey(e.target.value)}>
              <option value="mycelium">Agricultural Mycelium</option>
              <option value="cardboard">Corrugated Cardboard</option>
              <option value="kraft">Recycled Kraft Fibers</option>
            </select>
          </div>
          <div className="mat-badge">
            <div className="mat-dot" style={{ background: mat.dot }}></div>
            <div>
              <div className="mat-label">{mat.lbl}</div>
              <div className="mat-desc">{mat.desc}</div>
            </div>
          </div>
        </div>

        <div className="sb-section" style={{ marginTop: '14px' }}>
          <div className="section-label">Degradation Timeline</div>
          <div className="slider-header">
            <span className="slider-title">Material Degradation Timeline</span>
            <span className="slider-val">{degMonth} mo</span>
          </div>
          <input 
            type="range" 
            className="sl" 
            min="0" max="24" step="1" 
            value={degMonth} 
            onChange={(e) => setDegMonth(e.target.value)}
            style={{ background: `linear-gradient(to right, var(--g500) 0%, var(--g500) ${(degMonth/24)*100}%, var(--s200) ${(degMonth/24)*100}%, var(--s200) 100%)` }}
          />
          <div className="ticks"><span>0</span><span>6</span><span>12</span><span>18</span><span>24 mo</span></div>
          <div className="deg-bar">
            <div className="deg-fill" style={{ width: `${(degMonth/24)*100}%` }}></div>
          </div>
          <div className="deg-lbs">
            <span style={{ color: 'var(--g600)' }}>Fresh</span>
            <span style={{ color: '#eab308' }}>Breaking</span>
            <span style={{ color: '#f97316' }}>Composting</span>
          </div>
        </div>

        {file && (
          <div className="pipeline-box">
            <div className="section-label" style={{ marginBottom: '10px' }}>Pipeline Status</div>
            <div className="pipeline-row">
              <div className="pipe-ic" style={{ background: 'var(--g100)' }}>✓</div>
              <span className="pipe-txt">Mesh import &amp; validation</span>
              <span className="pipe-state st-done">done</span>
            </div>
            <div className="pipeline-row">
              <div className="pipe-ic" style={{ background: pipelineRunning ? '#fef9c3' : (outputs.glb ? 'var(--g100)' : 'var(--s100)') }}>{outputs.glb ? '✓' : (pipelineRunning ? '◐' : '○')}</div>
              <span className="pipe-txt">Convex hull generation</span>
              <span className={`pipe-state ${outputs.glb ? 'st-done' : (pipelineRunning ? 'st-run' : 'st-wait')}`}>{outputs.glb ? 'done' : (pipelineRunning ? 'running' : 'queued')}</span>
            </div>
            <div className="pipeline-row">
              <div className="pipe-ic" style={{ background: pipelineRunning ? '#fef9c3' : (outputs.svg ? 'var(--g100)' : 'var(--s100)') }}>{outputs.svg ? '✓' : (pipelineRunning ? '◐' : '○')}</div>
              <span className="pipe-txt">SVG dieline export</span>
              <span className={`pipe-state ${outputs.svg ? 'st-done' : (pipelineRunning ? 'st-run' : 'st-wait')}`}>{outputs.svg ? 'done' : (pipelineRunning ? 'running' : 'queued')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Viewport */}
      <div className="viewport">
        <div className="vp-header">
          <div className="vp-tabs">
            <button className={`vp-tab ${activeTab === '3d' ? 'active' : ''}`} onClick={() => setActiveTab('3d')}>3D Mesh</button>
            <button className={`vp-tab ${activeTab === 'dieline' ? 'active' : ''}`} onClick={() => setActiveTab('dieline')}>Dieline</button>
          </div>
          <div className="vp-actions">
            {activeTab === 'dieline' && outputs.svg && (
              <button className="act-btn" onClick={() => downloadAsset(outputs.svg, 'dieline_pattern.svg')}>
                <Download size={14} /> Download SVG
              </button>
            )}
            {activeTab === '3d' && outputs.glb && (
              <button className="act-btn" onClick={() => downloadAsset(outputs.glb, 'preview.glb')}>
                <Download size={14} /> Download GLB
              </button>
            )}
            <button className="act-btn primary" onClick={runPipeline} disabled={pipelineRunning || !file}>
              {pipelineRunning ? 'Processing...' : <><Play size={14} /> Run Pipeline</>}
            </button>
          </div>
        </div>

        <div className="vp-body" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === '3d' && (
            <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
              {outputs.glb ? (
                <model-viewer
                  src={outputs.glb}
                  camera-controls
                  auto-rotate
                  touch-action="pan-y"
                  shadow-intensity="1"
                  style={{ width: '100%', height: '100%', background: '#f8fafc' }}
                />
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--s400)' }}>
                  {pipelineRunning ? 'Generating 3D Preview...' : 'Upload a file and Run Pipeline'}
                </div>
              )}
              {outputs.glb && (
                <>
                  <div className="mesh-badge" style={{ color: 'var(--g700)', background: 'var(--g50)', borderColor: 'var(--g200)' }}>● READY</div>
                  <div className="mesh-label">{fileName} · Preview available</div>
                  <div className="mesh-ctrls">
                    <div className="mc-btn">+</div>
                    <div className="mc-btn">⊙</div>
                    <div className="mc-btn">−</div>
                  </div>
                </>
              )}
              {pipelineRunning && (
                <div className="mesh-badge proc">● PROCESSING</div>
              )}
            </div>
          )}

          {activeTab === 'dieline' && (
            <div className="dieline-workspace" ref={dielineRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--white)' }}>
              {outputs.svg ? (
                <>
                  <div className="zoom-controls">
                    <span className="badge">1 PAGE</span>
                    <button onClick={() => setZoom(z => Math.max(0.1, z - 0.25))}><ZoomOut size={16} /></button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => z + 0.25)}><ZoomIn size={16} /></button>
                    <button onClick={() => setZoom(1)} className="fit-btn">FIT</button>
                    <button onClick={toggleFullScreen}><Maximize size={16} /> Full</button>
                    <span className="divider">|</span>
                    <span className="legend-cut"></span> Cut line
                  </div>
                  <div className="svg-container">
                    <div 
                      className="svg-wrapper" 
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                      dangerouslySetInnerHTML={{ __html: svgContent }} 
                    />
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--s400)' }}>
                  {pipelineRunning ? 'Generating Dieline Pattern...' : 'Run Pipeline to generate 2D dieline'}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-toast" style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', background: '#fee2e2', color: '#991b1b', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #fecaca', zIndex: 50 }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="status-footer" style={{ height: '36px', background: 'var(--white)', borderTop: '1px solid var(--s200)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--s500)' }}>
          <div>{pipelineRunning ? 'Starting Blender pipeline...' : 'Idle'}</div>
          {outputs.glb && <button onClick={() => downloadAsset(outputs.glb, 'preview.glb')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--s600)' }}>Download GLB</button>}
          {outputs.svg && <button onClick={() => downloadAsset(outputs.svg, 'dieline_pattern.svg')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--s600)' }}>Download SVG</button>}
        </div>
      </div>

      {/* Analytics */}
      <div className="analytics">
        <div className="an-section" style={{ marginTop: '15px' }}>
          <div className="an-title">Fleet Telemetry &amp;<br/>Carbon Ripple Tracking</div>
          <div className="an-sub">Azure Cosmos DB · Power BI · Live sync</div>
        </div>

        {renderGauge()}

        <div className="metric-grid">
          <div className="mc">
            <div className="mc-lbl">Void Fill Volume Eliminated</div>
            <div className="mc-val">{mat.void.toFixed(2)}</div>
            <div className="mc-unit">cubic metres · per unit</div>
            <div className="mc-trend">↑ 23% vs standard box</div>
          </div>
          <div className="mc" style={{ borderLeftColor: 'var(--g300)' }}>
            <div className="mc-lbl">Container Efficiency Boost</div>
            <div className="mc-val" style={{ color: 'var(--g700)' }}>+{mat.eff}%</div>
            <div className="mc-unit">fleet-wide improvement</div>
            <div className="mc-trend">↑ cube utilisation</div>
          </div>
          <div className="mc" style={{ borderLeftColor: '#22d3ee' }}>
            <div className="mc-lbl">CO₂ Saved per Shipment</div>
            <div className="mc-val">{mat.co2.toFixed(2)}</div>
            <div className="mc-unit">kg CO₂ per dispatch</div>
            <div className="mc-trend">↑ Li &amp; Wang 2026</div>
          </div>
          <div className="mc" style={{ borderLeftColor: '#a78bfa' }}>
            <div className="mc-lbl">Carbon Ripple · Annual</div>
            <div className="mc-val">{mat.ann.toFixed(1)}</div>
            <div className="mc-unit">tonnes CO₂ · 500/mo fleet</div>
            <div className="mc-trend">↑ SDG 12 + 13 aligned</div>
          </div>
        </div>

        <div className="pbi-card">
          <div className="pbi-hd">
            <div className="pbi-ttl">
              <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Microsoft Power BI — Carbon Ripple
            </div>
            <span className="pbi-badge">EMBED SLOT</span>
          </div>
          <div className="pbi-body">
            <div className="mini-chart">
              {[28,35,41,38,52,67,61].map((v, i) => (
                <div key={i} className={`bar ${i === 6 ? 'hl' : ''}`} style={{ height: `${(v/88)*48}px` }}></div>
              ))}
            </div>
            <div className="chart-lbs">
              {['J','F','M','A','M','J','J'].map((m, i) => <span key={i}>{m}</span>)}
            </div>
            <div className="pbi-stats">
              <div className="pbi-stat"><div className="pbi-sv">6,200</div><div className="pbi-sl">Fleet shipments</div></div>
              <div className="pbi-stat"><div className="pbi-sv">2.1t</div><div className="pbi-sl">CO₂ avoided</div></div>
              <div className="pbi-stat"><div className="pbi-sv">A+</div><div className="pbi-sl">ESG grade</div></div>
            </div>
          </div>
        </div>

        <div className="sdg-row">
          <span className="sdg-tag" style={{ color: 'var(--g800)', background: 'var(--g50)', border: '1px solid var(--g200)' }}>SDG 12 · Responsible Consumption</span>
          <span className="sdg-tag" style={{ color: 'var(--g800)', background: 'var(--g50)', border: '1px solid var(--g200)' }}>SDG 13 · Climate Action</span>
          <span className="sdg-tag" style={{ color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe' }}>SDG 9 · Innovation</span>
        </div>
      </div>
    </div>
  );
}

export default App;
