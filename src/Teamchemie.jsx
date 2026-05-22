import { useState, useRef, useEffect } from "react";
import { db } from "./App.jsx";
import { collection, onSnapshot, doc, setDoc, updateDoc, query, where, orderBy } from "firebase/firestore";

const C = {
  bg:         "#12122a",
  surface:    "#1a1a35",
  surface2:   "#22224a",
  border:     "rgba(255,255,255,0.09)",
  borderHi:   "rgba(180,100,255,0.35)",
  accent:     "#c84aff",
  accentDim:  "rgba(200,74,255,0.15)",
  accentBorder:"rgba(200,74,255,0.4)",
  green:      "#1e3a4a",
  greenLight: "#2a5a6a",
  greenText:  "#4ac8c8",
  white:      "#ffffff",
  gray:       "#7878aa",
  grayDark:   "#44446a",
  grayLight:  "#c0c0e0",
  error:      "#cc3355",
  yellowText: "#e0b040",
  offColor:   "#ff7040",
  defColor:   "#4090e0",
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

const TACTIC_FORMATION = {
  1:"4-4-2",  2:"4-3-3",  3:"4-2-3-1", 4:"3-5-2",  5:"5-3-2",
  6:"4-1-4-1",7:"4-5-1",  8:"3-4-3",   9:"4-3-1-2",10:"4-2-2-2",
  11:"3-4-2-1",12:"5-4-1",13:"4-1-2-1-2",14:"3-1-4-2",
};

const ALL_TACTICS = [
  {id:1,  name:"4-4-2",       note:"Klassische, ausgeglichene Formation mit zwei Stürmern. Stark für Flanken und kompakte Defensive."},
  {id:2,  name:"4-3-3",       note:"Sehr beliebt im modernen Pressingfußball. Breite über die Flügel, dominant im Ballbesitz."},
  {id:3,  name:"4-2-3-1",     note:"Einer der häufigsten Standards heute. Zwei Sechser geben Stabilität, offensiver Zehner verbindet Mittelfeld und Angriff."},
  {id:4,  name:"3-5-2",       note:"Viele Teams nutzen es für Überzahl im Mittelfeld. Wingbacks liefern Breite."},
  {id:5,  name:"5-3-2",       note:"Defensivere Variante des 3-5-2. Gut gegen starke Gegner und für Konterspiel."},
  {id:6,  name:"4-1-4-1",     note:"Kontrollorientiert mit einem tiefen Sechser. Stabil gegen Konter."},
  {id:7,  name:"4-5-1",       note:"Kompakt und defensiv stark. Häufig gegen ballbesitzstarke Gegner."},
  {id:8,  name:"3-4-3",       note:"Aggressives Pressing und schnelle Flügelangriffe. Oft von offensiven Teams genutzt."},
  {id:9,  name:"4-3-1-2",     note:"Enge Formation mit Zehner und zwei Spitzen. Fokus auf Zentrum statt Flügelspiel."},
  {id:10, name:"4-2-2-2",     note:"Sehr kompakt im Zentrum. Bekannt aus dem Red-Bull-Pressingstil."},
  {id:11, name:"3-4-2-1",     note:"Moderne Variante mit zwei offensiven Halbräumen hinter einer Spitze."},
  {id:12, name:"5-4-1",       note:"Tief stehende Abwehrformation für Defensiv- und Umschaltspiel."},
  {id:13, name:"4-1-2-1-2 Raute", note:"Starke Kontrolle im Mittelfeldzentrum, aber anfällig auf den Außen."},
  {id:14, name:"3-1-4-2",     note:"Flexible Ballbesitzformation mit tiefem Spielmacher vor der Abwehr."},
];

// ── POSITIONEN – L/R gleich beschrieben ──────────────────
const AV_INFO   = "Sichert die Abwehrseite und unterstützt offensiv über die Außenbahn. Schnelligkeit, Zweikampfstärke und Ausdauer sind entscheidend.";
const IV_INFO   = "Zentraler Abwehrspieler im Herz der Defensive. Klärt Bälle, gewinnt Kopfballduelle und leitet Angriffe ein. Körperstärke und Übersicht sind Pflicht.";
const WB_INFO   = "Übernimmt in Dreierketten-Systemen die gesamte Außenbahn – defensiv absichern und offensiv Flanken schlagen. Benötigt extreme Ausdauer.";
const AM_INFO   = "Agiert auf der Außenbahn im Mittelfeld. Kann nach innen ziehen und abschließen oder klassisch flanken. Schnelligkeit und Dribbling sind entscheidend.";
const FLST_INFO = "Agiert auf der Außenposition im Sturm. Kombiniert Schnelligkeit mit Abschlussstärke und kann sowohl flanken als auch direkt abschließen.";

const POSITION_GROUPS = [
  {
    group:"Torwart",
    positions:[
      {id:"TW",  label:"Torwart",            short:"TW",
       info:"Hält das Tor, dirigiert die Abwehrkette und verteilt Bälle ins Aufbauspiel. Benötigt Reaktionsvermögen, Stellungsspiel und Kommunikationsstärke."},
    ]
  },
  {
    group:"Abwehr",
    positions:[
      {id:"LV",  label:"Links-Verteidiger",  short:"LV",  info:AV_INFO},
      {id:"RV",  label:"Rechts-Verteidiger", short:"RV",  info:AV_INFO},
      {id:"IVL", label:"Innenverteidiger L", short:"IV",  info:IV_INFO},
      {id:"IVR", label:"Innenverteidiger R", short:"IV",  info:IV_INFO},
      {id:"LWB", label:"Linker Wingback",    short:"LWB", info:WB_INFO},
      {id:"RWB", label:"Rechter Wingback",   short:"RWB", info:WB_INFO},
    ]
  },
  {
    group:"Mittelfeld",
    positions:[
      {id:"DM",  label:"Defensives Mittelfeld",  short:"DM",
       info:"Absichernder Spieler vor der Abwehr, auch '6' genannt. Unterbricht Angriffe, verteilt einfache Bälle und schützt die Innenverteidiger."},
      {id:"ZML", label:"Zentrales Mittelfeld L", short:"ZM",
       info:"Das Herzstück des Teams. Verbindet Abwehr und Angriff, gewinnt Zweikämpfe und schaltet schnell um. Benötigt Ausdauer, Übersicht und Passstärke."},
      {id:"ZMR", label:"Zentrales Mittelfeld R", short:"ZM",
       info:"Das Herzstück des Teams. Verbindet Abwehr und Angriff, gewinnt Zweikämpfe und schaltet schnell um. Benötigt Ausdauer, Übersicht und Passstärke."},
      {id:"ZAM", label:"Offensives Mittelfeld",  short:"ZAM",
       info:"Kreative Schaltzentrale hinter den Stürmern, auch 'Zehner' genannt. Verteilt Schlüsselpässe, schafft Torchancen und hat Freiheiten im Spiel."},
      {id:"LA",  label:"Linksaußen",             short:"LA",  info:AM_INFO},
      {id:"RA",  label:"Rechtsaußen",            short:"RA",  info:AM_INFO},
    ]
  },
  {
    group:"Sturm",
    positions:[
      {id:"ST",  label:"Stürmer",            short:"ST",
       info:"Zielspieler im Angriff. Hält Bälle fest, schafft Raum für Mitspieler und erzielt Tore. Kombination aus Abschluss, Positionsgefühl und Kraft."},
      {id:"LST", label:"Linker Stürmer",     short:"LS",  info:FLST_INFO},
      {id:"RST", label:"Rechter Stürmer",    short:"RS",  info:FLST_INFO},
    ]
  },
];

const ROLE_LABELS = ["Torwart","Außenverteidiger L","Innenverteidiger L","Innenverteidiger R","Außenverteidiger R","Mittelfeld 1","Mittelfeld 2","Mittelfeld 3","Außenbahn L","Stürmer","Außenbahn R"];

const STRENGTHS_LIST = [
  {id:"abschluss",    label:"Abschluss",       info:"Schussgenauigkeit und Timing vor dem Tor."},
  {id:"flanken",      label:"Flanken",         info:"Qualität der Hereingaben von der Außenbahn."},
  {id:"standards",    label:"Standards",       info:"Freistöße und Ecken – gefährliche Standardsituationen."},
  {id:"elfmeter",     label:"Elfmeter",        info:"Nervenstärke und Technik beim Strafstoß."},
  {id:"dribbling",    label:"Dribbling",       info:"Fähigkeit, Gegner im Eins-gegen-Eins zu überwinden."},
  {id:"passspiel",    label:"Passspiel",       info:"Präzision und Kreativität beim Passen."},
  {id:"kopfball",     label:"Kopfball",        info:"Stärke bei Kopfbällen – offensiv wie defensiv."},
  {id:"zweikampf",    label:"Zweikampf",       info:"Aggressivität und Erfolgsquote in direkten Duellen."},
  {id:"schnelligkeit",label:"Schnelligkeit",   info:"Tempo auf kurzen und langen Distanzen."},
  {id:"ausdauer",     label:"Ausdauer",        info:"Fitness und Laufbereitschaft über 90 Minuten."},
  {id:"fuehrung",     label:"Führungsqualität",info:"Kommunikation, Motivation und Vorbildfunktion im Team."},
  {id:"intelligenz",  label:"Spielintelligenz",info:"Taktisches Verständnis, Antizipation und kluge Entscheidungen."},
];

// Trainer-Attribute (nur Trainer sieht diese)
const TRAINER_ATTRIBUTES = [
  {id:"gesamtwertung",  label:"Gesamtwertung",   info:"Deine persönliche Einschätzung des Spielers (1-10)."},
  {id:"potenzial",      label:"Potenzial",        info:"Entwicklungspotenzial des Spielers (1-10)."},
  {id:"einstellung",    label:"Einstellung",      info:"Trainingsfleiß, Disziplin und Teamgeist (1-10)."},
  {id:"konstanz",       label:"Konstanz",         info:"Wie verlässlich ist die Leistung des Spielers (1-10)?"},
];

const STRONG_FOOT_OPTIONS = [
  {id:"rechts", label:"Rechts",     info:"Dein rechter Fuß ist dein dominanter Spielfuß."},
  {id:"links",  label:"Links",      info:"Dein linker Fuß ist dein dominanter Spielfuß."},
  {id:"beide",  label:"Beide Füße", info:"Du bist beidfüßig und kannst mit beiden Füßen gleich gut spielen."},
];

const FIELD_INFOS = {
  fitness:  "Wie fit fühlst du dich für das heutige Spiel? 100% bedeutet topfit und beschwerdefrei. Sei ehrlich – der Trainer kann dich nur richtig einsetzen, wenn er deinen Zustand kennt.",
  vorspiel: "Brauchst du vor dem Spiel Ruhe und Konzentration, oder holst du dir Energie durch Musik und Gespräche? Diese Info hilft dem Trainer, die Kabinenatmosphäre für dich zu gestalten.",
  wunsch:   "Auf welcher Position fühlst du dich am wohlsten und bringst du deine Stärken am besten ein? Der Trainer berücksichtigt deine Angabe bei der Aufstellung – bitte beachte jedoch, dass taktische und situative Anforderungen vorgehen und eine Garantie nicht möglich ist.",
  staerken: "Wähle die Bereiche aus, in denen du dich besonders stark fühlst. Der Trainer verteilt damit Standards, Elfmeter und taktische Aufgaben.",
  harmonie: "Mit welchen Mitspielern harmonierst du auf dem Platz am besten – sei es durch gutes Kombinationsspiel, gegenseitiges Verständnis oder ergänzende Qualitäten.",
  nachricht:"Etwas Wichtiges das nicht in die anderen Felder passt – eine Verletzung, persönliche Situation oder taktischer Hinweis.",
  mentalitaet: "Lege den grundsätzlichen Ansatz deiner Mannschaft fest. Links bedeutet maximale Defensive und Sicherheit, rechts maximalen Offensivdruck. Die Mitte ist ein ausgewogener Ansatz.",
};

const INIT_PLAYERS = [
  {id:1, name:"Max Müller",   number:1,  fitness:90,ruhe:false,partners:[2,3], note:"",                           wishRole:"Torwart",              strengths:["elfmeter"],                   strongFoot:"rechts"},
  {id:2, name:"Jonas Weber",  number:5,  fitness:70,ruhe:true, partners:[3,5], note:"Knie etwas verspannt",       wishRole:"Zentrales Mittelfeld L",strengths:["passspiel","standards"],       strongFoot:"rechts"},
  {id:3, name:"Lukas Bauer",  number:4,  fitness:85,ruhe:false,partners:[2,4], note:"",                           wishRole:"Innenverteidiger L",    strengths:["passspiel"],                   strongFoot:"rechts"},
  {id:4, name:"Tim Fischer",  number:3,  fitness:60,ruhe:true, partners:[3],   note:"Schlecht geschlafen",        wishRole:"Links-Verteidiger",     strengths:[],                             strongFoot:"links"},
  {id:5, name:"Felix Schulz", number:2,  fitness:95,ruhe:false,partners:[2,6], note:"",                           wishRole:"Rechts-Verteidiger",    strengths:["flanken","dribbling"],         strongFoot:"rechts"},
  {id:6, name:"Nico Wagner",  number:8,  fitness:80,ruhe:false,partners:[7,8], note:"",                           wishRole:"Zentrales Mittelfeld L",strengths:["passspiel","standards"],       strongFoot:"rechts"},
  {id:7, name:"Kevin Braun",  number:6,  fitness:75,ruhe:false,partners:[6,8], note:"",                           wishRole:"Zentrales Mittelfeld R",strengths:["passspiel"],                   strongFoot:"beide"},
  {id:8, name:"Lars Hofmann", number:10, fitness:88,ruhe:true, partners:[6,9], note:"Brauche heute etwas Abstand",wishRole:"Linksaußen",            strengths:["dribbling","flanken","abschluss"],strongFoot:"links"},
  {id:9, name:"Sven Koch",    number:11, fitness:92,ruhe:false,partners:[10,8],note:"",                           wishRole:"Linksaußen",            strengths:["dribbling","abschluss"],       strongFoot:"rechts"},
  {id:10,name:"Tobias Klein", number:9,  fitness:65,ruhe:false,partners:[9,11],note:"Leichte Erkältung",          wishRole:"Stürmer",               strengths:["abschluss","elfmeter"],        strongFoot:"rechts"},
  {id:11,name:"Finn Richter", number:7,  fitness:78,ruhe:false,partners:[10],  note:"",                           wishRole:"Rechtsaußen",           strengths:["flanken","dribbling"],         strongFoot:"beide"},
];

const CHAT_INIT = [
  {from:"trainer",text:"Lars, heute bitte auf der linken Seite spielen.",time:"09:12"},
  {from:"player", text:"Klar Trainer, kein Problem!",time:"09:15"},
];

// Mentalitäts-Label aus Wert 0-100
function mentalitaetLabel(v) {
  if (v<=15)  return "Sehr defensiv";
  if (v<=30)  return "Defensiv";
  if (v<=45)  return "Leicht defensiv";
  if (v<=55)  return "Ausgewogen";
  if (v<=70)  return "Leicht offensiv";
  if (v<=85)  return "Offensiv";
  return "Sehr offensiv";
}
function mentalitaetColor(v) {
  if (v<=30)  return C.defColor;
  if (v<=55)  return C.greenText;
  return C.offColor;
}

// ── HILFSKOMPONENTEN ──────────────────────────────────────
function InfoBtn({text}) {
  const [open,setOpen]=useState(false);
  return (
    <span style={{position:"relative",display:"inline-block"}}>
      <button onClick={()=>setOpen(!open)} style={{
        width:15,height:15,borderRadius:"50%",border:`1px solid ${C.grayDark}`,
        background:"transparent",color:C.gray,fontSize:9,fontWeight:700,
        cursor:"pointer",padding:0,fontFamily:"inherit",
        display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,
      }}>i</button>
      {open&&(
        <>
          <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:50}}/>
          <div style={{position:"absolute",left:0,top:20,width:210,background:C.surface2,border:`1px solid ${C.borderHi}`,borderRadius:10,padding:"10px 12px",color:C.grayLight,fontSize:11,lineHeight:1.6,zIndex:51,boxShadow:"0 4px 20px rgba(0,0,0,0.7)"}}>
            {text}
          </div>
        </>
      )}
    </span>
  );
}

function FitnessBar({value}) {
  const color=value>=80?C.greenText:value>=60?C.yellowText:C.error;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:3,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden"}}>
        <div style={{width:`${value}%`,height:"100%",background:color,borderRadius:2,transition:"width 0.4s"}}/>
      </div>
      <span style={{color,fontSize:11,fontWeight:600,minWidth:28}}>{value}%</span>
    </div>
  );
}

function Pill({children,active,onClick}) {
  return (
    <button onClick={onClick} style={{padding:"5px 12px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",border:`1px solid ${active?C.greenLight:C.border}`,background:active?C.green:"transparent",color:active?C.white:C.gray,transition:"all 0.15s"}}>
      {children}
    </button>
  );
}

function Card({children,style={}}) {
  return <div style={{background:C.surface,borderRadius:12,padding:14,border:`1px solid ${C.border}`,...style}}>{children}</div>;
}

function Label({children,info}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
      <span style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>{children}</span>
      {info&&<InfoBtn text={info}/>}
    </div>
  );
}

function Tab({label,active,onClick}) {
  return (
    <button onClick={onClick} style={{flex:1,padding:"8px 4px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",
      border:`1px solid ${active?C.accentBorder:C.border}`,
      background:active?C.accentDim:"transparent",
      color:active?C.accent:C.gray,transition:"all 0.15s"}}>
      {label}
    </button>
  );
}

function Btn({children,onClick,disabled}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:9,color:C.accent,padding:"11px 16px",cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",opacity:disabled?0.5:1,transition:"all 0.15s",width:"100%"}}>
      {children}
    </button>
  );
}

function GhostBtn({children,onClick}) {
  return (
    <button onClick={onClick} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:9,color:C.gray,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:500,fontFamily:"inherit"}}>
      {children}
    </button>
  );
}

function ChatUI({chat,chatInput,setChatInput,sendChat,isTrainer}) {
  return <>
    <div style={{background:C.surface2,borderRadius:10,padding:12,height:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,border:`1px solid ${C.border}`,marginBottom:10}}>
      {chat.map((msg,i)=>{
        const mine=isTrainer?msg.from==="trainer":msg.from==="player";
        return (
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:mine?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"78%",background:mine?C.green:C.surface,border:`1px solid ${C.border}`,borderRadius:mine?"12px 12px 4px 12px":"12px 12px 12px 4px",padding:"8px 12px"}}>
              <div style={{color:C.white,fontSize:13}}>{msg.text}</div>
            </div>
            <div style={{color:C.grayDark,fontSize:10,marginTop:2}}>{msg.time}</div>
          </div>
        );
      })}
    </div>
    <div style={{display:"flex",gap:8}}>
      <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}
        placeholder={isTrainer?"Nachricht schreiben...":"Nachricht an Trainer..."}
        style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
      <button onClick={sendChat} style={{background:C.green,border:`1px solid ${C.greenLight}`,borderRadius:8,color:C.white,padding:"0 16px",cursor:"pointer",fontSize:13,fontWeight:600}}>Senden</button>
    </div>
  </>;
}

function PositionPicker({value,onChange}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {POSITION_GROUPS.map(group=>(
        <div key={group.group}>
          <div style={{color:C.grayDark,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>
            {group.group}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {group.positions.map(pos=>{
              const active=value===pos.label;
              return (
                <div key={pos.id} style={{display:"flex",alignItems:"center",gap:4}}>
                  <button onClick={()=>onChange(pos.label)} style={{
                    padding:"5px 10px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",
                    border:`1px solid ${active?C.greenLight:C.border}`,
                    background:active?C.green:"transparent",color:active?C.white:C.gray,transition:"all 0.15s",
                  }}>
                    <span style={{color:active?C.greenText:C.grayDark,fontSize:9,marginRight:4}}>{pos.short}</span>
                    {pos.label}
                  </button>
                  <InfoBtn text={pos.info}/>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StaerkenPicker({value,onChange}) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
      {STRENGTHS_LIST.map(s=>{
        const active=value.includes(s.id);
        return (
          <div key={s.id} style={{display:"flex",alignItems:"center",gap:4}}>
            <button onClick={()=>onChange(active?value.filter(v=>v!==s.id):[...value,s.id])} style={{padding:"5px 12px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",border:`1px solid ${active?C.greenLight:C.border}`,background:active?C.green:"transparent",color:active?C.white:C.gray,transition:"all 0.15s"}}>
              {s.label}
            </button>
            <InfoBtn text={s.info}/>
          </div>
        );
      })}
    </div>
  );
}

// ── LINEARER REGLER (kein Halbkreis) ─────────────────────
function LinearSlider({value, onChange, leftLabel, rightLabel, colorFn, labelFn, scaleLbls, gradient}) {
  const trackRef = useRef(null);
  const color = colorFn(value);
  const label = labelFn(value);

  function handleInteraction(clientX) {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(pct * 100));
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{color:C.gray,fontSize:11}}>{leftLabel}</span>
        <span style={{color,fontSize:13,fontWeight:700,transition:"color 0.3s"}}>{label}</span>
        <span style={{color:C.gray,fontSize:11}}>{rightLabel}</span>
      </div>
      <div ref={trackRef}
        onClick={e=>handleInteraction(e.clientX)}
        onMouseMove={e=>{if(e.buttons===1)handleInteraction(e.clientX);}}
        onTouchMove={e=>handleInteraction(e.touches[0].clientX)}
        onTouchStart={e=>handleInteraction(e.touches[0].clientX)}
        style={{position:"relative",height:6,borderRadius:3,cursor:"pointer",
          background:gradient, userSelect:"none", marginBottom:8,
        }}>
        <div style={{
          position:"absolute",top:"50%",left:`${value}%`,
          transform:"translate(-50%,-50%)",
          width:20,height:20,borderRadius:"50%",
          background:C.surface2,border:`2px solid ${color}`,
          boxShadow:`0 0 10px ${color}99`,
          transition:"border-color 0.2s",pointerEvents:"none",
        }}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        {scaleLbls.map(l=>(
          <span key={l} style={{color:C.grayDark,fontSize:8,textAlign:"center"}}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function MentalitaetSlider({value, onChange}) {
  return <LinearSlider
    value={value} onChange={onChange}
    leftLabel="Defensiv" rightLabel="Offensiv"
    labelFn={mentalitaetLabel}
    colorFn={mentalitaetColor}
    gradient={`linear-gradient(to right, ${C.defColor}, ${C.greenText}, ${C.offColor})`}
    scaleLbls={["Riegel","Defensiv","Ausgewogen","Offensiv","Pressing"]}
  />;
}

// ── FOKUS-REGLER ──────────────────────────────────────────
function fokusLabel(v) {
  if (v <= 20)  return "Energie von außen";
  if (v <= 40)  return "Eher aktiv";
  if (v <= 60)  return "Neutral";
  if (v <= 80)  return "Eher zurückgezogen";
  return "Stille für Fokus";
}
function fokusColor(v) {
  if (v <= 20)  return C.offColor;
  if (v <= 40)  return C.yellowText;
  if (v <= 60)  return C.greenText;
  if (v <= 80)  return "#7090e0";
  return C.defColor;
}

function FokusSlider({value, onChange}) {
  return <LinearSlider
    value={value} onChange={onChange}
    leftLabel="Energie" rightLabel="Stille"
    labelFn={fokusLabel}
    colorFn={fokusColor}
    gradient={`linear-gradient(to right, ${C.offColor}, ${C.yellowText}, ${C.greenText}, ${C.defColor})`}
    scaleLbls={["Musik","Eher aktiv","Neutral","Eher ruhig","Stille"]}
  />;
}
function PlayerInfoCard({player, players, order, onClose, onDetail}) {
  if (!player) return null;
  const idx = order.indexOf(player.id);
  return (
    <div style={{marginTop:10,background:C.surface,borderRadius:12,padding:14,border:`1px solid ${C.borderHi}`,animation:"fadeIn 0.15s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:C.bg,flexShrink:0}}>
            {player.number}
          </div>
          <div>
            <div style={{color:C.white,fontWeight:700,fontSize:14}}>{player.name}</div>
            <div style={{color:C.gray,fontSize:11,marginTop:1}}>{idx>=0?ROLE_LABELS[idx]:"–"}</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.gray,fontSize:20,cursor:"pointer",lineHeight:1,padding:0}}>×</button>
      </div>

      {/* Fitness */}
      <div style={{marginBottom:10}}>
        <div style={{color:C.grayDark,fontSize:10,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Fitnesszustand</div>
        <FitnessBar value={player.fitness}/>
      </div>

      {/* Status-Zeile */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
        <span style={{background:player.ruhe?"rgba(160,120,32,0.12)":"rgba(26,74,46,0.2)",border:`1px solid ${player.ruhe?"rgba(160,120,32,0.3)":C.greenLight}`,borderRadius:20,padding:"3px 10px",color:player.ruhe?C.yellowText:C.greenText,fontSize:11}}>
          {player.ruhe?"Braucht Stille":"Fokussiert"}
        </span>
        <span style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:20,padding:"3px 10px",color:C.grayLight,fontSize:11}}>
          Wunsch: {player.wishRole}
        </span>
        {player.strongFoot&&(
          <span style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:20,padding:"3px 10px",color:C.grayLight,fontSize:11}}>
            {STRONG_FOOT_OPTIONS.find(o=>o.id===player.strongFoot)?.label}
          </span>
        )}
      </div>

      {/* Stärken */}
      {player.strengths?.length>0&&(
        <div style={{marginBottom:10}}>
          <div style={{color:C.grayDark,fontSize:10,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Stärken</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {player.strengths.map(sid=>{
              const s=STRENGTHS_LIST.find(x=>x.id===sid);
              return s?<span key={sid} style={{background:C.green,border:`1px solid ${C.greenLight}`,borderRadius:20,padding:"2px 9px",color:C.white,fontSize:10}}>{s.label}</span>:null;
            })}
          </div>
        </div>
      )}

      {/* Harmoniert mit */}
      {player.partners?.length>0&&(
        <div style={{marginBottom:12}}>
          <div style={{color:C.grayDark,fontSize:10,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Harmoniert mit</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {player.partners.map(pid=>{
              const p=players.find(pl=>pl.id===pid);
              return p?<span key={pid} style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:20,padding:"2px 9px",color:C.grayLight,fontSize:10}}>#{p.number} {p.name.split(" ")[0]}</span>:null;
            })}
          </div>
        </div>
      )}

      {player.note&&(
        <div style={{color:C.gray,fontSize:11,fontStyle:"italic",marginBottom:12}}>"{player.note}"</div>
      )}

      <button onClick={onDetail} style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:9,color:C.grayLight,padding:"8px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
        Vollständiges Profil öffnen
      </button>
    </div>
  );
}

// ── TAKTIK EDITOR KOMPONENTE ──────────────────────────────
// Wiederverwendbares Drag-Feld
function DragField({positions, setPositions, players, label, color="#6dbf8a"}) {
  const fieldRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  function getCoords(e) {
    const r = fieldRef.current?.getBoundingClientRect();
    if (!r) return {x:50,y:50};
    const cx = (e.touches?.[0]||e).clientX;
    const cy = (e.touches?.[0]||e).clientY;
    return {
      x: Math.max(4, Math.min(96, ((cx-r.left)/r.width)*100)),
      y: Math.max(4, Math.min(96, ((cy-r.top)/r.height)*100)),
    };
  }

  function onDown(e, idx) {
    e.preventDefault(); e.stopPropagation();
    setDragging(idx);
  }
  function onMove(e) {
    if (dragging===null) return;
    const {x,y} = getCoords(e);
    setPositions(prev=>prev.map((p,i)=>i===dragging?{...p,x,y}:p));
  }
  function onUp() { setDragging(null); }

  return (
    <div style={{position:"relative"}}>
      {/* Feld-Label */}
      <div style={{textAlign:"center",marginBottom:8}}>
        <span style={{background:`${color}22`,border:`1px solid ${color}55`,borderRadius:20,padding:"3px 14px",fontSize:11,fontWeight:600,color}}>{label}</span>
      </div>
      <div ref={fieldRef}
        onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchMove={onMove} onTouchEnd={onUp}
        style={{position:"relative",width:"100%",paddingBottom:"140%",background:"linear-gradient(180deg,#0e0e28 0%,#14143a 50%,#0e0e28 100%)",borderRadius:10,overflow:"hidden",border:`1px solid rgba(200,74,255,0.3)`,touchAction:"none"}}>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 100 140" preserveAspectRatio="none">
          {[0,1,2,3,4,5,6].map(i=><rect key={i} x="5" y={5+i*18.57} width="90" height="9.28" fill="rgba(200,74,255,0.025)"/>)}
          <rect x="5" y="5" width="90" height="130" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="0.7"/>
          <line x1="5" y1="70" x2="95" y2="70" stroke="rgba(200,74,255,0.35)" strokeWidth="0.7"/>
          <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="0.7"/>
          <circle cx="50" cy="70" r="1" fill="rgba(200,74,255,0.4)"/>
          <rect x="30" y="5"   width="40" height="16" fill="none" stroke="rgba(200,74,255,0.22)" strokeWidth="0.6"/>
          <rect x="30" y="119" width="40" height="16" fill="none" stroke="rgba(200,74,255,0.22)" strokeWidth="0.6"/>
          <rect x="18" y="5"   width="64" height="27" fill="none" stroke="rgba(200,74,255,0.12)" strokeWidth="0.6"/>
          <rect x="18" y="108" width="64" height="27" fill="none" stroke="rgba(200,74,255,0.12)" strokeWidth="0.6"/>
        </svg>
        {positions.map((pos,idx)=>{
          const player = players[idx];
          const isDrag = dragging===idx;
          return (
            <div key={idx}
              onMouseDown={e=>onDown(e,idx)}
              onTouchStart={e=>onDown(e,idx)}
              style={{position:"absolute",left:`${pos.x}%`,top:`${pos.y}%`,transform:"translate(-50%,-50%)",zIndex:isDrag?10:2,cursor:"grab",transition:isDrag?"none":"left 0.15s,top 0.15s",touchAction:"none"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:isDrag?color:C.surface2,border:`2px solid ${isDrag?color:"rgba(200,74,255,0.5)"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:isDrag?`0 0 12px ${color}88`:"0 2px 8px rgba(0,0,0,0.6)",pointerEvents:"none"}}>
                <span style={{color:C.white,fontSize:8,fontWeight:800,lineHeight:1}}>{player?.number||idx+1}</span>
                <span style={{color:"rgba(255,255,255,0.5)",fontSize:6,lineHeight:1.2,fontWeight:600}}>{player?.name.split(" ")[0].slice(0,5)||"Sp."}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Eckball-Feld – alle 11 Spieler positionierbar
function CornerField({players, positions, setPositions, side="links", type="offensiv"}) {
  const fieldRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const color = type==="offensiv" ? "#e07040" : "#4a90d9";

  function getCoords(e) {
    const r = fieldRef.current?.getBoundingClientRect();
    if (!r) return {x:50,y:50};
    const cx = (e.touches?.[0]||e).clientX;
    const cy = (e.touches?.[0]||e).clientY;
    return {
      x: Math.max(2, Math.min(98, ((cx-r.left)/r.width)*100)),
      y: Math.max(2, Math.min(98, ((cy-r.top)/r.height)*100)),
    };
  }
  function onDown(e,idx){e.preventDefault();e.stopPropagation();setDragging(idx);}
  function onMove(e){
    if(dragging===null)return;
    const {x,y}=getCoords(e);
    setPositions(prev=>prev.map((p,i)=>i===dragging?{...p,x,y}:p));
  }
  function onUp(){setDragging(null);}

  const isOff = type==="offensiv";

  return (
    <div ref={fieldRef}
      onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchMove={onMove} onTouchEnd={onUp}
      style={{position:"relative",width:"100%",paddingBottom:"75%",
        background:`linear-gradient(180deg,#0e0e28 0%,#14143a 100%)`,
        borderRadius:10,overflow:"hidden",border:`1px solid rgba(200,74,255,0.25)`,touchAction:"none"}}>

      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 100 75" preserveAspectRatio="none">
        <rect x="2" y="2" width="96" height="71" fill="none" stroke="rgba(200,74,255,0.3)" strokeWidth="0.7"/>
        <line x1="2" y1="37.5" x2="98" y2="37.5" stroke="rgba(200,74,255,0.12)" strokeWidth="0.5" strokeDasharray="2,2"/>
        {isOff ? <>
          <rect x="18" y="2" width="64" height="22" fill="none" stroke="rgba(200,74,255,0.22)" strokeWidth="0.7"/>
          <rect x="32" y="2" width="36" height="11" fill="none" stroke="rgba(200,74,255,0.14)" strokeWidth="0.6"/>
        </> : <>
          <rect x="18" y="51" width="64" height="22" fill="none" stroke="rgba(200,74,255,0.22)" strokeWidth="0.7"/>
          <rect x="32" y="62" width="36" height="11" fill="none" stroke="rgba(200,74,255,0.14)" strokeWidth="0.6"/>
        </>}
      </svg>

      {positions.map((pos,idx)=>{
        const player=players[idx];
        const isDrag=dragging===idx;
        // TW (idx=0) bei offensiver Ecke ausblenden
        if (type==="offensiv" && idx===0) return null;
        return (
          <div key={idx}
            onMouseDown={e=>onDown(e,idx)}
            onTouchStart={e=>onDown(e,idx)}
            style={{position:"absolute",left:`${pos.x}%`,top:`${pos.y}%`,transform:"translate(-50%,-50%)",zIndex:isDrag?10:2,cursor:"grab",transition:isDrag?"none":"all 0.15s",touchAction:"none"}}>
            <div style={{
              width:26,height:26,borderRadius:"50%",
              background:isDrag?C.accent:C.surface2,
              border:`2px solid ${isDrag?C.accent:"rgba(200,74,255,0.6)"}`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              boxShadow:isDrag?`0 0 12px ${C.accent}99`:`0 0 6px rgba(200,74,255,0.4)`,
              pointerEvents:"none"
            }}>
              <span style={{color:C.white,fontSize:8,fontWeight:800,lineHeight:1}}>{player?.number||idx+1}</span>
              <span style={{color:"rgba(255,255,255,0.5)",fontSize:6,lineHeight:1.1,fontWeight:600}}>{player?.name.split(" ")[0].slice(0,4)||"Sp"}</span>
            </div>
          </div>
        );
      })}

      {/* Magenta Ecken-Marker */}
      <div style={{
        position:"absolute",
        left: side==="links" ? "2%" : "98%",
        top:  type==="offensiv" ? "2%" : "98%",
        transform:"translate(-50%,-50%)",
        zIndex:5,
      }}>
        <div style={{
          width:14,height:14,borderRadius:"50%",
          background:C.accent,
          boxShadow:`0 0 10px ${C.accent}, 0 0 20px ${C.accent}66`,
        }}/>
        <div style={{
          position:"absolute",top:"50%",left:"50%",
          transform:"translate(-50%,6px)",
          color:C.accent,fontSize:7,fontWeight:700,
          whiteSpace:"nowrap",
          textShadow:`0 0 6px ${C.accent}`,
        }}>Ecke</div>
      </div>
    </div>
  );
}

const DEFAULT_CORNER_OFF = [
  {x:50,y:18},{x:35,y:22},{x:65,y:22},{x:42,y:32},{x:58,y:32},
  {x:30,y:38},{x:70,y:38},{x:50,y:42},{x:25,y:50},{x:75,y:50},{x:50,y:58},
];
const DEFAULT_CORNER_DEF = [
  {x:50,y:57},{x:35,y:53},{x:65,y:53},{x:42,y:44},{x:58,y:44},
  {x:30,y:38},{x:70,y:38},{x:50,y:33},{x:25,y:28},{x:75,y:28},{x:50,y:22},
];

function TacticEditor({players, onSave, onClose}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [slide, setSlide] = useState(0); // 0=Grund, 1=Offensiv, 2=Defensiv, 3=Ecken
  const startX = useRef(null);

  const base433 = FORMATIONS["4-3-3"].map((p,i)=>({...p,id:i}));
  const [posGrund,   setPosGrund]   = useState(base433.map(p=>({...p})));
  const [posOffensiv,setPosOffensiv] = useState(base433.map(p=>({...p,y:Math.max(4,p.y-8)})));
  const [posDefensiv,setPosDefensiv] = useState(base433.map(p=>({...p,y:Math.min(96,p.y+8)})));

  const [cornerOffL, setCornerOffL] = useState(DEFAULT_CORNER_OFF.map(p=>({...p})));
  const [cornerOffR, setCornerOffR] = useState(DEFAULT_CORNER_OFF.map(p=>({...p,x:100-p.x})));
  const [cornerDefL, setCornerDefL] = useState(DEFAULT_CORNER_DEF.map(p=>({...p})));
  const [cornerDefR, setCornerDefR] = useState(DEFAULT_CORNER_DEF.map(p=>({...p,x:100-p.x})));
  const [cornerSide, setCornerSide] = useState("links");
  const [cornerType, setCornerType] = useState("offensiv");

  const SLIDES = [
    {label:"Grundausrichtung", color:C.greenText},
    {label:"Offensiv",         color:"#e07040"},
    {label:"Defensiv",         color:"#4a90d9"},
    {label:"Eckball",          color:"#c8a040"},
  ];

  function onTouchStartSwipe(e) { startX.current = e.touches[0].clientX; }
  function onTouchEndSwipe(e) {
    if (startX.current===null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40 && slide < 3) setSlide(s=>s+1);
    if (dx >  40 && slide > 0) setSlide(s=>s-1);
    startX.current = null;
  }

  const cornerPositions = cornerType==="offensiv"
    ? (cornerSide==="links" ? cornerOffL : cornerOffR)
    : (cornerSide==="links" ? cornerDefL : cornerDefR);
  const setCornerPositions = cornerType==="offensiv"
    ? (cornerSide==="links" ? setCornerOffL : setCornerOffR)
    : (cornerSide==="links" ? setCornerDefL : setCornerDefR);

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.white}}>
      <div style={{maxWidth:440,margin:"0 auto",padding:"20px 16px 48px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,padding:0}}>← Zurück</button>
          <div style={{fontSize:15,fontWeight:700}}>Taktik-Editor</div>
          <button onClick={()=>{
            if(!name.trim()) return;
            onSave({id:Date.now(),name,note,custom:true,posGrund,posOffensiv,posDefensiv});
          }} style={{background:name.trim()?C.green:"rgba(255,255,255,0.05)",border:`1px solid ${name.trim()?C.greenLight:C.border}`,borderRadius:8,color:name.trim()?C.white:C.gray,padding:"6px 14px",cursor:name.trim()?"pointer":"not-allowed",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>
            Speichern
          </button>
        </div>

        {/* Name & Notiz */}
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Formationsname, z.B. Mein 4-3-3"
          style={{width:"100%",background:C.surface,border:`1px solid ${name?C.borderHi:C.border}`,borderRadius:8,color:C.white,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Taktikhinweis für Spieler (optional)"
          style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:14}}/>

        {/* Slide Indikatoren */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {SLIDES.map((s,i)=>(
            <button key={i} onClick={()=>setSlide(i)} style={{flex:1,padding:"7px 4px",borderRadius:8,cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:"inherit",border:`1px solid ${slide===i?s.color:C.border}`,background:slide===i?`${s.color}22`:"transparent",color:slide===i?s.color:C.gray,transition:"all 0.15s"}}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Swipe-Bereich */}
        <div onTouchStart={onTouchStartSwipe} onTouchEnd={onTouchEndSwipe}>

          {slide===0 && (
            <DragField positions={posGrund} setPositions={setPosGrund} players={players} label="Grundausrichtung" color={C.greenText}/>
          )}

          {slide===1 && (
            <DragField positions={posOffensiv} setPositions={setPosOffensiv} players={players} label="Offensiv-Ausrichtung" color="#e07040"/>
          )}

          {slide===2 && (
            <DragField positions={posDefensiv} setPositions={setPosDefensiv} players={players} label="Defensiv-Ausrichtung" color="#4a90d9"/>
          )}

          {slide===3 && <>
            {/* Eckball-Auswahl */}
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              <div style={{flex:1,display:"flex",gap:6}}>
                {["offensiv","defensiv"].map(t=>(
                  <button key={t} onClick={()=>setCornerType(t)} style={{flex:1,padding:"7px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",border:`1px solid ${cornerType===t?(t==="offensiv"?"#e07040":"#4a90d9"):C.border}`,background:cornerType===t?(t==="offensiv"?"rgba(224,112,64,0.15)":"rgba(74,144,217,0.15)"):"transparent",color:cornerType===t?(t==="offensiv"?"#e07040":"#4a90d9"):C.gray}}>
                    {t==="offensiv"?"Angriff":"Abwehr"}
                  </button>
                ))}
              </div>
              <div style={{flex:1,display:"flex",gap:6}}>
                {["links","rechts"].map(s=>(
                  <button key={s} onClick={()=>setCornerSide(s)} style={{flex:1,padding:"7px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",border:`1px solid ${cornerSide===s?C.greenLight:C.border}`,background:cornerSide===s?C.green:"transparent",color:cornerSide===s?C.white:C.gray}}>
                    {s==="links"?"Links":"Rechts"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{background:C.surface,borderRadius:10,padding:12,border:`1px solid ${C.border}`,marginBottom:10}}>
              <div style={{color:C.gray,fontSize:10,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>
                {cornerType==="offensiv"?"Offensiv-Eckball":"Defensiv-Eckball"} — {cornerSide==="links"?"Linke Ecke":"Rechte Ecke"}
              </div>
              <CornerField players={players} positions={cornerPositions} setPositions={setCornerPositions} side={cornerSide} type={cornerType}/>
              <div style={{color:C.grayDark,fontSize:10,marginTop:8,textAlign:"center"}}>
                A–E = Spieler positionieren durch ziehen · Ecken-Marker zeigt die Ecke
              </div>
            </div>
          </>}

        </div>

        {/* Swipe-Hinweis */}
        <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:12}}>
          {SLIDES.map((_,i)=>(
            <div key={i} onClick={()=>setSlide(i)} style={{width:i===slide?20:6,height:6,borderRadius:3,background:i===slide?SLIDES[i].color:"rgba(255,255,255,0.15)",transition:"all 0.3s",cursor:"pointer"}}/>
          ))}
        </div>
        <div style={{textAlign:"center",color:C.grayDark,fontSize:10,marginTop:6}}>Wischen oder oben tippen zum Wechseln</div>

        {/* Reset */}
        {slide<3&&(
          <button onClick={()=>{
            const reset = FORMATIONS["4-3-3"].map((p,i)=>({...p,id:i}));
            if(slide===0) setPosGrund(reset.map(p=>({...p})));
            if(slide===1) setPosOffensiv(reset.map(p=>({...p,y:Math.max(4,p.y-8)})));
            if(slide===2) setPosDefensiv(reset.map(p=>({...p,y:Math.min(96,p.y+8)})));
          }} style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:9,color:C.gray,padding:"9px",cursor:"pointer",fontSize:12,fontFamily:"inherit",marginTop:10}}>
            Aktuelle Ansicht zurücksetzen
          </button>
        )}

        {!name.trim()&&(
          <div style={{marginTop:8,fontSize:11,color:C.error,textAlign:"center"}}>Namen eingeben um zu speichern</div>
        )}
      </div>
    </div>
  );
}

// ── HAUPTKOMPONENTE ───────────────────────────────────────
export default function Teamchemie({ user, onLogout }) {
  const isTrainer = user?.role === "trainer";
  const [view,setView]         = useState(user?.role || "player");
  const [tab,setTab]           = useState(isTrainer ? "feld" : "status");
  const [players,setPlayers]   = useState(INIT_PLAYERS);
  const [order,setOrder]       = useState(INIT_PLAYERS.map(p=>p.id));
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [tactic,setTactic]     = useState(ALL_TACTICS[0]);
  const [tacticReleased,setTacticReleased] = useState(true); // erste Taktik ist bereits freigegeben
  const [releasedTactic,setReleasedTactic] = useState(ALL_TACTICS[0]); // was Spieler sehen
  const [mentalitaet,setMentalitaet] = useState(50);
  const [customTactics,setCustomTactics] = useState([]);
  const [showTacticEditor,setShowTacticEditor] = useState(false);
  const [playerFieldSlide,setPlayerFieldSlide] = useState(0);
  const [playerSwipeStartX,setPlayerSwipeStartX] = useState(null);
  const [playerCornerSide,setPlayerCornerSide] = useState("links");
  const [chat,setChat]         = useState(CHAT_INIT);
  const [chatInput,setChatInput] = useState("");
  const [notif,setNotif]       = useState(null);
  const [detailId,setDetailId] = useState(null);
  const [editingNum,setEditingNum] = useState(null);
  const [numInput,setNumInput] = useState("");
  const [swapFirst,setSwapFirst] = useState(null);
  const [fieldSelected,setFieldSelected] = useState(null);
  const [confirmRemove,setConfirmRemove] = useState(null);
  const [playerMenu,setPlayerMenu]       = useState(null);
  const [showSettings,setShowSettings]   = useState(false);
  const [showImpressum,setShowImpressum] = useState(false);
  const [standards,setStandards] = useState({elfmeter:10, freistoss:6, eckeLinks:9, eckeRechts:5});
  const [swipeStartX, setSwipeStartX]   = useState(null);

  const trainerTabs = ["feld","spieler","taktik","chat","ai"];
  const playerTabs  = ["status","feld","chat"];

  function handleSwipe(endX) {
    if (swipeStartX === null) return;
    const dx = endX - swipeStartX;
    if (Math.abs(dx) < 50) return;
    const tabs = isTrainer ? trainerTabs : playerTabs;
    const idx  = tabs.indexOf(tab);
    if (dx < 0 && idx < tabs.length-1) setTab(tabs[idx+1]);
    if (dx > 0 && idx > 0)             setTab(tabs[idx-1]);
    setSwipeStartX(null);
  }
  const [trainerAttributes, setTrainerAttributes] = useState({});
  const [trainerStrengths, setTrainerStrengths] = useState({});

  const ME_ID = user?.uid;
  const meData = players.find(p=>p.uid===ME_ID) || players[0] || INIT_PLAYERS[7];
  const [myFitness,setMyFitness]     = useState(meData.fitness);
  const [myRuhe,setMyRuhe]           = useState(meData.ruhe);
  const [myFokus,setMyFokus]         = useState(meData.ruhe ? 80 : 20);
  const [myNote,setMyNote]           = useState(meData.note);
  const [myWish,setMyWish]           = useState(meData.wishRole);
  const [myPartners,setMyPartners]   = useState(meData.partners);
  const [myStrengths,setMyStrengths] = useState(meData.strengths);
  const [myFoot,setMyFoot]           = useState(meData.strongFoot);
  const [myFormation,setMyFormation] = useState("");

  const formKey   = tactic.custom ? tactic.name : TACTIC_FORMATION[tactic.id];
  const positions = tactic.custom
    ? tactic.posGrund
    : FORMATIONS[formKey] || FORMATIONS["4-3-3"];

  // Spieler aus Firebase laden
  useEffect(() => {
    if (!user?.teamCode) return;
    const q = query(
      collection(db, "users"),
      where("teamCode", "==", user.teamCode),
      where("role", "==", "player")
    );
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setLoadingPlayers(false);
        return;
      }
      const firebasePlayers = snap.docs.map((doc, idx) => ({
        id:         idx + 1,
        uid:        doc.id,
        name:       doc.data().name || "Unbekannt",
        number:     doc.data().number || idx + 1,
        fitness:    doc.data().fitness || 85,
        ruhe:       doc.data().ruhe || false,
        partners:   doc.data().partners || [],
        note:       doc.data().note || "",
        wishRole:   doc.data().wishRole || "",
        wishFormation: doc.data().wishFormation || "",
        strengths:  doc.data().strengths || [],
        strongFoot: doc.data().strongFoot || "",
      }));
      setPlayers(firebasePlayers);
      setOrder(firebasePlayers.map(p => p.id));
      setLoadingPlayers(false);
    });
    return unsub;
  }, [user?.teamCode]);

  function showNotif(msg){setNotif(msg);setTimeout(()=>setNotif(null),2200);}

  // Chat aus Firebase laden (1:1 zwischen Trainer und Spieler)
  const chatPartnerUid = isTrainer
    ? (detailId ? players.find(p=>p.id===detailId)?.uid : null)
    : user?.uid;

  const chatId = user?.teamCode && chatPartnerUid
    ? `${user.teamCode}_${chatPartnerUid}`
    : null;

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({
        from:      d.data().from,
        text:      d.data().text,
        time:      d.data().time,
        timestamp: d.data().timestamp,
      }));
      setChat(msgs);
    });
    return unsub;
  }, [chatId]);

  async function sendChat(){
    if(!chatInput.trim()) return;
    const time = new Date().toLocaleTimeString("de",{hour:"2-digit",minute:"2-digit"});
    const msg = {
      from:      isTrainer ? "trainer" : "player",
      text:      chatInput,
      time,
      timestamp: Date.now(),
    };
    setChatInput("");
    if (chatId) {
      try {
        await setDoc(
          doc(collection(db, "chats", chatId, "messages")),
          msg
        );
      } catch(e) {
        // Fallback lokaler Chat
        setChat(prev=>[...prev, msg]);
      }
    } else {
      setChat(prev=>[...prev, msg]);
    }
  }
  async function sendAiMessage() {
  function saveNumber(pid){
    const n=parseInt(numInput);
    if(!isNaN(n)&&n>0&&n<=99){setPlayers(prev=>prev.map(p=>p.id===pid?{...p,number:n}:p));showNotif("Rückennummer gespeichert");}
    setEditingNum(null);setNumInput("");
  }
  function chooseTactic(t){setTactic(t);setTacticReleased(false);setSwapFirst(null);setFieldSelected(null);showNotif(`"${t.name}" ausgewählt — noch nicht freigegeben`);}
  // Taktik aus Firebase laden (für Spieler)
  useEffect(() => {
    if (!user?.teamCode) return;
    const unsub = onSnapshot(doc(db, "teams", user.teamCode), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.releasedTacticId) {
        const found = [...ALL_TACTICS, ...customTactics].find(t => t.id === data.releasedTacticId);
        if (found) {
          setReleasedTactic(found);
          if (!isTrainer) setTactic(found);
        }
      }
    });
    return unsub;
  }, [user?.teamCode, customTactics]);

  function releaseTactic(){
    setReleasedTactic(tactic);
    setTacticReleased(true);
    // In Firebase speichern
    if (user?.teamCode) {
      updateDoc(doc(db, "teams", user.teamCode), {
        releasedTacticId:   tactic.id,
        releasedTacticName: tactic.name,
        releasedTacticNote: tactic.note,
      }).catch(console.error);
    }
    showNotif(`"${tactic.name}" an alle Spieler freigegeben`);
  }
  function handleFieldTap(idx){
    if (typeof swapFirst === "string" && swapFirst.startsWith("bank_")) {
      // Bankspieler wurde zuerst gewählt, jetzt Feldspieler
      const bankPid = parseInt(swapFirst.replace("bank_",""));
      const newOrder=[...order];
      const displaced=newOrder[idx];
      newOrder[idx]=bankPid;
      setOrder(newOrder);
      setSwapFirst(null);setFieldSelected(null);
      const bp=players.find(p=>p.id===bankPid);
      showNotif(`${bp?.name.split(" ")[0]||"Spieler"} eingewechselt`);
      return;
    }
    if(swapFirst===null){setSwapFirst(idx);setFieldSelected(idx);return;}
    if(swapFirst===idx){setSwapFirst(null);setFieldSelected(null);return;}
    if(typeof swapFirst==="number"){
      const o=[...order];[o[swapFirst],o[idx]]=[o[idx],o[swapFirst]];
      setOrder(o);setSwapFirst(null);setFieldSelected(null);showNotif("Spieler getauscht");
      return;
    }
    setFieldSelected(fieldSelected===idx?null:idx);
  }
  function assignToSlot(dp,slotIdx){
    const o=[...order];
    const from=o.indexOf(dp.id);
    const dis=o[slotIdx];
    if(from!==-1)o[from]=dis;
    o[slotIdx]=dp.id;
    setOrder(o);showNotif(`${dp.name.split(" ")[0]} — ${ROLE_LABELS[slotIdx]}`);
  }
  function syncStatus(){
    // Lokaler State
    setPlayers(prev=>prev.map(p=>p.uid===user.uid?{...p,fitness:myFitness,ruhe:myFokus>50,note:myNote,wishRole:myWish,partners:myPartners,strengths:myStrengths,strongFoot:myFoot,wishFormation:myFormation}:p));
    // Firebase speichern
    if (user?.uid) {
      updateDoc(doc(db, "users", user.uid), {
        fitness:   myFitness,
        ruhe:      myFokus > 50,
        note:      myNote,
        wishRole:  myWish,
        partners:  myPartners,
        strengths: myStrengths,
        strongFoot:myFoot,
        wishFormation: myFormation,
      }).catch(console.error);
    }
    showNotif("Status an Trainer übermittelt");
  }

  const fieldSelectedPlayer = fieldSelected!==null ? players.find(p=>p.id===order[fieldSelected]) : null;

  function MentalitaetArrows({value}) {
    const isOff     = value > 50;
    const intensity = Math.abs(value - 50) / 50;
    if (intensity < 0.08) return null;

    const dir  = isOff ? -1 : 1;
    const base = isOff ? [80, 200, 120] : [64, 220, 200];
    const count = intensity > 0.6 ? 4 : 3;
    const allRows = isOff ? [78, 62, 46, 30] : [22, 38, 54, 70];
    const rows    = allRows.slice(0, count);
    const hw = 40, hh = 8 + intensity * 6, sw = 0.8 + intensity * 0.6;

    return (
      <>
        {rows.map((rowY, rowIdx) => {
          const fade  = 1 - rowIdx * 0.22;
          const alpha = (0.3 + intensity * 0.45) * fade;
          const color = `rgba(${base[0]},${base[1]},${base[2]},${alpha.toFixed(2)})`;
          return (
            <polyline key={rowIdx}
              points={`${50-hw},${rowY} 50,${rowY+dir*hh} ${50+hw},${rowY}`}
              fill="none" stroke={color} strokeWidth={sw}
              strokeLinecap="round" strokeLinejoin="round"
            />
          );
        })}
      </>
    );
  }

  // ── SPIELFELD ─────────────────────────────────────────────
  const Field = ({interactive=false})=>(
    <div style={{position:"relative",width:"100%",paddingBottom:"140%",background:"linear-gradient(180deg,#0e0e28 0%,#14143a 50%,#0e0e28 100%)",borderRadius:10,overflow:"hidden",border:`1px solid ${C.accentBorder}`}}>
      {/* Feldlinien SVG – z-index 1 */}
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",zIndex:1}} viewBox="0 0 100 140" preserveAspectRatio="none">
        {[0,1,2,3,4,5,6].map(i=><rect key={i} x="5" y={5+i*18.57} width="90" height="9.28" fill="rgba(200,74,255,0.025)"/>)}
        <rect x="5" y="5" width="90" height="130" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="0.7"/>
        <line x1="5" y1="70" x2="95" y2="70" stroke="rgba(200,74,255,0.35)" strokeWidth="0.7"/>
        <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="0.7"/>
        <circle cx="50" cy="70" r="1" fill="rgba(200,74,255,0.5)"/>
        <rect x="30" y="5"   width="40" height="16" fill="none" stroke="rgba(200,74,255,0.25)" strokeWidth="0.6"/>
        <rect x="30" y="119" width="40" height="16" fill="none" stroke="rgba(200,74,255,0.25)" strokeWidth="0.6"/>
        <rect x="18" y="5"   width="64" height="27" fill="none" stroke="rgba(200,74,255,0.15)" strokeWidth="0.6"/>
        <rect x="18" y="108" width="64" height="27" fill="none" stroke="rgba(200,74,255,0.15)" strokeWidth="0.6"/>
      </svg>

      {/* Mentalitäts-Pfeile SVG – z-index 2 (hinter Spielern) */}
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",zIndex:2}} viewBox="0 0 100 140" preserveAspectRatio="none">
        <MentalitaetArrows value={mentalitaet}/>
      </svg>

      <div style={{position:"absolute",top:7,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.5)",borderRadius:20,padding:"2px 10px",fontSize:9,color:"rgba(200,74,255,0.6)",zIndex:5,letterSpacing:"1px"}}>{formKey}</div>

      {interactive&&(
        <div style={{position:"absolute",top:7,right:8,zIndex:6,background:"rgba(0,0,0,0.5)",borderRadius:8,padding:"3px 8px",fontSize:9,color:swapFirst!==null?C.accent:"rgba(255,255,255,0.3)"}}>
          {swapFirst!==null?"Zweiten Spieler antippen":"Antippen zum Tauschen"}
        </div>
      )}

      {order.map((pid,idx)=>{
        const pos=positions[idx];if(!pos)return null;
        const player=players.find(p=>p.id===pid);if(!player)return null;
        const isMe=!interactive&&player.id===ME_ID;
        const isSwapFirst=interactive&&swapFirst===idx;
        const isSelected=interactive&&fieldSelected===idx;
        return (
          <div key={pid} onClick={()=>interactive&&handleFieldTap(idx)}
            style={{position:"absolute",left:`${pos.x}%`,top:`${pos.y}%`,transform:"translate(-50%,-50%)",zIndex:3,cursor:interactive?"pointer":"default",transition:"left 0.5s ease,top 0.5s ease"}}>
            <div style={{
              width:30,height:30,borderRadius:"50%",
              background: isSwapFirst||isSelected ? C.accent : "#14143a",
              border:`2px solid ${isSwapFirst||isSelected ? C.accent : isMe ? C.accent : "rgba(200,74,255,0.7)"}`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              boxShadow: isSwapFirst||isSelected
                ? `0 0 14px ${C.accent}, 0 0 28px ${C.accent}55`
                : isMe
                ? `0 0 10px ${C.accent}88, 0 0 20px ${C.accent}33`
                : `0 0 8px rgba(200,74,255,0.5), 0 0 16px rgba(200,74,255,0.2)`,
              transition:"all 0.2s",
            }}>
              <span style={{color: isSwapFirst||isSelected ? C.bg : C.white, fontSize:8,fontWeight:800,lineHeight:1}}>{player.number}</span>
              <span style={{color: isSwapFirst||isSelected ? C.bg : "rgba(255,255,255,0.6)", fontSize:6,lineHeight:1.2,fontWeight:600}}>{player.name.split(" ")[0].slice(0,5)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── DETAIL ANSICHT ────────────────────────────────────────
  const detailPlayer=detailId?players.find(p=>p.id===detailId):null;
  if(detailPlayer){
    const dp=detailPlayer;
    const idx=order.indexOf(dp.id);
    return (
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.white}}>
        <div style={{maxWidth:440,margin:"0 auto",padding:"20px 20px 48px"}}>
          <button onClick={()=>setDetailId(null)} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:13,marginBottom:20,padding:0}}>← Zurück</button>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
            <div style={{width:50,height:50,borderRadius:"50%",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}}
              onClick={()=>{setEditingNum(dp.id);setNumInput(String(dp.number));}}>
              {editingNum===dp.id
                ?<input autoFocus value={numInput} onChange={e=>setNumInput(e.target.value)} onBlur={()=>saveNumber(dp.id)} onKeyDown={e=>e.key==="Enter"&&saveNumber(dp.id)}
                   style={{width:38,textAlign:"center",background:"none",border:"none",color:C.bg,fontSize:16,fontWeight:800,outline:"none",fontFamily:"inherit"}}/>
                :<span style={{color:C.bg,fontSize:18,fontWeight:800}}>{dp.number}</span>
              }
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:700}}>{dp.name}</div>
              <div style={{color:C.gray,fontSize:12,marginTop:2}}>{idx>=0?ROLE_LABELS[idx]:"Kein Slot"}</div>
              <div style={{color:C.grayDark,fontSize:10,marginTop:1}}>Nummer antippen zum Ändern</div>
            </div>
          </div>

          <div style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:10,padding:"9px 13px",marginBottom:12,fontSize:11,color:C.accent}}>
            Live-Daten vom Spieler
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <Card><Label info={FIELD_INFOS.fitness}>Fitness</Label><FitnessBar value={dp.fitness}/></Card>
            <Card>
              <Label info={FIELD_INFOS.vorspiel}>Vor dem Spiel</Label>
              <div style={{color:dp.ruhe?C.yellowText:C.greenText,fontSize:13,fontWeight:600}}>{dp.ruhe?"Braucht Stille":"Fokussiert & aktiv"}</div>
            </Card>
          </div>

          <Card style={{marginBottom:10}}>
            <Label info={FIELD_INFOS.wunsch}>Wunschposition</Label>
            <div style={{color:C.white,fontSize:14,fontWeight:600}}>{dp.wishRole}</div>
          </Card>

          <Card style={{marginBottom:10}}>
            <Label info={FIELD_INFOS.staerken}>Stärken</Label>
            {dp.strengths?.length>0
              ?<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {dp.strengths.map(sid=>{const s=STRENGTHS_LIST.find(x=>x.id===sid);return s?<span key={sid} style={{background:C.green,border:`1px solid ${C.greenLight}`,borderRadius:20,padding:"3px 10px",color:C.white,fontSize:11}}>{s.label}</span>:null;})}
              </div>
              :<div style={{color:C.gray,fontSize:12}}>Keine Angabe</div>
            }
          </Card>

          <Card style={{marginBottom:10}}>
            <Label>Starker Fuß</Label>
            <div style={{color:C.white,fontSize:14,fontWeight:600,textTransform:"capitalize"}}>
              {dp.strongFoot ? STRONG_FOOT_OPTIONS.find(o=>o.id===dp.strongFoot)?.label : "Keine Angabe"}
            </div>
          </Card>

          <Card style={{marginBottom:10}}>
            <Label>Lieblingsformation</Label>
            <div style={{color:dp.wishFormation?C.accent:C.gray,fontSize:14,fontWeight:dp.wishFormation?700:400}}>
              {dp.wishFormation || "Keine Angabe"}
            </div>
          </Card>

          <Card style={{marginBottom:10}}>
            <Label info={FIELD_INFOS.harmonie}>Harmoniert am besten mit</Label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {dp.partners.map(pid=>{const p=players.find(pl=>pl.id===pid);return p?<span key={pid} style={{background:C.green,border:`1px solid ${C.greenLight}`,borderRadius:20,padding:"3px 10px",color:C.white,fontSize:11}}>#{p.number} {p.name.split(" ")[0]}</span>:null;})}
            </div>
          </Card>

          {dp.note&&<Card style={{marginBottom:10}}><Label>Nachricht</Label><div style={{color:C.grayLight,fontSize:13,fontStyle:"italic"}}>"{dp.note}"</div></Card>}

          {/* Trainer-Attribute (nur Trainer sieht das) */}
          <Card style={{marginBottom:10,borderColor:"rgba(200,74,255,0.2)"}}>
            <Label info="Diese Bewertungen sind nur für dich als Trainer sichtbar. Spieler sehen diese Informationen nicht.">Trainer-Bewertung (privat)</Label>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {TRAINER_ATTRIBUTES.map(attr=>{
                const val = (trainerAttributes[dp.uid]||{})[attr.id] || 0;
                return (
                  <div key={attr.id}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{color:C.gray,fontSize:11}}>{attr.label}</span>
                      <span style={{color:C.accent,fontSize:11,fontWeight:700}}>{val||"–"}/10</span>
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                        <button key={n} onClick={()=>setTrainerAttributes(prev=>({...prev,[dp.uid]:{...(prev[dp.uid]||{}),[attr.id]:n}}))}
                          style={{flex:1,height:20,borderRadius:3,border:"none",cursor:"pointer",background:n<=val?C.accent:"rgba(200,74,255,0.15)",transition:"all 0.1s"}}/>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Trainer kann eigene Stärken vergeben */}
          <Card style={{marginBottom:10,borderColor:"rgba(200,74,255,0.2)"}}>
            <Label info="Weise dem Spieler Stärken zu die du als Trainer erkennst. Ergänzt die Selbsteinschätzung des Spielers.">Stärken vom Trainer (privat)</Label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {STRENGTHS_LIST.map(s=>{
                const active=(trainerStrengths[dp.uid]||[]).includes(s.id);
                return (
                  <button key={s.id} onClick={()=>setTrainerStrengths(prev=>{
                    const cur=prev[dp.uid]||[];
                    return {...prev,[dp.uid]:active?cur.filter(x=>x!==s.id):[...cur,s.id]};
                  })} style={{padding:"4px 10px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",border:`1px solid ${active?C.accentBorder:C.border}`,background:active?C.accentDim:"transparent",color:active?C.accent:C.gray}}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card style={{marginBottom:10}}>
            <Label>Position ändern</Label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {ROLE_LABELS.map((label,i)=>{
                const isCurrent=order[i]===dp.id;
                const holder=players.find(p=>p.id===order[i]);
                return (
                  <button key={i} onClick={()=>!isCurrent&&assignToSlot(dp,i)} style={{padding:"5px 10px",borderRadius:20,cursor:isCurrent?"default":"pointer",fontSize:11,fontFamily:"inherit",border:`1px solid ${isCurrent?C.greenLight:C.border}`,background:isCurrent?C.green:"transparent",color:isCurrent?C.white:C.gray}}>
                    {label}{!isCurrent&&holder&&<span style={{color:C.grayDark,fontSize:10}}> ({holder.name.split(" ")[0]})</span>}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card><Label>Direktchat</Label><ChatUI chat={chat} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} isTrainer={true}/></Card>
        </div>
      </div>
    );
  }

  // ── TAKTIK EDITOR ─────────────────────────────────────────
  if (showTacticEditor) {
    return <TacticEditor
      players={players}
      onSave={(newTactic)=>{
        setCustomTactics(prev=>[...prev, newTactic]);
        setShowTacticEditor(false);
        showNotif(`Taktik "${newTactic.name}" gespeichert`);
      }}
      onClose={()=>setShowTacticEditor(false)}
    />;
  }

  // ── HAUPTANSICHT ──────────────────────────────────────────
  const ruheCount=players.filter(p=>p.ruhe).length;
  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",color:C.white}}
      onTouchStart={e=>setSwipeStartX(e.touches[0].clientX)}
      onTouchEnd={e=>handleSwipe(e.changedTouches[0].clientX)}
    >
      <div style={{maxWidth:440,margin:"0 auto",padding:"20px 20px 48px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {/* Logo Icon */}
            <svg width="32" height="32" viewBox="230 16 220 220" style={{flexShrink:0}}>
              <rect x="230" y="16" width="220" height="220" rx="22" fill="#1a1a35" stroke="rgba(200,74,255,0.5)" strokeWidth="2"/>
              <rect x="252" y="36" width="176" height="180" rx="2" fill="none" stroke="rgba(200,74,255,0.55)" strokeWidth="2.5"/>
              <line x1="252" y1="126" x2="428" y2="126" stroke="rgba(200,74,255,0.55)" strokeWidth="2.5"/>
              <circle cx="340" cy="126" r="22" fill="none" stroke="rgba(200,74,255,0.45)" strokeWidth="2"/>
              <rect x="288" y="36" width="104" height="33" rx="1.5" fill="none" stroke="rgba(200,74,255,0.45)" strokeWidth="2"/>
              <rect x="317" y="36" width="46" height="11" rx="1" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="1.5"/>
              <rect x="326" y="29" width="28" height="8" rx="1" fill="none" stroke="rgba(200,74,255,0.65)" strokeWidth="2"/>
              <path d="M322 69 A18 18 0 0 0 358 69" fill="none" stroke="rgba(200,74,255,0.4)" strokeWidth="1.5"/>
              <rect x="288" y="183" width="104" height="33" rx="1.5" fill="none" stroke="rgba(200,74,255,0.45)" strokeWidth="2"/>
              <rect x="317" y="205" width="46" height="11" rx="1" fill="none" stroke="rgba(200,74,255,0.35)" strokeWidth="1.5"/>
              <rect x="326" y="215" width="28" height="8" rx="1" fill="none" stroke="rgba(200,74,255,0.65)" strokeWidth="2"/>
              <path d="M322 183 A18 18 0 0 1 358 183" fill="none" stroke="rgba(200,74,255,0.4)" strokeWidth="1.5"/>
              <ellipse cx="340" cy="126" rx="54" ry="21" fill="none" stroke="#c84aff" strokeWidth="2.5" opacity="0.85"/>
              <ellipse cx="340" cy="126" rx="54" ry="21" fill="none" stroke="#c84aff" strokeWidth="2" opacity="0.5" transform="rotate(60,340,126)"/>
              <ellipse cx="340" cy="126" rx="54" ry="21" fill="none" stroke="#c84aff" strokeWidth="1.5" opacity="0.3" transform="rotate(120,340,126)"/>
              <circle cx="340" cy="126" r="8" fill="#c84aff"/>
              <circle cx="394" cy="126" r="5" fill="#c84aff" opacity="0.9"/>
              <circle cx="313" cy="111" r="4" fill="#c84aff" opacity="0.7"/>
            </svg>
            <div>
              <div style={{fontSize:22,fontWeight:900,letterSpacing:"-0.5px",lineHeight:1}}>
                <span style={{color:C.white}}>Team</span><span style={{color:C.accent}}>chemie</span>
              </div>
              <div style={{color:C.grayDark,fontSize:11,marginTop:2}}>
                {user?.teamName || "FC Beispiel"} · {isTrainer ? "Trainer" : user?.name || "Spieler"}
              </div>
              {isTrainer && user?.teamCode && (
                <div style={{color:C.accent,fontSize:10,marginTop:1,fontWeight:600}}>
                  Code: {user.teamCode}
                </div>
              )}
            </div>
          </div>
          <button onClick={()=>setShowSettings(true)} style={{
            width:36,height:36,borderRadius:"50%",background:C.surface,
            border:`1px solid ${C.border}`,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
            color:C.gray,fontSize:17,flexShrink:0,
          }}>⚙</button>
        </div>

        {/* Settings Overlay */}
        {showSettings&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"flex-end"}}>
            <div style={{width:"100%",maxWidth:440,margin:"0 auto",background:C.surface2,borderRadius:"20px 20px 0 0",padding:"20px 20px 40px",border:`1px solid ${C.border}`}}>
              {/* Handle */}
              <div style={{width:36,height:4,borderRadius:2,background:C.grayDark,margin:"0 auto 20px"}}/>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div style={{color:C.white,fontSize:16,fontWeight:700}}>Einstellungen</div>
                <button onClick={()=>setShowSettings(false)} style={{background:"none",border:"none",color:C.gray,fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
              </div>

              {/* Account */}
              <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Account</div>
              <div style={{background:C.surface,borderRadius:12,padding:14,marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{color:C.white,fontWeight:700,fontSize:14}}>{user?.name}</div>
                <div style={{color:C.gray,fontSize:12,marginTop:2}}>{user?.email}</div>
                <div style={{color:C.accent,fontSize:11,marginTop:4}}>{isTrainer?"Trainer":"Spieler"} · {user?.teamName}</div>
              </div>
              {isTrainer && user?.teamCode && (
                <div style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:12,padding:14,marginBottom:12}}>
                  <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>Team-Code für Spieler</div>
                  <div style={{color:C.accent,fontSize:28,fontWeight:900,letterSpacing:4,textAlign:"center",marginBottom:10}}>{user.teamCode}</div>
                  <div style={{color:C.gray,fontSize:11,textAlign:"center",marginBottom:12}}>Teile diesen Code mit deinen Spielern</div>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Hey! Lade dich zu unserem Team auf Teamchemie ein.\n\n1. App öffnen: https://teamchemie1.vercel.app\n2. Als Spieler registrieren\n3. Team-Code eingeben: ${user.teamCode}\n\nBis gleich!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{display:"block",background:"#25D366",border:"none",borderRadius:10,color:"#fff",padding:"12px",cursor:"pointer",fontSize:13,fontWeight:700,textAlign:"center",textDecoration:"none"}}
                  >
                    Per WhatsApp einladen
                  </a>
                </div>
              )}

              {/* Abo */}
              <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8,marginTop:20}}>Abo</div>
              <div style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:12,padding:14,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{color:C.accent,fontSize:13,fontWeight:700}}>Teamchemie Pro</div>
                    <div style={{color:C.gray,fontSize:11,marginTop:2}}>Bis zu 30 Spieler · Alle Features</div>
                  </div>
                  <div style={{color:C.accent,fontSize:13,fontWeight:700}}>4,99 €/Mo</div>
                </div>
              </div>
              {[
                {label:"Abo verwalten"},
                {label:"Rechnung"},
              ].map(item=>(
                <div key={item.label} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                  <span style={{color:C.grayLight,fontSize:13,flex:1}}>{item.label}</span>
                  <span style={{color:C.grayDark,fontSize:14}}>›</span>
                </div>
              ))}

              {/* Sonstiges */}
              <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8,marginTop:20}}>Sonstiges</div>
              {[
                {label:"Datenschutz"},
                {label:"App-Version 1.0"},
              ].map(item=>(
                <div key={item.label} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                  <span style={{color:C.grayLight,fontSize:13,flex:1}}>{item.label}</span>
                  <span style={{color:C.grayDark,fontSize:14}}>›</span>
                </div>
              ))}

              {/* Impressum aufklappbar */}
              <div onClick={()=>setShowImpressum(p=>!p)}
                style={{display:"flex",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                <span style={{color:C.grayLight,fontSize:13,flex:1}}>Impressum</span>
                <span style={{color:C.grayDark,fontSize:14}}>{showImpressum?"∨":"›"}</span>
              </div>
              {showImpressum&&(
                <div style={{background:C.surface,borderRadius:10,padding:14,margin:"8px 0",border:`1px solid ${C.border}`}}>
                  <div style={{color:C.grayLight,fontWeight:600,marginBottom:8,fontSize:13}}>Teamchemie</div>
                  <div style={{color:C.gray,fontSize:12,lineHeight:1.9}}>
                    <div>Lasse Kaufmann</div>
                    <div>Frankfurt am Main, Deutschland</div>
                    <div style={{marginTop:6}}>lassekaufmann01@gmail.com</div>
                    <div style={{marginTop:8,color:C.grayDark,fontSize:11}}>Diese App befindet sich in der Entwicklung. Daten werden über Firebase (Google) gespeichert.</div>
                    <div style={{marginTop:4,color:C.grayDark,fontSize:11}}>Version 1.0.0 · © 2025 Teamchemie</div>
                  </div>
                </div>
              )}

              <button onClick={onLogout} style={{width:"100%",background:"rgba(187,51,51,0.1)",border:`1px solid ${C.error}`,borderRadius:10,color:C.error,padding:"13px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",marginTop:20}}>
                Abmelden
              </button>
            </div>
          </div>
        )}

        {/* Rolle wird aus Login bestimmt - kein manueller Umschalter */}

        {/* ── TRAINER ── */}
        {view==="trainer"&&<>
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            {[["feld","Feld"],["spieler","Spieler"],["taktik","Taktik"],["chat","Chat"]].map(([key,label])=>(
              <Tab key={key} label={label} active={tab===key} onClick={()=>{setTab(key);setSwapFirst(null);setFieldSelected(null);}}/>
            ))}
          </div>

          {tab==="feld"&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,color:C.grayLight}}>Taktik: <span style={{color:C.white,fontWeight:600}}>{tactic.name}</span></div>
              <GhostBtn onClick={()=>setTab("taktik")}>Taktik</GhostBtn>
            </div>
            <Field interactive={true}/>

            {/* Spieler-Info unter dem Feld */}
            <PlayerInfoCard
              player={fieldSelectedPlayer}
              players={players}
              order={order}
              onClose={()=>setFieldSelected(null)}
              onDetail={()=>{setDetailId(fieldSelectedPlayer.id);setFieldSelected(null);}}
            />

            {/* Ersatzbank */}
            <div style={{marginTop:10}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>Ersatzbank</div>
                {swapFirst!==null&&(
                  <span style={{color:C.greenText,fontSize:11,fontWeight:600}}>Zweiten Spieler wählen zum Tauschen</span>
                )}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {players.map((p,bankIdx)=>{
                  const onField = order.slice(0,11).includes(p.id);
                  if (onField) return null;
                  const isBankSwap = swapFirst==="bank_"+p.id;
                  return (
                    <div key={p.id}
                      onClick={()=>{
                        if (swapFirst===null) {
                          setSwapFirst("bank_"+p.id);
                        } else if (typeof swapFirst==="number") {
                          // Tausch: Feldspieler mit Bankspieler
                          const newOrder=[...order];
                          newOrder[swapFirst]=p.id;
                          setOrder(newOrder);
                          setSwapFirst(null);
                          setFieldSelected(null);
                          showNotif(`${p.name.split(" ")[0]} eingewechselt`);
                        } else {
                          setSwapFirst(null);
                        }
                      }}
                      style={{
                        width:44,height:54,background:isBankSwap?"rgba(109,191,138,0.15)":C.surface,
                        borderRadius:8,border:`1px solid ${isBankSwap?C.greenLight:C.border}`,
                        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,
                        cursor:"pointer",transition:"all 0.15s",
                      }}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>
                        <span style={{color:"#0a0a0a",fontSize:8,fontWeight:800,lineHeight:1}}>{p.number}</span>
                      </div>
                      <span style={{color:C.gray,fontSize:8,textAlign:"center",lineHeight:1.2,maxWidth:40}}>{p.name.split(" ")[0]}</span>
                    </div>
                  );
                })}
                {/* Falls alle 11 auf dem Feld */}
                {players.filter(p=>!order.slice(0,11).includes(p.id)).length===0&&(
                  <div style={{color:C.grayDark,fontSize:11,padding:"8px 0"}}>Alle Spieler auf dem Feld</div>
                )}
              </div>
              <div style={{color:C.grayDark,fontSize:10,marginTop:8}}>
                {swapFirst===null
                  ? "Feldspieler antippen → dann Bankspieler antippen zum Einwechseln"
                  : typeof swapFirst==="number"
                  ? "Jetzt Bankspieler antippen zum Einwechseln — oder zweiten Feldspieler zum direkten Tausch"
                  : "Jetzt Feldspieler antippen zum Tauschen"
                }
              </div>
            </div>

            {!fieldSelectedPlayer&&(
              <div style={{marginTop:10,background:C.surface,borderRadius:10,padding:12,border:`1px solid ${C.border}`}}>
                <div style={{color:C.gray,fontSize:11,marginBottom:4}}>Taktikhinweis</div>
                <div style={{color:C.grayLight,fontSize:13}}>{tactic.note}</div>
              </div>
            )}

            {/* Mentalitäts-Regler */}
            <Card style={{marginTop:10}}>
              <Label info={FIELD_INFOS.mentalitaet}>Spielausrichtung</Label>
              <MentalitaetSlider value={mentalitaet} onChange={setMentalitaet}/>
            </Card>

            {/* Standardschützen */}
            <Card style={{marginTop:10}}>
              <Label info="Lege fest welcher Spieler bei Standardsituationen antritt. Diese Auswahl wird an alle Spieler übermittelt.">Standardschützen</Label>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[
                  {key:"elfmeter",    label:"Elfmeter",      strengthId:"elfmeter"},
                  {key:"freistoss",   label:"Freistoss",     strengthId:"standards"},
                  {key:"eckeLinks",   label:"Ecke Links",    strengthId:"flanken"},
                  {key:"eckeRechts",  label:"Ecke Rechts",   strengthId:"flanken"},
                ].map(({key,label,strengthId})=>{
                  const current = standards[key];
                  const currentPlayer = players.find(p=>p.id===current);
                  return (
                    <div key={key}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <span style={{color:C.gray,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</span>
                        {currentPlayer&&(
                          <span style={{color:C.accent,fontSize:11,fontWeight:600}}>
                            #{currentPlayer.number} {currentPlayer.name.split(" ")[0]}
                          </span>
                        )}
                      </div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {players.map(p=>{
                          const isSelected = standards[key]===p.id;
                          const hasStrength = p.strengths?.includes(strengthId);
                          return (
                            <button key={p.id} onClick={()=>setStandards(prev=>({...prev,[key]:p.id}))} style={{
                              padding:"4px 9px",borderRadius:20,cursor:"pointer",fontSize:10,
                              fontFamily:"inherit",fontWeight:isSelected?700:400,
                              border:`1px solid ${isSelected?C.accentBorder:hasStrength?"rgba(200,74,255,0.25)":C.border}`,
                              background:isSelected?C.accentDim:"transparent",
                              color:isSelected?C.accent:hasStrength?C.grayLight:C.gray,
                              transition:"all 0.15s",
                            }}>
                              #{p.number} {p.name.split(" ")[0]}
                              {hasStrength&&!isSelected&&<span style={{color:C.accent,marginLeft:3}}>·</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{color:C.grayDark,fontSize:10,marginTop:10}}>
                Magenta-Punkt = Spieler hat diese Stärke angegeben
              </div>
            </Card>
          </>}

          {tab==="spieler"&&<>
            {/* Bestätigungs-Popup */}
            {confirmRemove && (
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
                <div style={{background:C.surface2,borderRadius:16,padding:24,maxWidth:340,width:"100%",border:`1px solid ${C.borderHi}`}}>
                  <div style={{color:C.white,fontSize:16,fontWeight:700,marginBottom:8}}>Spieler entfernen?</div>
                  <div style={{color:C.gray,fontSize:13,lineHeight:1.6,marginBottom:20}}>
                    Möchtest du <span style={{color:C.white,fontWeight:600}}>{confirmRemove.name}</span> wirklich aus dem Team entfernen? Diese Aktion kann nicht rückgängig gemacht werden.
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setConfirmRemove(null)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.gray,padding:"11px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>
                      Abbrechen
                    </button>
                    <button onClick={()=>{
                      setPlayers(prev=>prev.filter(p=>p.id!==confirmRemove.id));
                      setOrder(prev=>prev.filter(id=>id!==confirmRemove.id));
                      setConfirmRemove(null);
                      showNotif(`${confirmRemove.name.split(" ")[0]} wurde entfernt`);
                    }} style={{flex:1,background:"rgba(187,51,51,0.15)",border:`1px solid ${C.error}`,borderRadius:10,color:C.error,padding:"11px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>
                      Entfernen
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Label>Mannschaft — {players.length} Spieler</Label>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {players.map(p=>{
                const idx    = order.indexOf(p.id);
                const menuOpen = playerMenu === p.id;
                return (
                  <div key={p.id} style={{position:"relative"}}>
                    <div style={{background:C.surface,borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"center",gap:12,border:`1px solid ${menuOpen?C.accentBorder:C.border}`,transition:"border-color 0.15s"}}>
                      {/* Avatar */}
                      <div onClick={()=>setDetailId(p.id)} style={{width:34,height:34,borderRadius:"50%",background:"rgba(200,74,255,0.15)",border:`1px solid rgba(200,74,255,0.5)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:C.white,flexShrink:0,cursor:"pointer",boxShadow:`0 0 8px rgba(200,74,255,0.3)`}}>
                        {p.number}
                      </div>
                      {/* Info */}
                      <div onClick={()=>setDetailId(p.id)} style={{flex:1,minWidth:0,cursor:"pointer"}}>
                        <div style={{color:C.white,fontWeight:600,fontSize:13}}>{p.name}</div>
                        <div style={{color:C.gray,fontSize:11,marginBottom:3}}>{idx>=0?ROLE_LABELS[idx]:"–"}</div>
                        <FitnessBar value={p.fitness}/>
                      </div>
                      {/* Tags + 3-Punkte */}
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                        {p.ruhe&&<span style={{background:"rgba(160,120,32,0.12)",border:"1px solid rgba(160,120,32,0.25)",borderRadius:20,padding:"2px 8px",color:C.yellowText,fontSize:10}}>Stille</span>}
                        <button
                          onClick={e=>{e.stopPropagation();setPlayerMenu(menuOpen?null:p.id);}}
                          style={{background:"transparent",border:"none",color:C.gray,cursor:"pointer",fontSize:18,lineHeight:1,padding:"2px 4px",letterSpacing:"1px"}}
                        >···</button>
                      </div>
                    </div>

                    {/* Dropdown Menü */}
                    {menuOpen && (
                      <>
                        <div onClick={()=>setPlayerMenu(null)} style={{position:"fixed",inset:0,zIndex:40}}/>
                        <div style={{position:"absolute",right:0,top:"100%",marginTop:4,background:C.surface2,borderRadius:10,border:`1px solid ${C.borderHi}`,overflow:"hidden",zIndex:50,minWidth:180,boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
                          <button onClick={()=>{setPlayerMenu(null);setDetailId(p.id);setTab("chat");}} style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,padding:"12px 16px",cursor:"pointer",fontSize:13,fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                            <span style={{color:C.accent,fontSize:14}}>💬</span> Mit Spieler chatten
                          </button>
                          <button onClick={()=>{setPlayerMenu(null);setConfirmRemove(p);}} style={{width:"100%",background:"transparent",border:"none",color:C.error,padding:"12px 16px",cursor:"pointer",fontSize:13,fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:14}}>✕</span> Aus Team entfernen
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>}

          {tab==="taktik"&&<>
            {/* Status-Badge */}
            <div style={{background:tacticReleased?"rgba(74,200,200,0.1)":C.accentDim,border:`1px solid ${tacticReleased?C.greenLight:C.accentBorder}`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:11,color:tacticReleased?C.greenText:C.accent,fontWeight:600}}>
                  {tacticReleased ? `Freigegeben: ${releasedTactic.name}` : `Nicht freigegeben: ${tactic.name}`}
                </div>
                <div style={{fontSize:10,color:C.gray,marginTop:2}}>
                  {tacticReleased ? "Spieler sehen diese Taktik" : "Spieler sehen noch die letzte freigegebene Taktik"}
                </div>
              </div>
              {!tacticReleased&&(
                <button onClick={releaseTactic} style={{
                  background:C.accent,border:"none",borderRadius:8,color:C.bg,
                  padding:"7px 14px",cursor:"pointer",fontSize:11,fontWeight:700,
                  fontFamily:"inherit",flexShrink:0,marginLeft:10,
                  boxShadow:`0 0 12px ${C.accent}66`,
                }}>Freigeben</button>
              )}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {[...ALL_TACTICS, ...customTactics].map(t=>{
                const isActive = tactic.id===t.id;
                const isReleased = releasedTactic.id===t.id;
                return (
                  <div key={t.id} onClick={()=>chooseTactic(t)}
                    style={{background:isActive?C.accentDim:C.surface,borderRadius:10,padding:"12px 14px",cursor:"pointer",border:`1px solid ${isActive?C.accentBorder:isReleased?C.greenLight:C.border}`,transition:"all 0.15s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{color:C.white,fontWeight:600,fontSize:13}}>
                          {t.name}
                          {t.custom&&<span style={{color:C.greenText,fontSize:10,marginLeft:6}}>Eigene</span>}
                        </div>
                        <div style={{color:isActive?"rgba(255,255,255,0.55)":C.gray,fontSize:11,marginTop:3}}>{t.note}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                        {isActive&&<span style={{color:C.accent,fontSize:10,fontWeight:600}}>Ausgewählt</span>}
                        {isReleased&&<span style={{color:C.greenText,fontSize:10,fontWeight:600}}>Freigegeben</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Eigene Taktik erstellen */}
            <button onClick={()=>setShowTacticEditor(true)} style={{
              width:"100%",background:"transparent",border:`1px solid ${C.border}`,
              borderRadius:10,color:C.grayLight,padding:"13px",cursor:"pointer",
              fontSize:13,fontWeight:600,fontFamily:"inherit",marginBottom:14,
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            }}>
              <span style={{fontSize:18,lineHeight:1,color:C.gray}}>+</span> Eigene Taktik erstellen
            </button>

            {/* Mentalitäts-Regler auch in Taktik-Tab */}
            <Card style={{marginBottom:14}}>
              <Label info={FIELD_INFOS.mentalitaet}>Spielausrichtung</Label>
              <MentalitaetSlider value={mentalitaet} onChange={setMentalitaet}/>
            </Card>

            <textarea placeholder="Zusätzliche Notiz an alle Spieler..."
              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",resize:"none",height:70,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
            <Btn onClick={()=>showNotif("Notiz an alle gesendet")}>Notiz senden</Btn>
          </>}

          {tab==="chat"&&<>
            <Label>Direktchat — Lars Hofmann</Label>
            <ChatUI chat={chat} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} isTrainer={true}/>
          </>}
        </>}

        {/* ── SPIELER ── */}
        {view==="player"&&<>
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {[["status","Mein Status"],["feld","Feld"],["chat","Chat"]].map(([key,label])=>(
              <Tab key={key} label={label} active={tab===key} onClick={()=>setTab(key)}/>
            ))}
          </div>

          {tab==="status"&&<>
            <div style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{color:C.accent,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>Taktik vom Trainer</div>
              <div style={{color:C.white,fontSize:16,fontWeight:700}}>{releasedTactic.name}</div>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:12,marginTop:4}}>{releasedTactic.note}</div>
              <div style={{color:C.gray,fontSize:12,marginTop:6}}>Meine Rolle: <span style={{color:C.white,fontWeight:600}}>{ROLE_LABELS[order.indexOf(ME_ID)]||"–"}</span></div>

              {/* Standardschützen */}
              <div style={{height:1,background:C.border,margin:"12px 0"}}/>
              <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Standardschützen</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {[
                  {key:"elfmeter",   label:"Elfmeter"},
                  {key:"freistoss",  label:"Freistoss"},
                  {key:"eckeLinks",  label:"Ecke Links"},
                  {key:"eckeRechts", label:"Ecke Rechts"},
                ].map(({key,label})=>{
                  const p = players.find(pl=>pl.id===standards[key]);
                  const isMe = standards[key]===ME_ID;
                  return (
                    <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:C.gray,fontSize:12}}>{label}</span>
                      <span style={{
                        color: isMe ? C.accent : C.grayLight,
                        fontSize:12, fontWeight: isMe ? 700 : 500,
                        background: isMe ? C.accentDim : "transparent",
                        border: isMe ? `1px solid ${C.accentBorder}` : "none",
                        borderRadius:20, padding: isMe ? "2px 10px" : "0",
                      }}>
                        {p ? `#${p.number} ${p.name.split(" ")[0]}${isMe?" (du)":""}` : "–"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Card style={{marginBottom:10}}>
              <Label info={FIELD_INFOS.fitness}>Fitnesszustand</Label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {[100,85,70,55,40].map(v=><Pill key={v} active={myFitness===v} onClick={()=>setMyFitness(v)}>{v}%</Pill>)}
              </div>
              <FitnessBar value={myFitness}/>
            </Card>

            <Card style={{marginBottom:10}}>
              <Label info={FIELD_INFOS.vorspiel}>Vor dem Spiel</Label>
              <FokusSlider value={myFokus} onChange={setMyFokus}/>
            </Card>

            <Card style={{marginBottom:10}}>
              <Label info={FIELD_INFOS.wunsch}>Wunschposition</Label>
              <PositionPicker value={myWish} onChange={setMyWish}/>
            </Card>

            <Card style={{marginBottom:10}}>
              <Label info="Welche Formation liegt dir am meisten? Der Trainer sieht deine Präferenz bei der Taktikplanung. Es gibt keine Garantie, dass diese Formation gespielt wird.">Lieblingsformation</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {Object.keys(FORMATIONS).map(f=>(
                  <button key={f} onClick={()=>setMyFormation(f)} style={{
                    padding:"5px 12px",borderRadius:20,cursor:"pointer",fontSize:12,
                    fontFamily:"inherit",fontWeight:myFormation===f?700:400,
                    border:`1px solid ${myFormation===f?C.accentBorder:C.border}`,
                    background:myFormation===f?C.accentDim:"transparent",
                    color:myFormation===f?C.accent:C.gray,
                    transition:"all 0.15s",
                  }}>{f}</button>
                ))}
              </div>
              {myFormation && (
                <div style={{marginTop:8,color:C.grayDark,fontSize:11}}>
                  Ausgewählt: <span style={{color:C.accent,fontWeight:600}}>{myFormation}</span>
                </div>
              )}
            </Card>

            <Card style={{marginBottom:10}}>
              <Label info={FIELD_INFOS.staerken}>Meine Stärken</Label>
              <StaerkenPicker value={myStrengths} onChange={setMyStrengths}/>
            </Card>

            <Card style={{marginBottom:10}}>
              <Label info="Dein starker Fuß hilft dem Trainer bei der Positionswahl und der Planung von Standards, Flanken und Abschlüssen.">Starker Fuß</Label>
              <div style={{display:"flex",gap:8}}>
                {STRONG_FOOT_OPTIONS.map(opt=>(
                  <button key={opt.id} onClick={()=>setMyFoot(opt.id)} style={{
                    flex:1,padding:"9px 6px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",
                    fontWeight:myFoot===opt.id?600:400,
                    border:`1px solid ${myFoot===opt.id?C.greenLight:C.border}`,
                    background:myFoot===opt.id?C.green:"transparent",
                    color:myFoot===opt.id?C.white:C.gray,
                  }}>{opt.label}</button>
                ))}
              </div>
            </Card>

            <Card style={{marginBottom:10}}>
              <Label info={FIELD_INFOS.harmonie}>Mit wem harmoniere ich am besten auf dem Platz?</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {players.filter(p=>p.id!==ME_ID).map(p=>{
                  const active=myPartners.includes(p.id);
                  return <Pill key={p.id} active={active} onClick={()=>setMyPartners(prev=>active?prev.filter(id=>id!==p.id):[...prev,p.id])}>#{p.number} {p.name.split(" ")[0]}</Pill>;
                })}
              </div>
            </Card>

            <Card style={{marginBottom:14}}>
              <Label info={FIELD_INFOS.nachricht}>Nachricht an den Trainer</Label>
              <textarea value={myNote} onChange={e=>setMyNote(e.target.value)}
                placeholder="z.B. Knie verspannt, brauche mehr Aufwärmen..."
                style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,padding:"10px 12px",fontSize:13,fontFamily:"inherit",resize:"none",height:70,outline:"none",boxSizing:"border-box"}}/>
            </Card>

            <Btn onClick={syncStatus}>Status an Trainer senden</Btn>
          </>}

          {tab==="feld"&&<>
            {/* Slide Labels */}
            <div style={{display:"flex",gap:5,marginBottom:10,overflowX:"auto"}}>
              {[
                {i:0,label:"Grundaufstellung"},
                {i:1,label:"Offensiv"},
                {i:2,label:"Defensiv"},
                {i:3,label:"Ecke Angriff"},
                {i:4,label:"Ecke Abwehr"},
              ].map(({i,label})=>(
                <button key={i} onClick={()=>setPlayerFieldSlide(i)} style={{
                  flexShrink:0,padding:"5px 10px",borderRadius:20,cursor:"pointer",fontSize:10,
                  fontFamily:"inherit",fontWeight:600,whiteSpace:"nowrap",
                  border:`1px solid ${playerFieldSlide===i?C.accentBorder:C.border}`,
                  background:playerFieldSlide===i?C.accentDim:"transparent",
                  color:playerFieldSlide===i?C.accent:C.gray,
                }}>{label}</button>
              ))}
            </div>

            {/* Swipe-Bereich */}
            <div
              onTouchStart={e=>setPlayerSwipeStartX(e.touches[0].clientX)}
              onTouchEnd={e=>{
                if (playerSwipeStartX===null) return;
                const dx=e.changedTouches[0].clientX-playerSwipeStartX;
                if (dx<-40 && playerFieldSlide<4) setPlayerFieldSlide(s=>s+1);
                if (dx>40  && playerFieldSlide>0) setPlayerFieldSlide(s=>s-1);
                setPlayerSwipeStartX(null);
              }}
            >
              {/* Taktik-Badge */}
              <div style={{background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:10,padding:"8px 13px",marginBottom:10,fontSize:11,color:C.accent}}>
                {playerFieldSlide===0 && <>Grundaufstellung — <span style={{color:C.white,fontWeight:600}}>{releasedTactic.name}</span></>}
                {playerFieldSlide===1 && <span style={{color:C.offColor,fontWeight:600}}>Offensiv-Ausrichtung</span>}
                {playerFieldSlide===2 && <span style={{color:C.defColor,fontWeight:600}}>Defensiv-Ausrichtung</span>}
                {playerFieldSlide===3 && <span style={{color:C.accent,fontWeight:600}}>Eckball Angriff</span>}
                {playerFieldSlide===4 && <span style={{color:C.accent,fontWeight:600}}>Eckball Abwehr</span>}
              </div>

              {/* Grundaufstellung */}
              {playerFieldSlide===0 && <>
                <Field interactive={false}/>
                <div style={{marginTop:6,color:C.grayDark,fontSize:10,textAlign:"center"}}>Du bist magenta markiert · Wischen zum Wechseln</div>
              </>}

              {/* Offensiv */}
              {playerFieldSlide===1 && <>
                <DragField
                  positions={releasedTactic.custom ? releasedTactic.posOffensiv : FORMATIONS["4-3-3"].map((p,i)=>({...p,y:Math.max(4,p.y-8)}))}
                  setPositions={()=>{}}
                  players={players}
                  label="Offensiv-Ausrichtung"
                  color={C.offColor}
                />
                <div style={{marginTop:6,color:C.grayDark,fontSize:10,textAlign:"center"}}>Wischen zum Wechseln</div>
              </>}

              {/* Defensiv */}
              {playerFieldSlide===2 && <>
                <DragField
                  positions={releasedTactic.custom ? releasedTactic.posDefensiv : FORMATIONS["4-3-3"].map((p,i)=>({...p,y:Math.min(96,p.y+8)}))}
                  setPositions={()=>{}}
                  players={players}
                  label="Defensiv-Ausrichtung"
                  color={C.defColor}
                />
                <div style={{marginTop:6,color:C.grayDark,fontSize:10,textAlign:"center"}}>Wischen zum Wechseln</div>
              </>}

              {/* Eckball Angriff */}
              {playerFieldSlide===3 && <>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  {["links","rechts"].map(s=>(
                    <button key={s} onClick={()=>setPlayerCornerSide(s)} style={{
                      flex:1,padding:"7px",borderRadius:8,cursor:"pointer",fontSize:11,
                      fontWeight:600,fontFamily:"inherit",
                      border:`1px solid ${playerCornerSide===s?C.accentBorder:C.border}`,
                      background:playerCornerSide===s?C.accentDim:"transparent",
                      color:playerCornerSide===s?C.accent:C.gray,
                    }}>
                      {s==="links"?"Linke Ecke":"Rechte Ecke"}
                    </button>
                  ))}
                </div>
                <CornerField
                  players={players}
                  positions={playerCornerSide==="links" ? DEFAULT_CORNER_OFF : DEFAULT_CORNER_OFF.map(p=>({...p,x:100-p.x}))}
                  setPositions={()=>{}}
                  side={playerCornerSide}
                  type="offensiv"
                />
                <div style={{marginTop:6,color:C.grayDark,fontSize:10,textAlign:"center"}}>Wischen zum Wechseln</div>
              </>}

              {/* Eckball Abwehr */}
              {playerFieldSlide===4 && <>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  {["links","rechts"].map(s=>(
                    <button key={s} onClick={()=>setPlayerCornerSide(s)} style={{
                      flex:1,padding:"7px",borderRadius:8,cursor:"pointer",fontSize:11,
                      fontWeight:600,fontFamily:"inherit",
                      border:`1px solid ${playerCornerSide===s?C.accentBorder:C.border}`,
                      background:playerCornerSide===s?C.accentDim:"transparent",
                      color:playerCornerSide===s?C.accent:C.gray,
                    }}>
                      {s==="links"?"Linke Ecke":"Rechte Ecke"}
                    </button>
                  ))}
                </div>
                <CornerField
                  players={players}
                  positions={playerCornerSide==="links" ? DEFAULT_CORNER_DEF : DEFAULT_CORNER_DEF.map(p=>({...p,x:100-p.x}))}
                  setPositions={()=>{}}
                  side={playerCornerSide}
                  type="defensiv"
                />
                <div style={{marginTop:6,color:C.grayDark,fontSize:10,textAlign:"center"}}>Wischen zum Wechseln</div>
              </>}

              {/* Dots */}
              <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:12}}>
                {[0,1,2,3,4].map(i=>(
                  <div key={i} onClick={()=>setPlayerFieldSlide(i)}
                    style={{width:i===playerFieldSlide?16:6,height:6,borderRadius:3,
                      background:i===playerFieldSlide?C.accent:"rgba(255,255,255,0.15)",
                      transition:"all 0.3s",cursor:"pointer"}}/>
                ))}
              </div>
            </div>
          </>}

          {tab==="chat"&&<>
            <Label>Direktchat mit dem Trainer</Label>
            <ChatUI chat={chat} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} isTrainer={false}/>
          </>}
        </>}

        {notif&&(
          <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.accentDim,border:`1px solid ${C.accentBorder}`,borderRadius:10,padding:"11px 20px",color:C.accent,fontWeight:700,fontSize:13,boxShadow:"0 4px 20px rgba(200,74,255,0.2)",zIndex:999,whiteSpace:"nowrap"}}>
            {notif}
          </div>
        )}
      </div>
    </div>
  );
}
