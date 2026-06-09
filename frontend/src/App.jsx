import React, { useState, useRef, useEffect } from 'react';

/* ─── DESIGN TOKENS (exact palette from existing codebase) ─── */
const T = {
  g50:'#f0fdf4',g100:'#dcfce7',g200:'#bbf7d0',g300:'#86efac',
  g400:'#4ade80',g500:'#22c55e',g600:'#16a34a',g700:'#15803d',g800:'#166534',
  s50:'#f8fafc',s100:'#f1f5f9',s200:'#e2e8f0',s300:'#cbd5e1',
  s400:'#94a3b8',s500:'#64748b',s600:'#475569',s700:'#334155',
  s800:'#1e293b',s900:'#0f172a',
  white:'#ffffff',
};

/* ─── GLOBAL STYLES ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --g50:${T.g50};--g100:${T.g100};--g200:${T.g200};--g300:${T.g300};
    --g400:${T.g400};--g500:${T.g500};--g600:${T.g600};--g700:${T.g700};--g800:${T.g800};
    --s50:${T.s50};--s100:${T.s100};--s200:${T.s200};--s300:${T.s300};
    --s400:${T.s400};--s500:${T.s500};--s600:${T.s600};--s700:${T.s700};
    --s800:${T.s800};--s900:${T.s900};
    --white:${T.white};
    --font-head:'Fraunces',Georgia,serif;
    --font-body:'DM Sans','Segoe UI',system-ui,sans-serif;
    --font-mono:'DM Mono','Fira Mono',monospace;
    --shadow-sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
    --shadow-md:0 4px 16px rgba(0,0,0,.07),0 2px 4px rgba(0,0,0,.04);
    --shadow-lg:0 20px 60px rgba(0,0,0,.12),0 8px 20px rgba(0,0,0,.06);
    --radius:10px;--radius-lg:14px;
  }
  html,body{height:100%;font-family:var(--font-body);background:var(--s50);color:var(--s800);font-size:13px;line-height:1.5}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--s200);border-radius:2px}

  /* ── LANDING ── */
  .lp{min-height:100vh;background:var(--s900);color:var(--white);overflow-x:hidden}
  .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 40px;height:60px;background:rgba(15,23,42,.85);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.07)}
  .lp-brand{display:flex;align-items:center;gap:10px}
  .lp-brand-mark{width:32px;height:32px;background:var(--g600);border-radius:8px;display:flex;align-items:center;justify-content:center}
  .lp-brand-mark svg{width:17px;height:17px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
  .lp-brand-name{font-family:var(--font-head);font-size:16px;font-weight:600;color:var(--white);letter-spacing:-.3px}
  .lp-brand-name em{color:var(--g400);font-style:normal}
  .lp-nav-links{display:flex;align-items:center;gap:28px}
  .lp-nav-links a{font-size:13px;color:rgba(255,255,255,.6);text-decoration:none;transition:color .15s;cursor:pointer}
  .lp-nav-links a:hover{color:var(--white)}
  .lp-cta-btn{font-family:var(--font-mono);font-size:11.5px;padding:8px 18px;background:var(--g600);color:#fff;border:none;border-radius:8px;cursor:pointer;transition:background .15s}
  .lp-cta-btn:hover{background:var(--g700)}

  /* HERO */
  .hero{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:80px 40px 60px}
  .hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(22,163,74,.18) 0%, transparent 70%)}
  .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:40px 40px}
  .hero-inner{position:relative;z-index:2;max-width:900px;text-align:center}
  .hero-eyebrow{font-family:var(--font-mono);font-size:10.5px;letter-spacing:2.5px;color:var(--g400);text-transform:uppercase;margin-bottom:24px;display:inline-flex;align-items:center;gap:8px}
  .hero-eyebrow-line{width:32px;height:1px;background:var(--g500)}
  .hero-h1{font-family:var(--font-head);font-size:clamp(42px,6vw,76px);font-weight:700;line-height:1.05;letter-spacing:-1.5px;margin-bottom:24px;color:var(--white)}
  .hero-h1 em{color:var(--g400);font-style:italic}
  .hero-sub{font-size:clamp(15px,2vw,19px);color:rgba(255,255,255,.55);max-width:600px;margin:0 auto 40px;line-height:1.65;font-weight:300}
  .hero-actions{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-bottom:64px}
  .btn-hero-primary{font-size:13.5px;font-weight:600;padding:13px 28px;background:var(--g600);color:#fff;border:none;border-radius:10px;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(22,163,74,.4)}
  .btn-hero-primary:hover{background:var(--g700);transform:translateY(-1px);box-shadow:0 6px 28px rgba(22,163,74,.5)}
  .btn-hero-secondary{font-size:13.5px;font-weight:500;padding:12px 26px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.15);border-radius:10px;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:8px}
  .btn-hero-secondary:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.25)}
  .hero-stats{display:flex;justify-content:center;gap:48px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.08);padding-top:48px}
  .hero-stat-val{font-family:var(--font-head);font-size:32px;font-weight:600;color:var(--g400);line-height:1}
  .hero-stat-lbl{font-size:11px;color:rgba(255,255,255,.4);margin-top:5px;font-family:var(--font-mono);letter-spacing:.5px}

  /* DIAGRAM SECTION */
  .section-dark{padding:100px 40px;background:var(--s900)}
  .section-mid{padding:100px 40px;background:#0d1a2a}
  .section-light{padding:100px 40px;background:var(--s50)}
  .sec-tag{font-family:var(--font-mono);font-size:10px;letter-spacing:2px;color:var(--g500);text-transform:uppercase;margin-bottom:16px}
  .sec-h2{font-family:var(--font-head);font-size:clamp(28px,3.5vw,44px);font-weight:600;line-height:1.1;letter-spacing:-.8px;margin-bottom:20px}
  .sec-h2.light{color:var(--white)}
  .sec-h2.dark{color:var(--s900)}
  .sec-desc{font-size:15px;max-width:520px;line-height:1.7;margin-bottom:56px}
  .sec-desc.light{color:rgba(255,255,255,.5);font-weight:300}
  .sec-desc.dark{color:var(--s500)}
  .sec-center{text-align:center}
  .sec-center .sec-desc{margin:0 auto 56px}

  /* VALUE PROP DIAGRAM */
  .vp-diagram{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;max-width:900px;margin:0 auto}
  .vp-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:28px;text-align:center;position:relative}
  .vp-box.highlight{border-color:var(--g600);background:rgba(22,163,74,.08);box-shadow:0 0 40px rgba(22,163,74,.15)}
  .vp-box-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
  .vp-box-icon.red{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3)}
  .vp-box-icon.green{background:rgba(22,163,74,.15);border:1px solid rgba(22,163,74,.3)}
  .vp-box-title{font-family:var(--font-head);font-size:17px;font-weight:600;color:var(--white);margin-bottom:8px}
  .vp-box-desc{font-size:12px;color:rgba(255,255,255,.45);line-height:1.6}
  .vp-arrow{font-size:28px;color:var(--g500);font-weight:300}
  .vp-metrics{display:flex;flex-direction:column;gap:8px;margin-top:16px}
  .vp-metric{display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,.5)}
  .vp-metric-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}

  /* SDG GRID */
  .sdg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:800px;margin:0 auto}
  .sdg-card{border-radius:12px;padding:24px;border:1px solid rgba(255,255,255,.08)}
  .sdg-num{font-family:var(--font-mono);font-size:10px;letter-spacing:2px;margin-bottom:8px;opacity:.6}
  .sdg-title{font-family:var(--font-head);font-size:16px;font-weight:600;color:var(--white);margin-bottom:8px}
  .sdg-desc{font-size:11.5px;color:rgba(255,255,255,.45);line-height:1.6}

  /* HOW IT WORKS */
  .hiw-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:1000px;margin:0 auto}
  .hiw-step{position:relative;padding:28px 24px;background:var(--white);border:1px solid var(--s200);border-radius:14px;box-shadow:var(--shadow-sm);transition:box-shadow .2s,transform .2s}
  .hiw-step:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
  .hiw-step-num{font-family:var(--font-mono);font-size:11px;font-weight:500;color:var(--g600);letter-spacing:1px;margin-bottom:14px}
  .hiw-step-icon{width:44px;height:44px;background:var(--g50);border:1px solid var(--g200);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
  .hiw-step-icon svg{width:20px;height:20px;stroke:var(--g700);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .hiw-step-title{font-family:var(--font-head);font-size:15px;font-weight:600;color:var(--s800);margin-bottom:8px}
  .hiw-step-desc{font-size:12px;color:var(--s500);line-height:1.65}
  .hiw-step-tag{display:inline-block;margin-top:12px;font-family:var(--font-mono);font-size:8.5px;color:var(--g700);background:var(--g100);border:1px solid var(--g200);border-radius:4px;padding:2px 8px}
  .hiw-connector{position:absolute;right:-11px;top:50%;transform:translateY(-50%);width:22px;height:1px;background:var(--g300);z-index:1}

  /* FOOTER */
  .lp-footer{background:#070e18;padding:48px 40px;border-top:1px solid rgba(255,255,255,.06)}
  .lp-footer-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
  .lp-footer-copy{font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,.25);letter-spacing:.5px}
  .lp-footer-sdg{display:flex;gap:8px;flex-wrap:wrap}
  .lp-footer-sdg span{font-family:var(--font-mono);font-size:8.5px;padding:3px 8px;border-radius:4px;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.4)}

  /* ── LOGIN PAGE ── */
  .login-page{min-height:100vh;display:flex;background:var(--s50)}
  .login-left{flex:1;background:var(--s900);display:flex;flex-direction:column;justify-content:center;padding:60px;position:relative;overflow:hidden}
  .login-left-bg{position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 20% 50%,rgba(22,163,74,.14) 0%,transparent 65%)}
  .login-left-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:36px 36px}
  .login-left-inner{position:relative;z-index:2;max-width:420px}
  .login-brand{display:flex;align-items:center;gap:10px;margin-bottom:64px}
  .login-brand-mark{width:34px;height:34px;background:var(--g600);border-radius:9px;display:flex;align-items:center;justify-content:center}
  .login-brand-mark svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
  .login-brand-name{font-family:var(--font-head);font-size:17px;font-weight:600;color:var(--white)}
  .login-brand-name em{color:var(--g400);font-style:normal}
  .login-headline{font-family:var(--font-head);font-size:clamp(28px,3vw,38px);font-weight:600;color:var(--white);line-height:1.2;letter-spacing:-.5px;margin-bottom:16px}
  .login-headline em{color:var(--g400);font-style:italic}
  .login-tagline{font-size:14px;color:rgba(255,255,255,.45);line-height:1.7;font-weight:300;margin-bottom:48px}
  .login-features{display:flex;flex-direction:column;gap:14px}
  .login-feat{display:flex;align-items:flex-start;gap:12px}
  .login-feat-dot{width:20px;height:20px;border-radius:5px;background:rgba(22,163,74,.2);border:1px solid rgba(22,163,74,.4);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
  .login-feat-dot svg{width:10px;height:10px;stroke:var(--g400);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
  .login-feat-text{font-size:12.5px;color:rgba(255,255,255,.55);line-height:1.5}

  .login-right{width:480px;display:flex;flex-direction:column;justify-content:center;padding:60px 56px;background:var(--white)}
  .login-form-title{font-family:var(--font-head);font-size:26px;font-weight:600;color:var(--s900);margin-bottom:6px;letter-spacing:-.3px}
  .login-form-sub{font-size:13px;color:var(--s500);margin-bottom:40px}
  .login-input-group{margin-bottom:20px}
  .login-label{display:block;font-family:var(--font-mono);font-size:9.5px;letter-spacing:1.2px;color:var(--s500);text-transform:uppercase;margin-bottom:7px}
  .login-input{width:100%;padding:11px 14px;border:1.5px solid var(--s200);border-radius:var(--radius);font-family:var(--font-body);font-size:13.5px;color:var(--s800);background:var(--white);outline:none;transition:border-color .15s,box-shadow .15s}
  .login-input:focus{border-color:var(--g400);box-shadow:0 0 0 3px var(--g100)}
  .login-input::placeholder{color:var(--s300)}
  .login-input.error{border-color:#f87171;box-shadow:0 0 0 3px #fee2e2}
  .login-error-msg{font-family:var(--font-mono);font-size:9.5px;color:#dc2626;margin-top:5px}
  .login-submit{width:100%;padding:13px;background:var(--g600);color:#fff;border:none;border-radius:var(--radius);font-family:var(--font-body);font-size:14px;font-weight:600;cursor:pointer;transition:background .15s,transform .1s;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px}
  .login-submit:hover{background:var(--g700)}
  .login-submit:active{transform:scale(.99)}
  .login-submit:disabled{opacity:.6;cursor:not-allowed}
  .login-divider{display:flex;align-items:center;gap:14px;margin:24px 0;color:var(--s300)}
  .login-divider span{font-family:var(--font-mono);font-size:9px;color:var(--s400);letter-spacing:.5px}
  .login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:var(--s200)}
  .login-demo{width:100%;padding:11px;background:var(--s50);color:var(--s700);border:1.5px solid var(--s200);border-radius:var(--radius);font-family:var(--font-mono);font-size:11.5px;cursor:pointer;transition:all .15s;text-align:center}
  .login-demo:hover{background:var(--s100);border-color:var(--s300)}
  .login-back{display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:10px;color:var(--s400);cursor:pointer;margin-top:28px;transition:color .15s;border:none;background:transparent}
  .login-back:hover{color:var(--g600)}
  .login-version{font-family:var(--font-mono);font-size:9px;color:var(--s300);margin-top:16px;letter-spacing:.5px}

  /* ── DASHBOARD (preserved from original) ── */
  .app{display:grid;grid-template-columns:264px 1fr 284px;grid-template-rows:52px 1fr;height:100vh}
  .topbar{grid-column:1/-1;background:var(--white);border-bottom:1px solid var(--s200);display:flex;align-items:center;justify-content:space-between;padding:0 20px;z-index:10}
  .sidebar{background:var(--white);border-right:1px solid var(--s200);overflow-y:auto;display:flex;flex-direction:column;gap:0}
  .viewport{background:var(--s100);display:flex;flex-direction:column;overflow:hidden}
  .analytics{background:var(--white);border-left:1px solid var(--s200);overflow-y:auto}
  .brand{display:flex;align-items:center;gap:10px}
  .brand-mark{width:30px;height:30px;background:var(--g600);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .brand-mark svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
  .brand-name{font-family:var(--font-head);font-size:15px;font-weight:600;color:var(--s900);letter-spacing:-.3px;line-height:1}
  .brand-name em{color:var(--g600);font-style:normal}
  .brand-sub{font-family:var(--font-mono);font-size:9.5px;color:var(--s400);letter-spacing:.4px;margin-top:1px}
  .topbar-right{display:flex;align-items:center;gap:10px}
  .status-pill{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--g700);background:var(--g50);border:1px solid var(--g200);border-radius:20px;padding:4px 11px;font-family:var(--font-mono)}
  .pulse{width:6px;height:6px;border-radius:50%;background:var(--g500);animation:pulseAnim 2s ease-in-out infinite}
  @keyframes pulseAnim{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.75)}}
  .tb-badge{font-family:var(--font-mono);font-size:9.5px;color:var(--s500);background:var(--s100);border:1px solid var(--s200);border-radius:5px;padding:3px 9px}
  .tb-user{display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 10px;border-radius:8px;border:1px solid var(--s200);transition:background .15s}
  .tb-user:hover{background:var(--s50)}
  .tb-avatar{width:24px;height:24px;border-radius:6px;background:var(--g600);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:#fff;font-weight:500}
  .tb-user-name{font-family:var(--font-mono);font-size:10px;color:var(--s600)}
  .tb-logout{font-family:var(--font-mono);font-size:9.5px;color:var(--s400);background:transparent;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all .15s}
  .tb-logout:hover{color:#dc2626;background:#fee2e2}

  .sb-section{padding:16px 16px 0}
  .sb-section:last-child{padding-bottom:20px}
  .section-label{font-family:var(--font-mono);font-size:8.5px;letter-spacing:1.4px;color:var(--s400);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px}
  .section-label::after{content:'';flex:1;height:1px;background:var(--s200)}
  .upload-zone{border:1.5px dashed var(--g300);border-radius:var(--radius-lg);padding:22px 14px;text-align:center;cursor:pointer;transition:background .18s,border-color .18s}
  .upload-zone:hover{background:var(--g50);border-color:var(--g500)}
  .upload-icon{width:36px;height:36px;background:var(--g50);border:1px solid var(--g200);border-radius:10px;display:flex;align-items:center;justify-content:center;margin:0 auto 9px;color:var(--g600)}
  .upload-icon svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .upload-t{font-size:12px;font-weight:500;color:var(--s700)}
  .upload-s{font-size:10px;color:var(--s400);font-family:var(--font-mono)}
  .fmt-row{display:flex;gap:4px;justify-content:center;margin-top:8px;flex-wrap:wrap}
  .fmt-tag{font-family:var(--font-mono);font-size:8.5px;color:var(--g700);background:var(--g100);border:1px solid var(--g200);border-radius:3px;padding:2px 6px}
  .prog-wrap{display:none;margin-top:12px}
  .prog-wrap.show{display:block}
  .prog-bar{height:3px;background:var(--s200);border-radius:2px;overflow:hidden}
  .prog-fill{height:100%;background:var(--g500);border-radius:2px;width:0%;transition:width .35s}
  .prog-meta{display:flex;justify-content:space-between;margin-top:4px;font-family:var(--font-mono);font-size:8.5px;color:var(--s400)}
  .sel-wrap{position:relative}
  .sel-wrap select{width:100%;padding:9px 30px 9px 11px;border:1px solid var(--s200);border-radius:var(--radius);background:var(--white);color:var(--s800);font-family:var(--font-body);font-size:12.5px;appearance:none;cursor:pointer;outline:none}
  .sel-wrap select:focus{border-color:var(--g400);box-shadow:0 0 0 3px var(--g100)}
  .sel-wrap::after{content:'▾';position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--s400);pointer-events:none}
  .mat-badge{display:flex;align-items:flex-start;gap:7px;margin-top:8px;padding:8px 10px;background:var(--g50);border:1px solid var(--g100);border-radius:8px}
  .mat-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:3px}
  .mat-label{font-size:11px;font-weight:500;color:var(--s800)}
  .mat-desc{font-size:9.5px;color:var(--s500);margin-top:1px}
  .slider-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}
  .slider-title{font-size:11.5px;font-weight:500;color:var(--s700)}
  .slider-val{font-family:var(--font-mono);font-size:12px;color:var(--g700);font-weight:500}
  .sl{width:100%;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
  .sl::-webkit-slider-thumb{appearance:none;width:16px;height:16px;border-radius:50%;background:var(--g600);border:2px solid #fff;box-shadow:0 1px 4px rgba(22,163,74,.4);cursor:grab}
  .ticks{display:flex;justify-content:space-between;margin-top:5px}
  .ticks span{font-family:var(--font-mono);font-size:8.5px;color:var(--s400)}
  .deg-bar{height:5px;background:var(--s200);border-radius:3px;overflow:hidden;margin-top:10px}
  .deg-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--g500),#84cc16,#eab308,#f97316);transition:width .3s}
  .deg-lbs{display:flex;justify-content:space-between;margin-top:3px}
  .deg-lbs span{font-family:var(--font-mono);font-size:8px}
  .pipeline-box{margin:14px 16px 0;background:var(--s50);border:1px solid var(--s200);border-radius:var(--radius);padding:12px}
  .pipeline-row{display:flex;align-items:center;gap:8px;margin-bottom:5px}
  .pipeline-row:last-child{margin-bottom:0}
  .pipe-ic{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}
  .pipe-txt{flex:1;font-size:10.5px;color:var(--s600)}
  .pipe-state{font-family:var(--font-mono);font-size:8.5px;padding:2px 6px;border-radius:3px}
  .st-done{background:var(--g100);color:var(--g800)}
  .st-run{background:#fef9c3;color:#854d0e;animation:blink 1.5s ease-in-out infinite}
  .st-wait{background:var(--s100);color:var(--s500)}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.55}}
  .vp-header{background:var(--white);border-bottom:1px solid var(--s200);padding:11px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
  .vp-tabs{display:flex;gap:2px}
  .vp-tab{font-size:10.5px;font-family:var(--font-mono);padding:5px 11px;border-radius:6px;border:none;background:transparent;color:var(--s500);cursor:pointer;transition:all .14s}
  .vp-tab.active{background:var(--g50);color:var(--g700);border:1px solid var(--g200)}
  .vp-actions{display:flex;gap:6px}
  .act-btn{font-size:10.5px;font-family:var(--font-mono);padding:5px 10px;border-radius:6px;border:1px solid var(--s200);background:var(--white);color:var(--s600);cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .14s}
  .act-btn:hover{background:var(--s50);border-color:var(--s300)}
  .act-btn:disabled{opacity:0.6;cursor:not-allowed}
  .act-btn.primary{background:var(--g600);color:#fff;border-color:var(--g600)}
  .act-btn.primary:hover:not(:disabled){background:var(--g700)}
  .mesh-badge{position:absolute;top:11px;right:11px;font-family:var(--font-mono);font-size:8.5px;color:var(--g700);background:var(--g50);border:1px solid var(--g200);border-radius:4px;padding:3px 8px;z-index:20}
  .mesh-badge.proc{color:#92400e;background:#fffbeb;border-color:#fde68a;animation:blink 1.5s ease-in-out infinite}
  .mesh-label{position:absolute;bottom:11px;left:11px;font-family:var(--font-mono);font-size:8.5px;color:var(--s400);background:var(--white);border:1px solid var(--s200);border-radius:4px;padding:3px 8px;z-index:20;pointer-events:none}
  .mesh-ctrls{position:absolute;bottom:11px;right:11px;display:flex;gap:4px;z-index:20}
  .mc-btn{width:26px;height:26px;border:1px solid var(--s200);background:var(--white);border-radius:5px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:var(--s600);transition:all .14s}
  .mc-btn:hover{background:var(--s50)}
  .zoom-controls{height:40px;background:#ffffff;border-bottom:1px solid var(--s200);display:flex;align-items:center;padding:0 20px;gap:12px;font-size:12px;color:var(--s500)}
  .zoom-controls button{background:transparent;border:none;cursor:pointer;color:var(--s500)}
  .zoom-controls button:hover{color:var(--s800)}
  .fit-btn{background:var(--g600) !important;color:white !important;padding:4px 8px;border-radius:4px;font-weight:600}
  .badge{background:var(--s200);padding:2px 6px;border-radius:4px;font-weight:500;font-size:9.5px}
  .divider{color:var(--s300)}
  .legend-cut{display:inline-block;width:20px;height:2px;background:#166534}
  .svg-container{flex:1;display:flex;align-items:center;justify-content:center;overflow:auto;background:#e2e8f0}
  .svg-wrapper{background:#ffffff;box-shadow:var(--shadow-md);transition:transform 0.2s ease-out;display:flex;align-items:center;justify-content:center}
  .an-section{padding:15px 15px 0}
  .an-title{font-size:12.5px;font-weight:500;color:var(--s800);line-height:1.35}
  .an-sub{font-family:var(--font-mono);font-size:9px;color:var(--s400);margin-top:2px}
  .gauge-card{margin:12px 15px 0;padding:15px;background:var(--white);border:1px solid var(--s200);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm)}
  .gauge-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
  .gauge-lbl{font-size:11px;font-weight:500;color:var(--s700)}
  .gauge-sub{font-family:var(--font-mono);font-size:8.5px;color:var(--s400);margin-top:2px}
  .gauge-score{font-family:var(--font-head);font-size:28px;font-weight:600;color:var(--g700);line-height:1}
  .gauge-score span{font-family:var(--font-body);font-size:13px;font-weight:400;color:var(--s400)}
  .ring-wrap{display:flex;justify-content:center;margin-bottom:12px}
  .ring-track{fill:none;stroke:var(--s200);stroke-width:8}
  .ring-arc{fill:none;stroke:var(--g500);stroke-width:8;stroke-linecap:round;stroke-dasharray:220;stroke-dashoffset:220;transition:stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1);transform:rotate(-90deg);transform-origin:50% 50%}
  .g-bars{display:flex;flex-direction:column;gap:7px}
  .g-bar-row{display:flex;align-items:center;gap:8px}
  .g-bar-lbl{font-size:9.5px;color:var(--s500);width:72px;flex-shrink:0}
  .g-bar-track{flex:1;height:4px;background:var(--s200);border-radius:2px;overflow:hidden}
  .g-bar-fill{height:100%;border-radius:2px;width:0%;transition:width 1.2s cubic-bezier(.16,1,.3,1)}
  .g-bar-val{font-family:var(--font-mono);font-size:8.5px;color:var(--g700);width:26px;text-align:right}
  .metric-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:11px 15px 0}
  .mc{background:var(--white);border:1px solid var(--s200);border-left:3px solid var(--g400);border-radius:var(--radius);padding:11px 11px 9px;box-shadow:var(--shadow-sm);cursor:default;transition:box-shadow .14s}
  .mc:hover{box-shadow:var(--shadow-md)}
  .mc-lbl{font-size:9px;color:var(--s500);margin-bottom:5px;line-height:1.35}
  .mc-val{font-family:var(--font-head);font-size:19px;font-weight:600;color:var(--s900);line-height:1}
  .mc-unit{font-family:var(--font-mono);font-size:8.5px;color:var(--s400);margin-top:3px}
  .mc-trend{font-family:var(--font-mono);font-size:8.5px;color:var(--g700);margin-top:4px}
  .pbi-card{margin:11px 15px 0;border:1px solid var(--s200);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm)}
  .pbi-hd{padding:9px 13px;background:var(--s50);border-bottom:1px solid var(--s200);display:flex;align-items:center;justify-content:space-between}
  .pbi-ttl{font-size:10px;font-weight:500;color:var(--s700);display:flex;align-items:center;gap:5px}
  .pbi-ttl svg{width:11px;height:11px;stroke:#1d4ed8;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .pbi-badge{font-family:var(--font-mono);font-size:8px;color:#1d4ed8;background:#eff6ff;border:1px solid #bfdbfe;padding:2px 6px;border-radius:3px}
  .pbi-body{padding:13px;background:var(--white)}
  .mini-chart{display:flex;align-items:flex-end;gap:3px;height:52px;margin-bottom:9px}
  .bar{border-radius:3px 3px 0 0;background:var(--g300);transition:height .8s cubic-bezier(.16,1,.3,1),background .2s;cursor:pointer;flex:1;min-width:14px}
  .bar:hover,.bar.hl{background:var(--g600)}
  .chart-lbs{display:flex;justify-content:space-between}
  .chart-lbs span{font-family:var(--font-mono);font-size:7.5px;color:var(--s400);flex:1;text-align:center}
  .pbi-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:11px;border-top:1px solid var(--s100);padding-top:11px}
  .pbi-stat{text-align:center}
  .pbi-sv{font-family:var(--font-head);font-size:14px;font-weight:600;color:var(--g700)}
  .pbi-sl{font-family:var(--font-mono);font-size:7.5px;color:var(--s400);margin-top:1px}
  .sdg-row{margin:10px 15px 16px;display:flex;flex-wrap:wrap;gap:4px}
  .sdg-tag{font-family:var(--font-mono);font-size:7.5px;border-radius:4px;padding:3px 6px;white-space:nowrap}

  /* Animations */
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .7s cubic-bezier(.16,1,.3,1) both}
  .fade-up-d1{animation-delay:.1s}
  .fade-up-d2{animation-delay:.2s}
  .fade-up-d3{animation-delay:.3s}
  .fade-up-d4{animation-delay:.4s}
`;

/* ─── MATS DATA ─── */
const MATS = {
  mycelium:{lbl:'Agricultural Mycelium',dot:'#22c55e',desc:'Circularity: 0.97 · 30-day soil degradation',ss:73,v:82,c:97,co:56,void:0.49,eff:38,co2:0.28,ann:1.7},
  cardboard:{lbl:'Corrugated Cardboard',dot:'#f59e0b',desc:'Circularity: 0.74 · Mechanical recycling pathway',ss:58,v:65,c:74,co:42,void:0.41,eff:29,co2:0.19,ann:1.1},
  kraft:{lbl:'Recycled Kraft Fibers',dot:'#78716c',desc:'Circularity: 0.80 · Mixed EoL — compost + paper recycle',ss:65,v:74,c:80,co:48,void:0.44,eff:33,co2:0.23,ann:1.4}
};
const API_BASE='http://localhost:5050/api';

/* ════════════════════════════════════════════════
   LANDING PAGE
════════════════════════════════════════════════ */
function LandingPage({ onLogin, onDemo }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="lp">
      {/* NAV */}
      <nav className="lp-nav" style={{ borderBottomColor: scrolled ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.04)' }}>
        <div className="lp-brand">
          <div className="lp-brand-mark">
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div className="lp-brand-name">Morpho<em>-Pack</em></div>
        </div>
        <div className="lp-nav-links">
          <a href="#how-it-works">How It Works</a>
          <a href="#sustainability">Sustainability</a>
          <a href="#pipeline">Pipeline</a>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="lp-cta-btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.8)' }} onClick={onLogin}>Sign In</button>
          <button className="lp-cta-btn" onClick={onLogin}>Launch App →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-eyebrow fade-up">
            <span className="hero-eyebrow-line" />
            AI-Generated Sustainable Packaging
            <span className="hero-eyebrow-line" />
          </div>
          <h1 className="hero-h1 fade-up fade-up-d1">
            Every shape. <em>Zero waste.</em><br/>Fit to the millimetre.
          </h1>
          <p className="hero-sub fade-up fade-up-d2">
            Upload any 3D mesh and Morpho-Pack generates tight-fitting, manufacturable packaging — eliminating void fill, cutting carbon, and aligning every shipment with SDG 12 &amp; 13.
          </p>
          <div className="hero-actions fade-up fade-up-d3">
            <button className="btn-hero-primary" onClick={onLogin}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Open Pipeline
            </button>
            <button className="btn-hero-secondary" onClick={onDemo}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              View Demo
            </button>
          </div>
          <div className="hero-stats fade-up fade-up-d4">
            {[
              { val: '−49%', lbl: 'Void fill eliminated' },
              { val: '+38%', lbl: 'Container efficiency' },
              { val: '0.28kg', lbl: 'CO₂ saved / shipment' },
              { val: 'SDG 12/13', lbl: 'Alignment certified' },
            ].map(s => (
              <div key={s.lbl} style={{ textAlign: 'center' }}>
                <div className="hero-stat-val">{s.val}</div>
                <div className="hero-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="section-dark" id="sustainability">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="sec-center">
            <div className="sec-tag">The Problem We Solve</div>
            <h2 className="sec-h2 light">Standard boxes ship air.<br/>We ship only your product.</h2>
            <p className="sec-desc light" style={{ maxWidth: '540px', margin: '0 auto 56px' }}>
              Oversized packaging is the invisible cost of every supply chain. Morpho-Pack uses convex hull geometry to generate the tightest manufacturable shape for any 3D object — automatically.
            </p>
          </div>
          <div className="vp-diagram">
            <div className="vp-box">
              <div className="vp-box-icon red">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z" opacity=".4"/></svg>
              </div>
              <div className="vp-box-title">Standard Box</div>
              <div className="vp-box-desc">Generic sizing, void fill required, up to 49% dead air per shipment</div>
              <div className="vp-metrics">
                <div className="vp-metric"><div className="vp-metric-dot" style={{ background: '#ef4444' }} />Void fill: ~0.49 m³</div>
                <div className="vp-metric"><div className="vp-metric-dot" style={{ background: '#f97316' }} />Container eff.: baseline</div>
                <div className="vp-metric"><div className="vp-metric-dot" style={{ background: '#eab308' }} />CO₂: unoptimised</div>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '30px', color: T.g400, fontFamily: 'var(--font-mono)' }}>→</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: T.g500, letterSpacing: '1px', marginTop: '6px' }}>MORPHO AI</div>
            </div>
            <div className="vp-box highlight">
              <div className="vp-box-icon green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 19 7 19 17 12 22 5 17 5 7 12 2"/></svg>
              </div>
              <div className="vp-box-title">Morpho-Pack Shell</div>
              <div className="vp-box-desc">Tight-fit convex hull, zero void fill, maximum container density</div>
              <div className="vp-metrics">
                <div className="vp-metric"><div className="vp-metric-dot" style={{ background: T.g500 }} />Void fill: near zero</div>
                <div className="vp-metric"><div className="vp-metric-dot" style={{ background: T.g400 }} />Container eff.: +38%</div>
                <div className="vp-metric"><div className="vp-metric-dot" style={{ background: '#22d3ee' }} />CO₂: −0.28kg/dispatch</div>
              </div>
            </div>
          </div>
          {/* SDG Cards */}
          <div className="sdg-grid" style={{ marginTop: '64px' }}>
            {[
              { num: 'SDG 12', title: 'Responsible Consumption', desc: 'Minimise material use through geometry-optimised packaging that eliminates waste at source.', color: '#16a34a' },
              { num: 'SDG 13', title: 'Climate Action', desc: 'Reduce transport-related CO₂ by maximising container utilisation across every fleet shipment.', color: '#0d9488' },
              { num: 'SDG 9', title: 'Industry Innovation', desc: 'AI-driven parametric design replaces manual box sizing with automated geometric intelligence.', color: '#1d4ed8' },
            ].map(s => (
              <div key={s.num} className="sdg-card" style={{ borderColor: `${s.color}44`, background: `${s.color}10` }}>
                <div className="sdg-num" style={{ color: s.color }}>{s.num} ·</div>
                <div className="sdg-title">{s.title}</div>
                <div className="sdg-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-light" id="how-it-works">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="sec-center">
            <div className="sec-tag" style={{ color: T.g700 }}>Instructions</div>
            <h2 className="sec-h2 dark">From mesh to manufacturable<br/>dieline in four steps</h2>
            <p className="sec-desc dark" style={{ margin: '0 auto 56px' }}>
              Morpho-Pack accepts standard 3D formats and outputs a ready-to-cut 2D dieline — all within a single cloud pipeline.
            </p>
          </div>
          <div className="hiw-steps">
            {[
              { num: 'Step 01', title: 'Upload 3D Mesh', desc: 'Drag and drop your .STL, .OBJ, .STEP, or .GLB file into the sidebar upload zone. The system validates geometry on receipt.', tag: '.STL · .OBJ · .GLB · .STEP', icon: <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /> },
              { num: 'Step 02', title: 'Select Material', desc: 'Choose your packaging substrate — Agricultural Mycelium, Corrugated Cardboard, or Recycled Kraft — to tune the sustainability score.', tag: 'Mycelium · Cardboard · Kraft', icon: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></> },
              { num: 'Step 03', title: 'Run Pipeline', desc: 'Click "Run Pipeline" to trigger the Azure-hosted Blender backend. Convex hull generation and SVG dieline export run in parallel.', tag: 'Azure · Blender · Python', icon: <><polygon points="5 3 19 12 5 21 5 3"/></> },
              { num: 'Step 04', title: 'Download Outputs', desc: 'Preview the 3D packaging shell in the model viewer, inspect the 2D dieline, then download the GLB or SVG for manufacturing.', tag: 'GLB preview · SVG dieline', icon: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></> },
            ].map((step, i) => (
              <div key={step.num} className="hiw-step" style={{ position: 'relative' }}>
                <div className="hiw-step-num">{step.num}</div>
                <div className="hiw-step-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{step.icon}</svg>
                </div>
                <div className="hiw-step-title">{step.title}</div>
                <div className="hiw-step-desc">{step.desc}</div>
                <div className="hiw-step-tag">{step.tag}</div>
                {i < 3 && <div className="hiw-connector" />}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '56px' }}>
            <button className="btn-hero-primary" style={{ display: 'inline-flex' }} onClick={onLogin}>
              Start Your First Pipeline →
            </button>
          </div>
        </div>
      </section>

      {/* PIPELINE SECTION */}
      <section className="section-mid" id="pipeline">
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div className="sec-tag">Technical Stack</div>
          <h2 className="sec-h2 light">Production-grade AI pipeline<br/>on Azure infrastructure</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '48px' }}>
            {[
              { icon: '⬡', title: 'Azure AI Foundry', desc: 'Model serving, versioning, and A/B testing for the convex hull generation model.', color: '#1d4ed8' },
              { icon: '◈', title: 'Blender Python', desc: 'Headless Blender renders watertight convex hull meshes and exports to GLB format.', color: T.g600 },
              { icon: '◇', title: 'Azure Cosmos DB', desc: 'Fleet telemetry, carbon ripple tracking, and Power BI live sync for ESG reporting.', color: '#7c3aed' },
            ].map(c => (
              <div key={c.title} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '14px', color: c.color }}>{c.icon}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '16px', fontWeight: 600, color: T.white, marginBottom: '8px' }}>{c.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)', lineHeight: 1.65 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '22px', height: '22px', background: T.g600, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: '14px', color: 'rgba(255,255,255,.7)' }}>Morpho<em style={{ color: T.g400, fontStyle: 'normal' }}>-Pack</em></span>
            </div>
            <div className="lp-footer-copy">v0.9.1-beta · Generative Geometric Sustainability · PaaS</div>
          </div>
          <div className="lp-footer-sdg">
            <span>SDG 12 · Responsible Consumption</span>
            <span>SDG 13 · Climate Action</span>
            <span>SDG 9 · Innovation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════
   LOGIN PAGE
════════════════════════════════════════════════ */
function LoginPage({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    setTimeout(() => { setLoading(false); onLogin({ email, name: email.split('@')[0] }); }, 900);
  };

  const handleDemo = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ email: 'demo@morphopack.ai', name: 'Demo User' }); }, 500);
  };

  return (
    <div className="login-page">
      {/* LEFT PANEL */}
      <div className="login-left">
        <div className="login-left-bg" />
        <div className="login-left-grid" />
        <div className="login-left-inner">
          <div className="login-brand">
            <div className="login-brand-mark">
              <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div className="login-brand-name">Morpho<em>-Pack</em></div>
          </div>
          <h2 className="login-headline">
            Packaging that fits <em>exactly</em> what you ship.
          </h2>
          <p className="login-tagline">
            AI-generated convex hull geometry. Zero void fill. Full SDG 12 &amp; 13 alignment. Manufacturing-ready dielines in seconds.
          </p>
          <div className="login-features">
            {[
              'Upload STL, OBJ, STEP, or GLB mesh files',
              'Automatic convex hull packaging generation',
              'Real-time sustainability scoring (Sₛ formula)',
              'Azure-powered pipeline with Power BI telemetry',
            ].map(f => (
              <div key={f} className="login-feat">
                <div className="login-feat-dot">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="login-feat-text">{f}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-form-title">Sign in</div>
        <div className="login-form-sub">Access the Morpho-Pack pipeline</div>

        <div className="login-input-group">
          <label className="login-label">Email address</label>
          <input
            className={`login-input${errors.email ? ' error' : ''}`}
            type="email" placeholder="you@organisation.com"
            value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {errors.email && <div className="login-error-msg">⚠ {errors.email}</div>}
        </div>
        <div className="login-input-group">
          <label className="login-label">Password</label>
          <input
            className={`login-input${errors.password ? ' error' : ''}`}
            type="password" placeholder="••••••••"
            value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {errors.password && <div className="login-error-msg">⚠ {errors.password}</div>}
        </div>

        <button className="login-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
              Signing in…
            </span>
          ) : 'Sign In →'}
        </button>

        <div className="login-divider"><span>or</span></div>
        <button className="login-demo" onClick={handleDemo} disabled={loading}>
          Continue with Demo Access
        </button>

        <button className="login-back" onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to homepage
        </button>
        <div className="login-version">MORPHO-PACK v0.9.1-beta · PaaS</div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════
   DASHBOARD (fully preserved original)
════════════════════════════════════════════════ */
function Dashboard({ user, onLogout }) {
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
  const mat = MATS[matKey];

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) dielineRef.current?.requestFullscreen().catch(console.error);
    else document.exitFullscreen();
  };

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
            if (data.outputs?.glb_ready) newOutputs.glb = `${API_BASE.replace('/api','')}${data.outputs.glb_url}?t=${Date.now()}`;
            if (data.outputs?.svg_ready) {
              const svgUrl = `${API_BASE.replace('/api','')}${data.outputs.svg_url}?t=${Date.now()}`;
              newOutputs.svg = svgUrl;
              fetch(svgUrl).then(r => r.text()).then(setSvgContent).catch(console.error);
            }
            setOutputs(newOutputs);
          }
        } catch (err) { console.error(err); }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [pipelineRunning, outputs]);

  useEffect(() => {
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      document.head.appendChild(s);
    }
  }, []);

  const handleFileUpload = async (selectedFile) => {
    setFile(selectedFile); setFileName(selectedFile.name); setError(null);
    setOutputs({ glb: null, svg: null }); setSvgContent(null); setUploadProgress(0);
    const iv = setInterval(() => setUploadProgress(p => { if (p >= 100) { clearInterval(iv); return 100; } return p + Math.random() * 11 + 4; }), 75);
    const fd = new FormData(); fd.append('mesh', selectedFile);
    try {
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
    } catch (err) { setError(err.message); }
  };

  const runPipeline = async () => {
    if (!file || pipelineRunning) return;
    setError(null); setPipelineRunning(true); setOutputs({ glb: null, svg: null }); setSvgContent(null);
    try {
      const res = await fetch(`${API_BASE}/run-pipeline`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start pipeline');
    } catch (err) { setError(err.message); setPipelineRunning(false); }
  };

  const downloadAsset = async (url, filename) => {
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    } catch { window.open(url, '_blank'); }
  };

  const renderGauge = () => {
    let dynamicV = mat.v;
    if (outputs.svg && outputs.glb && file) {
      const cf = Math.min(20, file.size / (1024 * 1024) * 5);
      const sf = svgContent ? Math.min(30, svgContent.length / 50000 * 10) : 0;
      dynamicV = Math.max(10, Math.round(100 - cf - sf));
    }
    const dynamicSS = Math.round((dynamicV * 0.55) + (mat.c * 0.25) + (mat.co * 0.20));
    const circ = 214, offset = circ - (dynamicSS / 100) * circ;
    return (
      <div className="gauge-card">
        <div className="gauge-top">
          <div>
            <div className="gauge-lbl" title="SDG 12 Alignment: Sₛ = α·Vol + β·Circ + γ·CO₂">Integrated Sustainability Score ⓘ</div>
            <div className="gauge-sub">Sₛ = α·Vol + β·Circ + γ·CO₂</div>
          </div>
          <div className="gauge-score">{dynamicSS}<span>/100</span></div>
        </div>
        <div className="ring-wrap">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle className="ring-track" cx="48" cy="48" r="34" />
            <circle className="ring-arc" cx="48" cy="48" r="34" style={{ strokeDashoffset: offset }} />
            <text x="48" y="44" textAnchor="middle" dominantBaseline="central" fontFamily="Fraunces,serif" fontSize="17" fontWeight="600" fill="#1e293b">{dynamicSS}</text>
            <text x="48" y="60" textAnchor="middle" fontFamily="DM Mono,monospace" fontSize="7.5" fill="#94a3b8">out of 100</text>
          </svg>
        </div>
        <div className="g-bars">
          {[
            { lbl: 'Volumetric', val: dynamicV, color: 'var(--g500)' },
            { lbl: 'Circularity', val: mat.c, color: '#22d3ee' },
            { lbl: 'CO₂ Index', val: mat.co, color: '#a78bfa' },
          ].map(b => (
            <div key={b.lbl} className="g-bar-row">
              <span className="g-bar-lbl">{b.lbl}</span>
              <div className="g-bar-track"><div className="g-bar-fill" style={{ width: `${b.val}%`, background: b.color }} /></div>
              <span className="g-bar-val">{b.val}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const initials = user.name.slice(0, 2).toUpperCase();

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
          <div className="status-pill"><div className="pulse" />Pipeline Active</div>
          <div className="tb-badge">v0.9.1-beta</div>
          <div className="tb-user">
            <div className="tb-avatar">{initials}</div>
            <div className="tb-user-name">{user.name}</div>
          </div>
          <button className="tb-logout" onClick={onLogout}>Sign out</button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sb-section" style={{ marginTop: '15px' }}>
          <div className="section-label">3D Mesh Input</div>
          <div className="upload-zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
            onDragLeave={e => e.currentTarget.classList.remove('drag')}
            onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag'); if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]); }}>
            <div className="upload-icon">
              <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div className="upload-t">Drop mesh file here</div>
            <div className="upload-s">or click to browse</div>
            <div className="fmt-row">
              {['.STEP','.OBJ','.STL','.GLB'].map(f => <span key={f} className="fmt-tag">{f}</span>)}
            </div>
            <input ref={fileInputRef} type="file" accept=".obj,.stl,.step,.glb" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="prog-wrap show">
                <div className="prog-bar"><div className="prog-fill" style={{ width: `${uploadProgress}%` }} /></div>
                <div className="prog-meta"><span>{fileName}</span><span>{Math.round(uploadProgress)}%</span></div>
              </div>
            )}
          </div>
        </div>

        <div className="sb-section" style={{ marginTop: '14px' }}>
          <div className="section-label">Material Profile</div>
          <div className="sel-wrap">
            <select value={matKey} onChange={e => setMatKey(e.target.value)}>
              <option value="mycelium">Agricultural Mycelium</option>
              <option value="cardboard">Corrugated Cardboard</option>
              <option value="kraft">Recycled Kraft Fibers</option>
            </select>
          </div>
          <div className="mat-badge">
            <div className="mat-dot" style={{ background: mat.dot }} />
            <div><div className="mat-label">{mat.lbl}</div><div className="mat-desc">{mat.desc}</div></div>
          </div>
        </div>

        <div className="sb-section" style={{ marginTop: '14px' }}>
          <div className="section-label">Degradation Timeline</div>
          <div className="slider-header">
            <span className="slider-title">Material Degradation Timeline</span>
            <span className="slider-val">{degMonth} mo</span>
          </div>
          <input type="range" className="sl" min="0" max="24" step="1" value={degMonth}
            onChange={e => setDegMonth(e.target.value)}
            style={{ background: `linear-gradient(to right,var(--g500) 0%,var(--g500) ${(degMonth/24)*100}%,var(--s200) ${(degMonth/24)*100}%,var(--s200) 100%)` }} />
          <div className="ticks">{['0','6','12','18','24 mo'].map(t => <span key={t}>{t}</span>)}</div>
          <div className="deg-bar"><div className="deg-fill" style={{ width: `${(degMonth/24)*100}%` }} /></div>
          <div className="deg-lbs">
            <span style={{ color: 'var(--g600)' }}>Fresh</span>
            <span style={{ color: '#eab308' }}>Breaking</span>
            <span style={{ color: '#f97316' }}>Composting</span>
          </div>
        </div>

        {file && (
          <div className="pipeline-box">
            <div className="section-label" style={{ marginBottom: '10px' }}>Pipeline Status</div>
            {[
              { label: 'Mesh import & validation', done: true, running: false },
              { label: 'Convex hull generation', done: !!outputs.glb, running: pipelineRunning },
              { label: 'SVG dieline export', done: !!outputs.svg, running: pipelineRunning },
            ].map((row, i) => (
              <div key={i} className="pipeline-row">
                <div className="pipe-ic" style={{ background: row.done ? 'var(--g100)' : row.running ? '#fef9c3' : 'var(--s100)' }}>
                  {row.done ? '✓' : row.running ? '◐' : '○'}
                </div>
                <span className="pipe-txt">{row.label}</span>
                <span className={`pipe-state ${row.done ? 'st-done' : row.running ? 'st-run' : 'st-wait'}`}>
                  {row.done ? 'done' : row.running ? 'running' : 'queued'}
                </span>
              </div>
            ))}
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
            {activeTab === 'dieline' && outputs.svg && <button className="act-btn" onClick={() => downloadAsset(outputs.svg,'dieline_pattern.svg')}><span>↓</span> Download SVG</button>}
            {activeTab === '3d' && outputs.glb && <button className="act-btn" onClick={() => downloadAsset(outputs.glb,'preview.glb')}><span>↓</span> Download GLB</button>}
            <button className="act-btn primary" onClick={runPipeline} disabled={pipelineRunning || !file}>
              {pipelineRunning ? 'Processing…' : '▶ Run Pipeline'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === '3d' && (
            <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
              {outputs.glb ? (
                <model-viewer src={outputs.glb} camera-controls auto-rotate touch-action="pan-y" shadow-intensity="1" style={{ width: '100%', height: '100%', background: '#f8fafc' }} />
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--s400)' }}>
                  {pipelineRunning ? 'Generating 3D Preview…' : 'Upload a file and Run Pipeline'}
                </div>
              )}
              {outputs.glb && <>
                <div className="mesh-badge" style={{ color: 'var(--g700)', background: 'var(--g50)', borderColor: 'var(--g200)' }}>● READY</div>
                <div className="mesh-label">{fileName} · Preview available</div>
                <div className="mesh-ctrls">{['+','⊙','−'].map(c => <div key={c} className="mc-btn">{c}</div>)}</div>
              </>}
              {pipelineRunning && <div className="mesh-badge proc">● PROCESSING</div>}
            </div>
          )}
          {activeTab === 'dieline' && (
            <div className="dieline-workspace" ref={dielineRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--white)' }}>
              {outputs.svg ? (
                <>
                  <div className="zoom-controls">
                    <span className="badge">1 PAGE</span>
                    <button onClick={() => setZoom(z => Math.max(0.1, z - 0.25))}>−</button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => z + 0.25)}>+</button>
                    <button onClick={() => setZoom(1)} className="fit-btn">FIT</button>
                    <button onClick={toggleFullScreen}>⛶ Full</button>
                    <span className="divider">|</span>
                    <span className="legend-cut" /> Cut line
                  </div>
                  <div className="svg-container">
                    <div className="svg-wrapper" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }} dangerouslySetInnerHTML={{ __html: svgContent }} />
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--s400)' }}>
                  {pipelineRunning ? 'Generating Dieline Pattern…' : 'Run Pipeline to generate 2D dieline'}
                </div>
              )}
            </div>
          )}
          {error && (
            <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', background: '#fee2e2', color: '#991b1b', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,.1)', border: '1px solid #fecaca', zIndex: 50 }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div style={{ height: '36px', background: 'var(--white)', borderTop: '1px solid var(--s200)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--s500)' }}>
          <div>{pipelineRunning ? 'Starting Blender pipeline…' : 'Idle'}</div>
          {outputs.glb && <button onClick={() => downloadAsset(outputs.glb,'preview.glb')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--s600)' }}>Download GLB</button>}
          {outputs.svg && <button onClick={() => downloadAsset(outputs.svg,'dieline_pattern.svg')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--s600)' }}>Download SVG</button>}
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
          {[
            { lbl: 'Void Fill Volume Eliminated', val: mat.void.toFixed(2), unit: 'cubic metres · per unit', trend: '↑ 23% vs standard box', bc: 'var(--g400)' },
            { lbl: 'Container Efficiency Boost', val: `+${mat.eff}%`, unit: 'fleet-wide improvement', trend: '↑ cube utilisation', color: 'var(--g700)', bc: 'var(--g300)' },
            { lbl: 'CO₂ Saved per Shipment', val: mat.co2.toFixed(2), unit: 'kg CO₂ per dispatch', trend: '↑ Li & Wang 2026', bc: '#22d3ee' },
            { lbl: 'Carbon Ripple · Annual', val: mat.ann.toFixed(1), unit: 'tonnes CO₂ · 500/mo fleet', trend: '↑ SDG 12 + 13 aligned', bc: '#a78bfa' },
          ].map((m, i) => (
            <div key={i} className="mc" style={{ borderLeftColor: m.bc }}>
              <div className="mc-lbl">{m.lbl}</div>
              <div className="mc-val" style={{ color: m.color || 'var(--s900)' }}>{m.val}</div>
              <div className="mc-unit">{m.unit}</div>
              <div className="mc-trend">{m.trend}</div>
            </div>
          ))}
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
              {[28,35,41,38,52,67,61].map((v,i) => <div key={i} className={`bar ${i===6?'hl':''}`} style={{ height: `${(v/88)*48}px` }} />)}
            </div>
            <div className="chart-lbs">
              {['J','F','M','A','M','J','J'].map((m,i) => <span key={i}>{m}</span>)}
            </div>
            <div className="pbi-stats">
              {[['6,200','Fleet shipments'],['2.1t','CO₂ avoided'],['A+','ESG grade']].map(([v,l]) => (
                <div key={l} className="pbi-stat"><div className="pbi-sv">{v}</div><div className="pbi-sl">{l}</div></div>
              ))}
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

/* ════════════════════════════════════════════════
   ROOT ROUTER
════════════════════════════════════════════════ */
export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'login' | 'dashboard'
  const [user, setUser] = useState(null);

  const handleLogin = (u) => { setUser(u); setView('dashboard'); };
  const handleLogout = () => { setUser(null); setView('landing'); };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {view === 'landing' && (
        <LandingPage
          onLogin={() => setView('login')}
          onDemo={() => handleLogin({ email: 'demo@morphopack.ai', name: 'Demo User' })}
        />
      )}
      {view === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onBack={() => setView('landing')}
        />
      )}
      {view === 'dashboard' && user && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </>
  );
}
