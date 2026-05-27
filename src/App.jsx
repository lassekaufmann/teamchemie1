import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, enableIndexedDbPersistence } from "firebase/firestore";
import LoginScreen from "./LoginScreen.jsx";
import Teamchemie from "./Teamchemie.jsx";

const firebaseConfig = {
  apiKey: "AIzaSyDT42Cb4ObMr99cuW4S69NO5bUMCDSYtUw",
  authDomain: "teamchemie.firebaseapp.com",
  projectId: "teamchemie",
  storageBucket: "teamchemie.firebasestorage.app",
  messagingSenderId: "1082960740944",
  appId: "1:1082960740944:web:aea2544716d8a914a24755"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Offline-Support: Daten werden lokal gecacht
enableIndexedDbPersistence(db).catch(err=>{
  if (err.code==="failed-precondition") console.warn("Offline-Cache: mehrere Tabs offen");
  else if (err.code==="unimplemented") console.warn("Browser unterstützt Offline-Cache nicht");
});

function SplashScreen() {
  return (
    <div style={{
      minHeight:"100vh", background:"#12122a",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:20,
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spinOrbit { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .tc-logo { animation: fadeIn 0.7s ease forwards; }
        .tc-sub  { animation: fadeIn 0.7s ease 0.4s both; }
        .tc-dot  { animation: pulse 1.4s ease infinite; }
        .tc-dot2 { animation: pulse 1.4s ease 0.2s infinite; }
        .tc-dot3 { animation: pulse 1.4s ease 0.4s infinite; }
      `}</style>

      {/* Logo Icon */}
      <div className="tc-logo">
        <svg width="140" height="140" viewBox="230 16 220 220">
          <rect x="230" y="16" width="220" height="220" rx="28" fill="#1a1a35" stroke="rgba(200,74,255,0.5)" strokeWidth="2"/>
          {/* Außenlinien */}
          <rect x="252" y="36" width="176" height="180" rx="2" fill="none" stroke="rgba(200,74,255,0.55)" strokeWidth="1.5"/>
          {/* Mittellinie */}
          <line x1="252" y1="126" x2="428" y2="126" stroke="rgba(200,74,255,0.55)" strokeWidth="1.5"/>
          {/* Mittelkreis */}
          <circle cx="340" cy="126" r="22" fill="none" stroke="rgba(200,74,255,0.45)" strokeWidth="1.2"/>
          <circle cx="340" cy="126" r="2" fill="rgba(200,74,255,0.7)"/>
          {/* Strafraum oben */}
          <rect x="288" y="36" width="104" height="33" rx="1.5" fill="none" stroke="rgba(200,74,255,0.45)" strokeWidth="1.2"/>
          <rect x="317" y="36" width="46" height="11" rx="1" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="1"/>
          <rect x="326" y="29" width="28" height="8" rx="1" fill="none" stroke="rgba(200,74,255,0.65)" strokeWidth="1.5"/>
          <circle cx="340" cy="58" r="1.8" fill="rgba(200,74,255,0.6)"/>
          <path d="M322 69 A18 18 0 0 0 358 69" fill="none" stroke="rgba(200,74,255,0.4)" strokeWidth="1"/>
          {/* Strafraum unten */}
          <rect x="288" y="183" width="104" height="33" rx="1.5" fill="none" stroke="rgba(200,74,255,0.45)" strokeWidth="1.2"/>
          <rect x="317" y="205" width="46" height="11" rx="1" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="1"/>
          <rect x="326" y="215" width="28" height="8" rx="1" fill="none" stroke="rgba(200,74,255,0.65)" strokeWidth="1.5"/>
          <circle cx="340" cy="194" r="1.8" fill="rgba(200,74,255,0.6)"/>
          <path d="M322 183 A18 18 0 0 1 358 183" fill="none" stroke="rgba(200,74,255,0.4)" strokeWidth="1"/>
          {/* Eckbögen */}
          <path d="M252 36 A5 5 0 0 1 257 41" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="1"/>
          <path d="M428 36 A5 5 0 0 0 423 41" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="1"/>
          <path d="M252 216 A5 5 0 0 0 257 211" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="1"/>
          <path d="M428 216 A5 5 0 0 1 423 211" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="1"/>
          {/* Atom Orbits */}
          <ellipse cx="340" cy="126" rx="54" ry="21" fill="none" stroke="#c84aff" strokeWidth="1.7" opacity="0.85"/>
          <ellipse cx="340" cy="126" rx="54" ry="21" fill="none" stroke="#c84aff" strokeWidth="1.3" opacity="0.5" transform="rotate(60,340,126)"/>
          <ellipse cx="340" cy="126" rx="54" ry="21" fill="none" stroke="#c84aff" strokeWidth="1" opacity="0.3" transform="rotate(120,340,126)"/>
          {/* Kern + Elektronen */}
          <circle cx="340" cy="126" r="6" fill="#c84aff"/>
          <circle cx="394" cy="126" r="3.5" fill="#c84aff" opacity="0.9"/>
          <circle cx="313" cy="111" r="3" fill="#c84aff" opacity="0.7"/>
          <circle cx="360" cy="143" r="3" fill="#c84aff" opacity="0.6"/>
        </svg>
      </div>

      {/* Wortmarke */}
      <div className="tc-sub" style={{textAlign:"center"}}>
        <div style={{fontSize:34,fontWeight:900,letterSpacing:-1,lineHeight:1}}>
          <span style={{color:"#ffffff"}}>Team</span>
          <span style={{color:"#c84aff"}}>chemie</span>
        </div>
        <div style={{color:"rgba(120,120,170,0.8)",fontSize:13,marginTop:8,letterSpacing:"0.3px"}}>
          Die Mannschaft optimal aufstellen
        </div>
      </div>

      {/* Ladeindikator */}
      <div style={{display:"flex",gap:7,marginTop:4}}>
        <div className="tc-dot"  style={{width:7,height:7,borderRadius:4,background:"#c84aff"}}/>
        <div className="tc-dot2" style={{width:7,height:7,borderRadius:4,background:"#c84aff"}}/>
        <div className="tc-dot3" style={{width:7,height:7,borderRadius:4,background:"#c84aff"}}/>
      </div>
    </div>
  );
}

export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Splash mindestens 1.8s zeigen
    const t = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setUser({ uid: firebaseUser.uid, ...snap.data() });
          } else { setUser(null); }
        } catch { setUser(null); }
      } else { setUser(null); }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading || showSplash) return <SplashScreen/>;
  if (!user) return <LoginScreen onLogin={setUser}/>;
  return <Teamchemie user={user} onLogout={async()=>{await signOut(auth);setUser(null);}}/>;
}
