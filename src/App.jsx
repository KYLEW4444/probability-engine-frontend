import { useState, useCallback, useEffect, useRef } from "react";

// ── utils ─────────────────────────────────────────────────────────────────────
const probColor = (p) => p >= 65 ? "#00ff9d" : p >= 50 ? "#ffd60a" : "#ff6b6b";
const dirColor  = (d) => d === "BULLISH" ? "#00ff9d" : d === "BEARISH" ? "#ff6b6b" : "#ffd60a";
const fmt = (n, d=2) => typeof n === "number" ? n.toFixed(d) : n;

// Toggle speak on/off
let currentlySpeaking = false;
function toggleSpeak(text, onDone) {
  if (!window.speechSynthesis) return false;
  if (currentlySpeaking) {
    window.speechSynthesis.cancel();
    currentlySpeaking = false;
    if (onDone) onDone(false);
    return false;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92; u.pitch = 1; u.volume = 1;
  u.onend = () => { currentlySpeaking = false; if (onDone) onDone(false); };
  u.onerror = () => { currentlySpeaking = false; if (onDone) onDone(false); };
  window.speechSynthesis.speak(u);
  currentlySpeaking = true;
  if (onDone) onDone(true);
  return true;
}
function stopSpeak() {
  window.speechSynthesis?.cancel();
  currentlySpeaking = false;
}

function nowStamp() {
  const d = new Date();
  return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}) +
    " · " + d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",timeZoneName:"short"});
}

// ── CURRENCIES ────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code:"USD", name:"US Dollar",          symbol:"$",   flag:"🇺🇸", rate:1.0000 },
  { code:"EUR", name:"Euro",               symbol:"€",   flag:"🇪🇺", rate:0.9180 },
  { code:"JPY", name:"Japanese Yen",       symbol:"¥",   flag:"🇯🇵", rate:157.20 },
  { code:"GBP", name:"British Pound",      symbol:"£",   flag:"🇬🇧", rate:0.7890 },
  { code:"CAD", name:"Canadian Dollar",    symbol:"CA$", flag:"🇨🇦", rate:1.3620 },
  { code:"AUD", name:"Australian Dollar",  symbol:"A$",  flag:"🇦🇺", rate:1.5280 },
  { code:"CHF", name:"Swiss Franc",        symbol:"Fr",  flag:"🇨🇭", rate:0.8990 },
  { code:"CNY", name:"Chinese Yuan",       symbol:"¥",   flag:"🇨🇳", rate:7.2450 },
  { code:"INR", name:"Indian Rupee",       symbol:"₹",   flag:"🇮🇳", rate:83.450 },
  { code:"BRL", name:"Brazilian Real",     symbol:"R$",  flag:"🇧🇷", rate:4.9800 },
  { code:"MXN", name:"Mexican Peso",       symbol:"MX$", flag:"🇲🇽", rate:17.150 },
  { code:"KRW", name:"South Korean Won",   symbol:"₩",   flag:"🇰🇷", rate:1342.0 },
  { code:"SGD", name:"Singapore Dollar",   symbol:"S$",  flag:"🇸🇬", rate:1.3450 },
  { code:"HKD", name:"Hong Kong Dollar",   symbol:"HK$", flag:"🇭🇰", rate:7.8220 },
  { code:"SEK", name:"Swedish Krona",      symbol:"kr",  flag:"🇸🇪", rate:10.480 },
  { code:"NOK", name:"Norwegian Krone",    symbol:"kr",  flag:"🇳🇴", rate:10.560 },
  { code:"NZD", name:"New Zealand Dollar", symbol:"NZ$", flag:"🇳🇿", rate:1.6380 },
  { code:"ZAR", name:"South African Rand", symbol:"R",   flag:"🇿🇦", rate:18.650 },
  { code:"AED", name:"UAE Dirham",         symbol:"د.إ", flag:"🇦🇪", rate:3.6730 },
  { code:"SAR", name:"Saudi Riyal",        symbol:"﷼",   flag:"🇸🇦", rate:3.7510 },
];

function fmtC(v, cur) {
  if (typeof v !== "number") return v;
  const x = v * cur.rate;
  if (cur.code === "JPY" || cur.code === "KRW") return cur.symbol + Math.round(x).toLocaleString();
  return cur.symbol + x.toFixed(2);
}

// ── CURRENCY SELECTOR ─────────────────────────────────────────────────────────
function CurrencySelector({ currency, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("touchstart", handleClick); };
  }, []);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(0,255,157,0.3)", borderRadius:6, padding:"6px 12px", color:"#fff", fontSize:11, fontFamily:"'Courier New',monospace", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
        <span>{currency.flag}</span>
        <span style={{ color:"#00ff9d", fontWeight:700 }}>{currency.code}</span>
        <span style={{ color:"#999", fontSize:9 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ position:"fixed", right:14, zIndex:999, background:"#0d1520", border:"1px solid rgba(0,255,157,0.25)", borderRadius:8, width:220, maxHeight:"60vh", overflowY:"auto", boxShadow:"0 8px 32px rgba(0,0,0,0.9)", bottom:80 }}>
          <div style={{ padding:"7px 12px", fontSize:9, color:"#999", letterSpacing:2, borderBottom:"1px solid rgba(255,255,255,0.07)", position:"sticky", top:0, background:"#0d1520" }}>SELECT DISPLAY CURRENCY</div>
          {CURRENCIES.map(c => (
            <button key={c.code} onClick={() => { onChange(c); setOpen(false); }} style={{ width:"100%", background:c.code===currency.code?"rgba(0,255,157,0.08)":"none", border:"none", padding:"8px 12px", textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:10, fontFamily:"'Courier New',monospace" }}>
              <span style={{ fontSize:15 }}>{c.flag}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:c.code===currency.code?"#00ff9d":"#fff", fontWeight:700 }}>{c.code} <span style={{ fontSize:9, color:"#bbb", fontWeight:400 }}>{c.name}</span></div>
                <div style={{ fontSize:9, color:"#bbb" }}>1 USD = {c.rate} {c.code}</div>
              </div>
              {c.code===currency.code && <span style={{ color:"#00ff9d" }}>✓</span>}
            </button>
          ))}
          <div style={{ padding:"6px 12px", fontSize:8, color:"#666", borderTop:"1px solid rgba(255,255,255,0.05)" }}>SIMULATED RATES · CONNECT EXCHANGERATE-API FOR LIVE</div>
        </div>
      )}
    </div>
  );
}

// ── API CALL ──────────────────────────────────────────────────────────────────
const BACKEND_URL = "https://probability-engine-production-04e9.up.railway.app";

// Fetch real live price from backend proxy
async function fetchLivePrice(ticker) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/price/${ticker.toUpperCase()}`);
    const data = await res.json();
    if (data.price) return data;
    return null;
  } catch {
    return null;
  }
}

async function analyzeStock(ticker) {
  const res = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: ticker.toUpperCase().trim() })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ── shared UI ─────────────────────────────────────────────────────────────────
function ProbRing({ value, size=52 }) {
  const c = probColor(value);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0, background:`conic-gradient(${c} ${value*3.6}deg, rgba(255,255,255,0.08) 0deg)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:size*0.71, height:size*0.71, borderRadius:"50%", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.22, fontWeight:700, color:c }}>{value}%</div>
    </div>
  );
}

function Badge({ label, color="#aaa" }) {
  return <span style={{ fontSize:9, background:`${color}18`, border:`1px solid ${color}44`, borderRadius:3, padding:"2px 7px", color, letterSpacing:1, fontWeight:700 }}>{label}</span>;
}

function StatBox({ label, value, sub, color="#fff" }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"10px 12px" }}>
      <div style={{ fontSize:9, color:"#ccc", letterSpacing:1, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:700, color }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:"#ddd", marginTop:3, lineHeight:1.4 }}>{sub}</div>}
    </div>
  );
}

function ScoreBar({ label, score, color }) {
  const c = color || probColor(score);
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:10, color:"#fff" }}>{label}</span>
        <span style={{ fontSize:10, fontWeight:700, color:c }}>{score}/100</span>
      </div>
      <div style={{ height:5, background:"rgba(255,255,255,0.07)", borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:`${score}%`, height:"100%", background:c, borderRadius:3, transition:"width 0.8s ease" }} />
      </div>
    </div>
  );
}

function StrikeCard({ opt, accent, stamp, currency }) {
  const riskColors = { "CONSERVATIVE":"#00ff9d","MODERATE":"#ffd60a","AGGRESSIVE":"#ff9a3c","HIGH RISK":"#ff6b6b","VERY HIGH RISK":"#ff3366" };
  const rc = riskColors[opt.riskLevel] || "#aaa";
  const C = (v) => fmtC(v, currency);
  const volOiRatio = opt.volume && opt.openInterest ? opt.volume / opt.openInterest : 0;
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${opt.rank===1?accent+"55":"rgba(255,255,255,0.09)"}`, borderRadius:8, padding:14, marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, gap:8, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>{C(opt.strike)}</div>
          {opt.rank===1 && <Badge label="★ TOP PICK" color={accent} />}
          <Badge label={opt.riskLevel} color={rc} />
          <span style={{ fontSize:10, color:"#ccc" }}>{opt.expiry} · {stamp}</span>
        </div>
        <ProbRing value={opt.probability} size={48} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:8 }}>
        <div><div style={{ fontSize:9, color:"#ccc", letterSpacing:1 }}>PREMIUM</div><div style={{ fontSize:13, color:"#fff", marginTop:2 }}>{C(opt.premium)}</div></div>
        <div><div style={{ fontSize:9, color:"#ccc", letterSpacing:1 }}>BREAKEVEN</div><div style={{ fontSize:13, color:"#fff", marginTop:2 }}>{C(opt.breakeven)}</div></div>
        <div><div style={{ fontSize:9, color:"#ccc", letterSpacing:1 }}>MAX LOSS</div><div style={{ fontSize:13, color:"#ff6b6b", marginTop:2 }}>{C(opt.maxLoss)}</div></div>
        <div><div style={{ fontSize:9, color:"#ccc", letterSpacing:1 }}>REWARD</div><div style={{ fontSize:13, color:"#ffd60a", marginTop:2 }}>{opt.reward}</div></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:8 }}>
        <div><div style={{ fontSize:9, color:"#ccc", letterSpacing:1 }}>DELTA</div><div style={{ fontSize:12, color:"#fff", marginTop:2 }}>{opt.delta}</div></div>
        <div><div style={{ fontSize:9, color:"#ccc", letterSpacing:1 }}>THETA</div><div style={{ fontSize:12, color:"#ff6b6b", marginTop:2 }}>{opt.theta}</div></div>
        <div><div style={{ fontSize:9, color:"#ccc", letterSpacing:1 }}>IV</div><div style={{ fontSize:12, color:"#fff", marginTop:2 }}>{opt.iv}%</div></div>
        <div><div style={{ fontSize:9, color:"#ccc", letterSpacing:1 }}>VOLUME</div><div style={{ fontSize:12, color:"#ffd60a", marginTop:2 }}>{opt.volume?.toLocaleString()}</div></div>
        <div><div style={{ fontSize:9, color:"#ccc", letterSpacing:1 }}>OPEN INT.</div><div style={{ fontSize:12, color:"#fff", marginTop:2 }}>{opt.openInterest?.toLocaleString()}</div></div>
      </div>
      {volOiRatio > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{ flex:1, height:3, background:"rgba(255,255,255,0.07)", borderRadius:2 }}>
            <div style={{ width:`${Math.min(100,volOiRatio*100)}%`, height:"100%", background:volOiRatio>0.2?"#00ff9d":volOiRatio>0.08?"#ffd60a":"#ff6b6b", borderRadius:2 }} />
          </div>
          <span style={{ fontSize:9, color:volOiRatio>0.2?"#00ff9d":volOiRatio>0.08?"#ffd60a":"#666", whiteSpace:"nowrap" }}>
            {volOiRatio>0.2?"🟢 HIGH ACTIVITY":volOiRatio>0.08?"🟡 MODERATE":"🔴 LOW"} · {volOiRatio.toFixed(2)} Vol/OI
          </span>
        </div>
      )}
      {opt.tip && (
        <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
          <div style={{ fontSize:11, color:"#fff", flex:1, lineHeight:1.5 }}>💡 {opt.tip}</div>
          <button onClick={() => toggleSpeak(opt.tip)} style={{ background:"none", border:"1px solid rgba(255,255,255,0.12)", borderRadius:4, color:"#bbb", fontSize:13, padding:"2px 8px", cursor:"pointer" }}>🔊</button>
        </div>
      )}
    </div>
  );
}

// ── LEARN content ─────────────────────────────────────────────────────────────
const LEARN = [
  { icon:"🌡️", title:"Pillar 1 · Implied Volatility (IV) & IV Rank", body:"IV measures how much movement the market expects. IV Rank (0-100) compares today's IV to the past year. Below 30 = options are CHEAP — great time to buy. Above 70 = EXPENSIVE — avoid buying, consider selling instead. Always check IV rank before entering any trade.", speak:"Implied volatility tells you if options are cheap or expensive right now. The IV rank compares today's volatility to the past year. A low IV rank under 30 means options are on sale. A high IV rank over 70 means you are overpaying. Always check this first." },
  { icon:"🐋", title:"Pillar 2 · Options Flow & Unusual Activity", body:"Follow the smart money. When large institutions buy thousands of contracts at once — called sweeps — they're usually positioning ahead of a big move. Bullish flow = large call buys. Bearish flow = large put buys. The Put/Call Ratio tells you the overall market sentiment.", speak:"Options flow shows you what big institutional traders are doing with real money. When a large institution buys thousands of call contracts at once, they likely know something. Bullish flow means smart money is betting the stock goes up. Always pay attention to unusual options activity." },
  { icon:"🎯", title:"Pillar 3 · Delta & Probability", body:"Delta (0 to 1) tells you two things: how much the option gains per $1 stock move, AND the approximate probability it expires profitable. Delta 0.40 = gains $0.40 per $1 move AND roughly 40% chance of profit. Our app targets the 0.35-0.45 delta sweet spot for best risk/reward.", speak:"Delta is one of the most useful numbers in options trading. A delta of 0.40 means two things. First, your option gains 40 cents for every dollar the stock moves up. Second, there is roughly a 40 percent chance the option expires profitable. The sweet spot for most traders is a delta between 0.35 and 0.45." },
  { icon:"📊", title:"Pillar 4 · Open Interest & Max Pain", body:"Open Interest is the total number of active contracts. High OI at a strike makes it magnetic — stocks often drift toward the highest OI strike at expiration (called Max Pain). OI walls at call strikes = resistance. OI walls at put strikes = support. Use this to find price targets.", speak:"Open interest tells you where the big money is concentrated. Stocks often drift toward the strike price with the highest open interest at expiration — this is called max pain. High open interest at a call strike creates resistance above. High open interest at a put strike creates support below. Use these levels as your price targets." },
  { icon:"📅", title:"Pillar 5 · Catalysts & Earnings", body:"Options are priced around events. Before earnings, IV inflates — options get expensive. After earnings, IV collapses — called IV crush — and options lose value fast even if the stock moves the right way. Always know the earnings date before buying options. The best trades happen between catalysts.", speak:"Catalyst awareness is critical for options traders. Before earnings, implied volatility rises and options get more expensive. After earnings, volatility collapses and options lose value fast even if the stock moved your way. This is called IV crush. Always check the earnings date before buying any option." },
  { icon:"🧠", title:"How to Use the Command Center", body:"The Command Center is your trading headquarters. It compiles all 5 pillars into one verdict — up or down, confidence score, best call, best put, and exact price ranges. Check it first every time. Then drill into each pillar tab for deeper analysis. Use the 🔊 button to hear the full verdict read aloud.", speak:"The Command Center pulls together all five analysis pillars and gives you one clear verdict. It tells you if the stock is likely going up or down, shows the best call and put options with exact strike prices and premiums, and lists what signals are working for and against the trade. Always start here." }
];

const FAQS = [
  { q:"What is IV crush and how do I avoid it?", a:"IV crush happens after earnings — implied volatility collapses and your option loses value even if the stock moves your way. Avoid: never hold options through earnings unless you're specifically trading the event. Our app always shows days to earnings.", speak:"IV crush is when implied volatility drops sharply after an earnings report, causing your option to lose value even if the stock moved the right direction. The solution is simple — never hold options through earnings unless you know what you are doing. Our app always shows you how many days until the next earnings date." },
  { q:"How much money do I need to start?", a:"Most brokers require $2,000-$5,000 for options approval. Each contract covers 100 shares — a $1.50 premium costs $150 real dollars. Start with 1-2 contracts max until you understand how options move. Always use less than 5% of your account on any single trade.", speak:"Most brokers require two to five thousand dollars to get approved for options trading. Remember each contract covers 100 shares so a one dollar fifty premium actually costs you 150 dollars. Start small — one or two contracts maximum. Never put more than 5 percent of your account into any single options trade." },
  { q:"When should I take profit or cut losses?", a:"Professional rule: Take profit at 50-100% gain. Cut losses at 50% down. Example: bought for $200, sell at $300-$400 for profit, or sell at $100 to limit loss. Set these levels BEFORE you enter. Don't hold waiting for the perfect price — time decay kills profits.", speak:"The professional rule is to take profit when you are up 50 to 100 percent, and cut your loss when you are down 50 percent. If you paid 200 dollars, sell at 300 to 400 for a win, or sell at 100 to limit your loss. Decide your exit price before you enter the trade, not while you are watching it move." },
  { q:"What does the Vol/OI ratio mean?", a:"Volume/Open Interest ratio shows trading activity intensity. Above 0.20 = HIGH ACTIVITY — lots of fresh trading, easy to fill orders. Below 0.08 = LOW ACTIVITY — thin market, hard to get good fills. Always prefer strikes with high volume. It means other traders are actively buying and selling that contract.", speak:"The volume to open interest ratio tells you how actively a specific options contract is being traded. A ratio above 0.20 means high activity — lots of traders are buying and selling that contract, making it easy to get in and out. A low ratio means a thin market where you might have trouble selling when you want to exit." },
  { q:"What is max pain and why does it matter?", a:"Max pain is the strike price where the most options expire worthless — causing the maximum loss to option buyers. Market makers know this level and stocks often drift toward it near expiration. It's not guaranteed but it's a useful reference. Our app shows max pain under Pillar 4.", speak:"Max pain is the price where most options expire worthless. Market makers who sell options profit most when the stock lands at this price on expiration day. Research shows stocks often gravitate toward their max pain price near expiration. It is not a guarantee but it is a useful level to know when picking your strike price." }
];

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [ticker, setTicker]     = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [mainTab, setMainTab]   = useState("analyze");
  const [resTab, setResTab]     = useState("command");
  const [optTab, setOptTab]     = useState("calls");
  const [openFaq, setOpenFaq]   = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const stamp = nowStamp();
  const C = useCallback((v) => fmtC(v, currency), [currency]);

  // Inject mobile-friendly global styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      body { margin: 0; padding: 0; overflow-x: hidden; background: #080c14; }
      input, select, textarea { font-size: 16px !important; }
      .tabs-scroll { display: flex; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; }
      .tabs-scroll::-webkit-scrollbar { display: none; }
      .tabs-scroll button { scroll-snap-align: start; flex-shrink: 0; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!ticker.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      // Fetch AI analysis and live price in parallel
      const [data, priceData] = await Promise.all([
        analyzeStock(ticker.trim()),
        fetchLivePrice(ticker.trim())
      ]);
      if (priceData?.price) {
        data.currentPrice = priceData.price;
        data.priceChange = priceData.change;
        data.priceChangePct = priceData.changePct;
        data.priceOpen = priceData.open;
        data.priceHigh = priceData.high;
        data.priceLow = priceData.low;
        data.livePrice = true;
        if (priceData.companyName) data.companyName = priceData.companyName;
        if (data.commandCenter) data.commandCenter.currentPrice = priceData.price;
      }
      setResult(data);
      setResTab("command");
    } catch(e) { setError(e.message || "Analysis failed — try again"); }
    setLoading(false);
  }, [ticker, loading]);

  const cc = result?.commandCenter;
  const dc = cc ? dirColor(cc.verdict) : "#00ff9d";

  return (
    <div style={{ minHeight:"100vh", background:"#080c14", fontFamily:"'Courier New',monospace", color:"#fff" }}>
      <div style={{ position:"fixed", inset:0, zIndex:0, backgroundImage:"linear-gradient(rgba(0,255,157,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,157,0.02) 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:760, margin:"0 auto", padding:"18px 14px 60px" }}>

        {/* HEADER */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#00ff9d", boxShadow:"0 0 10px #00ff9d" }} />
              <span style={{ fontSize:9, color:"#00ff9d", letterSpacing:4 }}>OPTIONS INTELLIGENCE</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, margin:0, letterSpacing:-1 }}>PROBABILITY ENGINE <span style={{ fontSize:11, color:"#666", fontWeight:400 }}>PRO</span></h1>
            <p style={{ margin:"2px 0 0", fontSize:9, color:"#bbb", letterSpacing:2 }}>5-PILLAR OPTIONS ANALYSIS · AI COMMAND CENTER</p>
          </div>
          <CurrencySelector currency={currency} onChange={setCurrency} />
        </div>

        {/* MAIN NAV */}
        <div className="tabs-scroll" style={{ borderBottom:"1px solid rgba(255,255,255,0.08)", marginBottom:18 }}>
          {[["analyze","📊 ANALYZE"],["learn","📚 LEARN"],["faq","❓ FAQ"]].map(([id,label]) => (
            <button key={id} onClick={() => setMainTab(id)} style={{ background:"none", border:"none", padding:"8px 14px", fontSize:9, letterSpacing:2, fontFamily:"'Courier New',monospace", color:mainTab===id?"#00ff9d":"#666", cursor:"pointer", fontWeight:700, borderBottom:mainTab===id?"2px solid #00ff9d":"2px solid transparent", marginBottom:-1 }}>{label}</button>
          ))}
        </div>

        {/* ── ANALYZE TAB ── */}
        {mainTab === "analyze" && (
          <div>
            {/* search */}
            <div style={{ display:"flex", gap:10, marginBottom:18 }}>
              <div style={{ flex:1, position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#00ff9d", fontWeight:700 }}>$</span>
                <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key==="Enter" && handleAnalyze()}
                  placeholder="ENTER TICKER  e.g. AAPL · TSLA · NVDA · SPY"
                  style={{ width:"100%", boxSizing:"border-box", background:"rgba(0,255,157,0.04)", border:"1px solid rgba(0,255,157,0.25)", borderRadius:6, padding:"12px 12px 12px 28px", color:"#fff", fontSize:13, fontFamily:"'Courier New',monospace", letterSpacing:2, outline:"none" }} />
              </div>
              <button onClick={handleAnalyze} disabled={loading||!ticker.trim()} style={{ background:"rgba(0,255,157,0.12)", border:"1px solid rgba(0,255,157,0.35)", borderRadius:6, padding:"12px 20px", color:"#00ff9d", fontSize:9, fontFamily:"'Courier New',monospace", letterSpacing:2, cursor:loading?"wait":"pointer", fontWeight:700, whiteSpace:"nowrap" }}>
                {loading?"ANALYZING...":"ANALYZE →"}
              </button>
            </div>

            {/* loading */}
            {loading && (
              <div style={{ textAlign:"center", padding:48 }}>
                <div style={{ fontSize:9, color:"#00ff9d", letterSpacing:3, marginBottom:16 }}>RUNNING 5-PILLAR ANALYSIS</div>
                <div style={{ display:"flex", justifyContent:"center", gap:6 }}>
                  {[0,1,2,3,4].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#00ff9d", animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite` }} />)}
                </div>
                <div style={{ marginTop:16, fontSize:9, color:"#666" }}>IV · FLOW · DELTA · OI · CATALYSTS</div>
                <style>{`@keyframes pulse{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}`}</style>
              </div>
            )}

            {error && <div style={{ background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.3)", borderRadius:6, padding:14, color:"#ff6b6b", fontSize:12 }}>⚠ {error}</div>}

            {result && (
              <div>
                {/* ticker bar */}
                <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${dc}35`, borderRadius:8, padding:14, marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:3 }}>ANALYZING</div>
                    <div style={{ fontSize:20, fontWeight:700 }}>{result.ticker} <span style={{ fontSize:12, color:"#ddd", fontWeight:400 }}>{result.companyName}</span></div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
                      <div style={{ fontSize:22, fontWeight:700 }}>{C(result.currentPrice)}</div>
                      {result.livePrice
                        ? <span style={{ fontSize:9, background:"rgba(0,255,157,0.15)", border:"1px solid rgba(0,255,157,0.4)", borderRadius:3, padding:"2px 6px", color:"#00ff9d", letterSpacing:1, fontWeight:700 }}>● LIVE</span>
                        : <span style={{ fontSize:9, background:"rgba(255,214,10,0.1)", border:"1px solid rgba(255,214,10,0.3)", borderRadius:3, padding:"2px 6px", color:"#ffd60a", letterSpacing:1 }}>SIMULATED</span>
                      }
                      {result.livePrice && result.priceChange !== undefined && (
                        <span style={{ fontSize:12, fontWeight:700, color: result.priceChange >= 0 ? "#00ff9d" : "#ff6b6b" }}>
                          {result.priceChange >= 0 ? "▲" : "▼"} {Math.abs(result.priceChange).toFixed(2)} ({Math.abs(result.priceChangePct).toFixed(2)}%)
                        </span>
                      )}
                    </div>
                    {currency.code!=="USD" && <div style={{ fontSize:9, color:"#888" }}>USD ${fmt(result.currentPrice)} · 1 USD = {currency.rate} {currency.code}</div>}
                    {result.livePrice && result.priceOpen && (
                      <div style={{ display:"flex", gap:12, marginTop:4 }}>
                        <span style={{ fontSize:10, color:"#888" }}>O <span style={{ color:"#fff" }}>{C(result.priceOpen)}</span></span>
                        <span style={{ fontSize:10, color:"#888" }}>H <span style={{ color:"#00ff9d" }}>{C(result.priceHigh)}</span></span>
                        <span style={{ fontSize:10, color:"#888" }}>L <span style={{ color:"#ff6b6b" }}>{C(result.priceLow)}</span></span>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:700, color:dc }}>{cc?.verdict} <span style={{ fontSize:12, color:"#ccc" }}>{cc?.verdictStrength}</span></div>
                    <div style={{ fontSize:11, color:"#fff", marginTop:2 }}>Confidence: <span style={{ color:probColor(cc?.confidenceScore) }}>{cc?.confidenceScore}%</span></div>
                    <div style={{ fontSize:10, color:"#888", marginTop:3 }}>📡 {result.dataSource}</div>
                    <div style={{ fontSize:10, color:"#888" }}>🕐 {stamp}</div>
                  </div>
                </div>

                {/* result tabs */}
                <div className="tabs-scroll" style={{ borderBottom:"1px solid rgba(255,255,255,0.08)", marginBottom:14 }}>
                  {[
                    ["command","🎯 COMMAND CENTER"],
                    ["iv","🌡️ PILLAR 1 · IV"],
                    ["flow","🐋 PILLAR 2 · FLOW"],
                    ["delta","🎯 PILLAR 3 · DELTA"],
                    ["oi","📊 PILLAR 4 · OI"],
                    ["catalyst","📅 PILLAR 5 · CATALYST"],
                    ["calls","▲ CALLS (5)"],
                    ["puts","▼ PUTS (5)"],
                    ["fundamentals","📋 FUNDAMENTALS"]
                  ].map(([id,label]) => (
                    <button key={id} onClick={() => setResTab(id)} style={{ background:"none", border:"none", padding:"7px 10px", fontSize:9, letterSpacing:1, fontFamily:"'Courier New',monospace", color:resTab===id?"#00ff9d":"#666", cursor:"pointer", fontWeight:700, borderBottom:resTab===id?"2px solid #00ff9d":"2px solid transparent", marginBottom:-1, whiteSpace:"nowrap" }}>{label}</button>
                  ))}
                </div>

                {/* ── COMMAND CENTER ── */}
                {resTab==="command" && cc && (
                  <div>
                    {/* verdict hero */}
                    <div style={{ background:`linear-gradient(135deg, rgba(${cc.verdict==="BULLISH"?"0,255,157":"255,107,107"},0.08) 0%, rgba(0,0,0,0) 60%)`, border:`2px solid ${dc}44`, borderRadius:12, padding:20, marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:14 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:9, color:dc, letterSpacing:3, marginBottom:6 }}>🎯 AI COMMAND CENTER · MASTER VERDICT</div>
                          <div style={{ fontSize:28, fontWeight:700, color:dc, marginBottom:4 }}>
                            {cc.verdict === "BULLISH" ? "📈" : cc.verdict === "BEARISH" ? "📉" : "➡️"} {cc.verdict}
                          </div>
                          <div style={{ fontSize:12, color:"#ccc" }}>{cc.verdictStrength} signal · {cc.timeframe} outlook · Target: {C(cc.priceTarget)}</div>
                        </div>
                        <div style={{ textAlign:"center" }}>
                          <ProbRing value={cc.confidenceScore} size={64} />
                          <div style={{ fontSize:9, color:"#ccc", marginTop:4 }}>CONFIDENCE</div>
                        </div>
                        <button onClick={() => { toggleSpeak(cc.spokenSummary, (s) => setSpeaking(s)); }} style={{ background:"rgba(0,255,157,0.1)", border:"1px solid rgba(0,255,157,0.3)", borderRadius:6, color:speaking?"#00ff9d":"#aaa", fontSize:20, padding:"8px 12px", cursor:"pointer", flexShrink:0 }}>{speaking?"🔊":"🔈"}</button>
                      </div>
                      <div style={{ fontSize:13, color:"#fff", lineHeight:1.8, marginBottom:14 }}>{cc.summary}</div>

                      {/* BEST CALL + BEST PUT side by side */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                        {/* BEST CALL */}
                        <div style={{ background:"rgba(0,255,157,0.06)", border:"1px solid rgba(0,255,157,0.3)", borderRadius:8, padding:14 }}>
                          <div style={{ fontSize:9, color:"#00ff9d", letterSpacing:2, marginBottom:8 }}>▲ BEST CALL RIGHT NOW</div>
                          <div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>{C(cc.bestCall?.strike)}</div>
                          <div style={{ fontSize:11, color:"#ccc", marginBottom:8 }}>{cc.bestCall?.expiry} expiry</div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 }}>
                            <div><div style={{ fontSize:9, color:"#ccc" }}>PREMIUM</div><div style={{ fontSize:13, color:"#fff", fontWeight:700 }}>{C(cc.bestCall?.premium)}</div></div>
                            <div><div style={{ fontSize:9, color:"#ccc" }}>MAX LOSS</div><div style={{ fontSize:13, color:"#ff6b6b", fontWeight:700 }}>{C(cc.bestCall?.maxLoss)}</div></div>
                            <div><div style={{ fontSize:9, color:"#ccc" }}>BREAKEVEN</div><div style={{ fontSize:12, color:"#fff" }}>{C(cc.bestCall?.breakeven)}</div></div>
                            <div><div style={{ fontSize:9, color:"#ccc" }}>REWARD</div><div style={{ fontSize:12, color:"#ffd60a" }}>{cc.bestCall?.reward}</div></div>
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <ProbRing value={cc.bestCall?.probability||0} size={44} />
                            <div style={{ fontSize:10, color:"#fff", flex:1, marginLeft:10, lineHeight:1.5 }}>{cc.bestCall?.whyThis}</div>
                          </div>
                        </div>

                        {/* BEST PUT */}
                        <div style={{ background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.3)", borderRadius:8, padding:14 }}>
                          <div style={{ fontSize:9, color:"#ff6b6b", letterSpacing:2, marginBottom:8 }}>▼ BEST PUT (IF REVERSAL)</div>
                          <div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>{C(cc.bestPut?.strike)}</div>
                          <div style={{ fontSize:11, color:"#ccc", marginBottom:8 }}>{cc.bestPut?.expiry} expiry</div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 }}>
                            <div><div style={{ fontSize:9, color:"#ccc" }}>PREMIUM</div><div style={{ fontSize:13, color:"#fff", fontWeight:700 }}>{C(cc.bestPut?.premium)}</div></div>
                            <div><div style={{ fontSize:9, color:"#ccc" }}>MAX LOSS</div><div style={{ fontSize:13, color:"#ff6b6b", fontWeight:700 }}>{C(cc.bestPut?.maxLoss)}</div></div>
                            <div><div style={{ fontSize:9, color:"#ccc" }}>BREAKEVEN</div><div style={{ fontSize:12, color:"#fff" }}>{C(cc.bestPut?.breakeven)}</div></div>
                            <div><div style={{ fontSize:9, color:"#ccc" }}>REWARD</div><div style={{ fontSize:12, color:"#ffd60a" }}>{cc.bestPut?.reward}</div></div>
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <ProbRing value={cc.bestPut?.probability||0} size={44} />
                            <div style={{ fontSize:10, color:"#fff", flex:1, marginLeft:10, lineHeight:1.5 }}>{cc.bestPut?.whyThis}</div>
                          </div>
                        </div>
                      </div>

                      {/* pillars for/against */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        <div style={{ background:"rgba(0,255,157,0.05)", border:"1px solid rgba(0,255,157,0.15)", borderRadius:6, padding:12 }}>
                          <div style={{ fontSize:9, color:"#00ff9d", letterSpacing:2, marginBottom:8 }}>✅ SIGNALS ALIGNED</div>
                          {cc.pillarsAligned?.map((p,i) => <div key={i} style={{ fontSize:11, color:"#fff", marginBottom:5, lineHeight:1.4 }}>• {p}</div>)}
                        </div>
                        <div style={{ background:"rgba(255,107,107,0.05)", border:"1px solid rgba(255,107,107,0.15)", borderRadius:6, padding:12 }}>
                          <div style={{ fontSize:9, color:"#ff6b6b", letterSpacing:2, marginBottom:8 }}>⚠ RISKS / AGAINST</div>
                          {cc.pillarsAgainst?.map((p,i) => <div key={i} style={{ fontSize:11, color:"#fff", marginBottom:5, lineHeight:1.4 }}>• {p}</div>)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize:9, color:"#666", textAlign:"center" }}>FOR INFORMATIONAL PURPOSES ONLY · NOT FINANCIAL ADVICE · OPTIONS TRADING INVOLVES SIGNIFICANT RISK</div>
                  </div>
                )}

                {/* ── PILLAR 1 IV ── */}
                {resTab==="iv" && result.pillar1_iv && (
                  <div>
                    <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:12 }}>🌡️ PILLAR 1 · IMPLIED VOLATILITY · {result.ticker} · {stamp}</div>
                    <ScoreBar label="IV Score" score={result.pillar1_iv.ivScore} />
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:10 }}>
                      <StatBox label="IMPLIED VOLATILITY" value={`${result.pillar1_iv.impliedVolatility}%`} sub={result.pillar1_iv.ivSignal} color="#fff" />
                      <StatBox label="IV RANK (0-100)" value={result.pillar1_iv.ivRank} sub={result.pillar1_iv.ivRank<30?"🟢 CHEAP — good to buy":result.pillar1_iv.ivRank>70?"🔴 EXPENSIVE — avoid buying":"🟡 Moderate"} color={result.pillar1_iv.ivRank<30?"#00ff9d":result.pillar1_iv.ivRank>70?"#ff6b6b":"#ffd60a"} />
                      <StatBox label="IV PERCENTILE" value={`${result.pillar1_iv.ivPercentile}%`} color="#fff" />
                      <StatBox label="HIST. VOL (30D)" value={`${result.pillar1_iv.historicalVol30d}%`} sub={result.pillar1_iv.ivVsHv} color="#fff" />
                      <StatBox label="OPTIONS PRICING" value={result.pillar1_iv.cheapOrExpensive} color={result.pillar1_iv.cheapOrExpensive==="CHEAP"?"#00ff9d":result.pillar1_iv.cheapOrExpensive==="EXPENSIVE"?"#ff6b6b":"#ffd60a"} />
                      <StatBox label="GOOD TO TRADE?" value={result.pillar1_iv.bestTimeToTrade?.startsWith("Yes")?"✅ YES":"⚠ CAUTION"} sub={result.pillar1_iv.bestTimeToTrade} color={result.pillar1_iv.bestTimeToTrade?.startsWith("Yes")?"#00ff9d":"#ffd60a"} />
                    </div>
                    <div style={{ background:"rgba(255,214,10,0.06)", border:"1px solid rgba(255,214,10,0.2)", borderRadius:6, padding:12, marginBottom:8 }}>
                      <div style={{ fontSize:9, color:"#ffd60a", letterSpacing:2, marginBottom:5 }}>⚠ IV CRUSH RISK</div>
                      <div style={{ fontSize:12, color:"#fff" }}>{result.pillar1_iv.ivCrushRisk}</div>
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:12 }}>
                      <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:5 }}>💡 PLAIN ENGLISH</div>
                      <div style={{ fontSize:12, color:"#fff", lineHeight:1.7 }}>{result.pillar1_iv.explanation}</div>
                      <button onClick={() => toggleSpeak(result.pillar1_iv.explanation)} style={{ marginTop:8, background:"none", border:"1px solid rgba(0,255,157,0.2)", borderRadius:4, color:"#00ff9d", fontSize:10, padding:"4px 12px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>🔊 HEAR THIS</button>
                    </div>
                  </div>
                )}

                {/* ── PILLAR 2 FLOW ── */}
                {resTab==="flow" && result.pillar2_flow && (
                  <div>
                    <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:12 }}>🐋 PILLAR 2 · OPTIONS FLOW & UNUSUAL ACTIVITY · {result.ticker} · {stamp}</div>
                    <ScoreBar label="Flow Score" score={result.pillar2_flow.flowScore} />
                    <div style={{ background:`rgba(${result.pillar2_flow.flowSignal==="BULLISH"?"0,255,157":"255,107,107"},0.07)`, border:`1px solid rgba(${result.pillar2_flow.flowSignal==="BULLISH"?"0,255,157":"255,107,107"},0.25)`, borderRadius:8, padding:14, marginBottom:10 }}>
                      <div style={{ fontSize:9, color:result.pillar2_flow.flowSignal==="BULLISH"?"#00ff9d":"#ff6b6b", letterSpacing:2, marginBottom:6 }}>⚡ UNUSUAL OPTIONS ACTIVITY</div>
                      <div style={{ fontSize:14, color:"#fff", fontWeight:700, marginBottom:4 }}>{result.pillar2_flow.unusualActivity}</div>
                      <div style={{ fontSize:11, color:"#fff" }}>{result.pillar2_flow.bigMoneyMove}</div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:10 }}>
                      <StatBox label="FLOW SIGNAL" value={result.pillar2_flow.flowSignal} color={result.pillar2_flow.flowSignal==="BULLISH"?"#00ff9d":"#ff6b6b"} />
                      <StatBox label="INSTITUTIONAL BIAS" value={result.pillar2_flow.institutionalBias} color={result.pillar2_flow.institutionalBias==="CALLS"?"#00ff9d":"#ff6b6b"} />
                      <StatBox label="PUT/CALL RATIO" value={result.pillar2_flow.putCallRatio} sub={result.pillar2_flow.pcrSignal} color={result.pillar2_flow.putCallRatio<0.7?"#00ff9d":result.pillar2_flow.putCallRatio>1.0?"#ff6b6b":"#ffd60a"} />
                      <StatBox label="SWEEP COUNT (TODAY)" value={result.pillar2_flow.sweepCount} sub={result.pillar2_flow.sweepDirection} color="#fff" />
                      <StatBox label="DARK POOL" value={result.pillar2_flow.darkPoolPrints} color="#fff" />
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:12 }}>
                      <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:5 }}>💡 PLAIN ENGLISH</div>
                      <div style={{ fontSize:12, color:"#fff", lineHeight:1.7 }}>{result.pillar2_flow.explanation}</div>
                      <button onClick={() => toggleSpeak(result.pillar2_flow.explanation)} style={{ marginTop:8, background:"none", border:"1px solid rgba(0,255,157,0.2)", borderRadius:4, color:"#00ff9d", fontSize:10, padding:"4px 12px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>🔊 HEAR THIS</button>
                    </div>
                  </div>
                )}

                {/* ── PILLAR 3 DELTA ── */}
                {resTab==="delta" && result.pillar3_delta && (
                  <div>
                    <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:12 }}>🎯 PILLAR 3 · DELTA & PROBABILITY · {result.ticker} · {stamp}</div>
                    <ScoreBar label="Delta Score" score={result.pillar3_delta.deltaScore} />
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:10 }}>
                      <StatBox label="RECOMMENDED DELTA" value={result.pillar3_delta.recommendedDelta} sub={result.pillar3_delta.deltaRationale} color="#00ff9d" />
                      <StatBox label="OPTIMAL STRIKE" value={C(result.pillar3_delta.optimalStrike)} sub={`Expiry: ${result.pillar3_delta.optimalExpiry}`} color="#fff" />
                      <StatBox label="PROB. IN THE MONEY" value={`${result.pillar3_delta.probabilityITM}%`} color={probColor(result.pillar3_delta.probabilityITM)} />
                      <StatBox label="PROB. OF PROFIT" value={`${result.pillar3_delta.probabilityProfit}%`} color={probColor(result.pillar3_delta.probabilityProfit)} />
                      <StatBox label="GAMMA RISK" value={result.pillar3_delta.gammaRisk} color={result.pillar3_delta.gammaRisk==="LOW"?"#00ff9d":"#ffd60a"} />
                      <StatBox label="VEGA EXPOSURE" value={result.pillar3_delta.vegaExposure} color="#fff" />
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:12 }}>
                      <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:5 }}>💡 PLAIN ENGLISH</div>
                      <div style={{ fontSize:12, color:"#fff", lineHeight:1.7 }}>{result.pillar3_delta.explanation}</div>
                      <button onClick={() => toggleSpeak(result.pillar3_delta.explanation)} style={{ marginTop:8, background:"none", border:"1px solid rgba(0,255,157,0.2)", borderRadius:4, color:"#00ff9d", fontSize:10, padding:"4px 12px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>🔊 HEAR THIS</button>
                    </div>
                  </div>
                )}

                {/* ── PILLAR 4 OI ── */}
                {resTab==="oi" && result.pillar4_oi && (
                  <div>
                    <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:12 }}>📊 PILLAR 4 · OPEN INTEREST & MAX PAIN · {result.ticker} · {stamp}</div>
                    <ScoreBar label="OI Score" score={result.pillar4_oi.oiScore} />
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:10 }}>
                      <StatBox label="MAX PAIN STRIKE" value={C(result.pillar4_oi.maxPainStrike)} sub="Stock tends to drift here at expiry" color="#ffd60a" />
                      <StatBox label="MAGNET LEVEL" value={C(result.pillar4_oi.magnetLevel)} sub="Highest OI concentration" color="#00ff9d" />
                      <StatBox label="CALL OI WALL" value={C(result.pillar4_oi.highestCallOI)} sub={result.pillar4_oi.oiWallCall} color="#00ff9d" />
                      <StatBox label="PUT OI WALL" value={C(result.pillar4_oi.highestPutOI)} sub={result.pillar4_oi.oiWallPut} color="#ff6b6b" />
                      <StatBox label="OI TREND" value={result.pillar4_oi.oiTrend} color={result.pillar4_oi.oiTrend?.startsWith("RISING")?"#00ff9d":"#ffd60a"} />
                      <StatBox label="PIN RISK" value={result.pillar4_oi.pinRisk} color={result.pillar4_oi.pinRisk==="LOW"?"#00ff9d":"#ffd60a"} />
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:12 }}>
                      <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:5 }}>💡 PLAIN ENGLISH</div>
                      <div style={{ fontSize:12, color:"#fff", lineHeight:1.7 }}>{result.pillar4_oi.explanation}</div>
                      <button onClick={() => toggleSpeak(result.pillar4_oi.explanation)} style={{ marginTop:8, background:"none", border:"1px solid rgba(0,255,157,0.2)", borderRadius:4, color:"#00ff9d", fontSize:10, padding:"4px 12px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>🔊 HEAR THIS</button>
                    </div>
                  </div>
                )}

                {/* ── PILLAR 5 CATALYST ── */}
                {resTab==="catalyst" && result.pillar5_catalyst && (
                  <div>
                    <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:12 }}>📅 PILLAR 5 · CATALYSTS & EARNINGS · {result.ticker} · {stamp}</div>
                    <ScoreBar label="Catalyst Score" score={result.pillar5_catalyst.catalystScore} />
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:10 }}>
                      <StatBox label="NEXT EARNINGS" value={result.pillar5_catalyst.nextEarnings} sub={`${result.pillar5_catalyst.daysToEarnings} days away`} color="#ffd60a" />
                      <StatBox label="EARNINGS RISK" value={result.pillar5_catalyst.earningsRisk?.split(" — ")[0]} sub={result.pillar5_catalyst.earningsRisk} color={result.pillar5_catalyst.daysToEarnings<7?"#ff6b6b":result.pillar5_catalyst.daysToEarnings<14?"#ffd60a":"#00ff9d"} />
                      <StatBox label="EX-DIVIDEND DATE" value={result.pillar5_catalyst.exDividendDate} sub={`Dividend: $${result.pillar5_catalyst.dividendAmount}`} color="#fff" />
                      <StatBox label="CATALYST BIAS" value={result.pillar5_catalyst.catalystBias?.split(" — ")[0]} sub={result.pillar5_catalyst.catalystBias} color={result.pillar5_catalyst.catalystBias?.startsWith("BULLISH")?"#00ff9d":"#ffd60a"} />
                      <StatBox label="FED IMPACT" value={result.pillar5_catalyst.fedMeetingImpact} color="#fff" />
                    </div>
                    {result.pillar5_catalyst.upcomingEvents?.length > 0 && (
                      <div style={{ background:"rgba(0,255,157,0.05)", border:"1px solid rgba(0,255,157,0.15)", borderRadius:6, padding:12, marginBottom:8 }}>
                        <div style={{ fontSize:9, color:"#00ff9d", letterSpacing:2, marginBottom:8 }}>📌 UPCOMING EVENTS</div>
                        {result.pillar5_catalyst.upcomingEvents.map((e,i) => <div key={i} style={{ fontSize:12, color:"#fff", marginBottom:4 }}>• {e}</div>)}
                      </div>
                    )}
                    <div style={{ background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:6, padding:12, marginBottom:8 }}>
                      <div style={{ fontSize:9, color:"#ff6b6b", letterSpacing:2, marginBottom:5 }}>⚠ IV CRUSH WARNING</div>
                      <div style={{ fontSize:12, color:"#fff" }}>{result.pillar5_catalyst.ivCrushWarning}</div>
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:12 }}>
                      <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:5 }}>💡 PLAIN ENGLISH</div>
                      <div style={{ fontSize:12, color:"#fff", lineHeight:1.7 }}>{result.pillar5_catalyst.explanation}</div>
                      <button onClick={() => toggleSpeak(result.pillar5_catalyst.explanation)} style={{ marginTop:8, background:"none", border:"1px solid rgba(0,255,157,0.2)", borderRadius:4, color:"#00ff9d", fontSize:10, padding:"4px 12px", cursor:"pointer", fontFamily:"'Courier New',monospace" }}>🔊 HEAR THIS</button>
                    </div>
                  </div>
                )}

                {/* ── CALLS ── */}
                {resTab==="calls" && (
                  <div>
                    <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:10 }}>▲ TOP 5 CALLS · {result.ticker} @ {C(result.currentPrice)} · {currency.flag} {currency.code} · {stamp}</div>
                    {result.topCalls?.map((opt,i) => <StrikeCard key={i} opt={opt} accent="#00ff9d" stamp={stamp} currency={currency} />)}
                  </div>
                )}

                {/* ── PUTS ── */}
                {resTab==="puts" && (
                  <div>
                    <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:10 }}>▼ TOP 5 PUTS · {result.ticker} @ {C(result.currentPrice)} · {currency.flag} {currency.code} · {stamp}</div>
                    {result.topPuts?.map((opt,i) => <StrikeCard key={i} opt={opt} accent="#ff6b6b" stamp={stamp} currency={currency} />)}
                  </div>
                )}

                {/* ── FUNDAMENTALS ── */}
                {resTab==="fundamentals" && result.fundamentals && (
                  <div>
                    <div style={{ fontSize:9, color:"#ccc", letterSpacing:2, marginBottom:10 }}>📋 FUNDAMENTALS · {result.ticker} · {currency.flag} {currency.code} · {stamp}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
                      <StatBox label="CURRENT PRICE" value={C(result.currentPrice)} color="#fff" />
                      <StatBox label="P/E RATIO" value={result.fundamentals.peRatio} sub="Higher = growth expectations" color="#ffd60a" />
                      <StatBox label="MARKET CAP" value={result.fundamentals.marketCap} color="#fff" />
                      <StatBox label="ANALYST RATING" value={result.fundamentals.analystRating} sub={`Target: ${C(result.fundamentals.priceTarget)}`} color={result.fundamentals.analystRating==="BUY"?"#00ff9d":result.fundamentals.analystRating==="SELL"?"#ff6b6b":"#ffd60a"} />
                      <StatBox label="52-WEEK HIGH" value={C(result.fundamentals.week52High)} color="#00ff9d" />
                      <StatBox label="52-WEEK LOW" value={C(result.fundamentals.week52Low)} color="#ff6b6b" />
                      <StatBox label="RSI (14)" value={result.fundamentals.rsi} sub={result.fundamentals.rsi>70?"Overbought":result.fundamentals.rsi<30?"Oversold":"Neutral"} color={result.fundamentals.rsi>70?"#ff6b6b":result.fundamentals.rsi<30?"#00ff9d":"#ffd60a"} />
                      <StatBox label="TREND" value={result.fundamentals.trend} color={result.fundamentals.trend==="UPTREND"?"#00ff9d":"#ff6b6b"} />
                      <StatBox label="SUPPORT" value={C(result.fundamentals.support)} sub="Key buy zone" color="#00ff9d" />
                      <StatBox label="RESISTANCE" value={C(result.fundamentals.resistance)} sub="Key sell zone" color="#ff6b6b" />
                      <StatBox label="50-DAY MA" value={C(result.fundamentals.ma50)} color="#fff" />
                      <StatBox label="200-DAY MA" value={C(result.fundamentals.ma200)} color="#fff" />
                      <StatBox label="AVG VOLUME" value={result.fundamentals.avgVolume} color="#fff" />
                      <StatBox label="DIVIDEND YIELD" value={result.fundamentals.dividendYield} color="#fff" />
                      <StatBox label="NEXT EARNINGS" value={result.fundamentals.earningsDate} sub="⚠ Watch for IV inflation" color="#ffd60a" />
                      <StatBox label="SECTOR" value={result.fundamentals.sector} color="#fff" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* empty state */}
            {!result && !loading && !error && (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
                <div style={{ fontSize:11, letterSpacing:2, color:"#888", marginBottom:6 }}>ENTER ANY STOCK TICKER TO BEGIN</div>
                <div style={{ fontSize:10, color:"#666" }}>Try: AAPL · TSLA · NVDA · MSFT · AMZN · SPY · META · GOOGL</div>
                <div style={{ marginTop:16, fontSize:10, color:"#666" }}>
                  New to options? Check the <button onClick={() => setMainTab("learn")} style={{ background:"none", border:"none", color:"#00ff9d", cursor:"pointer", fontFamily:"'Courier New',monospace", fontSize:10, padding:0 }}>LEARN</button> tab first.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LEARN TAB ── */}
        {mainTab === "learn" && (
          <div>
            <div style={{ fontSize:12, color:"#fff", lineHeight:1.7, marginBottom:16 }}>The 5 pillars every options trader needs to understand — explained simply, with read-aloud on every lesson.</div>
            {LEARN.map((item,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:8, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#fff", marginBottom:7 }}>{item.icon} {item.title}</div>
                    <div style={{ fontSize:12, color:"#fff", lineHeight:1.7 }}>{item.body}</div>
                  </div>
                  <button onClick={() => toggleSpeak(item.speak)} style={{ background:"rgba(0,255,157,0.07)", border:"1px solid rgba(0,255,157,0.2)", borderRadius:6, color:"#00ff9d", fontSize:16, padding:"5px 10px", cursor:"pointer", flexShrink:0 }}>🔊</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FAQ TAB ── */}
        {mainTab === "faq" && (
          <div>
            <div style={{ fontSize:11, color:"#ccc", marginBottom:16 }}>Top questions options traders ask — answered plainly with read-aloud on every answer.</div>
            {FAQS.map((item,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${openFaq===i?"rgba(0,255,157,0.25)":"rgba(255,255,255,0.09)"}`, borderRadius:8, marginBottom:10, overflow:"hidden" }}>
                <button onClick={() => { setOpenFaq(openFaq===i?null:i); stopSpeak(); }} style={{ width:"100%", background:"none", border:"none", padding:"13px 14px", textAlign:"left", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:12, color:"#fff", fontFamily:"'Courier New',monospace", fontWeight:700, lineHeight:1.4 }}>{item.q}</span>
                  <span style={{ color:"#999", fontSize:13, flexShrink:0 }}>{openFaq===i?"▲":"▼"}</span>
                </button>
                {openFaq===i && (
                  <div style={{ padding:"0 14px 14px" }}>
                    <div style={{ fontSize:12, color:"#fff", lineHeight:1.8, marginBottom:10 }}>{item.a}</div>
                    <button onClick={() => toggleSpeak(item.speak)} style={{ background:"rgba(0,255,157,0.07)", border:"1px solid rgba(0,255,157,0.2)", borderRadius:6, color:"#00ff9d", fontSize:9, padding:"5px 12px", cursor:"pointer", fontFamily:"'Courier New',monospace", letterSpacing:2 }}>🔊 HEAR THIS</button>
                  </div>
                )}
              </div>
            ))}
            <div style={{ background:"rgba(255,214,10,0.05)", border:"1px solid rgba(255,214,10,0.15)", borderRadius:8, padding:14, marginTop:4 }}>
              <div style={{ fontSize:10, color:"#ffd60a", fontWeight:700, marginBottom:6 }}>⚠ ALWAYS REMEMBER</div>
              <div style={{ fontSize:11, color:"#fff", lineHeight:1.7 }}>This app is an analysis tool — not a financial advisor. Options trading involves real risk of loss. Start small, use paper trading to practice, and never risk money you need for bills or emergencies.</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
