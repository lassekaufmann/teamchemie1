import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./App.jsx";

const C = {
  bg:"#12122a",surface:"#1a1a35",border:"rgba(255,255,255,0.09)",
  accent:"#c84aff",accentDim:"rgba(200,74,255,0.15)",accentBorder:"rgba(200,74,255,0.4)",
  white:"#ffffff",gray:"#7878aa",grayDark:"#44446a",error:"#cc3355",
};

function generateTeamCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
}

export default function LoginScreen({ onLogin }) {
  const [screen,   setScreen]   = useState("welcome");
  const [role,     setRole]     = useState("trainer");
  const [loading,  setLoading]  = useState(false);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [number,   setNumber]   = useState("");
  const [errors,   setErrors]   = useState({});
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const inputStyle = (err) => ({
    width:"100%",background:C.surface,border:`1px solid ${err?C.error:C.border}`,
    borderRadius:10,color:C.white,padding:"11px 14px",fontSize:14,
    fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:4,
  });

  async function handleRegister() {
    const e = {};
    if (!email.includes("@")) e.email = "Ungültige E-Mail";
    if (password.length < 6)  e.password = "Mindestens 6 Zeichen";
    if (!name.trim())         e.name = "Name erforderlich";
    if (role==="trainer" && !teamName.trim()) e.teamName = "Teamname erforderlich";
    if (role==="player"  && !teamCode.trim()) e.teamCode = "Team-Code erforderlich";
    setErrors(e);
    if (Object.keys(e).length>0) return;

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid  = cred.user.uid;

      if (role==="trainer") {
        const code = generateTeamCode();
        await setDoc(doc(db,"teams",code), {name:teamName,code,trainerId:uid,createdAt:new Date().toISOString(),saison:"2025/26"});
        await setDoc(doc(db,"users",uid),  {name,email,role:"trainer",teamCode:code,teamName,createdAt:new Date().toISOString()});
        alert(`Team erstellt!\n\nDein Team-Code: ${code}\n\nTeile ihn mit deinen Spielern!`);
        onLogin({uid,name,role:"trainer",teamCode:code,teamName});
      } else {
        const snap = await getDoc(doc(db,"teams",teamCode.toUpperCase()));
        if (!snap.exists()) { setErrors({teamCode:"Team-Code nicht gefunden"}); setLoading(false); return; }
        const team = snap.data();
        await setDoc(doc(db,"users",uid), {name,email,role:"player",teamCode:teamCode.toUpperCase(),teamName:team.name,number:parseInt(number)||0,fitness:85,ruhe:false,wishRole:"",strengths:[],strongFoot:"",partners:[],note:"",createdAt:new Date().toISOString()});
        await setDoc(doc(db,"teams",teamCode.toUpperCase(),"players",uid), {uid,name,number:parseInt(number)||0,joinedAt:new Date().toISOString()});
        onLogin({uid,name,role:"player",teamCode:teamCode.toUpperCase(),teamName:team.name});
      }
    } catch(err) {
      if (err.code==="auth/email-already-in-use") setErrors({email:"E-Mail bereits registriert"});
      else alert(err.message);
    }
    setLoading(false);
  }

  async function handleLogin() {
    const e = {};
    if (!email.includes("@")) e.email = "Ungültige E-Mail";
    if (password.length < 6)  e.password = "Mindestens 6 Zeichen";
    setErrors(e);
    if (Object.keys(e).length>0) return;
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db,"users",cred.user.uid));
      if (!snap.exists()) throw new Error("Profil nicht gefunden");
      onLogin({uid:cred.user.uid,...snap.data()});
    } catch(err) {
      if (err.code==="auth/invalid-credential") setErrors({password:"E-Mail oder Passwort falsch"});
      else alert(err.message);
    }
    setLoading(false);
  }

  const s = {minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",fontFamily:"'Segoe UI',system-ui,sans-serif"};
  const wrap = {width:"100%",maxWidth:420};

  // Privacy Modal - check first
  if (showPrivacyModal) {
    return (
      <div style={{...s,justifyContent:"center"}}>
        <div style={{...wrap,maxHeight:"85vh",overflowY:"auto",background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{color:C.white,fontSize:18,fontWeight:700}}>Datenschutzerklärung</div>
            <button onClick={()=>setShowPrivacyModal(false)} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:20}}>✕</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14,fontSize:13,color:C.gray,lineHeight:1.6}}>
            <div>
              <div style={{color:C.white,fontWeight:700,marginBottom:6}}>Verantwortlicher</div>
              <div>Lasse Kaufmann, Frankfurt am Main<br/>lassekaufmann01@gmail.com</div>
            </div>
            <div>
              <div style={{color:C.white,fontWeight:700,marginBottom:6}}>Gespeicherte Daten</div>
              <div>• Name und E-Mail-Adresse<br/>• Rolle (Trainer/Spieler)<br/>• Fitnessdaten und Spieler-Profile<br/>• Taktikdaten und Aufstellungen<br/>• Chat-Nachrichten zwischen Trainer und Spieler</div>
            </div>
            <div>
              <div style={{color:C.white,fontWeight:700,marginBottom:6}}>Zweck der Speicherung</div>
              <div>Verwaltung und Optimierung von Mannschaftstraining und Spielerchemie</div>
            </div>
            <div>
              <div style={{color:C.white,fontWeight:700,marginBottom:6}}>Speicherort</div>
              <div>Google Firebase (Cloud Firestore und Authentication)</div>
            </div>
            <div>
              <div style={{color:C.white,fontWeight:700,marginBottom:6}}>Weitergabe an Dritte</div>
              <div>Keine Weitergabe an Dritte. Keine Verwendung für Werbezwecke.</div>
            </div>
            <div>
              <div style={{color:C.white,fontWeight:700,marginBottom:6}}>Datenlöschung</div>
              <div>Du kannst dein Konto und alle deine Daten jederzeit löschen. Kontaktiere dafür: lassekaufmann01@gmail.com</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:24}}>
            <button onClick={()=>setShowPrivacyModal(false)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.gray,padding:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>
              Abbrechen
            </button>
            <button onClick={()=>{setPrivacyAccepted(true);setShowPrivacyModal(false);}} style={{flex:1,background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:8,color:C.accent,padding:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>
              Akzeptieren & Fortfahren
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen==="welcome") return (
    <div style={s}>
      <div style={wrap}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,fontWeight:900,letterSpacing:-1}}>
            <span style={{color:C.white}}>Team</span><span style={{color:C.accent}}>chemie</span>
          </div>
          <div style={{color:C.gray,fontSize:14,marginTop:8}}>Taktik & Kommunikation für deine Mannschaft</div>
        </div>
        {[["Taktikboard","Positionen & Formationen visuell planen"],["Direktchat","1:1 Kommunikation Trainer & Spieler"],["Teamchemie","Wunschpositionen & Spieler-Harmonie"],["Standards","Elfmeter, Freistoss & Eckball-Schützen"]].map(([t,d])=>(
          <div key={t} style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12,background:C.surface,borderRadius:12,padding:"10px 14px",border:`1px solid ${C.border}`}}>
            <div style={{width:6,height:6,borderRadius:3,background:C.accent,marginTop:4,flexShrink:0}}/>
            <div><div style={{color:C.white,fontWeight:600,fontSize:13}}>{t}</div><div style={{color:C.gray,fontSize:11,marginTop:2}}>{d}</div></div>
          </div>
        ))}
        <button onClick={()=>setScreen("register")} style={{width:"100%",background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:12,color:C.accent,padding:14,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>
          Kostenlos registrieren
        </button>
        <button onClick={()=>setScreen("login")} style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:12,color:C.gray,padding:14,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:10}}>
          Bereits ein Konto? Anmelden
        </button>
      </div>
    </div>
  );

  if (screen==="login") return (
    <div style={s}>
      <div style={wrap}>
        <button onClick={()=>setScreen("welcome")} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,marginBottom:20,padding:0}}>← Zurück</button>
        <div style={{color:C.white,fontSize:26,fontWeight:800,marginBottom:6}}>Willkommen zurück</div>
        <div style={{color:C.gray,fontSize:14,marginBottom:24}}>Melde dich bei deinem Team an</div>
        <form onSubmit={e=>{e.preventDefault();handleLogin();}}>
          <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>E-Mail</div>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="deine@email.de" type="email" name="email" autoComplete="email" style={inputStyle(errors.email)}/>
          {errors.email&&<div style={{color:C.error,fontSize:11,marginBottom:8}}>{errors.email}</div>}
          <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6,marginTop:8}}>Passwort</div>
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type="password" name="password" autoComplete="current-password" style={inputStyle(errors.password)}/>
          {errors.password&&<div style={{color:C.error,fontSize:11,marginBottom:8}}>{errors.password}</div>}
          <button type="submit" disabled={loading} style={{width:"100%",background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:12,color:C.accent,padding:14,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:16,opacity:loading?0.6:1}}>
            {loading?"Laden...":"Anmelden"}
          </button>
        </form>
        <div style={{textAlign:"center",marginTop:16,color:C.gray,fontSize:13}}>
          Noch kein Konto? <span onClick={()=>setScreen("register")} style={{color:C.accent,cursor:"pointer"}}>Registrieren</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{...s,justifyContent:"flex-start",paddingTop:52}}>
      <div style={wrap}>
        <button onClick={()=>setScreen("welcome")} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,marginBottom:20,padding:0}}>← Zurück</button>
        <div style={{color:C.white,fontSize:26,fontWeight:800,marginBottom:6}}>Konto erstellen</div>
        <div style={{color:C.gray,fontSize:14,marginBottom:20}}>Wähle deine Rolle im Team</div>
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          {[["trainer","Trainer","Taktik & Verwaltung"],["player","Spieler","Position & Chat"]].map(([k,l,sub])=>(
            <div key={k} onClick={()=>setRole(k)} style={{flex:1,background:role===k?C.accentDim:C.surface,border:`1px solid ${role===k?C.accentBorder:C.border}`,borderRadius:12,padding:14,cursor:"pointer",textAlign:"center"}}>
              <div style={{color:role===k?C.accent:C.white,fontWeight:700,fontSize:14}}>{l}</div>
              <div style={{color:C.gray,fontSize:10,marginTop:4}}>{sub}</div>
            </div>
          ))}
        </div>
        <form onSubmit={e=>{e.preventDefault();if(privacyAccepted)handleRegister();}}>
        {[["Name","text",name,setName,errors.name,"name"],["E-Mail","email",email,setEmail,errors.email,"email"],["Passwort","password",password,setPassword,errors.password,"new-password"]].map(([label,type,val,set,err,autoComplete])=>(
          <div key={label}>
            <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{label}</div>
            <input value={val} onChange={e=>set(e.target.value)} type={type} name={autoComplete} autoComplete={autoComplete} placeholder={label} style={inputStyle(err)}/>
            {err&&<div style={{color:C.error,fontSize:11,marginBottom:8}}>{err}</div>}
          </div>
        ))}
        {role==="trainer"&&<>
          <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Teamname</div>
          <input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="z.B. FC Beispiel" style={inputStyle(errors.teamName)}/>
          {errors.teamName&&<div style={{color:C.error,fontSize:11,marginBottom:8}}>{errors.teamName}</div>}
        </>}
        {role==="player"&&<>
          <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Team-Code</div>
          <input value={teamCode} onChange={e=>setTeamCode(e.target.value)} placeholder="z.B. AB3F7K" style={inputStyle(errors.teamCode)}/>
          {errors.teamCode&&<div style={{color:C.error,fontSize:11,marginBottom:8}}>{errors.teamCode}</div>}
          <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Trikotnummer</div>
          <input value={number} onChange={e=>setNumber(e.target.value)} placeholder="z.B. 10" type="number" style={inputStyle(false)}/>
        </>}
        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginTop:14,marginBottom:14}}>
          <input type="checkbox" checked={privacyAccepted} onChange={e=>setPrivacyAccepted(e.target.checked)} style={{width:18,height:18,marginTop:2,cursor:"pointer",accentColor:C.accent}}/>
          <label style={{color:C.gray,fontSize:12,cursor:"pointer",flex:1,lineHeight:1.4}}>
            Ich stimme der <span onClick={()=>setShowPrivacyModal(true)} style={{color:C.accent,textDecoration:"underline",cursor:"pointer"}}>Datenschutzerklärung</span> zu
          </label>
        </div>
        <button type="submit" disabled={loading||!privacyAccepted} style={{width:"100%",background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:12,color:C.accent,padding:14,fontSize:14,fontWeight:700,cursor:loading||!privacyAccepted?"not-allowed":"pointer",fontFamily:"inherit",marginTop:16,opacity:(loading||!privacyAccepted)?0.5:1}}>
          {loading?"Laden...":role==="trainer"?"Als Trainer registrieren":"Als Spieler registrieren"}
        </button>
        </form>
        <div style={{textAlign:"center",marginTop:16,color:C.gray,fontSize:13,paddingBottom:40}}>
          Bereits registriert? <span onClick={()=>setScreen("login")} style={{color:C.accent,cursor:"pointer"}}>Anmelden</span>
        </div>
      </div>
    </div>
  );
}
