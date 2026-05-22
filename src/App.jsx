import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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

function SplashScreen() {
  return (
    <div style={{
      minHeight:"100vh", background:"#12122a",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:24,
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .tc-logo { animation: fadeIn 0.7s ease forwards; }
        .tc-sub  { animation: fadeIn 0.7s ease 0.3s both; }
        .tc-dot  { animation: pulse 1.4s ease infinite; }
        .tc-dot2 { animation: pulse 1.4s ease 0.2s infinite; }
        .tc-dot3 { animation: pulse 1.4s ease 0.4s infinite; }
      `}</style>

      {/* Logo */}
      <div className="tc-logo" style={{textAlign:"center"}}>
        {/* Icon */}
        <div style={{
          width:72, height:72, borderRadius:20,
          background:"linear-gradient(135deg,#1a1a35 0%,#2a1a4a 100%)",
          border:"2px solid rgba(200,74,255,0.5)",
          display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 16px",
          boxShadow:"0 0 30px rgba(200,74,255,0.3)",
        }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            {/* Fußballfeld-Icon */}
            <rect x="4" y="6" width="32" height="28" rx="3" fill="none" stroke="#c84aff" strokeWidth="2"/>
            <line x1="20" y1="6" x2="20" y2="34" stroke="#c84aff" strokeWidth="1.5" opacity="0.6"/>
            <circle cx="20" cy="20" r="5" fill="none" stroke="#c84aff" strokeWidth="1.5" opacity="0.6"/>
            <rect x="4" y="14" width="7" height="12" rx="1" fill="none" stroke="#c84aff" strokeWidth="1.5" opacity="0.8"/>
            <rect x="29" y="14" width="7" height="12" rx="1" fill="none" stroke="#c84aff" strokeWidth="1.5" opacity="0.8"/>
            <circle cx="20" cy="20" r="1.5" fill="#c84aff"/>
          </svg>
        </div>

        {/* Wortmarke */}
        <div style={{fontSize:32, fontWeight:900, letterSpacing:-1, lineHeight:1}}>
          <span style={{color:"#ffffff"}}>Team</span>
          <span style={{color:"#c84aff"}}>chemie</span>
        </div>
      </div>

      {/* Tagline */}
      <div className="tc-sub" style={{color:"rgba(120,120,170,0.8)", fontSize:13, letterSpacing:"0.5px"}}>
        Taktik & Teamkommunikation
      </div>

      {/* Ladeindikator */}
      <div style={{display:"flex", gap:6, marginTop:8}}>
        <div className="tc-dot"  style={{width:6,height:6,borderRadius:3,background:"#c84aff"}}/>
        <div className="tc-dot2" style={{width:6,height:6,borderRadius:3,background:"#c84aff"}}/>
        <div className="tc-dot3" style={{width:6,height:6,borderRadius:3,background:"#c84aff"}}/>
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
