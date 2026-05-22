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

export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#12122a",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:40,height:40,borderRadius:"50%",border:"3px solid rgba(200,74,255,0.2)",borderTopColor:"#c84aff",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return <LoginScreen onLogin={setUser}/>;

  return <Teamchemie user={user} onLogout={async()=>{await signOut(auth);setUser(null);}}/>;
}
