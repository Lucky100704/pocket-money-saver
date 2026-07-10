const {
  useState,
  useMemo,
  useEffect,
  useRef
} = React;
const {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} = Recharts;

/* ─────────────────────────────────────────────────────────────
   POCKET MONEY SAVER — a personal budget tracker for Lucky
   Palette grounded in Canadian polymer banknotes:
   $5 blue · $10 purple · $20 green · $50 red · $100 brown
   ───────────────────────────────────────────────────────────── */

const CATEGORIES = {
  Housing: {
    color: "#9B8CE8",
    icon: "🏠"
  },
  Groceries: {
    color: "#3ECF8E",
    icon: "🛒"
  },
  Transport: {
    color: "#6B9DF2",
    icon: "🚌"
  },
  Dining: {
    color: "#EDB95E",
    icon: "🍜"
  },
  Shopping: {
    color: "#F07A7A",
    icon: "🛍️"
  },
  Tuition: {
    color: "#C98B5E",
    icon: "🎓"
  },
  Phone: {
    color: "#8AD4E8",
    icon: "📱"
  },
  Entertainment: {
    color: "#E08BC9",
    icon: "🎬"
  },
  Savings: {
    color: "#49D6BE",
    icon: "🌱"
  },
  Other: {
    color: "#A9B4AE",
    icon: "✨"
  }
};
const INCOME_COLOR = "#3ECF8E";
const seedTx = [{
  id: 1,
  type: "income",
  amount: 640,
  category: "Income",
  date: "2026-07-03",
  note: "Retail paycheque"
}, {
  id: 2,
  type: "expense",
  amount: 750,
  category: "Housing",
  date: "2026-07-01",
  note: "July rent"
}, {
  id: 3,
  type: "expense",
  amount: 62.4,
  category: "Groceries",
  date: "2026-07-02",
  note: "Food Basics run"
}, {
  id: 4,
  type: "expense",
  amount: 85,
  category: "Transport",
  date: "2026-07-01",
  note: "Transit Windsor pass"
}, {
  id: 5,
  type: "expense",
  amount: 45,
  category: "Phone",
  date: "2026-07-02",
  note: "Freedom Mobile"
}, {
  id: 6,
  type: "expense",
  amount: 150,
  category: "Savings",
  date: "2026-07-03",
  note: "TFSA — XEQT buy"
}, {
  id: 7,
  type: "expense",
  amount: 23.75,
  category: "Dining",
  date: "2026-07-04",
  note: "Shawarma with friends"
}, {
  id: 8,
  type: "expense",
  amount: 38.9,
  category: "Groceries",
  date: "2026-07-05",
  note: "Walmart groceries"
}, {
  id: 9,
  type: "expense",
  amount: 16.99,
  category: "Entertainment",
  date: "2026-07-05",
  note: "Movie night"
}, {
  id: 10,
  type: "income",
  amount: 120,
  category: "Income",
  date: "2026-07-05",
  note: "GST/HST credit"
}, {
  id: 11,
  type: "expense",
  amount: 54.2,
  category: "Shopping",
  date: "2026-07-04",
  note: "Desk lamp + cable"
},
// June history so the month switcher has something to show
{
  id: 12,
  type: "income",
  amount: 640,
  category: "Income",
  date: "2026-06-05",
  note: "Retail paycheque"
}, {
  id: 13,
  type: "income",
  amount: 640,
  category: "Income",
  date: "2026-06-19",
  note: "Retail paycheque"
}, {
  id: 14,
  type: "expense",
  amount: 750,
  category: "Housing",
  date: "2026-06-01",
  note: "June rent"
}, {
  id: 15,
  type: "expense",
  amount: 297.5,
  category: "Groceries",
  date: "2026-06-15",
  note: "Groceries (month)"
}, {
  id: 16,
  type: "expense",
  amount: 85,
  category: "Transport",
  date: "2026-06-01",
  note: "Bus pass"
}, {
  id: 17,
  type: "expense",
  amount: 129.9,
  category: "Dining",
  date: "2026-06-20",
  note: "Eating out (month)"
}, {
  id: 18,
  type: "expense",
  amount: 219,
  category: "Shopping",
  date: "2026-06-12",
  note: "PUMA sneakers"
}, {
  id: 19,
  type: "expense",
  amount: 150,
  category: "Savings",
  date: "2026-06-06",
  note: "TFSA — XEQT buy"
}, {
  id: 20,
  type: "expense",
  amount: 45,
  category: "Phone",
  date: "2026-06-02",
  note: "Freedom Mobile"
}];
const seedBudgets = {
  Housing: 800,
  Groceries: 350,
  Transport: 120,
  Dining: 150,
  Shopping: 200,
  Phone: 60,
  Entertainment: 100,
  Savings: 200,
  Other: 80
};
const seedGoals = [{
  id: 1,
  name: "Emergency fund",
  emoji: "🛟",
  target: 2000,
  saved: 850
}, {
  id: 2,
  name: "TFSA 2026 contributions",
  emoji: "📈",
  target: 3000,
  saved: 1050
}, {
  id: 3,
  name: "Mechanical keyboard",
  emoji: "⌨️",
  target: 220,
  saved: 140
}];
const fmt = n => new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD"
}).format(n);
const fmt0 = n => new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0
}).format(n);
const monthLabel = ym => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric"
  });
};
const shiftMonth = (ym, delta) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/* Animated number that counts toward its target */
function useCountUp(value, duration = 800) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = t => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}
function Money({
  value,
  className = "",
  zeroDec = false
}) {
  const v = useCountUp(value);
  return /*#__PURE__*/React.createElement("span", {
    className: className
  }, zeroDec ? fmt0(v) : fmt(v));
}

/* Signature element: the cash-flow ring */
function FlowRing({
  income,
  spent
}) {
  const R = 84,
    C = 2 * Math.PI * R;
  const ratio = income > 0 ? Math.min(spent / income, 1) : spent > 0 ? 1 : 0;
  const kept = Math.max(income - spent, 0);
  const over = spent > income && income > 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "ring-wrap"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 220 220",
    className: "ring-svg",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "spendGrad",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: over ? "#F07A7A" : "#EDB95E"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: over ? "#C94F4F" : "#E08BC9"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "keepGrad",
    x1: "0",
    y1: "1",
    x2: "1",
    y2: "0"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#3ECF8E"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#49D6BE"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: "110",
    cy: "110",
    r: R,
    className: "ring-track"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "110",
    cy: "110",
    r: R,
    className: "ring-arc",
    stroke: "url(#keepGrad)",
    strokeDasharray: C,
    strokeDashoffset: C * ratio,
    transform: "rotate(-90 110 110)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "110",
    cy: "110",
    r: R,
    className: "ring-arc ring-spend",
    stroke: "url(#spendGrad)",
    strokeDasharray: C,
    strokeDashoffset: C * (1 - ratio),
    transform: `rotate(${-90 + 360 * (1 - ratio)} 110 110)`
  })), /*#__PURE__*/React.createElement("div", {
    className: "ring-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ring-label"
  }, over ? "over budget" : "left to spend"), /*#__PURE__*/React.createElement("div", {
    className: `ring-value ${over ? "neg" : ""}`
  }, /*#__PURE__*/React.createElement(Money, {
    value: over ? spent - income : kept,
    zeroDec: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "ring-sub"
  }, "of ", /*#__PURE__*/React.createElement("b", null, fmt0(income)), " in")));
}
function ProgressBar({
  pct,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "pbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pbar-fill",
    style: {
      width: `${Math.min(pct, 100)}%`,
      background: pct > 100 ? "#F07A7A" : color
    }
  }));
}
const NAV = [{
  id: "dashboard",
  label: "Dashboard",
  icon: "◧"
}, {
  id: "transactions",
  label: "Transactions",
  icon: "⇄"
}, {
  id: "budgets",
  label: "Budgets",
  icon: "▤"
}, {
  id: "goals",
  label: "Goals",
  icon: "◎"
}, {
  id: "insights",
  label: "Insights",
  icon: "✦"
}];
function PocketMoneySaver() {
  const [txs, setTxs] = useState(seedTx);
  const [budgets, setBudgets] = useState(seedBudgets);
  const [goals, setGoals] = useState(seedGoals);
  const [month, setMonth] = useState("2026-07");
  const [view, setView] = useState("dashboard");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [toast, setToast] = useState(null);
  const nextId = useRef(100);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "Groceries",
    date: new Date().toISOString().slice(0, 10),
    note: ""
  });
  const notify = msg => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };
  const monthTx = useMemo(() => txs.filter(t => t.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)), [txs, month]);
  const income = monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const spent = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const saved = monthTx.filter(t => t.type === "expense" && t.category === "Savings").reduce((s, t) => s + t.amount, 0);
  const byCategory = useMemo(() => {
    const m = {};
    monthTx.forEach(t => {
      if (t.type === "expense") m[t.category] = (m[t.category] || 0) + t.amount;
    });
    return Object.entries(m).map(([name, value]) => ({
      name,
      value,
      color: CATEGORIES[name]?.color || "#A9B4AE"
    })).sort((a, b) => b.value - a.value);
  }, [monthTx]);
  const dailySeries = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const arr = Array.from({
      length: days
    }, (_, i) => ({
      day: i + 1,
      spend: 0
    }));
    monthTx.forEach(t => {
      if (t.type === "expense") arr[Number(t.date.slice(8)) - 1].spend += t.amount;
    });
    let run = 0;
    return arr.map(d => ({
      ...d,
      total: run += d.spend
    }));
  }, [monthTx, month]);
  const filteredTx = monthTx.filter(t => {
    const q = search.toLowerCase();
    const okQ = !q || t.note.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    const okC = filterCat === "All" || t.category === filterCat || filterCat === "Income" && t.type === "income";
    return okQ && okC;
  });
  const addTx = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      notify("Enter an amount above zero");
      return;
    }
    setTxs(p => [...p, {
      id: nextId.current++,
      type: form.type,
      amount: amt,
      category: form.type === "income" ? "Income" : form.category,
      date: form.date,
      note: form.note || (form.type === "income" ? "Income" : form.category)
    }]);
    setShowAdd(false);
    setForm(f => ({
      ...f,
      amount: "",
      note: ""
    }));
    notify(form.type === "income" ? "Income added 🎉" : "Expense logged");
    if (!form.date.startsWith(month)) setMonth(form.date.slice(0, 7));
  };
  const removeTx = id => {
    setTxs(p => p.filter(t => t.id !== id));
    notify("Transaction removed");
  };
  const addToGoal = (id, amt) => setGoals(p => p.map(g => {
    if (g.id !== id) return g;
    const ns = Math.min(g.saved + amt, g.target);
    if (ns >= g.target && g.saved < g.target) notify(`🎊 Goal reached: ${g.name}!`);
    return {
      ...g,
      saved: ns
    };
  }));

  /* Insights */
  const today = new Date("2026-07-06");
  const isCurrent = month === "2026-07";
  const [yy, mm] = month.split("-").map(Number);
  const daysInMonth = new Date(yy, mm, 0).getDate();
  const daysElapsed = isCurrent ? today.getDate() : daysInMonth;
  const avgDaily = daysElapsed ? spent / daysElapsed : 0;
  const projected = avgDaily * daysInMonth;
  const savingsRate = income > 0 ? saved / income * 100 : 0;
  const topCat = byCategory[0];
  const biggest = monthTx.filter(t => t.type === "expense").sort((a, b) => b.amount - a.amount)[0];
  const overBudget = Object.entries(budgets).map(([c, b]) => ({
    c,
    b,
    s: byCategory.find(x => x.name === c)?.value || 0
  })).filter(x => x.s > x.b);
  return /*#__PURE__*/React.createElement("div", {
    className: "ml-app"
  }, /*#__PURE__*/React.createElement("style", null, `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Outfit:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        :root{
          --bg:#0D1614; --panel:#132019; --panel2:#182821; --line:#24382E;
          --ink:#EAF4EE; --dim:#8FA79A; --faint:#5E7A6C;
          --green:#3ECF8E; --teal:#49D6BE; --gold:#EDB95E; --red:#F07A7A;
          --purple:#9B8CE8; --blue:#6B9DF2;
          --disp:'Space Grotesk',sans-serif; --body:'Outfit',sans-serif; --mono:'IBM Plex Mono',monospace;
        }
        .ml-app{min-height:100vh;background:
          radial-gradient(1100px 500px at 85% -10%, rgba(62,207,142,.09), transparent 60%),
          radial-gradient(800px 420px at -10% 100%, rgba(155,140,232,.08), transparent 55%),
          var(--bg);
          color:var(--ink);font-family:var(--body);display:flex;}
        .ml-app *{box-sizing:border-box}
        .sidebar{width:216px;padding:22px 14px;border-right:1px solid var(--line);position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:6px}
        .brand{font-family:var(--disp);font-weight:700;font-size:19px;letter-spacing:-.02em;padding:6px 10px 18px;display:flex;align-items:center;gap:8px}
        .leaf{color:var(--green);font-size:22px;line-height:1}
        .nav-btn{display:flex;align-items:center;gap:11px;width:100%;padding:11px 12px;border:none;border-radius:11px;background:transparent;color:var(--dim);font-family:var(--body);font-size:14.5px;font-weight:500;cursor:pointer;transition:all .18s;text-align:left}
        .nav-btn:hover{background:var(--panel);color:var(--ink)}
        .nav-btn.on{background:linear-gradient(135deg,rgba(62,207,142,.16),rgba(73,214,190,.08));color:var(--green);box-shadow:inset 0 0 0 1px rgba(62,207,142,.25)}
        .nav-ic{font-size:16px;width:20px;text-align:center}
        .main{flex:1;padding:26px clamp(16px,4vw,44px) 110px;max-width:1120px;margin:0 auto;width:100%}
        .topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:24px}
        h1.page{font-family:var(--disp);font-size:clamp(24px,3.4vw,32px);font-weight:700;letter-spacing:-.03em;margin:0}
        .month-pick{display:flex;align-items:center;gap:4px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:4px}
        .month-pick button{background:transparent;border:none;color:var(--dim);font-size:16px;cursor:pointer;padding:6px 10px;border-radius:8px;transition:.15s}
        .month-pick button:hover{color:var(--ink);background:var(--panel2)}
        .month-pick span{font-family:var(--mono);font-size:13px;padding:0 6px;min-width:118px;text-align:center;color:var(--ink)}
        .card{background:linear-gradient(180deg,var(--panel),rgba(19,32,25,.6));border:1px solid var(--line);border-radius:18px;padding:20px}
        .grid-hero{display:grid;grid-template-columns:minmax(250px,320px) 1fr;gap:18px;margin-bottom:18px}
        .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px}
        .kpi{padding:16px 18px}
        .kpi .lbl{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);font-weight:600}
        .kpi .val{font-family:var(--mono);font-size:clamp(19px,2.2vw,24px);font-weight:600;margin-top:7px}
        .kpi .chip{font-size:11.5px;color:var(--dim);margin-top:6px}
        .pos{color:var(--green)} .neg{color:var(--red)} .gold{color:var(--gold)} .teal{color:var(--teal)}
        .ring-wrap{position:relative;width:100%;max-width:250px;margin:0 auto}
        .ring-svg{width:100%;display:block}
        .ring-track{fill:none;stroke:var(--line);stroke-width:17}
        .ring-arc{fill:none;stroke-width:17;stroke-linecap:round;transition:stroke-dashoffset 1.1s cubic-bezier(.22,1,.3,1)}
        .ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
        .ring-label{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);font-weight:600}
        .ring-value{font-family:var(--mono);font-size:27px;font-weight:600;color:var(--green);margin:4px 0 2px}
        .ring-value.neg{color:var(--red)}
        .ring-sub{font-size:12px;color:var(--dim)}
        .sec-title{font-family:var(--disp);font-size:16.5px;font-weight:700;letter-spacing:-.01em;margin:0 0 14px;display:flex;justify-content:space-between;align-items:center}
        .sec-title small{font-family:var(--body);font-weight:400;font-size:12px;color:var(--faint)}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        .tx-row{display:flex;align-items:center;gap:13px;padding:12px 8px;border-bottom:1px solid var(--line);transition:background .15s;border-radius:10px}
        .tx-row:hover{background:rgba(255,255,255,.025)}
        .tx-row:last-child{border-bottom:none}
        .tx-ic{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
        .tx-note{font-weight:500;font-size:14.5px}
        .tx-meta{font-size:12px;color:var(--faint);margin-top:2px}
        .tx-amt{font-family:var(--mono);font-size:14.5px;font-weight:600;margin-left:auto;white-space:nowrap}
        .tx-del{background:transparent;border:none;color:var(--faint);cursor:pointer;font-size:15px;padding:6px;border-radius:8px;opacity:0;transition:.15s}
        .tx-row:hover .tx-del{opacity:1}
        .tx-del:hover{color:var(--red);background:rgba(240,122,122,.1)}
        .pbar{height:8px;background:var(--line);border-radius:99px;overflow:hidden;margin-top:9px}
        .pbar-fill{height:100%;border-radius:99px;transition:width .9s cubic-bezier(.22,1,.3,1)}
        .fab{position:fixed;right:26px;bottom:26px;width:58px;height:58px;border-radius:18px;border:none;background:linear-gradient(135deg,var(--green),var(--teal));color:#07110C;font-size:27px;font-weight:400;cursor:pointer;box-shadow:0 10px 32px rgba(62,207,142,.35);transition:transform .18s,box-shadow .18s;z-index:40}
        .fab:hover{transform:translateY(-3px) rotate(90deg);box-shadow:0 14px 40px rgba(62,207,142,.5)}
        .overlay{position:fixed;inset:0;background:rgba(6,12,9,.72);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:18px;z-index:50;animation:fade .2s}
        @keyframes fade{from{opacity:0}to{opacity:1}}
        .modal{width:100%;max-width:420px;background:var(--panel2);border:1px solid var(--line);border-radius:20px;padding:24px;animation:pop .25s cubic-bezier(.2,1.4,.4,1)}
        @keyframes pop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
        .seg{display:flex;background:var(--bg);border-radius:12px;padding:4px;gap:4px;margin-bottom:16px}
        .seg button{flex:1;padding:9px;border:none;border-radius:9px;background:transparent;color:var(--dim);font-family:var(--body);font-weight:600;font-size:13.5px;cursor:pointer;transition:.15s}
        .seg .on-exp{background:rgba(240,122,122,.15);color:var(--red)}
        .seg .on-inc{background:rgba(62,207,142,.15);color:var(--green)}
        .fld{margin-bottom:13px}
        .fld label{display:block;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:600;margin-bottom:6px}
        .fld input,.fld select{width:100%;padding:11px 13px;background:var(--bg);border:1px solid var(--line);border-radius:11px;color:var(--ink);font-family:var(--body);font-size:14.5px;outline:none;transition:border .15s}
        .fld input:focus,.fld select:focus{border-color:var(--green)}
        .btn{padding:12px 18px;border:none;border-radius:12px;font-family:var(--body);font-weight:600;font-size:14.5px;cursor:pointer;transition:.15s}
        .btn-go{background:linear-gradient(135deg,var(--green),var(--teal));color:#07110C;width:100%}
        .btn-go:hover{filter:brightness(1.08)}
        .btn-ghost{background:transparent;color:var(--dim)}
        .btn-ghost:hover{color:var(--ink)}
        .cat-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:99px;border:1px solid var(--line);background:var(--panel);color:var(--dim);font-size:12.5px;font-weight:500;cursor:pointer;transition:.15s;white-space:nowrap}
        .cat-chip.on{border-color:var(--green);color:var(--green);background:rgba(62,207,142,.1)}
        .search{width:100%;max-width:300px;padding:10px 14px;background:var(--panel);border:1px solid var(--line);border-radius:12px;color:var(--ink);font-family:var(--body);font-size:14px;outline:none}
        .search:focus{border-color:var(--green)}
        .chips-row{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none}
        .chips-row::-webkit-scrollbar{display:none}
        .goal-card{padding:20px}
        .goal-top{display:flex;align-items:center;gap:12px;margin-bottom:6px}
        .goal-emoji{font-size:26px}
        .goal-name{font-family:var(--disp);font-weight:700;font-size:16px}
        .goal-nums{font-family:var(--mono);font-size:13px;color:var(--dim);margin-top:8px;display:flex;justify-content:space-between}
        .goal-btns{display:flex;gap:8px;margin-top:14px}
        .mini-btn{flex:1;padding:8px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--teal);font-family:var(--mono);font-size:12.5px;font-weight:600;cursor:pointer;transition:.15s}
        .mini-btn:hover{background:rgba(73,214,190,.1);border-color:var(--teal)}
        .insight{display:flex;gap:14px;align-items:flex-start;padding:16px 18px}
        .insight .ico{font-size:22px;flex-shrink:0;margin-top:2px}
        .insight h4{margin:0 0 4px;font-family:var(--disp);font-size:14.5px;font-weight:700}
        .insight p{margin:0;font-size:13.5px;color:var(--dim);line-height:1.55}
        .toast{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);background:var(--panel2);border:1px solid var(--green);color:var(--ink);padding:11px 20px;border-radius:99px;font-size:14px;font-weight:500;z-index:60;animation:pop .25s;box-shadow:0 8px 28px rgba(0,0,0,.45)}
        .empty{padding:44px 20px;text-align:center;color:var(--faint);font-size:14px}
        .empty .big{font-size:34px;margin-bottom:10px}
        .bottom-nav{display:none}
        @media (max-width:840px){
          .sidebar{display:none}
          .grid-hero,.grid-2{grid-template-columns:1fr}
          .main{padding-bottom:150px}
          .bottom-nav{display:flex;position:fixed;left:0;right:0;bottom:0;background:rgba(13,22,20,.92);backdrop-filter:blur(12px);border-top:1px solid var(--line);z-index:45;padding:8px 6px calc(8px + env(safe-area-inset-bottom))}
          .bottom-nav button{flex:1;background:transparent;border:none;color:var(--faint);font-family:var(--body);font-size:10.5px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px;cursor:pointer;border-radius:10px}
          .bottom-nav button.on{color:var(--green)}
          .bottom-nav .nav-ic{font-size:18px}
          .fab{bottom:86px;right:18px}
          .toast{bottom:160px}
        }
        @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `), /*#__PURE__*/React.createElement("aside", {
    className: "sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "leaf"
  }, "🪙"), " Pocket Money Saver"), NAV.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    className: `nav-btn ${view === n.id ? "on" : ""}`,
    onClick: () => setView(n.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-ic"
  }, n.icon), n.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      padding: "12px 10px",
      fontSize: 11.5,
      color: "var(--faint)",
      lineHeight: 1.6
    }
  }, "Built for Lucky · Windsor, ON", /*#__PURE__*/React.createElement("br", null), "All amounts in CAD")), /*#__PURE__*/React.createElement("main", {
    className: "main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "page"
  }, view === "dashboard" && "Good day, Lucky 👋", view === "transactions" && "Transactions", view === "budgets" && "Budgets", view === "goals" && "Savings goals", view === "insights" && "Insights"), /*#__PURE__*/React.createElement("div", {
    className: "month-pick"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMonth(m => shiftMonth(m, -1)),
    "aria-label": "Previous month"
  }, "‹"), /*#__PURE__*/React.createElement("span", null, monthLabel(month)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMonth(m => shiftMonth(m, 1)),
    "aria-label": "Next month"
  }, "›"))), view === "dashboard" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "grid-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(FlowRing, {
    income: income,
    spent: spent
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpis"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Income"), /*#__PURE__*/React.createElement("div", {
    className: "val pos"
  }, /*#__PURE__*/React.createElement(Money, {
    value: income,
    zeroDec: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "chip"
  }, monthTx.filter(t => t.type === "income").length, " deposits")), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Spent"), /*#__PURE__*/React.createElement("div", {
    className: "val gold"
  }, /*#__PURE__*/React.createElement(Money, {
    value: spent,
    zeroDec: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "chip"
  }, fmt0(avgDaily), "/day average")), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Saved / TFSA"), /*#__PURE__*/React.createElement("div", {
    className: "val teal"
  }, /*#__PURE__*/React.createElement(Money, {
    value: saved,
    zeroDec: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "chip"
  }, savingsRate.toFixed(0), "% of income")), /*#__PURE__*/React.createElement("div", {
    className: "card kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Net"), /*#__PURE__*/React.createElement("div", {
    className: `val ${income - spent >= 0 ? "pos" : "neg"}`
  }, /*#__PURE__*/React.createElement(Money, {
    value: income - spent,
    zeroDec: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "chip"
  }, income - spent >= 0 ? "in the green 🟢" : "in the red 🔴"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      flex: 1,
      minHeight: 150,
      paddingBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "Spending curve ", /*#__PURE__*/React.createElement("small", null, "cumulative, this month")), /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 110
  }, /*#__PURE__*/React.createElement(AreaChart, {
    data: dailySeries,
    margin: {
      top: 4,
      right: 4,
      left: 4,
      bottom: 0
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "curve",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#EDB95E",
    stopOpacity: 0.4
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#EDB95E",
    stopOpacity: 0
  }))), /*#__PURE__*/React.createElement(CartesianGrid, {
    stroke: "#24382E",
    strokeDasharray: "3 6",
    vertical: false
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "day",
    tick: {
      fill: "#5E7A6C",
      fontSize: 10,
      fontFamily: "IBM Plex Mono"
    },
    tickLine: false,
    axisLine: false,
    interval: 4
  }), /*#__PURE__*/React.createElement(YAxis, {
    hide: true
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      background: "#182821",
      border: "1px solid #24382E",
      borderRadius: 12,
      fontFamily: "IBM Plex Mono",
      fontSize: 12
    },
    labelFormatter: d => `Day ${d}`,
    formatter: v => [fmt(v), "Total spent"]
  }), /*#__PURE__*/React.createElement(Area, {
    type: "monotone",
    dataKey: "total",
    stroke: "#EDB95E",
    strokeWidth: 2.5,
    fill: "url(#curve)"
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "grid-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "Where it went ", /*#__PURE__*/React.createElement("small", null, byCategory.length, " categories")), byCategory.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "big"
  }, "🌵"), "No spending yet this month.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: 160,
    height: 160
  }, /*#__PURE__*/React.createElement(PieChart, null, /*#__PURE__*/React.createElement(Pie, {
    data: byCategory,
    dataKey: "value",
    innerRadius: 48,
    outerRadius: 72,
    paddingAngle: 3,
    strokeWidth: 0
  }, byCategory.map(c => /*#__PURE__*/React.createElement(Cell, {
    key: c.name,
    fill: c.color
  }))), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      background: "#182821",
      border: "1px solid #24382E",
      borderRadius: 12,
      fontFamily: "IBM Plex Mono",
      fontSize: 12
    },
    formatter: (v, n) => [fmt(v), n]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 170
    }
  }, byCategory.slice(0, 5).map(c => /*#__PURE__*/React.createElement("div", {
    key: c.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "5px 0",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: c.color,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--dim)"
    }
  }, CATEGORIES[c.name]?.icon, " ", c.name), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--mono)",
      fontWeight: 600
    }
  }, fmt0(c.value))))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "Recent activity", /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    style: {
      fontSize: 12.5,
      padding: "4px 8px"
    },
    onClick: () => setView("transactions")
  }, "See all →")), monthTx.slice(0, 5).map(t => /*#__PURE__*/React.createElement(TxRow, {
    key: t.id,
    t: t,
    onDelete: removeTx
  })), monthTx.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "big"
  }, "🧾"), "Tap + to log your first transaction.")))), view === "transactions" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "search",
    placeholder: "Search notes or categories…",
    value: search,
    onChange: e => setSearch(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "chips-row"
  }, ["All", "Income", ...Object.keys(CATEGORIES)].map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    className: `cat-chip ${filterCat === c ? "on" : ""}`,
    onClick: () => setFilterCat(c)
  }, CATEGORIES[c]?.icon || (c === "Income" ? "💰" : "🗂️"), " ", c))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, filteredTx.map(t => /*#__PURE__*/React.createElement(TxRow, {
    key: t.id,
    t: t,
    onDelete: removeTx,
    showDate: true
  })), filteredTx.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "big"
  }, "🔍"), "Nothing matches — try a different search or month."))), view === "budgets" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 14
    }
  }, Object.entries(budgets).map(([cat, limit]) => {
    const used = byCategory.find(c => c.name === cat)?.value || 0;
    const pct = limit > 0 ? used / limit * 100 : 0;
    const col = CATEGORIES[cat]?.color || "#A9B4AE";
    return /*#__PURE__*/React.createElement("div", {
      key: cat,
      className: "card",
      style: {
        padding: "16px 20px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 19
      }
    }, CATEGORIES[cat]?.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--disp)",
        fontWeight: 700,
        fontSize: 15
      }
    }, cat), pct > 100 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--red)",
        fontWeight: 600,
        background: "rgba(240,122,122,.12)",
        padding: "3px 9px",
        borderRadius: 99
      }
    }, "OVER by ", fmt0(used - limit)), pct > 80 && pct <= 100 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--gold)",
        fontWeight: 600,
        background: "rgba(237,185,94,.12)",
        padding: "3px 9px",
        borderRadius: 99
      }
    }, "getting close"), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        fontFamily: "var(--mono)",
        fontSize: 13.5
      }
    }, /*#__PURE__*/React.createElement("b", {
      style: {
        color: pct > 100 ? "var(--red)" : "var(--ink)"
      }
    }, fmt0(used)), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--faint)"
      }
    }, " / "), /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: limit,
      min: 0,
      onChange: e => setBudgets(p => ({
        ...p,
        [cat]: Number(e.target.value) || 0
      })),
      style: {
        width: 68,
        background: "var(--bg)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        color: "var(--dim)",
        fontFamily: "var(--mono)",
        fontSize: 13,
        padding: "4px 7px",
        outline: "none"
      }
    }))), /*#__PURE__*/React.createElement(ProgressBar, {
      pct: pct,
      color: col
    }));
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: "var(--faint)",
      margin: "4px 6px"
    }
  }, "💡 Tip: edit any limit inline — bars update instantly for ", monthLabel(month), ".")), view === "goals" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
      gap: 16
    }
  }, goals.map(g => {
    const pct = g.saved / g.target * 100;
    const done = pct >= 100;
    return /*#__PURE__*/React.createElement("div", {
      key: g.id,
      className: "card goal-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "goal-top"
    }, /*#__PURE__*/React.createElement("span", {
      className: "goal-emoji"
    }, done ? "🏆" : g.emoji), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "goal-name"
    }, g.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: done ? "var(--green)" : "var(--faint)"
      }
    }, done ? "Completed — nice work!" : `${pct.toFixed(0)}% there`))), /*#__PURE__*/React.createElement(ProgressBar, {
      pct: pct,
      color: done ? "#3ECF8E" : "#49D6BE"
    }), /*#__PURE__*/React.createElement("div", {
      className: "goal-nums"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Money, {
      value: g.saved,
      zeroDec: true
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--faint)"
      }
    }, "of ", fmt0(g.target))), !done && /*#__PURE__*/React.createElement("div", {
      className: "goal-btns"
    }, [10, 25, 50].map(a => /*#__PURE__*/React.createElement("button", {
      key: a,
      className: "mini-btn",
      onClick: () => addToGoal(g.id, a)
    }, "+$", a))));
  })), view === "insights" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 14
    }
  }, isCurrent && /*#__PURE__*/React.createElement("div", {
    className: "card insight"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ico"
  }, "🔮"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, "Month-end projection"), /*#__PURE__*/React.createElement("p", null, "You're averaging ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--gold)"
    }
  }, fmt(avgDaily)), " a day. At this pace, July lands around ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: projected > income ? "var(--red)" : "var(--green)"
    }
  }, fmt0(projected)), " in total spending against ", fmt0(income), " of income so far — ", projected > income ? "watch the second half of the month." : "you're on track to finish in the green."))), topCat && /*#__PURE__*/React.createElement("div", {
    className: "card insight"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ico"
  }, CATEGORIES[topCat.name]?.icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, "Biggest category: ", topCat.name), /*#__PURE__*/React.createElement("p", null, fmt(topCat.value), " — that's ", (topCat.value / spent * 100).toFixed(0), "% of everything you spent in ", monthLabel(month), "."))), biggest && /*#__PURE__*/React.createElement("div", {
    className: "card insight"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ico"
  }, "💸"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, "Largest single expense"), /*#__PURE__*/React.createElement("p", null, "\"", biggest.note, "\" at ", /*#__PURE__*/React.createElement("b", null, fmt(biggest.amount)), " on ", new Date(biggest.date + "T12:00").toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric"
  }), "."))), /*#__PURE__*/React.createElement("div", {
    className: "card insight"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ico"
  }, "🌱"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, "Savings rate: ", savingsRate.toFixed(0), "%"), /*#__PURE__*/React.createElement("p", null, savingsRate >= 15 ? "Solid — most guides suggest 10–20% for students, and you're right in the zone. Your XEQT contributions are compounding quietly." : savingsRate > 0 ? "Every TFSA dollar counts. Even bumping this a few percent adds up fast with XEQT's long horizon." : "No savings logged this month yet — even a small TFSA transfer keeps the habit alive."))), overBudget.length > 0 ? /*#__PURE__*/React.createElement("div", {
    className: "card insight",
    style: {
      borderColor: "rgba(240,122,122,.35)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ico"
  }, "🚨"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, "Over-budget categories"), /*#__PURE__*/React.createElement("p", null, overBudget.map(x => `${x.c} (+${fmt0(x.s - x.b)})`).join(" · "), ". Consider trimming next week or nudging the limits if they were set too tight."))) : /*#__PURE__*/React.createElement("div", {
    className: "card insight"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ico"
  }, "✅"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, "All budgets holding"), /*#__PURE__*/React.createElement("p", null, "Nothing over limit in ", monthLabel(month), ". Keep it up."))))), /*#__PURE__*/React.createElement("button", {
    className: "fab",
    onClick: () => setShowAdd(true),
    "aria-label": "Add transaction"
  }, "+"), /*#__PURE__*/React.createElement("nav", {
    className: "bottom-nav"
  }, NAV.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    className: view === n.id ? "on" : "",
    onClick: () => setView(n.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-ic"
  }, n.icon), n.label))), showAdd && /*#__PURE__*/React.createElement("div", {
    className: "overlay",
    onClick: e => e.target === e.currentTarget && setShowAdd(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-title",
    style: {
      marginBottom: 16
    }
  }, "New transaction"), /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: form.type === "expense" ? "on-exp" : "",
    onClick: () => setForm(f => ({
      ...f,
      type: "expense"
    }))
  }, "− Expense"), /*#__PURE__*/React.createElement("button", {
    className: form.type === "income" ? "on-inc" : "",
    onClick: () => setForm(f => ({
      ...f,
      type: "income"
    }))
  }, "+ Income")), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "Amount (CAD)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    step: "0.01",
    placeholder: "0.00",
    value: form.amount,
    autoFocus: true,
    onChange: e => setForm(f => ({
      ...f,
      amount: e.target.value
    })),
    onKeyDown: e => e.key === "Enter" && addTx()
  })), form.type === "expense" && /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "Category"), /*#__PURE__*/React.createElement("select", {
    value: form.category,
    onChange: e => setForm(f => ({
      ...f,
      category: e.target.value
    }))
  }, Object.keys(CATEGORIES).map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => setForm(f => ({
      ...f,
      date: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "Note"), /*#__PURE__*/React.createElement("input", {
    placeholder: form.type === "income" ? "e.g. Paycheque" : "e.g. Groceries at Food Basics",
    value: form.note,
    onChange: e => setForm(f => ({
      ...f,
      note: e.target.value
    })),
    onKeyDown: e => e.key === "Enter" && addTx()
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-go",
    onClick: addTx
  }, form.type === "income" ? "Add income" : "Log expense"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    style: {
      width: "100%",
      marginTop: 6
    },
    onClick: () => setShowAdd(false)
  }, "Cancel"))), toast && /*#__PURE__*/React.createElement("div", {
    className: "toast"
  }, toast));
}
function TxRow({
  t,
  onDelete,
  showDate
}) {
  const isInc = t.type === "income";
  const meta = CATEGORIES[t.category] || {
    color: INCOME_COLOR,
    icon: "💰"
  };
  const col = isInc ? INCOME_COLOR : meta.color;
  return /*#__PURE__*/React.createElement("div", {
    className: "tx-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tx-ic",
    style: {
      background: col + "22",
      border: `1px solid ${col}44`
    }
  }, isInc ? "💰" : meta.icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "tx-note"
  }, t.note), /*#__PURE__*/React.createElement("div", {
    className: "tx-meta"
  }, isInc ? "Income" : t.category, showDate && ` · ${new Date(t.date + "T12:00").toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric"
  })}`)), /*#__PURE__*/React.createElement("div", {
    className: "tx-amt",
    style: {
      color: isInc ? "var(--green)" : "var(--ink)"
    }
  }, isInc ? "+" : "−", fmt(t.amount)), /*#__PURE__*/React.createElement("button", {
    className: "tx-del",
    onClick: () => onDelete(t.id),
    "aria-label": "Delete"
  }, "✕"));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(PocketMoneySaver, null));
