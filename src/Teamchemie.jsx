import { useState, useRef, useEffect } from "react";
import { db } from "./App.jsx";
import { collection, onSnapshot, doc, setDoc, updateDoc, query, where, orderBy } from "firebase/firestore";

const C = {
  bg:"#12122a", surface:"#1a1a35", surface2:"#22224a",
  border:"rgba(255,255,255,0.09)", borderHi:"rgba(180,100,255,0.35)",
  accent:"#c84aff", accentDim:"rgba(200,74,255,0.15)", accentBorder:"rgba(200,74,255,0.4)",
  green:"#1e3a4a", greenLight:"#2a5a6a", greenText:"#4ac8c8",
  white:"#ffffff", gray:"#7878aa", grayDark:"#44446a", grayLight:"#c0c0e0",
  error:"#cc3355", yellowText:"#e0b040", offColor:"#ff7040", defColor:"#4090e0",
};

const FORMATIONS = {
  "4-4-2":    [{x:50,y:91},{x:15,y:73},{x:34,y:76},{x:66,y:76},{x:85,y:73},{x:15,y:50},{x:36,y:52},{x:64,y:52},{x:85,y:50},{x:36,y:22},{x:64,y:22}],
  "4-3-3":    [{x:50,y:91},{x:15,y:73},{x:34,y:76},{x:66,y:76},{x:85,y:73},{x:25,y:53},{x:50,y:55},{x:75,y:53},{x:15,y:28},{x:50,y:18},{x:85,y:28}],
  "4-2-3-1":  [{x:50,y:91},{x:15,y:73},{x:34,y:76},{x:66,y:76},{x:85,y:73},{x:36,y:60},{x:64,y:60},{x:18,y:40},{x:50,y:38},{x:82,y:40},{x:50,y:18}],
  "3-5-2":    [{x:50,y:91},{x:28,y:76},{x:50,y:78},{x:72,y:76},{x:12,y:55},{x:30,y:55},{x:50,y:53},{x:70,y:55},{x:88,y:55},{x:36,y:22},{x:64,y:22}],
  "5-3-2":    [{x:50,y:91},{x:10,y:72},{x:28,y:76},{x:50,y:78},{x:72,y:76},{x:90,y:72},{x:28,y:52},{x:50,y:54},{x:72,y:52},{x:36,y:22},{x:64,y:22}],
  "4-1-4-1":  [{x:50,y:91},{x:15,y:73},{x:34,y:76},{x:66,y:76},{x:85,y:73},{x:50,y:62},{x:14,y:46},{x:36,y:48},{x:64,y:48},{x:86,y:46},{x:50,y:18}],
  "4-5-1":    [{x:50,y:91},{x:15,y:73},{x:34,y:76},{x:66,y:76},{x:85,y:73},{x:12,y:50},{x:30,y:52},{x:50,y:54},{x:70,y:52},{x:88,y:50},{x:50,y:18}],
  "3-4-3":    [{x:50,y:91},{x:28,y:76},{x:50,y:78},{x:72,y:76},{x:14,y:52},{x:36,y:54},{x:64,y:54},{x:86,y:52},{x:18,y:24},{x:50,y:18},{x:82,y:24}],
  "4-3-1-2":  [{x:50,y:91},{x:15,y:73},{x:34,y:76},{x:66,y:76},{x:85,y:73},{x:25,y:56},{x:50,y:58},{x:75,y:56},{x:50,y:40},{x:36,y:22},{x:64,y:22}],
  "4-2-2-2":  [{x:50,y:91},{x:15,y:73},{x:34,y:76},{x:66,y:76},{x:85,y:73},{x:36,y:60},{x:64,y:60},{x:30,y:44},{x:70,y:44},{x:36,y:22},{x:64,y:22}],
  "3-4-2-1":  [{x:50,y:91},{x:28,y:76},{x:50,y:78},{x:72,y:76},{x:14,y:55},{x:36,y:57},{x:64,y:57},{x:86,y:55},{x:36,y:38},{x:64,y:38},{x:50,y:18}],
  "5-4-1":    [{x:50,y:91},{x:10,y:72},{x:28,y:76},{x:50,y:78},{x:72,y:76},{x:90,y:72},{x:15,y:52},{x:38,y:54},{x:62,y:54},{x:85,y:52},{x:50,y:18}],
  "4-1-2-1-2":[{x:50,y:91},{x:15,y:73},{x:34,y:76},{x:66,y:76},{x:85,y:73},{x:50,y:62},{x:30,y:50},{x:70,y:50},{x:50,y:38},{x:36,y:22},{x:64,y:22}],
  "3-1-4-2":  [{x:50,y:91},{x:28,y:76},{x:50,y:78},{x:72,y:76},{x:50,y:64},{x:14,y:50},{x:36,y:52},{x:64,y:52},{x:86,y:50},{x:36,y:22},{x:64,y:22}],
};

const ALL_TACTICS = [
  {id:1, name:"4-4-2",      note:"Klassisch, ausgewogen. Zwei Stürmer, kompaktes Mittelfeld."},
  {id:2, name:"4-3-3",      note:"Offensiv mit drei Angreifern. Viel Breite im Spiel."},
  {id:3, name:"4-2-3-1",    note:"Solide defensiv, kreativer Zehner hinter dem Stürmer."},
  {id:4, name:"3-5-2",      note:"Drei Innenverteidiger, Kontrolle im Mittelfeld."},
  {id:5, name:"5-3-2",      note:"Defensiv kompakt, schnelle Konter über die Flügel."},
  {id:6, name:"4-1-4-1",    note:"Sicherheit durch defensiven Sechser vor der Abwehr."},
  {id:7, name:"4-5-1",      note:"Kontrolle im Mittelfeld, ein Stürmer im Zentrum."},
  {id:8, name:"3-4-3",      note:"Viel Offensivpower, braucht disziplinierte Flügel."},
  {id:9, name:"4-3-1-2",    note:"Zehner zwischen Mittelfeld und Sturm. Kreativ."},
  {id:10,name:"4-2-2-2",    note:"Doppelte Absicherung, zwei Stürmer und zwei Zehner."},
  {id:11,name:"3-4-2-1",    note:"Drei Verteidiger, zwei offensive Außenbahnspieler."},
  {id:12,name:"5-4-1",      note:"Sehr defensiv, Fokus auf Sicherheit und Konter."},
  {id:13,name:"4-1-2-1-2",  note:"Raute im Mittelfeld. Viel Zentralität."},
  {id:14,name:"3-1-4-2",    note:"Ein defensiver Sechser vor drei Verteidigern."},
];

const TACTIC_FORMATION = {
  1:"4-4-2",2:"4-3-3",3:"4-2-3-1",4:"3-5-2",5:"5-3-2",6:"4-1-4-1",7:"4-5-1",
  8:"3-4-3",9:"4-3-1-2",10:"4-2-2-2",11:"3-4-2-1",12:"5-4-1",13:"4-1-2-1-2",14:"3-1-4-2",
};

const ROLE_LABELS = ["TW","LV","IV L","IV R","RV","LM","ZM","ZM R","RM","ST L","ST R"];

const STRENGTHS_LIST = [
  {id:"abschluss",    label:"Abschluss"},
  {id:"flanken",      label:"Flanken"},
  {id:"standards",    label:"Standards"},
  {id:"elfmeter",     label:"Elfmeter"},
  {id:"dribbling",    label:"Dribbling"},
  {id:"passspiel",    label:"Passspiel"},
  {id:"kopfball",     label:"Kopfball"},
  {id:"zweikampf",    label:"Zweikampf"},
  {id:"schnelligkeit",label:"Schnelligkeit"},
  {id:"ausdauer",     label:"Ausdauer"},
  {id:"fuehrung",     label:"Führung"},
  {id:"intelligenz",  label:"Spielintelligenz"},
];

const TRAINER_ATTRIBUTES = [
  {id:"gesamtwertung",label:"Gesamtwertung"},
  {id:"potenzial",    label:"Potenzial"},
  {id:"einstellung",  label:"Einstellung"},
  {id:"konstanz",     label:"Konstanz"},
];

const INIT_PLAYERS = Array.from({length:11},(_,i)=>({
  id:i+1, name:`Spieler ${i+1}`, number:i+1,
  fitness:85, ruhe:false, partners:[], note:"",
  wishRole:"", strengths:[], strongFoot:"", isPlaceholder:true,
}));

// ── HILFSKOMPONENTEN ─────────────────────────────────────
function Card({children,style}) {
  return (
    <div style={{background:C.surface,borderRadius:12,padding:14,border:`1px solid ${C.border}`,marginBottom:10,...style}}>
      {children}
    </div>
  );
}
function Label({children}) {
  return (
    <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>
      {children}
    </div>
  );
}
function Pill({children,active,onClick}) {
  return (
    <button onClick={onClick} style={{
      padding:"5px 12px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",
      border:`1px solid ${active?C.accentBorder:C.border}`,
      background:active?C.accentDim:"transparent",
      color:active?C.accent:C.gray,
    }}>
      {children}
    </button>
  );
}
function FitnessBar({value}) {
  const color = value>=80?C.greenText:value>=60?C.yellowText:C.error;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:3,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden"}}>
        <div style={{width:`${value}%`,height:"100%",background:color,borderRadius:2}}/>
      </div>
      <span style={{color,fontSize:11,fontWeight:600}}>{value}%</span>
    </div>
  );
}
function TabBtn({label,active,onClick}) {
  return (
    <button onClick={onClick} style={{
      flex:1,padding:"9px 4px",borderRadius:8,cursor:"pointer",fontSize:11,
      fontFamily:"inherit",fontWeight:active?700:500,
      border:`1px solid ${active?C.accentBorder:C.border}`,
      background:active?C.accentDim:"transparent",
      color:active?C.accent:C.gray,
    }}>
      {label}
    </button>
  );
}

// ── SPIELFELD ────────────────────────────────────────────
function Field({positions,setPositions,order,players,editMode,swapFirst,onTap,label,mentalitaet,myUid}) {
  const fieldRef = useRef(null);
  const [dragging,setDragging] = useState(null);
  const dragMoved = useRef(false);

  function getCoords(e) {
    const r = fieldRef.current?.getBoundingClientRect();
    if (!r) return null;
    const cx = (e.touches?.[0]||e).clientX;
    const cy = (e.touches?.[0]||e).clientY;
    return {
      x: Math.max(3,Math.min(97,((cx-r.left)/r.width)*100)),
      y: Math.max(3,Math.min(97,((cy-r.top)/r.height)*100)),
    };
  }

  function onDown(e,idx) {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    dragMoved.current = false;
    setDragging(idx);
  }
  function onMove(e) {
    if (dragging===null) return;
    const c = getCoords(e);
    if (c) {
      dragMoved.current = true;
      if (setPositions) setPositions(prev=>prev.map((p,i)=>i===dragging?{...p,...c}:p));
    }
  }
  function onUp() {
    if (dragging!==null && !dragMoved.current && onTap && editMode) {
      onTap(dragging);
    }
    setDragging(null);
    dragMoved.current = false;
  }

  return (
    <div ref={fieldRef}
      style={{position:"relative",width:"100%",paddingBottom:"140%",borderRadius:8,overflow:"hidden",background:"#0e0e28",border:"1px solid rgba(200,74,255,0.2)",marginBottom:10,touchAction:"none"}}
      onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={()=>{setDragging(null);dragMoved.current=false;}}
      onTouchMove={e=>{e.preventDefault();onMove(e);}} onTouchEnd={onUp}
    >
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 68 105" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width="68" height="105" fill="#0e0e28"/>
        {/* Außenlinien */}
        <rect x="1" y="1" width="66" height="103" fill="none" stroke="rgba(200,74,255,0.55)" strokeWidth="0.5"/>
        {/* Mittellinie */}
        <line x1="1" y1="52.5" x2="67" y2="52.5" stroke="rgba(200,74,255,0.45)" strokeWidth="0.4"/>
        {/* Mittelkreis r=9.15m */}
        <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="0.4"/>
        <circle cx="34" cy="52.5" r="0.5" fill="rgba(200,74,255,0.6)"/>
        {/* Strafraum oben: 40.32m breit, 16.5m tief */}
        <rect x="13.84" y="1" width="40.32" height="16.5" fill="none" stroke="rgba(200,74,255,0.4)" strokeWidth="0.4"/>
        {/* 5m-Raum oben: 18.32m breit, 5.5m tief */}
        <rect x="24.84" y="1" width="18.32" height="5.5" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.35"/>
        {/* Elfmeterpunkt oben: 11m */}
        <circle cx="34" cy="12" r="0.4" fill="rgba(200,74,255,0.55)"/>
        {/* Halbkreis oben: Mittelpunkt Elfmeter, r=9.15, nur außerhalb Strafraum */}
        <path d="M24.2 17.5 A9.15 9.15 0 0 0 43.8 17.5" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.35"/>
        {/* Strafraum unten */}
        <rect x="13.84" y="87.5" width="40.32" height="16.5" fill="none" stroke="rgba(200,74,255,0.4)" strokeWidth="0.4"/>
        {/* 5m-Raum unten */}
        <rect x="24.84" y="98.5" width="18.32" height="5.5" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.35"/>
        {/* Elfmeterpunkt unten */}
        <circle cx="34" cy="93" r="0.4" fill="rgba(200,74,255,0.55)"/>
        {/* Halbkreis unten */}
        <path d="M24.2 87.5 A9.15 9.15 0 0 1 43.8 87.5" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.35"/>
        {/* Eckbögen r=1m */}
        <path d="M1 1 A1 1 0 0 1 2 2" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.35"/>
        <path d="M67 1 A1 1 0 0 0 66 2" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.35"/>
        <path d="M1 104 A1 1 0 0 0 2 103" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.35"/>
        <path d="M67 104 A1 1 0 0 1 66 103" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.35"/>
        {/* Mentalität – 4 Chevrons untereinander in Feldmitte, kein Pfeilschwanz */}
        {mentalitaet!==undefined && mentalitaet>55 && (()=>{
          const o = Math.min(0.65,(mentalitaet-55)/45);
          const col = `rgba(255,112,64,${o})`;
          return [0,1,2,3].map(i=>(
            <polyline key={i} points={`28,${56-i*4} 34,${52-i*4} 40,${56-i*4}`}
              fill="none" stroke={col} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          ));
        })()}
        {mentalitaet!==undefined && mentalitaet<45 && (()=>{
          const o = Math.min(0.65,(45-mentalitaet)/45);
          const col = `rgba(64,144,224,${o})`;
          return [0,1,2,3].map(i=>(
            <polyline key={i} points={`28,${49+i*4} 34,${53+i*4} 40,${49+i*4}`}
              fill="none" stroke={col} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          ));
        })()}
      </svg>
      {label && <div style={{position:"absolute",top:6,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.6)",borderRadius:8,padding:"2px 10px",fontSize:9,color:"rgba(200,74,255,0.7)",zIndex:5}}>{label}</div>}
      {editMode && (
        <div style={{position:"absolute",top:6,right:8,zIndex:6,background:"rgba(200,74,255,0.2)",borderRadius:8,padding:"3px 8px",fontSize:9,color:C.accent,border:`1px solid ${C.accentBorder}`}}>
          {dragging!==null?"Ziehen...":swapFirst!==null?"Zweiten antippen":"Halten = ziehen · Tippen = tauschen"}
        </div>
      )}
      {positions.map((pos,idx)=>{
        const pid = order?order[idx]:idx+1;
        const player = players?players.find(p=>p.id===pid):null;
        const isPlaceholder = !player||player.isPlaceholder;
        const isSelected = editMode && swapFirst===idx;
        const isDragging = dragging===idx;
        const isMe = myUid && player && player.uid===myUid;
        // Convert from percentage (0-100) to new coordinate system
        const leftPct = pos.x + "%";
        const topPct  = pos.y + "%";
        return (
          <div key={idx}
            onMouseDown={e=>onDown(e,idx)}
            onTouchStart={e=>onDown(e,idx)}
            style={{position:"absolute",left:`${pos.x}%`,top:`${pos.y}%`,transform:"translate(-50%,-50%)",zIndex:isDragging?10:3,
              cursor:editMode?"grab":"default",transition:isDragging?"none":"left 0.3s ease,top 0.3s ease"}}>
            <div style={{
              width:30,height:30,borderRadius:"50%",
              background:isSelected||isDragging?C.accent:isMe?"#c84aff":isPlaceholder?"rgba(255,255,255,0.03)":"#14143a",
              border:`2px solid ${isSelected||isDragging?C.accent:isMe?"#ff88ff":isPlaceholder?"rgba(200,74,255,0.12)":"rgba(200,74,255,0.7)"}`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              boxShadow:isDragging?`0 0 20px ${C.accent}`:isSelected?`0 0 12px ${C.accent}`:isMe?`0 0 10px #ff88ff, 0 0 22px rgba(200,74,255,0.6)`:isPlaceholder?"none":`0 0 6px rgba(200,74,255,0.4)`,
            }}>
              <span style={{color:isSelected||isDragging?C.bg:isPlaceholder?"rgba(200,74,255,0.2)":C.white,fontSize:8,fontWeight:800,lineHeight:1}}>
                {player?.number||idx+1}
              </span>
              {!isPlaceholder && (
                <span style={{color:isSelected||isDragging?C.bg:isMe?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.55)",fontSize:6,lineHeight:1.2,fontWeight:600}}>
                  {player.name.split(" ")[0].slice(0,5)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ECKEN EDITOR ─────────────────────────────────────────
const DEFAULT_CORNER_POSITIONS = [
  {x:5,y:5},   // Ecke
  {x:30,y:15},{x:50,y:10},{x:70,y:15},{x:85,y:20}, // Angreifer
  {x:20,y:30},{x:50,y:25},{x:80,y:30},              // Mittelfeld
  {x:30,y:45},{x:50,y:45},{x:70,y:45},              // Absicherung
];

function CornerField({positions,setPositions,players,order,side,type}) {
  const fieldRef = useRef(null);
  const [dragging,setDragging] = useState(null);
  const dragMoved = useRef(false);

  function getCoords(e) {
    const r = fieldRef.current?.getBoundingClientRect();
    if (!r) return null;
    const cx=(e.touches?.[0]||e).clientX;
    const cy=(e.touches?.[0]||e).clientY;
    return {x:Math.max(3,Math.min(97,((cx-r.left)/r.width)*100)),y:Math.max(3,Math.min(97,((cy-r.top)/r.height)*100))};
  }

  function onDown(e,idx){e.preventDefault();e.stopPropagation();dragMoved.current=false;setDragging(idx);}
  function onMove(e){if(dragging===null)return;const c=getCoords(e);if(c){dragMoved.current=true;if(setPositions)setPositions(prev=>prev.map((p,i)=>i===dragging?{...p,...c}:p));}}
  function onUp(){setDragging(null);dragMoved.current=false;}

  return (
    <div ref={fieldRef}
      style={{position:"relative",width:"100%",paddingBottom:"140%",borderRadius:8,overflow:"hidden",background:"#0e0e28",border:"1px solid rgba(200,74,255,0.2)",marginBottom:6,touchAction:"none"}}
      onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchMove={e=>{e.preventDefault();onMove(e);}} onTouchEnd={onUp}
    >
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 68 105" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width="68" height="105" fill="#0e0e28"/>
        <rect x="1" y="1" width="66" height="103" fill="none" stroke="rgba(200,74,255,0.45)" strokeWidth="0.5"/>
        <line x1="1" y1="52.5" x2="67" y2="52.5" stroke="rgba(200,74,255,0.3)" strokeWidth="0.4"/>
        <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="rgba(200,74,255,0.22)" strokeWidth="0.4"/>
        <rect x="13.84" y="1" width="40.32" height="16.5" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="0.4"/>
        <rect x="24.84" y="1" width="18.32" height="5.5" fill="none" stroke="rgba(200,74,255,0.25)" strokeWidth="0.35"/>
        <circle cx="34" cy="12" r="0.4" fill="rgba(200,74,255,0.45)"/>
        <path d="M24.2 17.5 A9.15 9.15 0 0 0 43.8 17.5" fill="none" stroke="rgba(200,74,255,0.25)" strokeWidth="0.35"/>
        <rect x="13.84" y="87.5" width="40.32" height="16.5" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="0.4"/>
        <rect x="24.84" y="98.5" width="18.32" height="5.5" fill="none" stroke="rgba(200,74,255,0.25)" strokeWidth="0.35"/>
        <circle cx="34" cy="93" r="0.4" fill="rgba(200,74,255,0.45)"/>
        <path d="M24.2 87.5 A9.15 9.15 0 0 1 43.8 87.5" fill="none" stroke="rgba(200,74,255,0.25)" strokeWidth="0.35"/>
        {type==="angriff" && side==="links"  && <circle cx="1" cy="1" r="1.2" fill="#c84aff" opacity="0.6"/>}
        {type==="angriff" && side==="rechts" && <circle cx="67" cy="1" r="1.2" fill="#c84aff" opacity="0.6"/>}
        {type==="abwehr"  && side==="links"  && <circle cx="67" cy="104" r="1.2" fill="#c84aff" opacity="0.6"/>}
        {type==="abwehr"  && side==="rechts" && <circle cx="1" cy="104" r="1.2" fill="#c84aff" opacity="0.6"/>}
      </svg>
      <div style={{position:"absolute",top:6,right:8,zIndex:6,background:"rgba(0,0,0,0.7)",borderRadius:8,padding:"3px 8px",fontSize:9,color:C.accent}}>
        Halten = Ziehen
      </div>
      {positions.map((pos,idx)=>{
        const pid=order?order[idx]:idx+1;
        const player=players?players.find(p=>p.id===pid):null;
        const isPlaceholder=!player||player.isPlaceholder;
        const isDragging=dragging===idx;
        return (
          <div key={idx}
            onMouseDown={e=>onDown(e,idx)} onTouchStart={e=>onDown(e,idx)}
            style={{position:"absolute",left:`${pos.x}%`,top:`${pos.y}%`,transform:"translate(-50%,-50%)",zIndex:isDragging?10:3,cursor:"grab",transition:isDragging?"none":"left 0.2s,top 0.2s"}}>
            <div style={{
              width:28,height:28,borderRadius:"50%",
              background:isDragging?C.accent:isPlaceholder?"rgba(255,255,255,0.03)":"#14143a",
              border:`2px solid ${isDragging?C.accent:isPlaceholder?"rgba(200,74,255,0.12)":"rgba(200,74,255,0.7)"}`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              boxShadow:isDragging?`0 0 16px ${C.accent}`:`0 0 5px rgba(200,74,255,0.3)`,
            }}>
              <span style={{color:isDragging?C.bg:isPlaceholder?"rgba(200,74,255,0.2)":C.white,fontSize:8,fontWeight:800}}>{player?.number||idx+1}</span>
              {!isPlaceholder&&<span style={{color:isDragging?C.bg:"rgba(255,255,255,0.55)",fontSize:6,fontWeight:600}}>{player.name.split(" ")[0].slice(0,4)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── SPIELTAG TAB ─────────────────────────────────────────
function SpieltagTab({spieltage,setSpieltage,showNewSpieltag,setShowNewSpieltag,newSpieltagForm,setNewSpieltagForm,activeSpieltagId,setActiveSpieltagId,setTactic,setReleasedTactic,setTacticReleased,players,user,showNotif}) {
  const sorted = [...spieltage].sort((a,b)=>new Date(a.datum+"T"+(a.zeit||"00:00"))-new Date(b.datum+"T"+(b.zeit||"00:00")));
  return (
    <>
      {!showNewSpieltag && (
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <button onClick={()=>{setShowNewSpieltag("spiel");setNewSpieltagForm({datum:"",zeit:"",gegner:"",heimAuswärts:"heim",ort:"",notiz:"",tacticId:1});}}
            style={{flex:1,background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:10,color:C.accent,padding:"12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
            Spiel eintragen
          </button>
          <button onClick={()=>{setShowNewSpieltag("training");setNewSpieltagForm({datum:"",zeit:"",ort:"",notiz:""});}}
            style={{flex:1,background:"rgba(74,200,200,0.1)",border:"1px solid rgba(74,200,200,0.3)",borderRadius:10,color:C.greenText,padding:"12px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
            Training eintragen
          </button>
        </div>
      )}
      {showNewSpieltag && (
        <div style={{background:C.surface,borderRadius:12,padding:16,border:`1px solid ${showNewSpieltag==="spiel"?C.accentBorder:"rgba(74,200,200,0.3)"}`,marginBottom:14}}>
          <div style={{color:showNewSpieltag==="spiel"?C.accent:C.greenText,fontWeight:700,fontSize:13,marginBottom:14}}>
            {showNewSpieltag==="spiel"?"Neues Spiel":"Neues Training"}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{flex:2}}>
              <Label>Datum</Label>
              <input type="date" value={newSpieltagForm.datum||""} onChange={e=>setNewSpieltagForm(p=>({...p,datum:e.target.value}))}
                style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",colorScheme:"dark"}}/>
            </div>
            <div style={{flex:1}}>
              <Label>Uhrzeit</Label>
              <input type="time" value={newSpieltagForm.zeit||""} onChange={e=>setNewSpieltagForm(p=>({...p,zeit:e.target.value}))}
                style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",colorScheme:"dark"}}/>
            </div>
          </div>
          {showNewSpieltag==="spiel" && (
            <>
              <Label>Gegner</Label>
              <input placeholder="z.B. FC Musterstadt" value={newSpieltagForm.gegner||""} onChange={e=>setNewSpieltagForm(p=>({...p,gegner:e.target.value}))}
                style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                {["heim","auswärts"].map(v=>(
                  <button key={v} onClick={()=>setNewSpieltagForm(p=>({...p,heimAuswärts:v}))}
                    style={{flex:1,padding:"9px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600,
                      border:`1px solid ${newSpieltagForm.heimAuswärts===v?C.accentBorder:C.border}`,
                      background:newSpieltagForm.heimAuswärts===v?C.accentDim:"transparent",
                      color:newSpieltagForm.heimAuswärts===v?C.accent:C.gray}}>
                    {v==="heim"?"Heimspiel":"Auswärts"}
                  </button>
                ))}
              </div>
            </>
          )}
          <Label>Ort</Label>
          <input placeholder="z.B. Sportplatz Hauptstraße 1" value={newSpieltagForm.ort||""} onChange={e=>setNewSpieltagForm(p=>({...p,ort:e.target.value}))}
            style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
          <Label>Notizen</Label>
          <textarea value={newSpieltagForm.notiz||""} onChange={e=>setNewSpieltagForm(p=>({...p,notiz:e.target.value}))}
            style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",resize:"none",height:70,outline:"none",boxSizing:"border-box",marginBottom:14}}/>
          {showNewSpieltag==="spiel" && (
            <>
              <Label>Taktik</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                {ALL_TACTICS.map(t=>(
                  <button key={t.id} onClick={()=>setNewSpieltagForm(p=>({...p,tacticId:t.id}))}
                    style={{padding:"5px 12px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",
                      border:`1px solid ${newSpieltagForm.tacticId===t.id?C.accentBorder:C.border}`,
                      background:newSpieltagForm.tacticId===t.id?C.accentDim:"transparent",
                      color:newSpieltagForm.tacticId===t.id?C.accent:C.gray}}>
                    {t.name}
                  </button>
                ))}
              </div>
            </>
          )}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowNewSpieltag(false)}
              style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.gray,padding:"11px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>
              Abbrechen
            </button>
            <button onClick={()=>{
              if (!newSpieltagForm.datum) return showNotif("Bitte Datum eingeben");
              if (showNewSpieltag==="spiel" && !newSpieltagForm.gegner?.trim()) return showNotif("Bitte Gegner eingeben");
              const ev={id:Date.now(),type:showNewSpieltag,datum:newSpieltagForm.datum,zeit:newSpieltagForm.zeit,ort:newSpieltagForm.ort,notiz:newSpieltagForm.notiz,gegner:newSpieltagForm.gegner,heimAuswärts:newSpieltagForm.heimAuswärts,tacticId:newSpieltagForm.tacticId||1,released:false,attendance:{}};
              setSpieltage(prev=>[...prev,ev]);
              setShowNewSpieltag(false);
              showNotif(showNewSpieltag==="spiel"?`Spiel vs. ${ev.gegner} eingetragen`:"Training eingetragen");
            }} style={{flex:1,background:showNewSpieltag==="spiel"?C.accentDim:"rgba(74,200,200,0.15)",border:`1px solid ${showNewSpieltag==="spiel"?C.accentBorder:"rgba(74,200,200,0.4)"}`,borderRadius:10,color:showNewSpieltag==="spiel"?C.accent:C.greenText,padding:"11px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>
              Speichern
            </button>
          </div>
        </div>
      )}
      {spieltage.length===0 && !showNewSpieltag && (
        <div style={{background:C.surface,borderRadius:12,padding:24,border:`1px solid ${C.border}`,textAlign:"center"}}>
          <div style={{color:C.gray,fontSize:13,marginBottom:4}}>Noch keine Einträge</div>
          <div style={{color:C.grayDark,fontSize:11}}>Trage dein nächstes Spiel oder Training ein</div>
        </div>
      )}
      {sorted.map(ev=>{
        const isSpiel = ev.type==="spiel";
        const color = isSpiel?C.accent:C.greenText;
        const isActive = activeSpieltagId===ev.id;
        const attendCount = Object.values(ev.attendance||{}).filter(v=>v==="ja").length;
        const maybeCount = Object.values(ev.attendance||{}).filter(v=>v==="vielleicht").length;
        const absentCount = Object.values(ev.attendance||{}).filter(v=>v==="nein").length;
        return (
          <div key={ev.id} style={{background:isActive?C.accentDim:C.surface,borderRadius:12,padding:14,border:`1px solid ${isActive?C.accentBorder:C.border}`,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{background:`${color}22`,border:`1px solid ${color}55`,borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,color}}>
                    {isSpiel?"Spiel":"Training"}
                  </span>
                  {isSpiel && ev.heimAuswärts && <span style={{color:C.grayDark,fontSize:10}}>{ev.heimAuswärts==="heim"?"Heim":"Auswärts"}</span>}
                  {isActive && <span style={{color:C.accent,fontSize:10,fontWeight:600}}>Aktiv</span>}
                  {isSpiel && ev.released && <span style={{color:C.greenText,fontSize:10,fontWeight:600}}>Freigegeben</span>}
                </div>
                <div style={{color:C.white,fontWeight:700,fontSize:14}}>{isSpiel?`vs. ${ev.gegner||"–"}`:(ev.notiz||"Training")}</div>
                <div style={{color:C.gray,fontSize:11,marginTop:3}}>
                  {ev.datum?new Date(ev.datum+"T12:00:00").toLocaleDateString("de",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}):""}
                  {ev.zeit?` · ${ev.zeit} Uhr`:""}{ev.ort?` · ${ev.ort}`:""}
                </div>
              </div>
              <button onClick={()=>setSpieltage(prev=>prev.filter(s=>s.id!==ev.id))}
                style={{background:"transparent",border:"none",color:C.grayDark,fontSize:16,cursor:"pointer",padding:"0 4px"}}>x</button>
            </div>
            <div style={{display:"flex",gap:14,marginBottom:10,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
              <div style={{textAlign:"center"}}><div style={{color:C.greenText,fontSize:18,fontWeight:800}}>{attendCount}</div><div style={{color:C.grayDark,fontSize:9}}>Dabei</div></div>
              <div style={{textAlign:"center"}}><div style={{color:C.yellowText,fontSize:18,fontWeight:800}}>{maybeCount}</div><div style={{color:C.grayDark,fontSize:9}}>Vielleicht</div></div>
              <div style={{textAlign:"center"}}><div style={{color:C.error,fontSize:18,fontWeight:800}}>{absentCount}</div><div style={{color:C.grayDark,fontSize:9}}>Fehlt</div></div>
              <div style={{textAlign:"center"}}><div style={{color:C.grayDark,fontSize:18,fontWeight:800}}>{players.length-attendCount-maybeCount-absentCount}</div><div style={{color:C.grayDark,fontSize:9}}>Offen</div></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {isSpiel && (
                <button onClick={()=>{setActiveSpieltagId(ev.id);const t=ALL_TACTICS.find(t=>t.id===ev.tacticId)||ALL_TACTICS[0];setTactic(t);showNotif(`Spiel vs. ${ev.gegner} aktiviert`);}}
                  style={{flex:1,background:isActive?"transparent":C.surface2,border:`1px solid ${isActive?C.accentBorder:C.border}`,borderRadius:8,color:isActive?C.accent:C.gray,padding:"8px",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>
                  {isActive?"Aktiv":"Aktivieren"}
                </button>
              )}
              {isSpiel && (
                <button onClick={()=>{setSpieltage(prev=>prev.map(s=>s.id===ev.id?{...s,released:!s.released}:s));const t=ALL_TACTICS.find(t=>t.id===ev.tacticId)||ALL_TACTICS[0];if(!ev.released){setReleasedTactic(t);setTacticReleased(true);}showNotif(ev.released?"Freigabe zurückgezogen":"Taktik freigegeben");}}
                  style={{flex:1,background:ev.released?"rgba(74,200,200,0.1)":"transparent",border:`1px solid ${ev.released?C.greenText:C.border}`,borderRadius:8,color:ev.released?C.greenText:C.gray,padding:"8px",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>
                  {ev.released?"Freigabe aufheben":"Freigeben"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── HAUPTKOMPONENTE ──────────────────────────────────────
export default function Teamchemie({user,onLogout}) {
  const isTrainer = user?.role==="trainer";

  // State
  const [tab,setTab]               = useState(isTrainer?"feld":"status");
  const [players,setPlayers]       = useState(INIT_PLAYERS);
  const [order,setOrder]           = useState(INIT_PLAYERS.map(p=>p.id));
  const [tactic,setTactic]         = useState(ALL_TACTICS[0]);
  const [releasedTactic,setReleasedTactic] = useState(ALL_TACTICS[0]);
  const [tacticReleased,setTacticReleased] = useState(false);
  const [mentalität,setMentalität] = useState(50);
  const [swapFirst,setSwapFirst]   = useState(null);
  const [detailId,setDetailId]     = useState(null);   // Spieler-Tab Detail
  const [chatPartnerId,setChatPartnerId] = useState(null); // Chat-Tab Partner
  const [chat,setChat]             = useState([]);
  const [chatInput,setChatInput]   = useState("");
  const [notif,setNotif]           = useState(null);
  const [showSettings,setShowSettings] = useState(false);
  const [showImpressum,setShowImpressum] = useState(false);
  const [spieltage,setSpieltage]   = useState([]);
  const [activeSpieltagId,setActiveSpieltagId] = useState(null);
  const [showNewSpieltag,setShowNewSpieltag] = useState(false);
  const [newSpieltagForm,setNewSpieltagForm] = useState({datum:"",zeit:"",gegner:"",heimAuswärts:"heim",ort:"",notiz:"",tacticId:1});
  const [attendance,setAttendance] = useState({});
  const [myAttendance,setMyAttendance] = useState(null);
  const [myFitness,setMyFitness]   = useState(85);
  const [myFokus,setMyFokus]       = useState(50);
  const [myWish,setMyWish]         = useState("");
  const [myNote,setMyNote]         = useState("");
  const [myStrengths,setMyStrengths] = useState([]);
  const [myFoot,setMyFoot]         = useState("");
  const [myFormation,setMyFormation] = useState("");
  const [myPartners,setMyPartners] = useState([]);
  const [playerFieldView,setPlayerFieldView] = useState(null);
  const [trainerFieldView,setTrainerFieldView] = useState(null);
  const [fieldEditMode,setFieldEditMode]       = useState(false);
  const [trainerPositions,setTrainerPositions] = useState(null);
  const [posOffensiv,setPosOffensiv]           = useState(null);
  const [posDefensiv,setPosDefensiv]           = useState(null);
  const [cornerSide,setCornerSide]             = useState("links");
  const [cornerOffL,setCornerOffL]             = useState(null);
  const [cornerOffR,setCornerOffR]             = useState(null);
  const [cornerDefL,setCornerDefL]             = useState(null);
  const [cornerDefR,setCornerDefR]             = useState(null);
  const [customTactics,setCustomTactics]   = useState([]);
  const [showCustomTacticEditor,setShowCustomTacticEditor] = useState(false);
  const [customTacticName,setCustomTacticName] = useState("");
  const [customTacticNote,setCustomTacticNote] = useState("");
  const [customTacticBase,setCustomTacticBase] = useState(1);
  const [trainerAttributes,setTrainerAttributes] = useState({});
  const [trainerStrengths,setTrainerStrengths] = useState({});
  const [swipeStartX,setSwipeStartX] = useState(null);
  const [showOnboarding,setShowOnboarding] = useState(isTrainer && !user?.hasSeenOnboarding);
  const [confirmRemove,setConfirmRemove] = useState(null);
  const [playerMenu,setPlayerMenu] = useState(null);
  const [standards,setStandards]   = useState({elfmeter:null,freistoss:null,eckeLinks:null,eckeRechts:null});

  const formKey   = tactic.custom ? (tactic.baseFormation||"4-4-2") : (TACTIC_FORMATION[tactic.id]||"4-4-2");
  const positions = FORMATIONS[formKey]||FORMATIONS["4-4-2"];

  // Firebase: Spieler laden
  useEffect(()=>{
    if (!user?.teamCode) return;
    const q = query(collection(db,"users"),where("teamCode","==",user.teamCode),where("role","==","player"));
    return onSnapshot(q,snap=>{
      const real = snap.docs.map((d,i)=>({
        id:         i+1,
        uid:        d.id,
        name:       d.data().name        || `Spieler ${i+1}`,
        number:     d.data().number      || i+1,
        fitness:    d.data().fitness     || 85,
        ruhe:       d.data().ruhe        || false,
        partners:   d.data().partners    || [],
        note:       d.data().note        || "",
        wishRole:   d.data().wishRole    || "",
        wishFormation: d.data().wishFormation || "",
        strengths:  d.data().strengths   || [],
        strongFoot: d.data().strongFoot  || "",
        attendance: d.data().attendance  || null,
        isPlaceholder: false,
      }));
      const slots = Array.from({length:11},(_,i)=>real[i]||{
        id:i+1,uid:null,name:`Spieler ${i+1}`,number:i+1,
        fitness:85,ruhe:false,partners:[],note:"",wishRole:"",strengths:[],strongFoot:"",isPlaceholder:true,
      });
      setPlayers(slots);
      setOrder(slots.map(p=>p.id));
    });
  },[user?.teamCode]);

  // Firebase: Taktik sync + Aufstellung laden
  useEffect(()=>{
    if (!user?.teamCode) return;
    const [loaded, setLoaded] = [false];
    return onSnapshot(doc(db,"teams",user.teamCode),snap=>{
      if (!snap.exists()) return;
      const d = snap.data();
      // Freigegebene Taktik
      if (d.releasedTacticId) {
        const std = ALL_TACTICS.find(t=>t.id===d.releasedTacticId);
        const custom = (d.customTactics||[]).find(t=>t.id===d.releasedTacticId);
        const found = std||custom;
        if (found) {
          setReleasedTactic(found);
          if (!isTrainer) { setTactic(found); setTacticReleased(true); }
        }
        if (isTrainer) setTacticReleased(true);
      } else {
        if (isTrainer) setTacticReleased(false);
        // Spieler sehen gesperrte Ansicht
      }
      if (!isTrainer) return; // Spieler brauchen den Rest nicht
      // Aufstellung
      if (d.order && Array.isArray(d.order)) setOrder(d.order);
      if (d.trainerPositions) setTrainerPositions(d.trainerPositions);
      if (d.posOffensiv)  setPosOffensiv(d.posOffensiv);
      if (d.posDefensiv)  setPosDefensiv(d.posDefensiv);
      if (d.cornerOffL)   setCornerOffL(d.cornerOffL);
      if (d.cornerOffR)   setCornerOffR(d.cornerOffR);
      if (d.cornerDefL)   setCornerDefL(d.cornerDefL);
      if (d.cornerDefR)   setCornerDefR(d.cornerDefR);
      // Taktik
      if (d.tacticId) {
        const std = ALL_TACTICS.find(t=>t.id===d.tacticId);
        const custom = (d.customTactics||[]).find(t=>t.id===d.tacticId);
        if (std||custom) setTactic(std||custom);
      }
      if (d.customTactics) setCustomTactics(d.customTactics);
      if (d.mentalitaet!==undefined) setMentalität(d.mentalitaet);
      // Standards
      if (d.standards) setStandards(d.standards);
      // Kalender
      if (d.spieltage) setSpieltage(d.spieltage);
    });
  },[user?.teamCode]);

  // Alles in Firebase speichern – debounced
  useEffect(()=>{
    if (!isTrainer || !user?.teamCode) return;
    const timer = setTimeout(()=>{
      updateDoc(doc(db,"teams",user.teamCode),{
        order,
        trainerPositions: trainerPositions||positions,
        posOffensiv:  posOffensiv||positions.map(p=>({...p,y:Math.max(4,p.y-8)})),
        posDefensiv:  posDefensiv||positions.map(p=>({...p,y:Math.min(96,p.y+8)})),
        cornerOffL:   cornerOffL||[],
        cornerOffR:   cornerOffR||[],
        cornerDefL:   cornerDefL||[],
        cornerDefR:   cornerDefR||[],
        tacticId:     tactic.id,
        customTactics,
        mentalitaet:  mentalität,
        standards,
        spieltage,
      }).catch(()=>{});
    }, 1200);
    return ()=>clearTimeout(timer);
  },[order, trainerPositions, posOffensiv, posDefensiv,
     cornerOffL, cornerOffR, cornerDefL, cornerDefR,
     tactic.id, customTactics, mentalität, standards, spieltage]);

  // Firebase: Chat – für Spieler fix, für Trainer dynamisch je nach ausgewähltem Spieler
  const chatPlayerUid = isTrainer ? players.find(p=>p.uid===chatPartnerId||p.id===chatPartnerId)?.uid : user?.uid;
  const chatId = user?.teamCode && chatPlayerUid ? `${user.teamCode}_${chatPlayerUid}` : null;
  useEffect(()=>{
    if (!chatId) return;
    const q = query(collection(db,"chats",chatId,"messages"),orderBy("timestamp","asc"));
    return onSnapshot(q,snap=>{
      setChat(snap.docs.map(d=>({from:d.data().from,text:d.data().text,time:d.data().time})));
    });
  },[chatId]);

  function showNotif(msg){setNotif(msg);setTimeout(()=>setNotif(null),2200);}

  // Init Offensiv/Defensiv/Ecken Positionen wenn Taktik wechselt
  useEffect(()=>{    setTrainerPositions(positions.map(p=>({...p})));
    setPosOffensiv(positions.map(p=>({...p,y:Math.max(4,p.y-8)})));
    setPosDefensiv(positions.map(p=>({...p,y:Math.min(96,p.y+8)})));
    const defaultCorner = [
      {x:8,y:8},{x:30,y:20},{x:50,y:25},{x:70,y:20},{x:85,y:15},
      {x:20,y:35},{x:40,y:35},{x:60,y:35},{x:75,y:35},{x:45,y:50},{x:50,y:90},
    ];
    setCornerOffL(defaultCorner.map(p=>({...p})));
    setCornerOffR(defaultCorner.map(p=>({...p,x:100-p.x})));
    setCornerDefL(defaultCorner.map(p=>({...p,y:100-p.y})));
    setCornerDefR(defaultCorner.map(p=>({...p,x:100-p.x,y:100-p.y})));
  },[tactic.id]);

  async function sendChat(){
    if (!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString("de",{hour:"2-digit",minute:"2-digit"});
    const msg = {from:isTrainer?"trainer":"player",text:chatInput,time,timestamp:Date.now()};
    setChatInput("");
    if (chatId) {
      try { await setDoc(doc(collection(db,"chats",chatId,"messages")),msg); }
      catch { setChat(prev=>[...prev,msg]); }
    } else {
      setChat(prev=>[...prev,msg]);
    }
  }

  function releaseTactic(){
    setReleasedTactic(tactic);
    setTacticReleased(true);
    if (user?.teamCode) {
      updateDoc(doc(db,"teams",user.teamCode),{releasedTacticId:tactic.id,releasedTacticName:tactic.name}).catch(console.error);
    }
    showNotif(`"${tactic.name}" freigegeben`);
  }

  function syncStatus(){
    if (user?.uid) {
      updateDoc(doc(db,"users",user.uid),{
        fitness:myFitness,ruhe:myFokus>50,note:myNote,wishRole:myWish,
        partners:myPartners,strengths:myStrengths,strongFoot:myFoot,attendance:myAttendance,wishFormation:myFormation,
      }).catch(console.error);
    }
    if (myAttendance) setAttendance(prev=>({...prev,[user?.uid]:myAttendance}));
    showNotif("Status an Trainer übermittelt");
  }

  function handleFieldTap(idx){
    if (swapFirst===null) { setSwapFirst(idx); return; }
    if (swapFirst===idx)  { setSwapFirst(null); return; }
    const o=[...order];[o[swapFirst],o[idx]]=[o[idx],o[swapFirst]];
    setOrder(o);setSwapFirst(null);showNotif("Spieler getauscht");
  }

  function handleSwipe(endX){
    if (swipeStartX===null) return;
    const dx = endX-swipeStartX;
    if (Math.abs(dx)<50) return;
    const tabs = isTrainer?["feld","taktik","kalender","spieler","chat"]:["status","feld","chat"];
    const idx = tabs.indexOf(tab);
    if (dx<0 && idx<tabs.length-1) setTab(tabs[idx+1]);
    if (dx>0 && idx>0) setTab(tabs[idx-1]);
    setSwipeStartX(null);
  }

  // ChatUI als inline Funktion
  function renderChat(){
    return (
      <div>
        <div style={{background:C.surface2,borderRadius:10,padding:10,maxHeight:300,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:8,border:`1px solid ${C.border}`}}>
          {chat.length===0 && <div style={{color:C.grayDark,fontSize:12,textAlign:"center",padding:"20px 0"}}>Noch keine Nachrichten</div>}
          {chat.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.from===(isTrainer?"trainer":"player")?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"80%",background:m.from===(isTrainer?"trainer":"player")?C.accentDim:C.surface,border:`1px solid ${m.from===(isTrainer?"trainer":"player")?C.accentBorder:C.border}`,borderRadius:10,padding:"8px 12px"}}>
                <div style={{color:C.white,fontSize:13}}>{m.text}</div>
                <div style={{color:C.grayDark,fontSize:10,marginTop:2,textAlign:"right"}}>{m.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}
            placeholder="Nachricht..." style={{flex:1,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          <button onClick={sendChat} style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:8,color:C.accent,padding:"0 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>Senden</button>
        </div>
      </div>
    );
  }

  // Spieler Detail Ansicht (Trainer)
  if (isTrainer && detailId) {
    const dp = players.find(p=>p.uid===detailId || p.id===detailId);
    if (!dp || dp.isPlaceholder) {
      return (
        <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,padding:24}}>
          <div style={{color:C.gray,fontSize:14,textAlign:"center"}}>Spieler wird geladen...</div>
          <div style={{color:C.grayDark,fontSize:12,textAlign:"center"}}>Stelle sicher dass der Spieler sich mit deinem Team-Code registriert hat.</div>
          <button onClick={()=>setDetailId(null)} style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:10,color:C.accent,padding:"10px 20px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>← Zurück</button>
        </div>
      );
    }
    const allStrengths = [...new Set([...(dp.strengths||[]),...(trainerStrengths[dp.uid]||[])])];
    const att = attendance[dp.uid||dp.id];
    const attCfg = {ja:{l:"Dabei",c:C.greenText},vielleicht:{l:"Unsicher",c:C.yellowText},nein:{l:"Fehlt",c:C.error}};
    return (
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.white}}>
        <div style={{maxWidth:440,margin:"0 auto",padding:"20px 20px 40px"}}>

          {/* Header */}
          <button onClick={()=>setDetailId(null)} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,marginBottom:16,padding:0,display:"flex",alignItems:"center",gap:6}}>
            ← Zurück
          </button>

          {/* Spieler Header */}
          <div style={{background:C.surface,borderRadius:16,padding:16,marginBottom:14,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:C.accentDim,border:`2px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:22,color:C.accent,flexShrink:0}}>
              {dp.number}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:18,fontWeight:800,color:C.white}}>{dp.name}</div>
              <div style={{color:C.gray,fontSize:12,marginTop:2}}>{ROLE_LABELS[order.indexOf(dp.id)]||"–"}</div>
              {att && attCfg[att] && (
                <span style={{display:"inline-block",marginTop:4,background:`${attCfg[att].c}18`,border:`1px solid ${attCfg[att].c}44`,borderRadius:20,padding:"2px 10px",color:attCfg[att].c,fontSize:11,fontWeight:600}}>{attCfg[att].l}</span>
              )}
            </div>
          </div>

          {/* ── AKTUELLE INFOS ── */}
          <div style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Aktuelle Infos</div>

          {/* Fitness + Stimmung nebeneinander */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <Card style={{marginBottom:0}}>
              <Label>Fitnesszustand</Label>
              <div style={{color:dp.fitness>=80?C.greenText:dp.fitness>=60?C.yellowText:C.error,fontSize:20,fontWeight:800,marginBottom:4}}>{dp.fitness}%</div>
              <FitnessBar value={dp.fitness}/>
            </Card>
            <Card style={{marginBottom:0}}>
              <Label>Vor dem Spiel</Label>
              <div style={{color:dp.ruhe?C.yellowText:C.greenText,fontSize:13,fontWeight:600,marginTop:4}}>{dp.ruhe?"Braucht Stille":"Fokussiert"}</div>
              <div style={{color:C.grayDark,fontSize:10,marginTop:4}}>{dp.ruhe?"Ruhige Umgebung":"Bereit zum Anpfiff"}</div>
            </Card>
          </div>

          {/* Nachricht vom Spieler */}
          {dp.note && (
            <Card style={{marginBottom:10,borderColor:"rgba(200,74,255,0.25)"}}>
              <Label>Nachricht an Trainer</Label>
              <div style={{color:C.grayLight,fontSize:13,fontStyle:"italic",lineHeight:1.5}}>"{dp.note}"</div>
            </Card>
          )}

          {/* Anwesenheit setzen */}
          <Card style={{marginBottom:14}}>
            <Label>Anwesenheit setzen</Label>
            <div style={{display:"flex",gap:8}}>
              {[{k:"ja",l:"Dabei",c:C.greenText},{k:"vielleicht",l:"Unsicher",c:C.yellowText},{k:"nein",l:"Fehlt",c:C.error}].map(opt=>(
                <button key={opt.k} onClick={()=>{setAttendance(prev=>({...prev,[dp.uid||dp.id]:opt.k}));showNotif(`${dp.name.split(" ")[0]}: ${opt.l}`);}}
                  style={{flex:1,padding:"8px 4px",borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600,
                    border:`1px solid ${att===opt.k?opt.c:`${opt.c}44`}`,background:att===opt.k?`${opt.c}18`:"transparent",color:opt.c}}>
                  {opt.l}
                </button>
              ))}
            </div>
          </Card>

          {/* ── SPIELER-PROFIL ── */}
          <div style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Spieler-Profil</div>

          {/* Wunschposition */}
          {dp.wishRole && (
            <Card style={{marginBottom:10}}>
              <Label>Wunschposition</Label>
              <div style={{color:C.white,fontSize:14,fontWeight:600}}>{dp.wishRole}</div>
            </Card>
          )}

          {/* Stärken kombiniert */}
          {allStrengths.length>0 && (
            <Card style={{marginBottom:10}}>
              <Label>Stärken</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {allStrengths.map(s=>{
                  const sl = STRENGTHS_LIST.find(x=>x.id===s);
                  const isTrainerAdded = (trainerStrengths[dp.uid]||[]).includes(s);
                  const isPlayerAdded = (dp.strengths||[]).includes(s);
                  return (
                    <span key={s} style={{background:isTrainerAdded&&isPlayerAdded?C.accentDim:isTrainerAdded?"rgba(74,200,200,0.12)":C.accentDim,
                      border:`1px solid ${isTrainerAdded&&isPlayerAdded?C.accentBorder:isTrainerAdded?"rgba(74,200,200,0.4)":C.accentBorder}`,
                      borderRadius:20,padding:"3px 10px",
                      color:isTrainerAdded&&isPlayerAdded?C.accent:isTrainerAdded?C.greenText:C.accent,fontSize:11}}>
                      {sl?.label||s}{isTrainerAdded&&!isPlayerAdded&&<span style={{fontSize:9,opacity:0.7}}> (T)</span>}
                    </span>
                  );
                })}
              </div>
              <div style={{color:C.grayDark,fontSize:10,marginTop:6}}>(T) = vom Trainer bewertet</div>
            </Card>
          )}

          {/* Starker Fuß */}
          {dp.strongFoot && (
            <Card style={{marginBottom:10}}>
              <Label>Starker Fuß</Label>
              <div style={{color:C.white,fontSize:13,fontWeight:600}}>{dp.strongFoot}</div>
            </Card>
          )}

          {/* Harmonie */}
          {dp.partners && dp.partners.length>0 && (
            <Card style={{marginBottom:10}}>
              <Label>Harmonie mit</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {dp.partners.map(pid=>{
                  const partner = players.find(p=>p.id===pid);
                  return partner ? (
                    <span key={pid} style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:20,padding:"3px 10px",color:C.grayLight,fontSize:11}}>
                      {partner.name.split(" ")[0]}
                    </span>
                  ) : null;
                })}
              </div>
            </Card>
          )}

          {/* Lieblingsformation */}
          {dp.wishFormation && (
            <Card style={{marginBottom:14}}>
              <Label>Lieblingsformation</Label>
              <div style={{color:C.white,fontSize:13,fontWeight:600}}>{dp.wishFormation}</div>
            </Card>
          )}

          {/* ── TRAINER BEWERTUNG ── */}
          <div style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Trainer-Bewertung (privat)</div>

          <Card style={{marginBottom:10,borderColor:"rgba(200,74,255,0.25)"}}>
            {TRAINER_ATTRIBUTES.map(attr=>{
              const val = (trainerAttributes[dp.uid]||{})[attr.id]||0;
              return (
                <div key={attr.id} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:C.gray,fontSize:12}}>{attr.label}</span>
                    <span style={{color:val>=8?C.greenText:val>=6?C.yellowText:val>0?C.error:C.grayDark,fontSize:12,fontWeight:700}}>{val||"–"}/10</span>
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                      <button key={n} onClick={()=>setTrainerAttributes(prev=>({...prev,[dp.uid]:{...(prev[dp.uid]||{}),[attr.id]:n}}))}
                        style={{flex:1,height:22,borderRadius:3,border:"none",cursor:"pointer",
                          background:n<=val?(n>=8?C.greenText:n>=6?C.yellowText:C.accent):"rgba(200,74,255,0.1)",
                          transition:"all 0.1s"}}/>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Trainer Stärken vergeben */}
          <Card style={{marginBottom:10,borderColor:"rgba(200,74,255,0.25)"}}>
            <Label>Stärken vom Trainer vergeben</Label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {STRENGTHS_LIST.map(s=>{
                const active = (trainerStrengths[dp.uid]||[]).includes(s.id);
                return (
                  <button key={s.id} onClick={()=>setTrainerStrengths(prev=>{const cur=prev[dp.uid]||[];return {...prev,[dp.uid]:active?cur.filter(x=>x!==s.id):[...cur,s.id]};})}
                    style={{padding:"4px 10px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",
                      border:`1px solid ${active?C.accentBorder:C.border}`,
                      background:active?C.accentDim:"transparent",
                      color:active?C.accent:C.gray}}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Position ändern */}
          <Card style={{marginBottom:14}}>
            <Label>Position im Team ändern</Label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {ROLE_LABELS.map((label,i)=>{
                const isCurrent = order[i]===dp.id;
                return (
                  <button key={i} onClick={()=>{if(!isCurrent){const o=[...order];const from=o.indexOf(dp.id);const dis=o[i];if(from!==-1)o[from]=dis;o[i]=dp.id;setOrder(o);showNotif(`${dp.name.split(" ")[0]} → ${label}`);}}}
                    style={{padding:"5px 10px",borderRadius:20,cursor:isCurrent?"default":"pointer",fontSize:11,fontFamily:"inherit",
                      border:`1px solid ${isCurrent?C.greenText:C.border}`,
                      background:isCurrent?"rgba(74,200,200,0.15)":"transparent",
                      color:isCurrent?C.greenText:C.gray}}>
                    {label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Direktchat */}
          <div style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Direktchat</div>
          <Card>
            {renderChat()}
          </Card>
        </div>
      </div>
    );
  }

  // Onboarding
  if (showOnboarding) return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
      <div style={{maxWidth:400,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:32,fontWeight:900,letterSpacing:-0.5}}>
            <span style={{color:C.white}}>Team</span><span style={{color:C.accent}}>chemie</span>
          </div>
          <div style={{color:C.gray,fontSize:14,marginTop:8}}>Hallo {user?.name}! So startest du:</div>
        </div>
        {[
          {step:"1",title:"Team-Code teilen",desc:"Dein Code steht oben im Header. Schicke ihn per WhatsApp an deine Spieler."},
          {step:"2",title:"Spieler registrieren lassen",desc:"Spieler oeffnen die App, wählen Spieler-Rolle und geben deinen Code ein."},
          {step:"3",title:"Taktik auswählen",desc:"Wähle eine Formation, passe die Aufstellung an und gib sie frei."},
          {step:"4",title:"Status abfragen",desc:"Spieler geben vor dem Spiel ihre Fitness und Wunschposition ein."},
        ].map(item=>(
          <div key={item.step} style={{display:"flex",gap:14,marginBottom:16,background:C.surface,borderRadius:12,padding:"12px 14px",border:`1px solid ${C.border}`}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:C.accentDim,border:`1px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:C.accent,fontSize:13,fontWeight:800}}>{item.step}</span>
            </div>
            <div>
              <div style={{color:C.white,fontWeight:600,fontSize:13}}>{item.title}</div>
              <div style={{color:C.gray,fontSize:12,marginTop:3,lineHeight:1.5}}>{item.desc}</div>
            </div>
          </div>
        ))}
        <button onClick={()=>setShowOnboarding(false)} style={{width:"100%",background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:12,color:C.accent,padding:14,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          Los geht's!
        </button>
      </div>
    </div>
  );

  const navItems = isTrainer
    ? [{key:"feld",label:"Feld"},{key:"taktik",label:"Taktik"},{key:"kalender",label:"Kalender"},{key:"spieler",label:"Spieler"},{key:"chat",label:"Chat"}]
    : [{key:"status",label:"Status"},{key:"feld",label:"Feld"},{key:"chat",label:"Chat"}];

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.white}}
      onTouchStart={e=>setSwipeStartX(e.touches[0].clientX)}
      onTouchEnd={e=>handleSwipe(e.changedTouches[0].clientX)}
    >
      <div style={{maxWidth:440,margin:"0 auto",padding:"20px 20px 90px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:36,height:36,borderRadius:10,background:"#1a1a35",border:"1.5px solid rgba(200,74,255,0.5)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="26" height="26" viewBox="0 0 28 28">
                <rect x="2" y="2" width="24" height="24" rx="1" fill="none" stroke="rgba(200,74,255,0.5)" strokeWidth="0.8"/>
                <line x1="2" y1="14" x2="26" y2="14" stroke="rgba(200,74,255,0.5)" strokeWidth="0.8"/>
                <circle cx="14" cy="14" r="3.5" fill="none" stroke="rgba(200,74,255,0.4)" strokeWidth="0.7"/>
                <rect x="8" y="2" width="12" height="4" rx="0.5" fill="none" stroke="rgba(200,74,255,0.4)" strokeWidth="0.7"/>
                <rect x="8" y="22" width="12" height="4" rx="0.5" fill="none" stroke="rgba(200,74,255,0.4)" strokeWidth="0.7"/>
                <ellipse cx="14" cy="14" rx="7" ry="2.8" fill="none" stroke="#c84aff" strokeWidth="1" opacity="0.9"/>
                <ellipse cx="14" cy="14" rx="7" ry="2.8" fill="none" stroke="#c84aff" strokeWidth="0.7" opacity="0.5" transform="rotate(60,14,14)"/>
                <circle cx="14" cy="14" r="1.5" fill="#c84aff"/>
                <circle cx="21" cy="14" r="1" fill="#c84aff" opacity="0.8"/>
              </svg>
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.5px",lineHeight:1}}>
                <span style={{color:C.white}}>Team</span><span style={{color:C.accent}}>chemie</span>
              </div>
              <div style={{color:C.grayDark,fontSize:10,marginTop:2}}>{user?.teamName||"Mein Team"} · {isTrainer?"Trainer":user?.name}</div>
              {isTrainer && user?.teamCode && <div style={{color:C.accent,fontSize:10,marginTop:1,fontWeight:600}}>Code: {user.teamCode}</div>}
            </div>
          </div>
          <button onClick={()=>setShowSettings(true)} style={{width:36,height:36,borderRadius:"50%",background:C.surface,border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.gray,fontSize:17,flexShrink:0}}>
            &#9881;
          </button>
        </div>

        {/* Settings */}
        {showSettings && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowSettings(false)}>
            <div style={{width:"100%",maxWidth:440,margin:"0 auto",background:C.surface,borderRadius:"20px 20px 0 0",padding:"20px 20px 40px",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
              <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px"}}/>
              <div style={{fontSize:17,fontWeight:700,marginBottom:20}}>Einstellungen</div>
              <Label>Account</Label>
              <div style={{background:C.surface2,borderRadius:12,padding:14,marginBottom:14,border:`1px solid ${C.border}`}}>
                <div style={{color:C.white,fontWeight:700}}>{user?.name}</div>
                <div style={{color:C.gray,fontSize:12,marginTop:2}}>{user?.email}</div>
                <div style={{color:C.accent,fontSize:11,marginTop:4}}>{isTrainer?"Trainer":"Spieler"} · {user?.teamName}</div>
              </div>
              {isTrainer && user?.teamCode && (
                <div style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:12,padding:14,marginBottom:14}}>
                  <Label>Team-Code für Spieler</Label>
                  <div style={{color:C.accent,fontSize:28,fontWeight:900,letterSpacing:4,textAlign:"center",marginBottom:10}}>{user.teamCode}</div>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Tritt unserem Team auf Teamchemie bei!\n\n1. teamchemie1.vercel.app oeffnen\n2. Als Spieler registrieren\n3. Code eingeben: ${user.teamCode}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{display:"block",background:"#25D366",borderRadius:10,color:"#fff",padding:"12px",fontSize:13,fontWeight:700,textAlign:"center",textDecoration:"none"}}>
                    Per WhatsApp einladen
                  </a>
                </div>
              )}
              <Label>Sonstiges</Label>
              <div onClick={()=>setShowImpressum(p=>!p)} style={{display:"flex",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                <span style={{color:C.grayLight,fontSize:13,flex:1}}>Impressum</span>
                <span style={{color:C.grayDark}}>{showImpressum?"v":">"}</span>
              </div>
              {showImpressum && (
                <div style={{background:C.surface2,borderRadius:10,padding:14,margin:"8px 0",border:`1px solid ${C.border}`}}>
                  <div style={{color:C.gray,fontSize:12,lineHeight:1.9}}>
                    <div style={{fontWeight:600,color:C.grayLight,marginBottom:4}}>Teamchemie</div>
                    <div>Lasse Kaufmann · Frankfurt am Main</div>
                    <div>lassekaufmann01@gmail.com</div>
                    <div style={{marginTop:8,color:C.grayDark,fontSize:11}}>Version 1.0.0 · 2025 Teamchemie</div>
                  </div>
                </div>
              )}
              <div style={{padding:"13px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{color:C.grayLight,fontSize:13}}>App-Version 1.0.0</span>
              </div>
              <button onClick={onLogout} style={{width:"100%",background:"rgba(187,51,51,0.1)",border:`1px solid ${C.error}`,borderRadius:10,color:C.error,padding:"13px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",marginTop:20}}>
                Abmelden
              </button>
            </div>
          </div>
        )}

        {/* Spieler entfernen Popup */}
        {confirmRemove && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
            <div style={{background:C.surface2,borderRadius:16,padding:24,maxWidth:340,width:"100%",border:`1px solid ${C.borderHi}`}}>
              <div style={{color:C.white,fontSize:16,fontWeight:700,marginBottom:8}}>Spieler entfernen?</div>
              <div style={{color:C.gray,fontSize:13,lineHeight:1.6,marginBottom:20}}>
                Moechtest du <span style={{color:C.white,fontWeight:600}}>{confirmRemove.name}</span> wirklich entfernen?
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setConfirmRemove(null)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.gray,padding:"11px",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Abbrechen</button>
                <button onClick={()=>{setPlayers(prev=>prev.filter(p=>p.id!==confirmRemove.id));setOrder(prev=>prev.filter(id=>id!==confirmRemove.id));setConfirmRemove(null);showNotif("Spieler entfernt");}}
                  style={{flex:1,background:"rgba(187,51,51,0.15)",border:`1px solid ${C.error}`,borderRadius:10,color:C.error,padding:"11px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>
                  Entfernen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TRAINER ── */}
        {isTrainer && (
          <>
            {/* Feld - Atom Navigation */}
            {tab==="feld" && (
              <>
                {trainerFieldView===null ? (
                  <>
                    <div style={{color:C.accent,fontSize:12,textAlign:"center",marginBottom:4}}>Taktik: <span style={{color:C.white,fontWeight:600}}>{tactic.name}</span></div>
                    <div style={{color:C.grayDark,fontSize:11,textAlign:"center",marginBottom:8}}>Bereich antippen zum Bearbeiten</div>
                    <div style={{position:"relative",height:300,margin:"0 auto"}}>
                      {/* Orbit Bahnen */}
                      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="-150 -150 300 300">
                        <ellipse cx="0" cy="0" rx="130" ry="50" fill="none" stroke="rgba(200,74,255,0.12)" strokeWidth="1"/>
                        <ellipse cx="0" cy="0" rx="130" ry="50" fill="none" stroke="rgba(200,74,255,0.08)" strokeWidth="1" transform="rotate(60)"/>
                        <ellipse cx="0" cy="0" rx="130" ry="50" fill="none" stroke="rgba(200,74,255,0.06)" strokeWidth="1" transform="rotate(120)"/>
                        <circle cx="130" cy="0" r="3" fill="#c84aff" opacity="0.5"/>
                        <circle cx="-65" cy="-112" r="2.5" fill="#c84aff" opacity="0.35"/>
                        <circle cx="-55" cy="100" r="2" fill="#c84aff" opacity="0.25"/>
                      </svg>
                      {[
                        {id:"grund",      label:"Grundaufstellung",color:C.accent,   x:0,   y:0,   size:90},
                        {id:"offensiv",   label:"Offensiv",        color:C.offColor, x:0,   y:-115,size:68},
                        {id:"defensiv",   label:"Defensiv",        color:C.defColor, x:0,   y:115, size:68},
                        {id:"eckeAngriff",label:"Ecke Angriff",   color:"#e0c040",  x:-115,y:-60, size:64},
                        {id:"eckeAbwehr", label:"Ecke Abwehr",    color:C.greenText,x:115, y:-60, size:64},
                      ].map(item=>(
                        <button key={item.id} onClick={()=>{setTrainerFieldView(item.id);setFieldEditMode(false);setSwapFirst(null);}}
                          style={{position:"absolute",top:"50%",left:"50%",width:item.size,height:item.size,borderRadius:"50%",
                            background:`${item.color}15`,border:`2px solid ${item.color}88`,
                            transform:`translate(calc(-50% + ${item.x}px),calc(-50% + ${item.y}px))`,
                            cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                          <span style={{color:item.color,fontSize:item.id==="grund"?11:9,fontWeight:700,textAlign:"center",padding:"0 4px"}}>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Standards */}
                    <Card style={{marginTop:14}}>
                      <Label>Standardschützen</Label>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {[
                          {key:"elfmeter",  label:"Elfmeter"},
                          {key:"freistoss", label:"Freistoss"},
                          {key:"eckeLinks", label:"Ecke Links"},
                          {key:"eckeRechts",label:"Ecke Rechts"},
                        ].map(({key,label})=>{
                          const pid = standards[key];
                          const p = players.find(pl=>pl.id===pid&&!pl.isPlaceholder);
                          return (
                            <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{color:C.gray,fontSize:12,width:90}}>{label}</span>
                              <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:4}}>
                                {players.filter(pl=>!pl.isPlaceholder).map(pl=>(
                                  <button key={pl.id} onClick={()=>setStandards(prev=>({...prev,[key]:pl.id}))}
                                    style={{padding:"3px 8px",borderRadius:20,cursor:"pointer",fontSize:10,fontFamily:"inherit",
                                      border:`1px solid ${standards[key]===pl.id?C.accentBorder:C.border}`,
                                      background:standards[key]===pl.id?C.accentDim:"transparent",
                                      color:standards[key]===pl.id?C.accent:C.gray}}>
                                    {pl.name.split(" ")[0]}
                                  </button>
                                ))}
                                {players.filter(pl=>!pl.isPlaceholder).length===0 && <span style={{color:C.grayDark,fontSize:11}}>Keine Spieler</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Taktik teilen Toggle */}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.surface,borderRadius:12,padding:"14px 16px",border:`1px solid ${tacticReleased?C.accentBorder:C.border}`,marginTop:10}}>
                      <div>
                        <div style={{color:C.white,fontSize:13,fontWeight:600}}>Taktik mit Spielern teilen</div>
                        <div style={{color:tacticReleased?C.greenText:C.grayDark,fontSize:11,marginTop:2}}>{tacticReleased?"Spieler sehen deine Taktik":"Taktik ist nicht geteilt"}</div>
                      </div>
                      <button onClick={()=>{
                        const next = !tacticReleased;
                        setTacticReleased(next);
                        if (next) {
                          setReleasedTactic(tactic);
                          if (user?.teamCode) updateDoc(doc(db,"teams",user.teamCode),{
                            releasedTacticId: tactic.id,
                            releasedTacticName: tactic.name,
                          }).catch(console.error);
                        } else {
                          if (user?.teamCode) updateDoc(doc(db,"teams",user.teamCode),{
                            releasedTacticId: null,
                          }).catch(console.error);
                        }
                        showNotif(next?"Taktik freigegeben – Spieler sehen sie jetzt":"Taktik zurückgezogen");
                      }} style={{
                        width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",
                        background:tacticReleased?"#c84aff":"rgba(255,255,255,0.1)",
                        position:"relative",transition:"background 0.2s",flexShrink:0,
                      }}>
                        <div style={{
                          width:22,height:22,borderRadius:"50%",background:C.white,
                          position:"absolute",top:3,transition:"left 0.2s",
                          left:tacticReleased?27:3,
                        }}/>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Header der Detail-Ansicht */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <button onClick={()=>{setTrainerFieldView(null);setSwapFirst(null);setFieldEditMode(false);}}
                        style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,padding:0}}>
                        zurück
                      </button>
                      <div style={{color:C.white,fontSize:13,fontWeight:600}}>
                        {trainerFieldView==="grund"?"Grundaufstellung":
                         trainerFieldView==="offensiv"?"Offensiv":
                         trainerFieldView==="defensiv"?"Defensiv":
                         trainerFieldView==="eckeAngriff"?"Ecke Angriff":"Ecke Abwehr"}
                      </div>
                      {(trainerFieldView==="grund"||trainerFieldView==="offensiv"||trainerFieldView==="defensiv") && (
                        <button onClick={()=>{setFieldEditMode(p=>!p);setSwapFirst(null);}}
                          style={{background:fieldEditMode?C.accentDim:"transparent",border:`1px solid ${fieldEditMode?C.accentBorder:C.border}`,borderRadius:8,color:fieldEditMode?C.accent:C.gray,padding:"5px 10px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>
                          {fieldEditMode?"Fertig":"Bearbeiten"}
                        </button>
                      )}
                      {(trainerFieldView==="eckeAngriff"||trainerFieldView==="eckeAbwehr") && (
                        <div style={{width:70}}/>
                      )}
                    </div>

                    {/* Aufstellung Felder */}
                    {(trainerFieldView==="grund"||trainerFieldView==="offensiv"||trainerFieldView==="defensiv") && (
                      <>
                        {fieldEditMode && (
                          <div style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:11,color:C.accent}}>
                            Spieler halten und ziehen zum Verschieben · Antippen zum Tauschen
                          </div>
                        )}
                        <Field
                          positions={
                            trainerFieldView==="offensiv"?(posOffensiv||positions.map(p=>({...p,y:Math.max(4,p.y-8)}))):
                            trainerFieldView==="defensiv"?(posDefensiv||positions.map(p=>({...p,y:Math.min(96,p.y+8)}))):
                            (trainerPositions||positions)
                          }
                          setPositions={
                            fieldEditMode?(
                              trainerFieldView==="offensiv"?setPosOffensiv:
                              trainerFieldView==="defensiv"?setPosDefensiv:
                              setTrainerPositions
                            ):null
                          }
                          order={order} players={players}
                          editMode={fieldEditMode}
                          swapFirst={fieldEditMode?swapFirst:null}
                          onTap={fieldEditMode?handleFieldTap:null}
                          mentalitaet={trainerFieldView==="grund"?mentalität:undefined}
                        />
                        {trainerFieldView==="grund" && (
                          <Card style={{marginTop:6}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                              <span style={{color:C.defColor,fontSize:11}}>Defensiv</span>
                              <span style={{color:C.gray,fontSize:11}}>{mentalität<=30?"Sehr defensiv":mentalität<=50?"Ausgewogen":mentalität<=70?"Offensiv":"Sehr offensiv"}</span>
                              <span style={{color:C.offColor,fontSize:11}}>Offensiv</span>
                            </div>
                            <input type="range" min={0} max={100} value={mentalität} onChange={e=>setMentalität(Number(e.target.value))}
                              style={{width:"100%",accentColor:C.accent}}/>
                          </Card>
                        )}
                        {!fieldEditMode && <div style={{color:C.grayDark,fontSize:11,textAlign:"center",marginTop:-6,marginBottom:8}}>Auf "Bearbeiten" tippen um Spieler zu verschieben</div>}
                      </>
                    )}

                    {/* Ecken Editor */}
                    {(trainerFieldView==="eckeAngriff"||trainerFieldView==="eckeAbwehr") && (
                      <>
                        <div style={{display:"flex",gap:8,marginBottom:10}}>
                          {["links","rechts"].map(s=>(
                            <button key={s} onClick={()=>setCornerSide(s)}
                              style={{flex:1,padding:"8px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600,
                                border:`1px solid ${cornerSide===s?C.accentBorder:C.border}`,
                                background:cornerSide===s?C.accentDim:"transparent",
                                color:cornerSide===s?C.accent:C.gray}}>
                              {s==="links"?"Linke Ecke":"Rechte Ecke"}
                            </button>
                          ))}
                        </div>
                        <CornerField
                          positions={
                            trainerFieldView==="eckeAngriff"
                              ?(cornerSide==="links"?cornerOffL:cornerOffR)
                              :(cornerSide==="links"?cornerDefL:cornerDefR)
                          }
                          setPositions={
                            trainerFieldView==="eckeAngriff"
                              ?(cornerSide==="links"?setCornerOffL:setCornerOffR)
                              :(cornerSide==="links"?setCornerDefL:setCornerDefR)
                          }
                          players={players} order={order}
                          side={cornerSide}
                          type={trainerFieldView==="eckeAngriff"?"angriff":"abwehr"}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Taktik */}
            {tab==="taktik" && (
              <>
                <Label>Formation wählen</Label>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                  {[...ALL_TACTICS,...customTactics].map(t=>(
                    <div key={t.id} onClick={()=>setTactic(t)}
                      style={{background:tactic.id===t.id?C.accentDim:C.surface,border:`1px solid ${tactic.id===t.id?C.accentBorder:C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{color:tactic.id===t.id?C.accent:C.white,fontWeight:700,fontSize:14}}>{t.name} {t.custom&&<span style={{color:C.greenText,fontSize:10,fontWeight:600}}>Eigene</span>}</div>
                          <div style={{color:C.gray,fontSize:11,marginTop:2}}>{t.note}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          {t.custom && <button onClick={e=>{e.stopPropagation();setCustomTactics(prev=>prev.filter(x=>x.id!==t.id));if(tactic.id===t.id)setTactic(ALL_TACTICS[0]);}} style={{background:"transparent",border:"none",color:C.error,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>x</button>}
                          {tactic.id===t.id && <span style={{color:C.accent,fontSize:16,fontWeight:700}}>v</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Eigene Formation erstellen */}
                {!showCustomTacticEditor ? (
                  <button onClick={()=>setShowCustomTacticEditor(true)}
                    style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.grayLight,padding:"12px",cursor:"pointer",fontSize:13,fontFamily:"inherit",marginBottom:12}}>
                    + Eigene Formation erstellen
                  </button>
                ) : (
                  <div style={{background:C.surface,borderRadius:12,padding:16,border:`1px solid ${C.accentBorder}`,marginBottom:12}}>
                    <div style={{color:C.accent,fontWeight:700,fontSize:13,marginBottom:12}}>Eigene Formation erstellen</div>
                    <Label>Name der Formation</Label>
                    <input value={customTacticName} onChange={e=>setCustomTacticName(e.target.value)} placeholder="z.B. Mein 4-3-3"
                      style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
                    <Label>Taktikhinweis</Label>
                    <input value={customTacticNote} onChange={e=>setCustomTacticNote(e.target.value)} placeholder="z.B. Pressig, aggressives Pressing"
                      style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
                    <Label>Basierend auf Formation</Label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                      {ALL_TACTICS.slice(0,8).map(t=>(
                        <button key={t.id} onClick={()=>setCustomTacticBase(t.id)}
                          style={{padding:"5px 12px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",
                            border:`1px solid ${customTacticBase===t.id?C.accentBorder:C.border}`,
                            background:customTacticBase===t.id?C.accentDim:"transparent",
                            color:customTacticBase===t.id?C.accent:C.gray}}>
                          {t.name}
                        </button>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setShowCustomTacticEditor(false)}
                        style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.gray,padding:"11px",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
                        Abbrechen
                      </button>
                      <button onClick={()=>{
                        if (!customTacticName.trim()) return showNotif("Bitte Namen eingeben");
                        const newId = Date.now();
                        const baseFormation = TACTIC_FORMATION[customTacticBase]||"4-4-2";
                        const newTactic = {
                          id:newId, name:customTacticName.trim(), note:customTacticNote.trim()||"Eigene Formation",
                          custom:true, baseFormation,
                        };
                        setCustomTactics(prev=>[...prev,newTactic]);
                        setTactic(newTactic);
                        setCustomTacticName(""); setCustomTacticNote(""); setCustomTacticBase(1);
                        setShowCustomTacticEditor(false);
                        showNotif(`Formation "${newTactic.name}" erstellt`);
                      }} style={{flex:1,background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:10,color:C.accent,padding:"11px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>
                        Erstellen
                      </button>
                    </div>
                  </div>
                )}

                {tacticReleased && <div style={{color:C.greenText,fontSize:12,textAlign:"center",marginTop:8}}>Taktik freigegeben</div>}
              </>
            )}

            {/* Kalender */}
            {tab==="kalender" && (
              <SpieltagTab
                spieltage={spieltage} setSpieltage={setSpieltage}
                showNewSpieltag={showNewSpieltag} setShowNewSpieltag={setShowNewSpieltag}
                newSpieltagForm={newSpieltagForm} setNewSpieltagForm={setNewSpieltagForm}
                activeSpieltagId={activeSpieltagId} setActiveSpieltagId={setActiveSpieltagId}
                setTactic={setTactic} setReleasedTactic={setReleasedTactic} setTacticReleased={setTacticReleased}
                players={players} user={user} showNotif={showNotif}
              />
            )}

            {/* Spieler */}
            {tab==="spieler" && (
              <>
                {/* Spieler Detail als Overlay */}
                {detailId && (()=>{
                              const dp = players.find(p=>p.uid===detailId||p.id===detailId)||players.find(p=>String(p.uid)===String(detailId)||String(p.id)===String(detailId));
                  if (!dp) return (
                    <div style={{textAlign:"center",padding:"40px 0"}}>
                      <div style={{color:C.gray,marginBottom:12}}>Spieler wird geladen...</div>
                      <button onClick={()=>setDetailId(null)} style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:8,color:C.accent,padding:"8px 16px",cursor:"pointer",fontFamily:"inherit"}}>← Zurück</button>
                    </div>
                  );
                  const att = attendance[dp.uid];
                  const attCfg = {ja:{l:"Dabei",c:C.greenText},vielleicht:{l:"Unsicher",c:C.yellowText},nein:{l:"Fehlt",c:C.error}};
                  const allStrengths = [...new Set([...(dp.strengths||[]),...(trainerStrengths[dp.uid]||[])])];
                  return (
                    <>
                      <button onClick={()=>setDetailId(null)} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,marginBottom:16,padding:0}}>← Zurück</button>

                      {/* Spieler Header */}
                      <div style={{background:C.surface,borderRadius:16,padding:16,marginBottom:12,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:50,height:50,borderRadius:"50%",background:C.accentDim,border:`2px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:C.accent,flexShrink:0}}>
                          {dp.number}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:18,fontWeight:800,color:C.white}}>{dp.name}</div>
                          <div style={{color:C.gray,fontSize:12,marginTop:2}}>{ROLE_LABELS[order.indexOf(dp.id)]||"–"}</div>
                          {att && attCfg[att] && <span style={{display:"inline-block",marginTop:4,background:`${attCfg[att].c}18`,border:`1px solid ${attCfg[att].c}44`,borderRadius:20,padding:"2px 10px",color:attCfg[att].c,fontSize:11,fontWeight:600}}>{attCfg[att].l}</span>}
                        </div>
                      </div>

                      {/* Aktuelle Infos */}
                      <div style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Aktuelle Infos</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                        <Card style={{marginBottom:0}}>
                          <Label>Fitness</Label>
                          <div style={{color:dp.fitness>=80?C.greenText:dp.fitness>=60?C.yellowText:C.error,fontSize:22,fontWeight:800,marginBottom:4}}>{dp.fitness||85}%</div>
                          <FitnessBar value={dp.fitness||85}/>
                        </Card>
                        <Card style={{marginBottom:0}}>
                          <Label>Stimmung</Label>
                          <div style={{color:dp.ruhe?C.yellowText:C.greenText,fontSize:12,fontWeight:600,marginTop:4}}>{dp.ruhe?"Braucht Stille":"Fokussiert"}</div>
                        </Card>
                      </div>

                      {dp.note && <Card style={{marginBottom:10,borderColor:"rgba(200,74,255,0.25)"}}>
                        <Label>Nachricht</Label>
                        <div style={{color:C.grayLight,fontSize:13,fontStyle:"italic",lineHeight:1.5}}>"{dp.note}"</div>
                      </Card>}

                      {/* Anwesenheit setzen */}
                      <Card style={{marginBottom:12}}>
                        <Label>Anwesenheit setzen</Label>
                        <div style={{display:"flex",gap:8}}>
                          {[{k:"ja",l:"Dabei",c:C.greenText},{k:"vielleicht",l:"Unsicher",c:C.yellowText},{k:"nein",l:"Fehlt",c:C.error}].map(opt=>(
                            <button key={opt.k} onClick={()=>{setAttendance(prev=>({...prev,[dp.uid]:opt.k}));showNotif(`${dp.name.split(" ")[0]}: ${opt.l}`);}}
                              style={{flex:1,padding:"8px 4px",borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600,
                                border:`1px solid ${att===opt.k?opt.c:`${opt.c}44`}`,background:att===opt.k?`${opt.c}18`:"transparent",color:opt.c}}>
                              {opt.l}
                            </button>
                          ))}
                        </div>
                      </Card>

                      {/* Spielerprofil */}
                      <div style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Spielerprofil</div>
                      {dp.wishRole && <Card style={{marginBottom:10}}><Label>Wunschposition</Label><div style={{color:C.white,fontSize:14,fontWeight:600}}>{dp.wishRole}</div></Card>}
                      {dp.wishFormation && <Card style={{marginBottom:10}}><Label>Lieblingsformation</Label><div style={{color:C.white,fontSize:13,fontWeight:600}}>{dp.wishFormation}</div></Card>}
                      {allStrengths.length>0 && <Card style={{marginBottom:10}}>
                        <Label>Stärken</Label>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {allStrengths.map(s=>{const sl=STRENGTHS_LIST.find(x=>x.id===s);return <span key={s} style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:20,padding:"3px 10px",color:C.accent,fontSize:11}}>{sl?.label||s}</span>;})}
                        </div>
                      </Card>}
                      {dp.strongFoot && <Card style={{marginBottom:10}}><Label>Starker Fuß</Label><div style={{color:C.white,fontSize:13,fontWeight:600}}>{dp.strongFoot}</div></Card>}

                      {/* Trainer Bewertung */}
                      <div style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Trainer-Bewertung (privat)</div>
                      <Card style={{marginBottom:10,borderColor:"rgba(200,74,255,0.25)"}}>
                        {TRAINER_ATTRIBUTES.map(attr=>{
                          const val=(trainerAttributes[dp.uid]||{})[attr.id]||0;
                          return <div key={attr.id} style={{marginBottom:12}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{color:C.gray,fontSize:12}}>{attr.label}</span>
                              <span style={{color:val>=8?C.greenText:val>=5?C.yellowText:val>0?C.accent:C.grayDark,fontSize:12,fontWeight:700}}>{val||"–"}/10</span>
                            </div>
                            <div style={{display:"flex",gap:3}}>
                              {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                                <button key={n} onClick={()=>setTrainerAttributes(prev=>({...prev,[dp.uid]:{...(prev[dp.uid]||{}),[attr.id]:n}}))}
                                  style={{flex:1,height:20,borderRadius:3,border:"none",cursor:"pointer",background:n<=val?(n>=8?C.greenText:n>=5?C.yellowText:C.accent):"rgba(200,74,255,0.1)"}}/>
                              ))}
                            </div>
                          </div>;
                        })}
                      </Card>

                      {/* Trainer Stärken */}
                      <Card style={{marginBottom:10,borderColor:"rgba(200,74,255,0.25)"}}>
                        <Label>Stärken vom Trainer vergeben</Label>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {STRENGTHS_LIST.map(s=>{
                            const active=(trainerStrengths[dp.uid]||[]).includes(s.id);
                            return <button key={s.id} onClick={()=>setTrainerStrengths(prev=>{const cur=prev[dp.uid]||[];return {...prev,[dp.uid]:active?cur.filter(x=>x!==s.id):[...cur,s.id]};})}
                              style={{padding:"4px 10px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",border:`1px solid ${active?C.accentBorder:C.border}`,background:active?C.accentDim:"transparent",color:active?C.accent:C.gray}}>{s.label}</button>;
                          })}
                        </div>
                      </Card>

                      {/* Position ändern */}
                      <Card style={{marginBottom:14}}>
                        <Label>Position im Team ändern</Label>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {ROLE_LABELS.map((label,i)=>{
                            const isCurrent=order[i]===dp.id;
                            return <button key={i} onClick={()=>{if(!isCurrent){const o=[...order];const from=o.indexOf(dp.id);if(from!==-1)o[from]=o[i];o[i]=dp.id;setOrder(o);showNotif(`${dp.name.split(" ")[0]} → ${label}`);}}}
                              style={{padding:"5px 10px",borderRadius:20,cursor:isCurrent?"default":"pointer",fontSize:11,fontFamily:"inherit",border:`1px solid ${isCurrent?C.greenText:C.border}`,background:isCurrent?"rgba(74,200,200,0.15)":"transparent",color:isCurrent?C.greenText:C.gray}}>{label}</button>;
                          })}
                        </div>
                      </Card>

                      {/* Chat */}
                      <div style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Direktchat</div>
                      <Card>{renderChat()}</Card>
                    </>
                  );
                })()}

                {/* Spielerliste */}
                {!detailId && <>
                  <Card style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <Label>Anwesenheit</Label>
                      <button onClick={()=>setAttendance({})} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.gray,padding:"3px 8px",cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>Reset</button>
                    </div>
                    <div style={{display:"flex",gap:20}}>
                      {[{k:"ja",l:"Dabei",c:C.greenText},{k:"vielleicht",l:"Vielleicht",c:C.yellowText},{k:"nein",l:"Fehlt",c:C.error},{k:null,l:"Offen",c:C.grayDark}].map(({k,l,c})=>(
                        <div key={l} style={{textAlign:"center"}}>
                          <div style={{color:c,fontSize:22,fontWeight:800}}>
                            {k===null?players.filter(p=>!p.isPlaceholder&&!attendance[p.uid]).length:players.filter(p=>!p.isPlaceholder&&attendance[p.uid]===k).length}
                          </div>
                          <div style={{color:C.grayDark,fontSize:9}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Label>Mannschaft — {players.filter(p=>!p.isPlaceholder).length} Spieler</Label>
                  {players.filter(p=>!p.isPlaceholder).length===0 && (
                    <div style={{background:C.surface,borderRadius:12,padding:20,border:`1px solid ${C.border}`,textAlign:"center",marginBottom:10}}>
                      <div style={{color:C.gray,fontSize:13}}>Noch keine Spieler beigetreten</div>
                      <div style={{color:C.grayDark,fontSize:11,marginTop:4}}>Team-Code teilen: {user?.teamCode}</div>
                    </div>
                  )}
                  {players.filter(p=>!p.isPlaceholder).map(p=>{
                    const att = attendance[p.uid];
                    const attCfg = {ja:{l:"Dabei",c:C.greenText},vielleicht:{l:"Unsicher",c:C.yellowText},nein:{l:"Fehlt",c:C.error}};
                    return (
                      <div key={p.uid||p.id} onClick={()=>{setDetailId(p.uid||p.id);}} style={{background:C.surface,borderRadius:12,padding:"12px 14px",marginBottom:8,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                        <div style={{width:40,height:40,borderRadius:"50%",background:C.accentDim,border:`1px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:C.accent,flexShrink:0}}>
                          {p.number}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{color:C.white,fontWeight:600,fontSize:14}}>{p.name}</div>
                          <div style={{color:C.gray,fontSize:11}}>{p.wishRole||ROLE_LABELS[order.indexOf(p.id)]||"–"}</div>
                          <div style={{marginTop:4}}><FitnessBar value={p.fitness||85}/></div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                          {att && attCfg[att] && <span style={{background:`${attCfg[att].c}18`,border:`1px solid ${attCfg[att].c}55`,borderRadius:20,padding:"2px 8px",color:attCfg[att].c,fontSize:10,fontWeight:600}}>{attCfg[att].l}</span>}
                          <span style={{color:C.accent,fontSize:18,lineHeight:1}}>›</span>
                        </div>
                      </div>
                    );
                  })}
                </>}
              </>
            )}

            {/* Chat */}
            {tab==="chat" && (
              <>
                {!chatPartnerId ? (
                  <>
                    <Label>Direktchat – Spieler auswählen</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {players.filter(p=>!p.isPlaceholder).map(p=>(
                        <div key={p.uid||p.id} onClick={()=>setChatPartnerId(p.uid||p.id)}
                          style={{background:C.surface,borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,border:`1px solid ${C.border}`,cursor:"pointer"}}>
                          <div style={{width:36,height:36,borderRadius:"50%",background:C.accentDim,border:`1px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:C.accent,flexShrink:0}}>{p.number}</div>
                          <div style={{flex:1}}>
                            <div style={{color:C.white,fontWeight:600,fontSize:13}}>{p.name}</div>
                            <div style={{color:C.gray,fontSize:11}}>{p.wishRole||ROLE_LABELS[order.indexOf(p.id)]||"–"}</div>
                          </div>
                          <span style={{color:C.accent,fontSize:18}}>›</span>
                        </div>
                      ))}
                      {players.filter(p=>!p.isPlaceholder).length===0 && (
                        <div style={{color:C.gray,fontSize:13,textAlign:"center",padding:"20px 0"}}>Noch keine Spieler beigetreten</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                      <button onClick={()=>setChatPartnerId(null)} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,padding:0}}>
                        zurück
                      </button>
                      <div style={{color:C.white,fontWeight:700,fontSize:15}}>
                        Chat mit {players.find(p=>p.uid===chatPartnerId||p.id===chatPartnerId)?.name}
                      </div>
                    </div>
                    {renderChat()}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── SPIELER ── */}
        {!isTrainer && (
          <>
            {/* Status */}
            {tab==="status" && (
              <>
                {spieltage.length>0 && (
                  <Card style={{marginBottom:10}}>
                    <Label>Nächste Termine</Label>
                    {[...spieltage].sort((a,b)=>new Date(a.datum+"T"+(a.zeit||"12:00"))-new Date(b.datum+"T"+(b.zeit||"12:00"))).slice(0,3).map(ev=>{
                      const isSpiel = ev.type==="spiel";
                      const myAtt = (ev.attendance||{})[user?.uid];
                      return (
                        <div key={ev.id} style={{background:C.surface2,borderRadius:10,padding:"11px 12px",marginBottom:8,border:`1px solid ${C.border}`}}>
                          <div style={{color:C.white,fontWeight:600,fontSize:13,marginBottom:2}}>{isSpiel?`vs. ${ev.gegner}`:(ev.notiz||"Training")}</div>
                          <div style={{color:C.gray,fontSize:11,marginBottom:8}}>
                            {ev.datum?new Date(ev.datum+"T12:00:00").toLocaleDateString("de",{weekday:"short",day:"2-digit",month:"short"}):""}
                            {ev.zeit?` · ${ev.zeit} Uhr`:""}{ev.ort?` · ${ev.ort}`:""}
                          </div>
                          <div style={{display:"flex",gap:6}}>
                            {[{k:"ja",l:"Dabei",c:C.greenText},{k:"vielleicht",l:"Vielleicht",c:C.yellowText},{k:"nein",l:"Absagen",c:C.error}].map(opt=>(
                              <button key={opt.k} onClick={()=>{setSpieltage(prev=>prev.map(s=>s.id===ev.id?{...s,attendance:{...(s.attendance||{}),[user?.uid]:opt.k}}:s));showNotif(opt.k==="ja"?"Angemeldet!":"Abgemeldet");}}
                                style={{flex:1,padding:"6px 4px",borderRadius:8,cursor:"pointer",fontSize:10,fontFamily:"inherit",fontWeight:600,
                                  border:`1px solid ${myAtt===opt.k?opt.c:`${opt.c}44`}`,background:myAtt===opt.k?`${opt.c}18`:"transparent",color:opt.c}}>
                                {opt.l}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                )}

                <Card style={{marginBottom:10}}>
                  <Label>Zum nächsten Spiel</Label>
                  <div style={{display:"flex",gap:8}}>
                    {[{k:"ja",l:"Ich bin dabei",c:C.greenText},{k:"vielleicht",l:"Vielleicht",c:C.yellowText},{k:"nein",l:"Kann nicht",c:C.error}].map(opt=>(
                      <button key={opt.k} onClick={()=>setMyAttendance(opt.k)}
                        style={{flex:1,padding:"9px 4px",borderRadius:8,cursor:"pointer",fontSize:10,fontFamily:"inherit",fontWeight:600,
                          border:`1px solid ${myAttendance===opt.k?opt.c:`${opt.c}44`}`,background:myAttendance===opt.k?`${opt.c}18`:"transparent",color:opt.c,lineHeight:1.3}}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </Card>

                {tacticReleased && (
                  <Card style={{marginBottom:10,borderColor:C.accentBorder}}>
                    <Label>Taktik vom Trainer</Label>
                    <div style={{color:C.white,fontSize:16,fontWeight:700}}>{releasedTactic.name}</div>
                    <div style={{color:C.gray,fontSize:12,marginTop:4}}>{releasedTactic.note}</div>
                  </Card>
                )}

                <Card style={{marginBottom:10}}>
                  <Label>Fitnesszustand</Label>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {[100,85,70,55,40].map(v=><Pill key={v} active={myFitness===v} onClick={()=>setMyFitness(v)}>{v}%</Pill>)}
                  </div>
                  <FitnessBar value={myFitness}/>
                </Card>

                <Card style={{marginBottom:10}}>
                  <Label>Wunschposition</Label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {["Torwart","Innenverteidiger","Außenverteidiger","Defensives MF","Zentrales MF","Offensives MF","Außenbahn","Stürmer"].map(pos=>(
                      <Pill key={pos} active={myWish===pos} onClick={()=>setMyWish(pos)}>{pos}</Pill>
                    ))}
                  </div>
                </Card>

                <Card style={{marginBottom:10}}>
                  <Label>Meine Stärken</Label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {STRENGTHS_LIST.map(s=>(
                      <Pill key={s.id} active={myStrengths.includes(s.id)} onClick={()=>setMyStrengths(prev=>prev.includes(s.id)?prev.filter(x=>x!==s.id):[...prev,s.id])}>
                        {s.label}
                      </Pill>
                    ))}
                  </div>
                </Card>

                <Card style={{marginBottom:10}}>
                  <Label>Harmonie – mit wem spielst du am liebsten?</Label>
                  {players.filter(p=>!p.isPlaceholder&&p.uid!==user?.uid).length===0 ? (
                    <div style={{color:C.grayDark,fontSize:12}}>Noch keine anderen Spieler im Team</div>
                  ) : (
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {players.filter(p=>!p.isPlaceholder&&p.uid!==user?.uid).map(p=>(
                        <button key={p.uid} onClick={()=>setMyPartners(prev=>prev.includes(p.uid)?prev.filter(x=>x!==p.uid):[...prev,p.uid])}
                          style={{padding:"5px 12px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",
                            border:`1px solid ${myPartners.includes(p.uid)?C.accentBorder:C.border}`,
                            background:myPartners.includes(p.uid)?C.accentDim:"transparent",
                            color:myPartners.includes(p.uid)?C.accent:C.gray}}>
                          {p.name.split(" ")[0]} #{p.number}
                        </button>
                      ))}
                    </div>
                  )}
                </Card>

                <Card style={{marginBottom:10}}>
                  <Label>Lieblingsformation</Label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {ALL_TACTICS.map(t=>(
                      <Pill key={t.id} active={myFormation===t.name} onClick={()=>setMyFormation(t.name)}>{t.name}</Pill>
                    ))}
                  </div>
                </Card>

                <Card style={{marginBottom:10}}>
                  <Label>Nachricht an Trainer</Label>
                  <textarea value={myNote} onChange={e=>setMyNote(e.target.value)} placeholder="Verletzung, besondere Situation..."
                    style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",resize:"none",height:80,outline:"none",boxSizing:"border-box"}}/>
                </Card>

                <button onClick={syncStatus} style={{width:"100%",background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:12,color:C.accent,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
                  Status absenden
                </button>
              </>
            )}

            {/* Feld - Atom Navigation (readonly) */}
            {tab==="feld" && (
              <>
                {playerFieldView===null ? (
                  <>
                    {tacticReleased ? (
                      <>
                        <div style={{color:C.accent,fontSize:12,textAlign:"center",marginBottom:4}}>Taktik vom Trainer: <span style={{color:C.white,fontWeight:700}}>{releasedTactic.name}</span></div>
                        <div style={{color:C.grayDark,fontSize:11,textAlign:"center",marginBottom:8}}>Antippen zum Anzeigen</div>
                        <div style={{position:"relative",height:300,margin:"0 auto"}}>
                          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="-150 -150 300 300">
                            <ellipse cx="0" cy="0" rx="130" ry="50" fill="none" stroke="rgba(200,74,255,0.12)" strokeWidth="1"/>
                            <ellipse cx="0" cy="0" rx="130" ry="50" fill="none" stroke="rgba(200,74,255,0.08)" strokeWidth="1" transform="rotate(60)"/>
                            <ellipse cx="0" cy="0" rx="130" ry="50" fill="none" stroke="rgba(200,74,255,0.06)" strokeWidth="1" transform="rotate(120)"/>
                            <circle cx="130" cy="0" r="3" fill="#c84aff" opacity="0.5"/>
                            <circle cx="-65" cy="-112" r="2.5" fill="#c84aff" opacity="0.35"/>
                            <circle cx="-55" cy="100" r="2" fill="#c84aff" opacity="0.25"/>
                          </svg>
                          {[
                            {id:"grund",      label:"Aufstellung",   color:C.accent,   x:0,   y:0,   size:90},
                            {id:"offensiv",   label:"Offensiv",      color:C.offColor, x:0,   y:-115,size:68},
                            {id:"defensiv",   label:"Defensiv",      color:C.defColor, x:0,   y:115, size:68},
                            {id:"eckeAngriff",label:"Ecke Angriff",  color:"#e0c040",  x:-115,y:-60, size:64},
                            {id:"eckeAbwehr", label:"Ecke Abwehr",   color:C.greenText,x:115, y:-60, size:64},
                          ].map(item=>(
                            <button key={item.id} onClick={()=>setPlayerFieldView(item.id)}
                              style={{position:"absolute",top:"50%",left:"50%",width:item.size,height:item.size,borderRadius:"50%",
                                background:`${item.color}15`,border:`2px solid ${item.color}88`,
                                transform:`translate(calc(-50% + ${item.x}px),calc(-50% + ${item.y}px))`,
                                cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                              <span style={{color:item.color,fontSize:item.id==="grund"?10:9,fontWeight:700,textAlign:"center",padding:"0 4px"}}>{item.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Standardschützen anzeigen */}
                        {(standards.elfmeter||standards.freistoss||standards.eckeLinks||standards.eckeRechts) && (
                          <Card style={{marginTop:14}}>
                            <Label>Standardschützen</Label>
                            <div style={{display:"flex",flexDirection:"column",gap:6}}>
                              {[
                                {key:"elfmeter",  label:"Elfmeter"},
                                {key:"freistoss", label:"Freistoss"},
                                {key:"eckeLinks", label:"Ecke Links"},
                                {key:"eckeRechts",label:"Ecke Rechts"},
                              ].map(({key,label})=>{
                                const pid = standards[key];
                                const p = players.find(pl=>pl.id===pid&&!pl.isPlaceholder);
                                if (!p) return null;
                                return (
                                  <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                    <span style={{color:C.gray,fontSize:12}}>{label}</span>
                                    <span style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:20,padding:"3px 12px",color:C.accent,fontSize:12,fontWeight:600}}>{p.name.split(" ")[0]}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </Card>
                        )}
                      </>
                    ) : (
                      <div style={{background:C.surface,borderRadius:12,padding:32,border:`1px solid ${C.border}`,textAlign:"center",marginTop:20}}>
                        <div style={{color:C.grayDark,fontSize:32,marginBottom:12}}>🔒</div>
                        <div style={{color:C.gray,fontSize:14,fontWeight:600,marginBottom:6}}>Noch keine Taktik freigegeben</div>
                        <div style={{color:C.grayDark,fontSize:12}}>Der Trainer hat noch keine Taktik geteilt</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <button onClick={()=>setPlayerFieldView(null)} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,padding:0}}>
                        ← zurück
                      </button>
                      <div style={{color:C.white,fontSize:13,fontWeight:600}}>
                        {playerFieldView==="grund"?"Aufstellung":
                         playerFieldView==="offensiv"?"Offensiv":
                         playerFieldView==="defensiv"?"Defensiv":
                         playerFieldView==="eckeAngriff"?"Ecke Angriff":"Ecke Abwehr"}
                      </div>
                      <div style={{width:60}}/>
                    </div>

                    {playerFieldView==="grund" && <Field positions={trainerPositions||positions} order={order} players={players} editMode={false} mentalitaet={mentalität} myUid={user?.uid}/>}
                    {playerFieldView==="offensiv" && <Field positions={posOffensiv||positions.map(p=>({...p,y:Math.max(4,p.y-8)}))} order={order} players={players} editMode={false} myUid={user?.uid}/>}
                    {playerFieldView==="defensiv" && <Field positions={posDefensiv||positions.map(p=>({...p,y:Math.min(96,p.y+8)}))} order={order} players={players} editMode={false} myUid={user?.uid}/> }
                    {(playerFieldView==="eckeAngriff"||playerFieldView==="eckeAbwehr") && (
                      <>
                        <div style={{display:"flex",gap:8,marginBottom:10}}>
                          {["links","rechts"].map(s=>(
                            <button key={s} onClick={()=>setCornerSide(s)}
                              style={{flex:1,padding:"8px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600,
                                border:`1px solid ${cornerSide===s?C.accentBorder:C.border}`,
                                background:cornerSide===s?C.accentDim:"transparent",
                                color:cornerSide===s?C.accent:C.gray}}>
                              {s==="links"?"Linke Ecke":"Rechte Ecke"}
                            </button>
                          ))}
                        </div>
                        <CornerField
                          positions={
                            playerFieldView==="eckeAngriff"
                              ?(cornerSide==="links"?cornerOffL:cornerOffR)
                              :(cornerSide==="links"?cornerDefL:cornerDefR)
                          }
                          setPositions={null}
                          players={players} order={order}
                          side={cornerSide}
                          type={playerFieldView==="eckeAngriff"?"angriff":"abwehr"}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Chat */}
            {tab==="chat" && (
              <>
                <Label>Chat mit Trainer</Label>
                {renderChat()}
              </>
            )}
          </>
        )}

        {/* Notification */}
        {notif && (
          <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:10,padding:"11px 20px",color:C.accent,fontWeight:700,fontSize:13,zIndex:999,whiteSpace:"nowrap"}}>
            {notif}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(18,18,42,0.97)",borderTop:`1px solid ${C.border}`,zIndex:100,backdropFilter:"blur(12px)",paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div style={{maxWidth:440,margin:"0 auto",display:"flex"}}>
          {navItems.map(item=>{
            const active = tab===item.key;
            return (
              <button key={item.key} onClick={()=>{setTab(item.key);setSwapFirst(null);}}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"12px 4px 10px",background:"transparent",border:"none",cursor:"pointer",gap:0,borderTop:`2px solid ${active?C.accent:"transparent"}`}}>
                <span style={{fontSize:11,fontWeight:active?700:500,color:active?C.accent:"rgba(120,120,170,0.7)",letterSpacing:"0.3px"}}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
