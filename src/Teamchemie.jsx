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
function Field({positions,order,players,interactive,swapFirst,onTap}) {
  return (
    <div style={{position:"relative",width:"100%",paddingBottom:"140%",borderRadius:8,overflow:"hidden",background:"#0e0e28",border:"1px solid rgba(200,74,255,0.2)",marginBottom:10}}>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 100 140" preserveAspectRatio="none">
        <rect x="0" y="0" width="100" height="140" fill="#0e0e28"/>
        <rect x="2" y="2" width="96" height="136" fill="none" stroke="rgba(200,74,255,0.5)" strokeWidth="0.8"/>
        <line x1="2" y1="70" x2="98" y2="70" stroke="rgba(200,74,255,0.4)" strokeWidth="0.6"/>
        <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.6"/>
        <circle cx="50" cy="70" r="1" fill="rgba(200,74,255,0.5)"/>
        <rect x="22" y="2"  width="56" height="20" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.6"/>
        <rect x="32" y="2"  width="36" height="10" fill="none" stroke="rgba(200,74,255,0.2)" strokeWidth="0.6"/>
        <rect x="22" y="118" width="56" height="20" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.6"/>
        <rect x="32" y="128" width="36" height="10" fill="none" stroke="rgba(200,74,255,0.2)" strokeWidth="0.6"/>
        <path d="M28 22 A16 16 0 0 0 72 22" fill="none" stroke="rgba(200,74,255,0.2)" strokeWidth="0.6"/>
        <path d="M28 118 A16 16 0 0 1 72 118" fill="none" stroke="rgba(200,74,255,0.2)" strokeWidth="0.6"/>
        <circle cx="50" cy="14" r="1" fill="rgba(200,74,255,0.4)"/>
        <circle cx="50" cy="126" r="1" fill="rgba(200,74,255,0.4)"/>
      </svg>
      {interactive && swapFirst!==null && (
        <div style={{position:"absolute",top:6,right:8,zIndex:6,background:"rgba(0,0,0,0.7)",borderRadius:8,padding:"3px 8px",fontSize:9,color:C.accent}}>
          Zweiten Spieler antippen
        </div>
      )}
      {interactive && swapFirst===null && (
        <div style={{position:"absolute",top:6,right:8,zIndex:6,background:"rgba(0,0,0,0.7)",borderRadius:8,padding:"3px 8px",fontSize:9,color:"rgba(255,255,255,0.4)"}}>
          Antippen zum Tauschen
        </div>
      )}
      {positions.map((pos,idx)=>{
        const pid = order[idx];
        const player = players.find(p=>p.id===pid);
        const isPlaceholder = !player || player.isPlaceholder;
        const isSelected = interactive && swapFirst===idx;
        return (
          <div key={idx}
            onClick={()=>interactive && onTap && onTap(idx)}
            style={{position:"absolute",left:`${pos.x}%`,top:`${pos.y}%`,transform:"translate(-50%,-50%)",zIndex:3,cursor:interactive?"pointer":"default"}}>
            <div style={{
              width:30,height:30,borderRadius:"50%",
              background:isSelected?C.accent:isPlaceholder?"rgba(255,255,255,0.03)":"#14143a",
              border:`2px solid ${isSelected?C.accent:isPlaceholder?"rgba(200,74,255,0.12)":"rgba(200,74,255,0.7)"}`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              boxShadow:isSelected?`0 0 16px ${C.accent}`:isPlaceholder?"none":`0 0 6px rgba(200,74,255,0.4)`,
              transition:"all 0.2s",
            }}>
              <span style={{color:isSelected?C.bg:isPlaceholder?"rgba(200,74,255,0.2)":C.white,fontSize:8,fontWeight:800,lineHeight:1}}>
                {player?.number||idx+1}
              </span>
              {!isPlaceholder && (
                <span style={{color:isSelected?C.bg:"rgba(255,255,255,0.55)",fontSize:6,lineHeight:1.2,fontWeight:600}}>
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
  const [mentalitaet,setMentalitaet] = useState(50);
  const [swapFirst,setSwapFirst]   = useState(null);
  const [detailId,setDetailId]     = useState(null);
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
  const [myPartners,setMyPartners] = useState([]);
  const [playerFieldView,setPlayerFieldView] = useState(null);
  const [trainerAttributes,setTrainerAttributes] = useState({});
  const [trainerStrengths,setTrainerStrengths] = useState({});
  const [swipeStartX,setSwipeStartX] = useState(null);
  const [showOnboarding,setShowOnboarding] = useState(isTrainer && !user?.hasSeenOnboarding);
  const [confirmRemove,setConfirmRemove] = useState(null);
  const [playerMenu,setPlayerMenu] = useState(null);
  const [customTactics,setCustomTactics] = useState([]);
  const [standards,setStandards]   = useState({elfmeter:null,freistoss:null,eckeLinks:null,eckeRechts:null});

  const formKey   = TACTIC_FORMATION[tactic.id]||"4-4-2";
  const positions = FORMATIONS[formKey]||FORMATIONS["4-4-2"];

  // Firebase: Spieler laden
  useEffect(()=>{
    if (!user?.teamCode) return;
    const q = query(collection(db,"users"),where("teamCode","==",user.teamCode),where("role","==","player"));
    return onSnapshot(q,snap=>{
      const real = snap.docs.map((d,i)=>({
        id:i+1,uid:d.id,name:d.data().name||`Spieler ${i+1}`,number:d.data().number||i+1,
        fitness:d.data().fitness||85,ruhe:d.data().ruhe||false,partners:d.data().partners||[],
        note:d.data().note||"",wishRole:d.data().wishRole||"",strengths:d.data().strengths||[],
        strongFoot:d.data().strongFoot||"",attendance:d.data().attendance||null,isPlaceholder:false,
      }));
      const slots = Array.from({length:11},(_,i)=>real[i]||{
        id:i+1,uid:null,name:`Spieler ${i+1}`,number:i+1,
        fitness:85,ruhe:false,partners:[],note:"",wishRole:"",strengths:[],strongFoot:"",isPlaceholder:true,
      });
      setPlayers(slots);
      setOrder(slots.map(p=>p.id));
    });
  },[user?.teamCode]);

  // Firebase: Taktik sync
  useEffect(()=>{
    if (!user?.teamCode) return;
    return onSnapshot(doc(db,"teams",user.teamCode),snap=>{
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.releasedTacticId) {
        const found = ALL_TACTICS.find(t=>t.id===d.releasedTacticId);
        if (found) { setReleasedTactic(found); if (!isTrainer) setTactic(found); }
      }
    });
  },[user?.teamCode]);

  // Firebase: Chat
  const chatId = user?.teamCode && user?.uid ? `${user.teamCode}_${user.uid}` : null;
  useEffect(()=>{
    if (!chatId) return;
    const q = query(collection(db,"chats",chatId,"messages"),orderBy("timestamp","asc"));
    return onSnapshot(q,snap=>{
      setChat(snap.docs.map(d=>({from:d.data().from,text:d.data().text,time:d.data().time})));
    });
  },[chatId]);

  function showNotif(msg){setNotif(msg);setTimeout(()=>setNotif(null),2200);}

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
        partners:myPartners,strengths:myStrengths,strongFoot:myFoot,attendance:myAttendance,
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
    const dp = players.find(p=>p.id===detailId);
    if (!dp || dp.isPlaceholder) { setDetailId(null); return null; }
    return (
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.white}}>
        <div style={{maxWidth:440,margin:"0 auto",padding:"20px 20px 60px"}}>
          <button onClick={()=>setDetailId(null)} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,marginBottom:20,padding:0}}>
            zurueck
          </button>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
            <div style={{width:50,height:50,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:C.bg,flexShrink:0}}>
              {dp.number}
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:700}}>{dp.name}</div>
              <div style={{color:C.gray,fontSize:12,marginTop:2}}>{dp.wishRole||ROLE_LABELS[order.indexOf(dp.id)]||"–"}</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <Card><Label>Fitness</Label><FitnessBar value={dp.fitness}/></Card>
            <Card>
              <Label>Vor dem Spiel</Label>
              <div style={{color:dp.ruhe?C.yellowText:C.greenText,fontSize:13,fontWeight:600}}>{dp.ruhe?"Braucht Stille":"Fokussiert"}</div>
            </Card>
          </div>

          {dp.wishRole && (
            <Card style={{marginBottom:10}}>
              <Label>Wunschposition</Label>
              <div style={{color:C.white,fontSize:14,fontWeight:600}}>{dp.wishRole}</div>
            </Card>
          )}

          {dp.strengths && dp.strengths.length>0 && (
            <Card style={{marginBottom:10}}>
              <Label>Staerken (Spieler)</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {dp.strengths.map(s=>{
                  const sl = STRENGTHS_LIST.find(x=>x.id===s);
                  return <span key={s} style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:20,padding:"3px 10px",color:C.accent,fontSize:11}}>{sl?.label||s}</span>;
                })}
              </div>
            </Card>
          )}

          {dp.note && (
            <Card style={{marginBottom:10}}>
              <Label>Nachricht</Label>
              <div style={{color:C.grayLight,fontSize:13,fontStyle:"italic"}}>"{dp.note}"</div>
            </Card>
          )}

          {/* Trainer Bewertung */}
          <Card style={{marginBottom:10,borderColor:"rgba(200,74,255,0.25)"}}>
            <Label>Trainer-Bewertung (privat)</Label>
            {TRAINER_ATTRIBUTES.map(attr=>{
              const val = (trainerAttributes[dp.uid]||{})[attr.id]||0;
              return (
                <div key={attr.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:C.gray,fontSize:11}}>{attr.label}</span>
                    <span style={{color:C.accent,fontSize:11,fontWeight:700}}>{val||"–"}/10</span>
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                      <button key={n} onClick={()=>setTrainerAttributes(prev=>({...prev,[dp.uid]:{...(prev[dp.uid]||{}),[attr.id]:n}}))}
                        style={{flex:1,height:20,borderRadius:2,border:"none",cursor:"pointer",background:n<=val?C.accent:"rgba(200,74,255,0.12)"}}/>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Trainer Staerken */}
          <Card style={{marginBottom:10,borderColor:"rgba(200,74,255,0.25)"}}>
            <Label>Trainer-Staerken (privat)</Label>
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

          {/* Position aendern */}
          <Card style={{marginBottom:10}}>
            <Label>Position im Team aendern</Label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {ROLE_LABELS.map((label,i)=>{
                const isCurrent = order[i]===dp.id;
                return (
                  <button key={i} onClick={()=>{if(!isCurrent){const o=[...order];const from=o.indexOf(dp.id);const dis=o[i];if(from!==-1)o[from]=dis;o[i]=dp.id;setOrder(o);showNotif(`${dp.name.split(" ")[0]} - ${label}`);}}}
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
          <Card>
            <Label>Direktchat</Label>
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
          {step:"2",title:"Spieler registrieren lassen",desc:"Spieler oeffnen die App, waehlen Spieler-Rolle und geben deinen Code ein."},
          {step:"3",title:"Taktik auswaehlen",desc:"Waehle eine Formation, passe die Aufstellung an und gib sie frei."},
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
                  <Label>Team-Code fuer Spieler</Label>
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
            {/* Feld */}
            {tab==="feld" && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:12,color:C.grayLight}}>Taktik: <span style={{color:C.white,fontWeight:600}}>{tactic.name}</span></div>
                  <button onClick={()=>setSwapFirst(null)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.gray,padding:"5px 10px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>
                    {swapFirst!==null?"Abbrechen":"Aufstellung"}
                  </button>
                </div>
                <Field positions={positions} order={order} players={players} interactive={true} swapFirst={swapFirst} onTap={handleFieldTap}/>
                <div style={{marginTop:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{color:C.defColor,fontSize:11}}>Defensiv</span>
                    <span style={{color:C.gray,fontSize:11}}>{mentalitaet<=30?"Sehr defensiv":mentalitaet<=50?"Ausgewogen":mentalitaet<=70?"Offensiv":"Sehr offensiv"}</span>
                    <span style={{color:C.offColor,fontSize:11}}>Offensiv</span>
                  </div>
                  <input type="range" min={0} max={100} value={mentalitaet} onChange={e=>setMentalitaet(Number(e.target.value))}
                    style={{width:"100%",accentColor:C.accent}}/>
                </div>
              </>
            )}

            {/* Taktik */}
            {tab==="taktik" && (
              <>
                <Label>Formation waehlen</Label>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                  {ALL_TACTICS.map(t=>(
                    <div key={t.id} onClick={()=>setTactic(t)}
                      style={{background:tactic.id===t.id?C.accentDim:C.surface,border:`1px solid ${tactic.id===t.id?C.accentBorder:C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{color:tactic.id===t.id?C.accent:C.white,fontWeight:700,fontSize:14}}>{t.name}</div>
                          <div style={{color:C.gray,fontSize:11,marginTop:2}}>{t.note}</div>
                        </div>
                        {tactic.id===t.id && <span style={{color:C.accent,fontSize:16,fontWeight:700}}>v</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={releaseTactic} style={{width:"100%",background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:10,color:C.accent,padding:"13px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>
                  "{tactic.name}" an Spieler freigeben
                </button>
                {tacticReleased && <div style={{color:C.greenText,fontSize:12,textAlign:"center",marginTop:8}}>Taktik freigegeben - Spieler sehen sie jetzt</div>}
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
                <Card style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <Label>Anwesenheit</Label>
                    <button onClick={()=>setAttendance({})} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.gray,padding:"3px 8px",cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>Reset</button>
                  </div>
                  <div style={{display:"flex",gap:20}}>
                    {[{k:"ja",l:"Dabei",c:C.greenText},{k:"vielleicht",l:"Vielleicht",c:C.yellowText},{k:"nein",l:"Fehlt",c:C.error},{k:null,l:"Offen",c:C.grayDark}].map(({k,l,c})=>(
                      <div key={l} style={{textAlign:"center"}}>
                        <div style={{color:c,fontSize:22,fontWeight:800}}>
                          {k===null?players.filter(p=>!p.isPlaceholder&&!attendance[p.uid||p.id]).length:players.filter(p=>!p.isPlaceholder&&attendance[p.uid||p.id]===k).length}
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
                    <div style={{color:C.grayDark,fontSize:11,marginTop:4}}>Team-Code: {user?.teamCode}</div>
                  </div>
                )}
                {players.filter(p=>!p.isPlaceholder).map(p=>{
                  const menuOpen = playerMenu===p.id;
                  const att = attendance[p.uid||p.id];
                  const attCfg = {ja:{l:"Dabei",c:C.greenText},vielleicht:{l:"Unsicher",c:C.yellowText},nein:{l:"Fehlt",c:C.error}};
                  return (
                    <div key={p.id} onClick={()=>setDetailId(p.id)} style={{background:C.surface,borderRadius:12,padding:"12px 14px",marginBottom:8,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:C.bg,flexShrink:0}}>
                        {p.number}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{color:C.white,fontWeight:600,fontSize:14}}>{p.name}</div>
                        <div style={{color:C.gray,fontSize:11}}>{p.wishRole||ROLE_LABELS[order.indexOf(p.id)]||"–"}</div>
                        {p.fitness && <div style={{marginTop:4}}><FitnessBar value={p.fitness}/></div>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                        {att && attCfg[att] && (
                          <span style={{background:`${attCfg[att].c}18`,border:`1px solid ${attCfg[att].c}55`,borderRadius:20,padding:"2px 8px",color:attCfg[att].c,fontSize:10,fontWeight:600}}>{attCfg[att].l}</span>
                        )}
                        <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>setPlayerMenu(menuOpen?null:p.id)}
                            style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:6,color:C.gray,padding:"4px 8px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
                            ...
                          </button>
                          {menuOpen && (
                            <div style={{position:"absolute",right:0,top:"100%",marginTop:4,background:C.surface2,borderRadius:10,border:`1px solid ${C.borderHi}`,overflow:"hidden",zIndex:50,minWidth:200,boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
                              <div style={{padding:"8px 12px",borderBottom:`1px solid ${C.border}`}}>
                                <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>Anwesenheit</div>
                                <div style={{display:"flex",gap:6}}>
                                  {[{k:"ja",l:"Dabei",c:C.greenText},{k:"vielleicht",l:"Unsicher",c:C.yellowText},{k:"nein",l:"Fehlt",c:C.error}].map(opt=>(
                                    <button key={opt.k} onClick={()=>{setAttendance(prev=>({...prev,[p.uid||p.id]:opt.k}));setPlayerMenu(null);showNotif(`${p.name.split(" ")[0]}: ${opt.l}`);}}
                                      style={{flex:1,padding:"5px 4px",borderRadius:6,cursor:"pointer",fontSize:9,fontFamily:"inherit",fontWeight:600,
                                        border:`1px solid ${att===opt.k?opt.c:`${opt.c}44`}`,background:att===opt.k?`${opt.c}22`:"transparent",color:opt.c}}>
                                      {opt.l}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <button onClick={()=>{setPlayerMenu(null);setConfirmRemove(p);}}
                                style={{width:"100%",background:"transparent",border:"none",color:C.error,padding:"11px 16px",cursor:"pointer",fontSize:13,fontFamily:"inherit",textAlign:"left"}}>
                                Aus Team entfernen
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Chat */}
            {tab==="chat" && (
              <>
                {!detailId ? (
                  <>
                    <Label>Direktchat - Spieler auswaehlen</Label>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {players.filter(p=>!p.isPlaceholder).map(p=>(
                        <div key={p.id} onClick={()=>setDetailId(p.id)}
                          style={{background:C.surface,borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,border:`1px solid ${C.border}`,cursor:"pointer"}}>
                          <div style={{width:36,height:36,borderRadius:"50%",background:C.accentDim,border:`1px solid ${C.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:C.accent,flexShrink:0}}>{p.number}</div>
                          <div style={{flex:1}}>
                            <div style={{color:C.white,fontWeight:600,fontSize:13}}>{p.name}</div>
                            <div style={{color:C.gray,fontSize:11}}>{p.wishRole||"–"}</div>
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
                    <button onClick={()=>setDetailId(null)} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,marginBottom:14,padding:0}}>
                      Alle Spieler
                    </button>
                    <div style={{color:C.white,fontWeight:700,fontSize:15,marginBottom:12}}>Chat mit {players.find(p=>p.id===detailId)?.name}</div>
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
                    <Label>Naechste Termine</Label>
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
                  <Label>Zum naechsten Spiel</Label>
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
                    {["Torwart","Innenverteidiger","Aussenverteidiger","Defensives MF","Zentrales MF","Offensives MF","Aussenband","Stuermer"].map(pos=>(
                      <Pill key={pos} active={myWish===pos} onClick={()=>setMyWish(pos)}>{pos}</Pill>
                    ))}
                  </div>
                </Card>

                <Card style={{marginBottom:10}}>
                  <Label>Meine Staerken</Label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {STRENGTHS_LIST.map(s=>(
                      <Pill key={s.id} active={myStrengths.includes(s.id)} onClick={()=>setMyStrengths(prev=>prev.includes(s.id)?prev.filter(x=>x!==s.id):[...prev,s.id])}>
                        {s.label}
                      </Pill>
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

            {/* Feld - Atom Navigation */}
            {tab==="feld" && (
              <>
                {playerFieldView===null ? (
                  <>
                    <div style={{color:C.accent,fontSize:12,textAlign:"center",marginBottom:8}}>Taktik: {releasedTactic.name}</div>
                    <div style={{position:"relative",height:300,margin:"0 auto"}}>
                      {[130,90,50].map((r,i)=>(
                        <div key={i} style={{position:"absolute",top:"50%",left:"50%",width:r*2,height:r*2,borderRadius:"50%",border:`1px solid rgba(200,74,255,${0.06+i*0.04})`,transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
                      ))}
                      {[
                        {id:0,label:"Aufstellung",sub:releasedTactic.name,color:C.accent,x:0,y:0,size:90},
                        {id:1,label:"Offensiv",sub:"Angriff",color:C.offColor,x:0,y:-115,size:68},
                        {id:2,label:"Defensiv",sub:"Abwehr",color:C.defColor,x:0,y:115,size:68},
                        {id:3,label:"Ecke Links",sub:"",color:"#e0c040",x:-115,y:-60,size:64},
                        {id:4,label:"Ecke Rechts",sub:"",color:C.greenText,x:115,y:-60,size:64},
                      ].map(item=>(
                        <button key={item.id} onClick={()=>setPlayerFieldView(item.id)}
                          style={{position:"absolute",top:"50%",left:"50%",width:item.size,height:item.size,borderRadius:"50%",
                            background:`${item.color}15`,border:`2px solid ${item.color}88`,
                            transform:`translate(calc(-50% + ${item.x}px),calc(-50% + ${item.y}px))`,
                            cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                          <span style={{color:item.color,fontSize:9,fontWeight:700,textAlign:"center",padding:"0 4px"}}>{item.label}</span>
                          {item.sub && <span style={{color:`${item.color}99`,fontSize:8}}>{item.sub}</span>}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <button onClick={()=>setPlayerFieldView(null)} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,marginBottom:12,padding:0}}>
                      zurueck zur Uebersicht
                    </button>
                    {playerFieldView===0 && <Field positions={positions} order={order} players={players} interactive={false}/>}
                    {playerFieldView===1 && <Field positions={positions.map(p=>({...p,y:Math.max(4,p.y-8)}))} order={order} players={players} interactive={false}/>}
                    {playerFieldView===2 && <Field positions={positions.map(p=>({...p,y:Math.min(96,p.y+8)}))} order={order} players={players} interactive={false}/>}
                    {(playerFieldView===3||playerFieldView===4) && (
                      <div style={{color:C.gray,fontSize:13,textAlign:"center",padding:"40px 0"}}>Eckball-Aufstellung wird vom Trainer konfiguriert</div>
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
