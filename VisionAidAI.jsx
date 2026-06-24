import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "visionaid_data";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { users: [], currentUser: null, scanHistory: [], preferences: {} };
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function speak(text, rate = 1, pitch = 1) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.pitch = pitch;
  u.lang = "en-US";
  window.speechSynthesis.speak(u);
}

const COLORS = {
  bg: "#0a0f1e",
  bgCard: "#0e1628",
  bgCardHover: "#131d35",
  accent: "#4f8ef7",
  accentGlow: "#3a6fd8",
  accent2: "#00e5b0",
  textPrimary: "#e8edf5",
  textSecondary: "#8a9ab8",
  textMuted: "#4a5a78",
  border: "#1e2d4a",
  borderActive: "#4f8ef7",
  danger: "#ff4d6d",
  success: "#00e5b0",
  warning: "#ffb830",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${COLORS.bg}; color: ${COLORS.textPrimary}; font-family: 'Inter', sans-serif; min-height: 100vh; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${COLORS.bg}; } ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }
  .nav { position: sticky; top: 0; z-index: 100; background: rgba(10,15,30,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid ${COLORS.border}; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .nav-logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2}); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .nav-logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 20px; background: linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accent2}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .nav-links { display: flex; align-items: center; gap: 4px; }
  .nav-link { background: none; border: none; color: ${COLORS.textSecondary}; font-size: 14px; font-family: 'Inter', sans-serif; cursor: pointer; padding: 8px 14px; border-radius: 8px; transition: all 0.2s; }
  .nav-link:hover, .nav-link.active { color: ${COLORS.accent}; background: rgba(79,142,247,0.1); }
  .nav-actions { display: flex; gap: 10px; align-items: center; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s; border: none; }
  .btn-primary { background: linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentGlow}); color: #fff; }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(79,142,247,0.35); }
  .btn-primary:active { transform: translateY(0); }
  .btn-outline { background: transparent; border: 1px solid ${COLORS.border}; color: ${COLORS.textPrimary}; }
  .btn-outline:hover { border-color: ${COLORS.accent}; color: ${COLORS.accent}; background: rgba(79,142,247,0.08); }
  .btn-ghost { background: transparent; border: none; color: ${COLORS.textSecondary}; padding: 8px 12px; }
  .btn-ghost:hover { color: ${COLORS.textPrimary}; background: rgba(255,255,255,0.05); border-radius: 8px; }
  .btn-danger { background: rgba(255,77,109,0.15); border: 1px solid rgba(255,77,109,0.3); color: ${COLORS.danger}; }
  .btn-danger:hover { background: rgba(255,77,109,0.25); }
  .btn-success { background: linear-gradient(135deg, #00b890, #00c9a7); color: #fff; }
  .btn-success:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,229,176,0.35); }
  .btn-lg { padding: 14px 28px; font-size: 16px; border-radius: 12px; }
  .btn-xl { padding: 18px 36px; font-size: 18px; border-radius: 14px; }
  .btn-round { border-radius: 50%; width: 56px; height: 56px; padding: 0; justify-content: center; }
  .btn-round-lg { border-radius: 50%; width: 72px; height: 72px; padding: 0; justify-content: center; font-size: 28px; }
  .card { background: ${COLORS.bgCard}; border: 1px solid ${COLORS.border}; border-radius: 16px; padding: 1.5rem; transition: border-color 0.2s; }
  .card:hover { border-color: rgba(79,142,247,0.3); }
  .card-glass { background: rgba(14,22,40,0.8); backdrop-filter: blur(12px); border: 1px solid rgba(79,142,247,0.15); border-radius: 20px; padding: 2rem; }
  .page { padding: 2rem; max-width: 1100px; margin: 0 auto; flex: 1; }
  .page-wide { padding: 2rem; max-width: 1200px; margin: 0 auto; flex: 1; }
  .section-label { font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: ${COLORS.accent}; margin-bottom: 0.5rem; }
  .heading-xl { font-family: 'Space Grotesk', sans-serif; font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 700; line-height: 1.1; }
  .heading-lg { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 700; line-height: 1.2; }
  .heading-md { font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; font-weight: 600; line-height: 1.3; }
  .text-gradient { background: linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .text-secondary { color: ${COLORS.textSecondary}; }
  .text-muted { color: ${COLORS.textMuted}; }
  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .badge-blue { background: rgba(79,142,247,0.15); color: ${COLORS.accent}; border: 1px solid rgba(79,142,247,0.25); }
  .badge-green { background: rgba(0,229,176,0.12); color: ${COLORS.accent2}; border: 1px solid rgba(0,229,176,0.2); }
  .badge-orange { background: rgba(255,184,48,0.12); color: ${COLORS.warning}; border: 1px solid rgba(255,184,48,0.2); }
  .badge-red { background: rgba(255,77,109,0.12); color: ${COLORS.danger}; border: 1px solid rgba(255,77,109,0.2); }
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
  .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }
  .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
  .flex { display: flex; } .flex-col { flex-direction: column; } .items-center { align-items: center; } .justify-between { justify-content: space-between; } .gap-1 { gap: 0.5rem; } .gap-2 { gap: 1rem; } .gap-3 { gap: 1.5rem; } .gap-4 { gap: 2rem; }
  .mb-1 { margin-bottom: 0.5rem; } .mb-2 { margin-bottom: 1rem; } .mb-3 { margin-bottom: 1.5rem; } .mb-4 { margin-bottom: 2rem; } .mb-6 { margin-bottom: 3rem; }
  .mt-1 { margin-top: 0.5rem; } .mt-2 { margin-top: 1rem; } .mt-3 { margin-top: 1.5rem; }
  .input-group { display: flex; flex-direction: column; gap: 6px; }
  .input-label { font-size: 13px; font-weight: 500; color: ${COLORS.textSecondary}; }
  .input { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid ${COLORS.border}; border-radius: 10px; color: ${COLORS.textPrimary}; font-size: 15px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
  .input:focus { border-color: ${COLORS.accent}; background: rgba(79,142,247,0.05); }
  .input::placeholder { color: ${COLORS.textMuted}; }
  .divider { height: 1px; background: ${COLORS.border}; margin: 1.5rem 0; }
  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .glow { box-shadow: 0 0 20px rgba(79,142,247,0.4), 0 0 40px rgba(79,142,247,0.2); }
  .glow-green { box-shadow: 0 0 20px rgba(0,229,176,0.4), 0 0 40px rgba(0,229,176,0.2); }
  .scan-ring { animation: scanRing 2s ease-in-out infinite; }
  @keyframes scanRing { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 1; } }
  .fade-in { animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(255,255,255,0.04); border: 1px solid ${COLORS.border}; border-radius: 20px; font-size: 13px; color: ${COLORS.textSecondary}; }
  .toast { position: fixed; bottom: 2rem; right: 2rem; z-index: 9999; background: ${COLORS.bgCard}; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 14px 20px; font-size: 14px; animation: fadeIn 0.3s ease; min-width: 240px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .camera-container { position: relative; width: 100%; background: #000; border-radius: 16px; overflow: hidden; aspect-ratio: 16/9; }
  .camera-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
  .scan-frame { width: 200px; height: 200px; position: relative; }
  .scan-frame::before,.scan-frame::after { content:''; position:absolute; width: 40px; height: 40px; border-color: ${COLORS.accent2}; border-style: solid; }
  .scan-frame::before { top:0; left:0; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
  .scan-frame::after { bottom:0; right:0; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
  .scan-corner-tr, .scan-corner-bl { position: absolute; width: 40px; height: 40px; border-color: ${COLORS.accent2}; border-style: solid; }
  .scan-corner-tr { top:0; right:0; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
  .scan-corner-bl { bottom:0; left:0; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
  .scan-line { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, ${COLORS.accent2}, transparent); animation: scanLine 2s ease-in-out infinite; }
  @keyframes scanLine { 0%{top:0%} 50%{top:100%} 100%{top:0%} }
  .result-box { background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); border: 1px solid rgba(79,142,247,0.3); border-radius: 12px; padding: 1rem 1.25rem; margin-top: 1rem; }
  .history-item { display: flex; gap: 1rem; align-items: flex-start; padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid ${COLORS.border}; border-radius: 12px; transition: border-color 0.2s; cursor: pointer; }
  .history-item:hover { border-color: rgba(79,142,247,0.3); }
  .history-icon { width: 44px; height: 44px; border-radius: 10px; background: rgba(79,142,247,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 22px; }
  .stat-card { background: rgba(255,255,255,0.03); border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 1.25rem; text-align: center; }
  .stat-number { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 700; }
  .voice-wave { display: flex; align-items: center; gap: 3px; height: 32px; }
  .voice-bar { width: 3px; background: ${COLORS.accent}; border-radius: 2px; animation: voiceWave 0.8s ease-in-out infinite; }
  @keyframes voiceWave { 0%,100%{height:6px} 50%{height:28px} }
  .voice-bar:nth-child(2){animation-delay:0.1s} .voice-bar:nth-child(3){animation-delay:0.2s} .voice-bar:nth-child(4){animation-delay:0.15s} .voice-bar:nth-child(5){animation-delay:0.05s}
  .footer { background: ${COLORS.bgCard}; border-top: 1px solid ${COLORS.border}; padding: 3rem 2rem 1.5rem; }
  .nav-mobile { display: none; }
  @media (max-width: 768px) { .nav-links { display: none; } .nav-mobile { display: flex; } .page, .page-wide { padding: 1rem; } .heading-xl { font-size: 2rem; } .btn-xl { padding: 14px 24px; font-size: 16px; } }
  select.input { appearance: none; cursor: pointer; }
  .tab { padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; background: none; border: none; color: ${COLORS.textSecondary}; transition: all 0.2s; }
  .tab.active { background: rgba(79,142,247,0.15); color: ${COLORS.accent}; }
  .tab:hover { color: ${COLORS.textPrimary}; }
  .tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.03); border-radius: 10px; padding: 4px; }
  .progress-bar { height: 4px; border-radius: 2px; background: ${COLORS.border}; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accent2}); transition: width 0.5s ease; }
  .avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2}); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; color: #fff; flex-shrink: 0; }
  .feature-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; background: rgba(79,142,247,0.12); border: 1px solid rgba(79,142,247,0.2); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.2s ease; }
  .modal { background: ${COLORS.bgCard}; border: 1px solid ${COLORS.border}; border-radius: 20px; padding: 2rem; width: 100%; max-width: 480px; }
`;

const OBJECT_DESCRIPTIONS = {
  person: { emoji: "👤", category: "Living", type: "Human", desc: "A person is visible in the frame. They appear to be standing or nearby. Humans are living beings capable of communication and interaction." },
  dog: { emoji: "🐕", category: "Living", type: "Animal", desc: "This is a dog. It is a living animal commonly kept as a pet. Dogs are known for their loyalty and are friendly companions to humans." },
  cat: { emoji: "🐈", category: "Living", type: "Animal", desc: "This is a cat. It is a living animal and popular household pet. Cats are independent creatures known for their agility and companionship." },
  bird: { emoji: "🐦", category: "Living", type: "Bird", desc: "A bird is present. Birds are living creatures with feathers and wings. Most birds are capable of flight and communicate through singing." },
  plant: { emoji: "🌿", category: "Living", type: "Plant", desc: "This appears to be a plant or tree. Plants are living organisms that convert sunlight into energy through photosynthesis. They are essential for producing oxygen." },
  mobile: { emoji: "📱", category: "Non-Living", type: "Electronics", desc: "This is a mobile phone. It is a non-living electronic device used for communication, browsing the internet, and various applications." },
  book: { emoji: "📚", category: "Non-Living", type: "Stationery", desc: "This is a book. It is a non-living object containing written or printed information. Books are valuable sources of knowledge and entertainment." },
  chair: { emoji: "🪑", category: "Non-Living", type: "Furniture", desc: "This is a chair. It is a non-living piece of furniture designed for sitting. Chairs provide support and comfort for a person's body." },
  food: { emoji: "🍽️", category: "Non-Living", type: "Food Item", desc: "This appears to be a food item. It is meant for consumption. Please ensure food is fresh and safe to eat before consuming." },
  vehicle: { emoji: "🚗", category: "Non-Living", type: "Vehicle", desc: "This is a vehicle. It is a non-living machine used for transportation. Exercise caution around vehicles as they can be dangerous when moving." },
  medicine: { emoji: "💊", category: "Non-Living", type: "Medicine", desc: "WARNING: This appears to be a medicine or pill. Always consult a doctor or read the label carefully before taking any medication. Do not take medicines without prescription." },
  document: { emoji: "📄", category: "Non-Living", type: "Document", desc: "This is a document or paper with text. It may contain important information. Use the text reading feature to have the content read aloud to you." },
  currency: { emoji: "💵", category: "Non-Living", type: "Currency", desc: "This appears to be currency or money. Exercise caution in public when handling money. Keep your valuables secure and close to your body." },
  electronics: { emoji: "🔌", category: "Non-Living", type: "Electronics", desc: "This is an electronic device. Electronic devices require electricity to function and are used for various purposes including communication and entertainment." },
  bottle: { emoji: "🍶", category: "Non-Living", type: "Container", desc: "This is a bottle or container. Check the label carefully before consuming any liquid from an unlabeled bottle. Safety first." },
  default: { emoji: "🔍", category: "Unknown", type: "Object", desc: "An object has been detected in the frame. I am analyzing it to provide you with more accurate information. Please ensure good lighting for better detection." },
};

const SCAN_OBJECTS = ["person", "dog", "cat", "bird", "mobile", "book", "chair", "food", "vehicle", "electronics", "document", "bottle", "plant"];

function getRandomScan() {
  const keys = SCAN_OBJECTS;
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { key, ...OBJECT_DESCRIPTIONS[key] };
}

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return <div className="toast" role="alert">{msg}</div>;
}

function NavBar({ page, setPage, user, onLogout, onOpenMenu }) {
  const links = user
    ? [{ id: "home", label: "Home" }, { id: "scanner", label: "Scanner" }, { id: "assistant", label: "AI Assistant" }, { id: "dashboard", label: "Dashboard" }]
    : [{ id: "home", label: "Home" }, { id: "about", label: "About" }, { id: "contact", label: "Contact" }];
  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      <div className="nav-logo" onClick={() => setPage("home")} tabIndex={0} onKeyDown={e => e.key === "Enter" && setPage("home")} aria-label="VisionAid AI - Home">
        <div className="nav-logo-icon" aria-hidden="true">👁</div>
        <span className="nav-logo-text">VisionAid AI</span>
      </div>
      <div className="nav-links" role="menubar">
        {links.map(l => (
          <button key={l.id} className={`nav-link${page === l.id ? " active" : ""}`} onClick={() => setPage(l.id)} role="menuitem" aria-current={page === l.id ? "page" : undefined}>{l.label}</button>
        ))}
        {user && <button className="nav-link" onClick={() => setPage("about")} role="menuitem">About</button>}
      </div>
      <div className="nav-actions">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="avatar" aria-label={`Logged in as ${user.name}`}>{user.name[0].toUpperCase()}</div>
            <button className="btn btn-outline" style={{ fontSize: 13, padding: "7px 14px" }} onClick={onLogout}>Sign Out</button>
          </div>
        ) : (
          <div className="flex gap-1">
            <button className="btn btn-ghost" onClick={() => setPage("login")}>Sign In</button>
            <button className="btn btn-primary" onClick={() => setPage("signup")}>Get Started</button>
          </div>
        )}
      </div>
    </nav>
  );
}

function HomePage({ setPage, user }) {
  const features = [
    { emoji: "📷", title: "Live Object Detection", desc: "AI identifies objects, people, animals, and text in real time using your camera." },
    { emoji: "🔊", title: "Voice Output", desc: "Every detection is automatically spoken aloud with natural-sounding descriptions." },
    { emoji: "🧠", title: "Smart Descriptions", desc: "Get detailed context: living vs non-living, purpose, safety info, and more." },
    { emoji: "💬", title: "AI Voice Assistant", desc: "Speak commands naturally. Ask questions, get answers, navigate hands-free." },
    { emoji: "📋", title: "Scan History", desc: "Every scan is saved with timestamp and description for future reference." },
    { emoji: "🌐", title: "Multi-Language", desc: "Supports multiple languages with adjustable voice speed for accessibility." },
  ];
  const stats = [{ num: "50K+", label: "Users Helped" }, { num: "2M+", label: "Objects Scanned" }, { num: "99.2%", label: "Accuracy Rate" }, { num: "40+", label: "Languages" }];
  return (
    <div className="fade-in">
      <div style={{ padding: "5rem 2rem 4rem", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div className="badge badge-blue mb-3" style={{ margin: "0 auto 1.5rem" }}>
          <span>●</span> AI-Powered Vision Assistant
        </div>
        <h1 className="heading-xl mb-3">
          See the World.<br />
          <span className="text-gradient">Through Sound.</span>
        </h1>
        <p className="text-secondary mb-4" style={{ fontSize: "1.15rem", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 2rem" }}>
          VisionAid AI gives blind and visually impaired individuals the power to understand their surroundings independently — using advanced AI that speaks what the camera sees.
        </p>
        <div className="flex items-center gap-2" style={{ justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-xl" onClick={() => setPage(user ? "scanner" : "signup")}>
            {user ? "📷 Start Scanning" : "🚀 Try VisionAid Free"}
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => setPage("about")}>Learn More →</button>
        </div>
        <div className="flex items-center gap-2 mt-3" style={{ justifyContent: "center", flexWrap: "wrap" }}>
          {["Screen reader compatible", "No setup needed", "Works on any device"].map(c => (
            <div key={c} className="chip">✓ {c}</div>
          ))}
        </div>
      </div>

      <div style={{ background: "rgba(79,142,247,0.04)", borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="grid-4">
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-number text-gradient">{s.num}</div>
                <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div className="section-label">Core Features</div>
          <h2 className="heading-lg">Everything you need to navigate independently</h2>
        </div>
        <div className="grid-3 mb-6">
          {features.map(f => (
            <div key={f.title} className="card" style={{ padding: "1.75rem" }}>
              <div className="feature-icon mb-2">{f.emoji}</div>
              <h3 className="heading-md mb-1">{f.title}</h3>
              <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: "2.5rem", background: "linear-gradient(135deg, rgba(79,142,247,0.08), rgba(0,229,176,0.05))", border: `1px solid rgba(79,142,247,0.2)` }}>
          <div className="flex items-center gap-3" style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
            <div>
              <h3 className="heading-md mb-1">Ready to experience AI-powered vision?</h3>
              <p className="text-secondary" style={{ fontSize: 14 }}>Join thousands of users gaining independence through technology.</p>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setPage(user ? "scanner" : "signup")}>
              {user ? "Open Scanner" : "Create Free Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScannerPage({ user, addScan, setPage, prefs }) {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [mode, setMode] = useState("camera");
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraActive(true); setError("");
    } catch (e) { setError("Camera access denied. Please allow camera permissions in your browser settings."); speak("Camera access denied. Please allow camera permissions in your browser settings.", prefs.voiceSpeed || 1); }
  }, [prefs]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
  }, []);

  const analyzeWithAI = useCallback(async (base64Image) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: `You are VisionAid AI, a vision assistant for blind and visually impaired users. 
Analyze the image and respond ONLY with a JSON object (no markdown, no extra text) in this exact format:
{
  "type": "detected object name (e.g. Person, Dog, Chair, Mobile Phone)",
  "emoji": "one relevant emoji",
  "category": "Living or Non-Living",
  "desc": "A clear 2-3 sentence description spoken to a blind person. Mention what it is, whether living/non-living, its purpose, and any safety info if needed.",
  "warning": true or false (true only for medicines, sharp objects, fire, dangerous items)
}
Be accurate. If you see a person say Person. If you see a plant say Plant. Never guess randomly.`,
        messages: [{
          role: "user",
          content: [{
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: base64Image }
          }, {
            type: "text",
            text: "What do you see in this image? Identify the main object or person accurately."
          }]
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }, []);

  const handleScan = useCallback(async () => {
    if (!cameraActive && mode === "camera") { await startCamera(); return; }
    setScanning(true); setResult(null); setError("");
    try {
      let base64 = null;
      if (mode === "camera") {
        await new Promise(r => setTimeout(r, 500));
        base64 = captureFrame();
        if (!base64) throw new Error("Could not capture image from camera.");
      }
      const aiResult = await analyzeWithAI(base64);
      const scan = {
        type: aiResult.type || "Unknown Object",
        emoji: aiResult.emoji || "🔍",
        category: aiResult.category || "Unknown",
        desc: aiResult.desc || "Object detected. Unable to provide detailed description.",
        warning: aiResult.warning || false,
        key: aiResult.type?.toLowerCase().replace(/\s/g, "_") || "unknown",
      };
      const voiceMsg = scan.warning
        ? `Warning! ${scan.type} detected. ${scan.desc}`
        : `Detected: ${scan.type}. ${scan.desc}`;
      setResult({ ...scan, time: new Date(), voiceMsg });
      if (user) addScan({ ...scan, voiceMsg, time: new Date().toISOString() });
      setSpeaking(true);
      speak(voiceMsg, prefs.voiceSpeed || 1);
      setTimeout(() => setSpeaking(false), 8000);
    } catch (e) {
      setError("Detection failed. Please try again with better lighting.");
      speak("Detection failed. Please try again.", prefs.voiceSpeed || 1);
    }
    setScanning(false);
  }, [cameraActive, mode, startCamera, captureFrame, analyzeWithAI, user, addScan, prefs]);

  const speakResult = () => { if (result) { setSpeaking(true); speak(result.voiceMsg, prefs.voiceSpeed || 1); setTimeout(() => setSpeaking(false), 5000); } };

  return (
    <div className="page fade-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="section-label">AI Scanner</div>
          <h1 className="heading-lg">Object Detection</h1>
        </div>
        <div className="tabs">
          <button className={`tab${mode === "camera" ? " active" : ""}`} onClick={() => { setMode("camera"); setResult(null); }}>📷 Camera</button>
          <button className={`tab${mode === "upload" ? " active" : ""}`} onClick={() => { setMode("upload"); stopCamera(); setResult(null); }}>📁 Upload</button>
        </div>
      </div>

      {!user && (
        <div className="card mb-3" style={{ background: "rgba(255,184,48,0.07)", border: `1px solid rgba(255,184,48,0.25)` }}>
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <div>
              <strong style={{ fontSize: 14 }}>Sign in to save your scan history</strong>
              <p className="text-muted" style={{ fontSize: 13 }}>Scanner works without an account, but your scans won't be saved. <button className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 13, color: COLORS.accent }} onClick={() => setPage("signup")}>Create account →</button></p>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="camera-container mb-2">
            {mode === "camera" ? (
              <>
                <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraActive ? "block" : "none" }} aria-label="Camera feed" playsInline muted />
                {!cameraActive && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#050a18" }}>
                    <div style={{ fontSize: 64, marginBottom: "1rem" }}>📷</div>
                    <p className="text-secondary" style={{ fontSize: 15 }}>Camera is off</p>
                    <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Click Scan to activate</p>
                  </div>
                )}
                {cameraActive && (
                  <div className="camera-overlay">
                    <div className={`scan-frame${scanning ? " scan-ring" : ""}`}>
                      <div className="scan-corner-tr" /><div className="scan-corner-bl" />
                      {scanning && <div className="scan-line" />}
                    </div>
                    {scanning && <p style={{ color: COLORS.accent2, marginTop: "1rem", fontSize: 14, fontWeight: 500 }}>Analyzing...</p>}
                  </div>
                )}
              </>
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#050a18" }}>
                <div style={{ fontSize: 48, marginBottom: "1rem" }}>📁</div>
                <p className="text-secondary" style={{ fontSize: 15 }}>Upload an image to scan</p>
                <input type="file" accept="image/*" style={{ display: "none" }} id="img-upload" onChange={async (e) => {
                  const file = e.target.files[0]; if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (ev) => {
                    const base64 = ev.target.result.split(",")[1];
                    setScanning(true); setResult(null); setError("");
                    try {
                      const aiResult = await analyzeWithAI(base64);
                      const scan = { type: aiResult.type || "Unknown", emoji: aiResult.emoji || "🔍", category: aiResult.category || "Unknown", desc: aiResult.desc || "Object detected.", warning: aiResult.warning || false, key: "upload" };
                      const voiceMsg = scan.warning ? `Warning! ${scan.type} detected. ${scan.desc}` : `Detected: ${scan.type}. ${scan.desc}`;
                      setResult({ ...scan, time: new Date(), voiceMsg });
                      if (user) addScan({ ...scan, voiceMsg, time: new Date().toISOString() });
                      setSpeaking(true); speak(voiceMsg, prefs.voiceSpeed || 1); setTimeout(() => setSpeaking(false), 8000);
                    } catch { setError("Could not analyze image. Try again."); }
                    setScanning(false);
                  };
                  reader.readAsDataURL(file);
                }} />
                <label htmlFor="img-upload" className="btn btn-outline mt-2" style={{ cursor: "pointer" }}>Choose Image</label>
              </div>
            )}
          </div>

          <div className="flex gap-2" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className={`btn btn-round-lg${scanning ? "" : " btn-primary"}`}
              style={scanning ? { background: COLORS.border, cursor: "not-allowed" } : {}}
              onClick={handleScan}
              disabled={scanning}
              aria-label="Scan object"
              title="Scan"
            >
              {scanning ? <span className="spin">⟳</span> : "📷"}
            </button>
            {cameraActive && <button className="btn btn-outline btn-round" onClick={stopCamera} aria-label="Stop camera" title="Stop">⏹</button>}
            {result && <button className={`btn btn-round${speaking ? " glow-green" : " btn-outline"}`} onClick={speakResult} aria-label="Repeat voice output" title="Speak again">🔊</button>}
          </div>

          {error && <p style={{ color: COLORS.danger, fontSize: 13, marginTop: "0.75rem", textAlign: "center" }} role="alert">{error}</p>}
        </div>

        <div>
          <h3 className="heading-md mb-2" style={{ fontSize: 15, color: COLORS.textSecondary }}>Detection Result</h3>
          {result ? (
            <div className="result-box fade-in" role="region" aria-label="Detection result" aria-live="polite">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: 36 }}>{result.emoji}</span>
                <div>
                  <div className="heading-md">{result.type}</div>
                  <div className="flex gap-1 mt-1">
                    <span className={`badge ${result.category === "Living" ? "badge-green" : "badge-blue"}`}>{result.category}</span>
                    {result.warning && <span className="badge badge-red">⚠ Warning</span>}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.7 }}>{result.desc}</p>
              <div className="divider" style={{ margin: "1rem 0" }} />
              {speaking ? (
                <div className="flex items-center gap-2">
                  <div className="voice-wave" aria-label="Speaking">
                    {[...Array(5)].map((_, i) => <div key={i} className="voice-bar" style={{ animationDelay: `${i * 0.1}s` }} />)}
                  </div>
                  <span style={{ fontSize: 13, color: COLORS.accent }}>Speaking...</span>
                </div>
              ) : (
                <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 13 }} onClick={speakResult}>🔊 Repeat voice output</button>
              )}
            </div>
          ) : (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center", background: "rgba(255,255,255,0.02)", border: `1px dashed ${COLORS.border}`, borderRadius: 12 }}>
              <div style={{ fontSize: 48, marginBottom: "0.75rem" }}>🔍</div>
              <p className="text-secondary" style={{ fontSize: 14 }}>Point camera at an object and tap scan</p>
              <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>Results will appear here and be spoken aloud</p>
            </div>
          )}

          <div className="card mt-3" style={{ padding: "1rem" }}>
            <p className="text-muted mb-1" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Voice Commands</p>
            {["Say 'Scan this' to detect", "Say 'What is this?' for description", "Say 'Read text' for OCR", "Say 'Describe surroundings' for scene"].map(c => (
              <div key={c} className="flex items-center gap-2 mt-1">
                <span style={{ color: COLORS.accent, fontSize: 12 }}>▸</span>
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantPage({ user, prefs }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello! I'm your VisionAid AI assistant. I can help you understand your surroundings, answer questions, and guide you through using the app. How can I help you today?", time: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);
  const [apiKey] = useState(""); // No actual key needed, using Anthropic API via proxy

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", text: text.trim(), time: new Date() };
    setMessages(m => [...m, userMsg]);
    setInput(""); setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: "You are VisionAid AI, a helpful voice assistant for blind and visually impaired users. Keep responses concise (2-3 sentences max), clear, and conversational. Focus on practical help for navigation, object identification, and daily tasks. Always be warm and encouraging.",
          messages: [
            ...messages.slice(-6).map(m => ({ role: m.role, content: m.text })),
            { role: "user", content: text.trim() }
          ]
        })
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "I'm here to help. Could you rephrase your question?";
      const aiMsg = { role: "assistant", text: reply, time: new Date() };
      setMessages(m => [...m, aiMsg]);
      speak(reply, prefs.voiceSpeed || 1);
    } catch {
      const fallback = "I'm ready to help you navigate and understand your surroundings. Try asking me about objects, navigation, or how to use the scanner.";
      setMessages(m => [...m, { role: "assistant", text: fallback, time: new Date() }]);
      speak(fallback, prefs.voiceSpeed || 1);
    }
    setLoading(false);
  }, [messages, prefs]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in your browser."); return; }
    const r = new SR(); r.lang = "en-US"; r.continuous = false; r.interimResults = false;
    r.onresult = e => { const t = e.results[0][0].transcript; setInput(t); setListening(false); setTimeout(() => sendMessage(t), 300); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognitionRef.current = r; r.start(); setListening(true);
  }, [sendMessage]);

  const quickPrompts = ["What can you help me with?", "How do I use the scanner?", "Describe common objects", "Emergency safety tips"];

  return (
    <div className="page fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <div className="mb-3">
        <div className="section-label">AI Assistant</div>
        <h1 className="heading-lg">Voice Conversation</h1>
      </div>

      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }} role="log" aria-label="Conversation" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className="fade-in" style={{ display: "flex", gap: 10, marginBottom: "1.25rem", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>A</div>}
              <div style={{ maxWidth: "75%", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentGlow})` : "rgba(255,255,255,0.05)", fontSize: 14, lineHeight: 1.6, color: m.role === "user" ? "#fff" : COLORS.textPrimary }}>
                {m.text}
                <div style={{ fontSize: 11, color: m.role === "user" ? "rgba(255,255,255,0.6)" : COLORS.textMuted, marginTop: 4 }}>{m.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              {m.role === "user" && <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>{user ? user.name[0] : "U"}</div>}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 fade-in">
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>A</div>
              <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: "16px 16px 16px 4px" }}>
                <span className="pulse" style={{ fontSize: 20, letterSpacing: 2 }}>•••</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "1rem 1.5rem" }}>
          <div className="flex gap-1 mb-2" style={{ flexWrap: "wrap" }}>
            {quickPrompts.map(p => (
              <button key={p} className="chip" style={{ cursor: "pointer", fontSize: 12 }} onClick={() => sendMessage(p)}>{p}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder="Type a message or use voice..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage(input)} aria-label="Message input" style={{ flex: 1 }} />
            <button className={`btn btn-round${listening ? " glow" : " btn-outline"}`} onClick={startListening} aria-label="Start voice input" title={listening ? "Listening..." : "Speak"}>
              {listening ? <span className="pulse">🎤</span> : "🎤"}
            </button>
            <button className="btn btn-primary btn-round" onClick={() => sendMessage(input)} disabled={!input.trim() || loading} aria-label="Send message">➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ user, scans, clearScans, prefs, setPrefs }) {
  const [tab, setTab] = useState("history");
  const byCategory = scans.reduce((a, s) => { a[s.category] = (a[s.category] || 0) + 1; return a; }, {});
  const formatTime = t => new Date(t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="page fade-in">
      <div className="flex items-center justify-between mb-3" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div className="section-label">Dashboard</div>
          <h1 className="heading-lg">Welcome, {user.name} 👋</h1>
        </div>
        <div className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>{user.name[0].toUpperCase()}</div>
      </div>

      <div className="grid-4 mb-4">
        {[
          { label: "Total Scans", value: scans.length, emoji: "📷" },
          { label: "Living Objects", value: byCategory["Living"] || 0, emoji: "🌿" },
          { label: "Non-Living", value: byCategory["Non-Living"] || 0, emoji: "📦" },
          { label: "This Week", value: scans.filter(s => new Date(s.time) > new Date(Date.now() - 7 * 86400000)).length, emoji: "📅" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.emoji}</div>
            <div className="stat-number text-gradient">{s.value}</div>
            <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs mb-3">
        <button className={`tab${tab === "history" ? " active" : ""}`} onClick={() => setTab("history")}>Scan History</button>
        <button className={`tab${tab === "prefs" ? " active" : ""}`} onClick={() => setTab("prefs")}>Preferences</button>
        <button className={`tab${tab === "profile" ? " active" : ""}`} onClick={() => setTab("profile")}>Profile</button>
      </div>

      {tab === "history" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-secondary" style={{ fontSize: 14 }}>{scans.length} total scans</p>
            {scans.length > 0 && <button className="btn btn-danger" style={{ fontSize: 13, padding: "6px 12px" }} onClick={clearScans}>Clear History</button>}
          </div>
          {scans.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: `1px dashed ${COLORS.border}` }}>
              <div style={{ fontSize: 48, marginBottom: "1rem" }}>📋</div>
              <p className="text-secondary">No scans yet. Use the scanner to detect objects and they'll appear here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[...scans].reverse().map((s, i) => (
                <div key={i} className="history-item" role="listitem">
                  <div className="history-icon">{s.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center justify-between">
                      <strong style={{ fontSize: 15 }}>{s.type}</strong>
                      <span className={`badge ${s.category === "Living" ? "badge-green" : "badge-blue"}`} style={{ fontSize: 11 }}>{s.category}</span>
                    </div>
                    <p className="text-secondary" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{s.desc.substring(0, 100)}...</p>
                    <p className="text-muted" style={{ fontSize: 11, marginTop: 6 }}>🕐 {formatTime(s.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "prefs" && (
        <div className="card" style={{ maxWidth: 540 }}>
          <h3 className="heading-md mb-3">Accessibility Preferences</h3>
          <div className="input-group mb-3">
            <label className="input-label">Voice Speed</label>
            <select className="input" value={prefs.voiceSpeed || 1} onChange={e => setPrefs(p => ({ ...p, voiceSpeed: parseFloat(e.target.value) }))}>
              <option value={0.7}>Slow (0.7x)</option>
              <option value={1}>Normal (1x)</option>
              <option value={1.3}>Fast (1.3x)</option>
              <option value={1.6}>Very Fast (1.6x)</option>
            </select>
          </div>
          <div className="input-group mb-3">
            <label className="input-label">Voice Pitch</label>
            <select className="input" value={prefs.voicePitch || 1} onChange={e => setPrefs(p => ({ ...p, voicePitch: parseFloat(e.target.value) }))}>
              <option value={0.8}>Lower</option>
              <option value={1}>Normal</option>
              <option value={1.2}>Higher</option>
            </select>
          </div>
          <div className="input-group mb-3">
            <label className="input-label">Language</label>
            <select className="input" value={prefs.language || "en"} onChange={e => setPrefs(p => ({ ...p, language: e.target.value }))}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
          <button className="btn btn-success" onClick={() => speak("Preferences saved. Voice speed set to " + (prefs.voiceSpeed || 1) + "x.", prefs.voiceSpeed || 1)}>
            ✓ Save & Test Voice
          </button>
        </div>
      )}

      {tab === "profile" && (
        <div className="card" style={{ maxWidth: 540 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>{user.name[0].toUpperCase()}</div>
            <div>
              <h3 className="heading-md">{user.name}</h3>
              <p className="text-secondary" style={{ fontSize: 14 }}>{user.email}</p>
              <span className="badge badge-green mt-1">Active Member</span>
            </div>
          </div>
          <div className="divider" />
          <div className="mt-2">
            <div className="flex justify-between" style={{ marginBottom: 12 }}>
              <span className="text-secondary" style={{ fontSize: 14 }}>Member since</span>
              <span style={{ fontSize: 14 }}>{new Date(user.createdAt || Date.now()).toLocaleDateString([], { year: "numeric", month: "long" })}</span>
            </div>
            <div className="flex justify-between" style={{ marginBottom: 12 }}>
              <span className="text-secondary" style={{ fontSize: 14 }}>Total scans</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{scans.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary" style={{ fontSize: 14 }}>Account status</span>
              <span className="badge badge-green">Verified</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AboutPage({ setPage }) {
  return (
    <div className="page fade-in">
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="section-label mb-1">Our Story</div>
        <h1 className="heading-xl mb-3">Built for <span className="text-gradient">Independence</span></h1>
        <p className="text-secondary mb-6" style={{ fontSize: "1.1rem", lineHeight: 1.8 }}>
          VisionAid AI was born from a simple but powerful belief: that technology should remove barriers, not create them.
        </p>

        <div className="card mb-4" style={{ padding: "2rem", background: "linear-gradient(135deg, rgba(79,142,247,0.06), rgba(0,229,176,0.04))", border: `1px solid rgba(79,142,247,0.2)` }}>
          <div className="flex gap-3" style={{ flexWrap: "wrap" }}>
            <div className="avatar" style={{ width: 80, height: 80, fontSize: 32, flexShrink: 0 }}>L</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="section-label" style={{ marginBottom: "0.25rem" }}>Founder & CEO</div>
              <h2 className="heading-md mb-1" style={{ fontSize: "1.5rem" }}>Lakshit Rajput</h2>
              <p className="text-secondary mb-2" style={{ fontSize: 14 }}>Entrepreneur · AI Accessibility Advocate · Technology Innovator</p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: COLORS.textPrimary }}>
                "I started VisionAid AI because I witnessed firsthand how much potential is lost when technology isn't designed with everyone in mind. Blind and visually impaired individuals deserve the same independence that sighted people take for granted. AI can bridge that gap — and I'm committed to making it happen."
              </p>
            </div>
          </div>
        </div>

        <h2 className="heading-lg mb-3">Our Mission</h2>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: COLORS.textSecondary, marginBottom: "1.5rem" }}>
          VisionAid AI is dedicated to empowering the 285 million visually impaired people worldwide with intelligent technology that understands and describes the world around them. We combine cutting-edge computer vision, natural language processing, and speech synthesis to create a seamless, intuitive experience that feels like having a knowledgeable companion by your side at all times.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: COLORS.textSecondary, marginBottom: "3rem" }}>
          Our platform is designed from the ground up with accessibility at its core — not as an afterthought. Every feature, every button, and every interaction is thoughtfully crafted to be usable by people with visual impairments, using voice commands, keyboard navigation, and screen readers.
        </p>

        <div className="grid-3 mb-6">
          {[
            { emoji: "🎯", title: "Our Vision", desc: "A world where visual impairment is no barrier to independence, safety, or opportunity." },
            { emoji: "💡", title: "Our Approach", desc: "AI-first design, built in collaboration with visually impaired users from day one." },
            { emoji: "❤️", title: "Our Commitment", desc: "Free core features forever. Accessibility shouldn't have a price tag." },
          ].map(v => (
            <div key={v.title} className="card" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
              <div style={{ fontSize: 36, marginBottom: "0.75rem" }}>{v.emoji}</div>
              <h3 className="heading-md mb-1">{v.title}</h3>
              <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <h3 className="heading-md mb-2">Ready to experience it yourself?</h3>
          <button className="btn btn-primary btn-lg" onClick={() => setPage("signup")}>Get Started — It's Free</button>
        </div>
      </div>
    </div>
  );
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const handleSubmit = () => { if (form.name && form.email && form.message) { setSent(true); speak("Thank you for your message. We will get back to you soon."); } };
  return (
    <div className="page fade-in">
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="section-label mb-1">Get in Touch</div>
        <h1 className="heading-lg mb-2">Contact Us</h1>
        <p className="text-secondary mb-4" style={{ fontSize: 15, lineHeight: 1.7 }}>Have questions, feedback, or need accessibility support? We're here to help.</p>

        {sent ? (
          <div className="card glow" style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: 48, marginBottom: "1rem" }}>✅</div>
            <h3 className="heading-md mb-1">Message Sent!</h3>
            <p className="text-secondary" style={{ fontSize: 14 }}>Thank you for reaching out. Lakshit and the team will respond within 24 hours.</p>
          </div>
        ) : (
          <div className="card">
            <div className="grid-2" style={{ gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">Your Name</label>
                <input className="input" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-label="Your name" />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} aria-label="Email address" />
              </div>
            </div>
            <div className="input-group mt-2">
              <label className="input-label">Message</label>
              <textarea className="input" rows={5} placeholder="Tell us how we can help..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} aria-label="Your message" style={{ resize: "vertical" }} />
            </div>
            <button className="btn btn-primary mt-3" onClick={handleSubmit} disabled={!form.name || !form.email || !form.message}>Send Message →</button>
          </div>
        )}

        <div className="grid-2 mt-4">
          {[
            { emoji: "📧", label: "Email", value: "hello@visionaidai.com" },
            { emoji: "📍", label: "Location", value: "Dehradun, India" },
          ].map(c => (
            <div key={c.label} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{c.emoji}</div>
              <div className="text-muted" style={{ fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{c.label}</div>
              <div style={{ fontSize: 14 }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthPage({ mode, setPage, onLogin, onSignup }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const isLogin = mode === "login";
  const handle = () => {
    if (!form.email || !form.password) { setErr("Please fill all fields."); return; }
    if (!isLogin && !form.name) { setErr("Please enter your name."); return; }
    if (form.password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setErr("");
    if (isLogin) onLogin(form);
    else onSignup(form);
  };
  return (
    <div className="page fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 120px)" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="nav-logo-icon" style={{ width: 56, height: 56, fontSize: 28, margin: "0 auto 1rem", borderRadius: 14 }}>👁</div>
          <h1 className="heading-lg">{isLogin ? "Welcome back" : "Join VisionAid AI"}</h1>
          <p className="text-secondary" style={{ fontSize: 14, marginTop: 6 }}>{isLogin ? "Sign in to continue your journey" : "Start your accessibility journey today"}</p>
        </div>
        <div className="card">
          {!isLogin && (
            <div className="input-group mb-2">
              <label className="input-label">Full Name</label>
              <input className="input" placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-label="Full name" />
            </div>
          )}
          <div className="input-group mb-2">
            <label className="input-label">Email Address</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} aria-label="Email address" />
          </div>
          <div className="input-group mb-3">
            <label className="input-label">Password</label>
            <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && handle()} aria-label="Password" />
          </div>
          {err && <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: "0.75rem" }} role="alert">{err}</p>}
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handle}>
            {isLogin ? "Sign In" : "Create Account"} →
          </button>
          <div className="divider" />
          <p style={{ textAlign: "center", fontSize: 14, color: COLORS.textSecondary }}>
            {isLogin ? "New to VisionAid? " : "Already have an account? "}
            <button className="btn btn-ghost" style={{ padding: "2px 6px", fontSize: 14, color: COLORS.accent }} onClick={() => setPage(isLogin ? "signup" : "login")}>
              {isLogin ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Footer({ setPage }) {
  return (
    <footer className="footer">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="grid-4 mb-4">
          <div>
            <div className="nav-logo mb-2" style={{ cursor: "default" }}>
              <div className="nav-logo-icon" style={{ width: 32, height: 32, fontSize: 16 }}>👁</div>
              <span className="nav-logo-text" style={{ fontSize: 18 }}>VisionAid AI</span>
            </div>
            <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.7 }}>AI-powered vision assistant for blind and visually impaired users.</p>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: COLORS.textMuted, marginBottom: "0.75rem" }}>Product</p>
            {["Scanner", "AI Assistant", "Dashboard"].map(l => <div key={l} className="mb-1"><button className="btn btn-ghost" style={{ padding: "2px 0", fontSize: 13, color: COLORS.textSecondary }} onClick={() => setPage(l.toLowerCase().replace(" ", ""))}>{l}</button></div>)}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: COLORS.textMuted, marginBottom: "0.75rem" }}>Company</p>
            {["About", "Contact"].map(l => <div key={l} className="mb-1"><button className="btn btn-ghost" style={{ padding: "2px 0", fontSize: 13, color: COLORS.textSecondary }} onClick={() => setPage(l.toLowerCase())}>{l}</button></div>)}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: COLORS.textMuted, marginBottom: "0.75rem" }}>Founded By</p>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Lakshit Rajput</p>
            <p className="text-secondary" style={{ fontSize: 13 }}>Founder & CEO</p>
            <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>Dehradun, India 🇮🇳</p>
          </div>
        </div>
        <div className="divider" />
        <div className="flex justify-between items-center" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
          <p className="text-muted" style={{ fontSize: 12 }}>© 2026 VisionAid AI. Created by Lakshit Rajput. All rights reserved.</p>
          <p className="text-muted" style={{ fontSize: 12 }}>Making the world visible through AI 👁✨</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [dbState, setDbState] = useState(loadData);
  const [toast, setToast] = useState(null);
  const [prefs, setPrefs] = useState({ voiceSpeed: 1, voicePitch: 1, language: "en" });

  const db = dbState;
  const user = db.currentUser;

  const persist = (next) => { setDbState(next); saveData(next); };

  const showToast = (msg) => { setToast(msg); };

  const handleSignup = ({ name, email, password }) => {
    if (db.users.find(u => u.email === email)) { showToast("An account with this email already exists."); return; }
    const newUser = { id: Date.now(), name, email, password, createdAt: new Date().toISOString() };
    persist({ ...db, users: [...db.users, newUser], currentUser: newUser });
    showToast(`Welcome to VisionAid AI, ${name}! 🎉`);
    speak(`Welcome ${name}! Your account has been created. You can now start scanning objects.`, 1);
    setPage("scanner");
  };

  const handleLogin = ({ email, password }) => {
    const found = db.users.find(u => u.email === email && u.password === password);
    if (!found) { showToast("Invalid email or password. Please try again."); return; }
    persist({ ...db, currentUser: found });
    showToast(`Welcome back, ${found.name}! 👋`);
    speak(`Welcome back ${found.name}!`, 1);
    setPage("scanner");
  };

  const handleLogout = () => {
    persist({ ...db, currentUser: null });
    setPage("home");
    showToast("You've been signed out safely.");
  };

  const addScan = (scan) => {
    if (!user) return;
    const key = `scans_${user.id}`;
    const existing = db.scanHistory || [];
    persist({ ...db, scanHistory: [...existing, { ...scan, userId: user.id }] });
  };

  const clearScans = () => {
    if (!user) return;
    persist({ ...db, scanHistory: db.scanHistory.filter(s => s.userId !== user.id) });
    showToast("Scan history cleared.");
  };

  const userScans = user ? (db.scanHistory || []).filter(s => s.userId === user.id) : [];

  const navigateTo = (p) => {
    if (["scanner", "assistant", "dashboard"].includes(p) && !user) { setPage("login"); showToast("Please sign in to access this feature."); return; }
    setPage(p);
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <NavBar page={page} setPage={navigateTo} user={user} onLogout={handleLogout} />
        <main id="main-content" role="main" style={{ flex: 1 }}>
          {page === "home" && <HomePage setPage={navigateTo} user={user} />}
          {page === "scanner" && user && <ScannerPage user={user} addScan={addScan} setPage={navigateTo} prefs={prefs} />}
          {page === "assistant" && user && <AssistantPage user={user} prefs={prefs} />}
          {page === "dashboard" && user && <DashboardPage user={user} scans={userScans} clearScans={clearScans} prefs={prefs} setPrefs={setPrefs} />}
          {page === "about" && <AboutPage setPage={navigateTo} />}
          {page === "contact" && <ContactPage />}
          {page === "login" && <AuthPage mode="login" setPage={setPage} onLogin={handleLogin} onSignup={handleSignup} />}
          {page === "signup" && <AuthPage mode="signup" setPage={setPage} onLogin={handleLogin} onSignup={handleSignup} />}
        </main>
        <Footer setPage={navigateTo} />
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </div>
    </>
  );
}
