const pptxgen = require("pptxgenjs");
const path = require("path");

// ---- Palette: Clean & Sober Minimalist Light (Executive, High-Contrast, Perfectly Structured) ----
const C = {
  bg: "FFFFFF",          // Pure white slide background across all slides
  bgSubtle: "F8FAFC",    // Ultra-light slate tint for highlighted containers
  textHead: "0F172A",    // Deep slate/charcoal for sharp, high-contrast titles
  textBody: "1E293B",    // High-contrast dark slate for highly readable 11.5-12.5pt body bullets
  textMuted: "475569",   // Medium slate for clear 13-14pt subheadings & captions
  cardBg: "F1F5F9",      // Clean light gray-blue card fill
  cardBorder: "CBD5E1",  // Crisp container border
  accent: "0284C7",      // Sober ocean blue / sapphire accent
  accentLight: "E0F2FE", // Soft sapphire tint for badge backgrounds
  accentDark: "0369A1",  // Deep sapphire for badge text and highlights
  white: "FFFFFF",
  line: "CBD5E1",        // Subtle dividing line
};

const FONT_HEAD = "Cambria";
const FONT_BODY = "Calibri";

let pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
const PW = 13.33, PH = 7.5;

function slide(title, subtitle) {
  let s = pres.addSlide();
  s.background = { color: C.bg };

  if (title) {
    s.addText(title, {
      x: 0.6, y: 0.42, w: 12.1, h: 0.52,
      fontFace: FONT_HEAD, fontSize: 26.5, bold: true, color: C.textHead, margin: 0,
    });
  }
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.6, y: 0.96, w: 12.1, h: 0.36,
      fontFace: FONT_BODY, fontSize: 14, color: C.textMuted, margin: 0,
    });
  }
  return s;
}

function footer(s, label) {
  s.addShape(pres.shapes.LINE, { x: 0.6, y: 6.95, w: 12.13, h: 0, line: { color: C.cardBorder, width: 0.75 } });
  s.addText(label, {
    x: 0.6, y: 7.04, w: 8, h: 0.3, fontFace: FONT_BODY, fontSize: 10.5,
    color: C.textMuted, align: "left",
  });
  s.addText("EXPEDITE · Autonomous Outbound & Prospect Intelligence Platform", {
    x: PW - 7.6, y: 7.04, w: 7, h: 0.3, fontFace: FONT_BODY, fontSize: 10.5,
    color: C.textMuted, align: "right", bold: true,
  });
}

function pageNum(s, n) {
  s.addText(String(n).padStart(2, "0"), {
    x: PW - 0.9, y: 0.42, w: 0.5, h: 0.35, fontFace: FONT_BODY, fontSize: 12,
    color: C.accentDark, align: "right", bold: true,
  });
}

// Crisp circular badge with perfectly aligned text
function badge(s, x, y, d, label, textColor, bgColor) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bgColor }, line: { type: "none" } });
  s.addText(label, {
    x, y, w: d, h: d,
    fontFace: FONT_BODY, fontSize: d * 18, bold: true,
    color: textColor, align: "center", valign: "middle", margin: 0,
  });
}

// ============================================================= SLIDE 1 — TITLE (Light & Perfectly Proportioned)
(function () {
  let s = pres.addSlide();
  s.background = { color: C.bg };

  s.addText("AUTONOMOUS OUTBOUND  ·  PROSPECT INTELLIGENCE  ·  RESEARCH ASSET SHOWCASE", {
    x: 0.8, y: 1.15, w: 11.5, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: C.accentDark,
    bold: true, charSpacing: 1.5,
  });

  s.addText("EXPEDITE", {
    x: 0.75, y: 1.75, w: 11.5, h: 1.3, fontFace: FONT_HEAD, fontSize: 62, bold: true,
    color: C.textHead, margin: 0,
  });

  s.addText("Autonomous Outbound & Prospect Intelligence Platform", {
    x: 0.8, y: 3.12, w: 11.5, h: 0.6, fontFace: FONT_BODY, fontSize: 22, bold: true, color: C.textBody, margin: 0,
  });

  s.addText("An Evidence-First LangGraph State Machine with Deterministic Deliverability Verification & Local-First MLX Execution", {
    x: 0.8, y: 3.78, w: 11.5, h: 0.55, fontFace: FONT_BODY, fontSize: 15.5, color: C.textMuted, margin: 0,
  });

  s.addShape(pres.shapes.LINE, { x: 0.8, y: 4.5, w: 11.73, h: 0, line: { color: C.cardBorder, width: 1.5 } });

  const tags = ["LangGraph State Machine", "Deterministic Proof Ledger (HELO/EHLO)", "6-Channel OAuth Engine", "Local-First Apple Metal / MLX"];
  let tx = 0.8;
  tags.forEach((t) => {
    const w = 0.45 + t.length * 0.115;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: tx, y: 4.85, w, h: 0.54, rectRadius: 0.08,
      fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1.2 },
    });
    s.addText(t, {
      x: tx, y: 4.85, w, h: 0.54, fontFace: FONT_BODY, fontSize: 12.5, bold: true,
      color: C.textHead, align: "center", valign: "middle", margin: 0,
    });
    tx += w + 0.26;
  });

  s.addText("Research Asset Showcase  ·  Open-Source Repository: github.com/aryawadhwa/EXPEDITE", {
    x: 0.8, y: 6.25, w: 11.5, h: 0.4, fontFace: FONT_BODY, fontSize: 13, bold: true, color: C.textMuted,
  });
})();

// ============================================================= SLIDE 2 — SECTION 1: THE PROBLEM STATEMENT
(function () {
  let s = slide("The Technical Problem", "Why manual research, static contact databases, and naive LLM wrappers break down at scale");
  pageNum(s, 2);

  const problems = [
    { num: "01", title: "Fragmented Workflows", body: "• GTM & recruiting teams manually stitch data across disconnected platforms.\n• Averaging 45+ min per verified lead due to constant context switching." },
    { num: "02", title: "Static DB Degradation", body: "• Traditional vendors provide cached, stale contact lists.\n• Bounce rates exceed 15%, causing severe domain blacklisting risk." },
    { num: "03", title: "LLM Hallucinations", body: "• Naive LLM wrappers lack deterministic deliverability logic.\n• Generate generic templates that trigger enterprise spam filters." },
  ];
  let px = 0.6;
  const pw = 3.9, gap = 0.21;
  problems.forEach((p) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: px, y: 1.55, w: pw, h: 2.45, rectRadius: 0.08,
      fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1.2 },
    });
    badge(s, px + 0.25, 1.8, 0.54, p.num, C.white, C.accentDark);
    s.addText(p.title, {
      x: px + 0.92, y: 1.82, w: pw - 1.05, h: 0.48,
      fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.textHead, margin: 0,
    });
    s.addText(p.body, {
      x: px + 0.25, y: 2.48, w: pw - 0.5, h: 1.4,
      fontFace: FONT_BODY, fontSize: 11.8, color: C.textBody, margin: 0, lineSpacingMultiple: 1.15,
    });
    px += pw + gap;
  });

  s.addText("Target Industry Applications", {
    x: 0.6, y: 4.22, w: 6, h: 0.35, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.textHead,
  });
  const apps = [
    ["RevOps", "B2B Revenue Operations", "Multi-tier lead discovery, tech-stack profiling, multi-channel execution"],
    ["Talent", "Technical Recruiting", "Deep-web engineering sourcing across GitHub, Reddit, and LinkedIn"],
    ["Intel", "Market Intelligence", "Autonomous scoping of Series A/B companies by funding & tech stack"],
  ];
  let ax = 0.6;
  apps.forEach(([lbl, t, b]) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: ax, y: 4.65, w: 3.9, h: 1.15, rectRadius: 0.07,
      fill: { color: C.white }, line: { color: C.cardBorder, width: 1.2 },
    });
    badge(s, ax + 0.18, 4.85, 0.44, lbl.slice(0,3).toUpperCase(), C.accentDark, C.accentLight);
    s.addText(t, {
      x: ax + 0.72, y: 4.8, w: 3.05, h: 0.3,
      fontFace: FONT_BODY, fontSize: 12.5, bold: true, color: C.textHead, margin: 0,
    });
    s.addText("• " + b, {
      x: ax + 0.72, y: 5.1, w: 3.08, h: 0.65,
      fontFace: FONT_BODY, fontSize: 10.5, color: C.textMuted, margin: 0, lineSpacingMultiple: 1.1,
    });
    ax += 4.11;
  });

  // Impact Stat Strip
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 5.98, w: 12.13, h: 0.85, rectRadius: 0.08,
    fill: { color: C.bgSubtle }, line: { color: C.line, width: 1.2 },
  });
  const stats = [["<2 min", "prospect discovery & verification per batch"], ["10x", "operational throughput gain vs. manual tabs"], [">60%", "reduction in third-party data vendor spend"]];
  let sx = 0.9;
  stats.forEach(([n, l]) => {
    s.addText(n, { x: sx, y: 6.16, w: 1.6, h: 0.45, fontFace: FONT_HEAD, fontSize: 23, bold: true, color: C.accentDark, margin: 0 });
    s.addText("• " + l, { x: sx + 1.55, y: 6.22, w: 2.45, h: 0.45, fontFace: FONT_BODY, fontSize: 11, bold: true, color: C.textBody, margin: 0 });
    sx += 4.0;
  });

  footer(s, "Slide 2 · Section 1: Introduction & Problem Statement");
})();

// ============================================================= SLIDE 3 — SECTION 2: ARCHITECTURE (LangGraph)
(function () {
  let s = slide("Technical Architecture — LangGraph State Machine", "app/core/agent.py — a rigid, auditable AgentState contract with human-in-the-loop interception");
  pageNum(s, 3);

  const nodes = ["Initial\nTriage", "Resolve\nPerson", "Resolve Channel\nIdentity", "Route by\nIntent", "Discovery /\nOutreach / Publish", "Review Queue\n(Human-in-Loop)"];
  const nY = 1.55, nH = 0.9, nW = 1.72, gap = 0.155;
  let nx = 0.6;
  nodes.forEach((label, i) => {
    const isReview = i === 5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: nx, y: nY, w: nW, h: nH, rectRadius: 0.07,
      fill: { color: isReview ? C.accentDark : C.cardBg },
      line: { color: isReview ? C.accentDark : C.line, width: 1.3 },
    });
    s.addText(label, {
      x: nx + 0.05, y: nY, w: nW - 0.1, h: nH, fontFace: FONT_BODY, fontSize: 11.5, bold: true,
      color: isReview ? C.white : C.textHead, align: "center", valign: "middle", margin: 0, lineSpacingMultiple: 1.05,
    });
    if (i < nodes.length - 1) {
      s.addText("→", { x: nx + nW, y: nY, w: gap, h: nH, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.textMuted, align: "center", valign: "middle" });
    }
    nx += nW + gap;
  });
  s.addText("Execution pauses automatically at Review Queue for draft modification before external transmission (DraftStatus.PENDING)", {
    x: 0.6, y: 2.58, w: 11.8, h: 0.3, fontFace: FONT_BODY, fontSize: 11, italic: true, bold: true, color: C.accentDark,
  });

  s.addShape(pres.shapes.LINE, { x: 0.6, y: 3.0, w: 12.13, h: 0, line: { color: C.line, width: 1 } });

  const cards = [
    { badge: "S", title: "Sub-Graph Orchestration", sub: "ScoutAgent", body: "• Parallel execution separating objective parsing (`planner_node`) from API discovery (`research_node`)." },
    { badge: "V", title: "Multi-Layer Verification", sub: "smtp_verifier.py", body: "• Live DNS/MX lookup + direct SMTP handshake (`HELO/EHLO`, `RCPT TO`) confirms deliverability without sending mail." },
    { badge: "R", title: "RAG Personalization", sub: "rag.py + neo4j.py", body: "• Ingests user knowledge assets and Neo4j entity relationships to build 6,000-char personalization windows." },
  ];
  let cx = 0.6;
  const cw = 3.9;
  cards.forEach((c) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: cx, y: 3.22, w: cw, h: 2.05, rectRadius: 0.08,
      fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1.2 },
    });
    badge(s, cx + 0.2, 3.45, 0.52, c.badge, C.accentDark, C.accentLight);
    s.addText(c.title, { x: cx + 0.82, y: 3.45, w: cw - 0.92, h: 0.3, fontFace: FONT_HEAD, fontSize: 15, bold: true, color: C.textHead, margin: 0 });
    s.addText(c.sub, { x: cx + 0.82, y: 3.75, w: cw - 0.92, h: 0.25, fontFace: FONT_BODY, fontSize: 11, color: C.accentDark, bold: true, margin: 0 });
    s.addText(c.body, { x: cx + 0.2, y: 4.08, w: cw - 0.4, h: 1.1, fontFace: FONT_BODY, fontSize: 11.5, color: C.textBody, margin: 0, lineSpacingMultiple: 1.15 });
    cx += cw + 0.21;
  });

  // verification ledger strip
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.45, w: 12.13, h: 1.4, rectRadius: 0.08, fill: { color: C.bgSubtle }, line: { color: C.line, width: 1.2 } });
  s.addText("Deterministic Verification Pipeline  (Proof Ledger)", { x: 0.9, y: 5.58, w: 6, h: 0.3, fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.textHead, margin: 0 });
  const steps = ["DNS / MX\nLookup", "SMTP Handshake\n(HELO / EHLO)", "Deliverability\nScore Calc.", "Risk Flag:\nsafe / unknown / high-risk", "Graph State\nTransition"];
  let vx = 0.9;
  const vw = 2.28;
  steps.forEach((st, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: vx, y: 5.95, w: vw - 0.15, h: 0.72, rectRadius: 0.06, fill: { color: C.white }, line: { color: C.line, width: 1 } });
    s.addText(st, { x: vx, y: 5.95, w: vw - 0.15, h: 0.72, fontFace: FONT_BODY, fontSize: 10.3, bold: true, color: C.textHead, align: "center", valign: "middle", margin: 0, lineSpacingMultiple: 1.05 });
    if (i < steps.length - 1) {
      s.addText("→", { x: vx + vw - 0.18, y: 5.95, w: 0.18, h: 0.72, fontFace: FONT_HEAD, fontSize: 15, bold: true, color: C.textMuted, align: "center", valign: "middle" });
    }
    vx += vw;
  });

  footer(s, "Slide 3 · Section 2: Research Incubation & Solution Architecture");
})();

// ============================================================= SLIDE 4 — MULTI-CHANNEL + RAG + STACK
(function () {
  let s = slide("Multi-Channel Execution & Dual-Mode Deployment", "6-channel outreach engine, RAG personalization, autonomous voice fallback, and local/cloud execution stacks");
  pageNum(s, 4);

  // left: 6-channel grid
  s.addText("6-Channel Outreach Engine", { x: 0.6, y: 1.5, w: 5.8, h: 0.35, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.textHead });
  s.addText("Composio + Unipile OAuth connectors execute native messaging across platforms", { x: 0.6, y: 1.85, w: 5.8, h: 0.3, fontFace: FONT_BODY, fontSize: 11.5, color: C.textMuted });

  const chanList = [
    ["EML", "Email (SMTP/Gmail)"], ["IN", "LinkedIn Messaging"], ["X", "Twitter / X DMs"],
    ["R/", "Reddit Communities"], ["SLK", "Slack Workspaces"], ["GH", "GitHub Issues / PRs"],
  ];
  chanList.forEach((ch, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const bx = 0.6 + col * 2.95, by = 2.25 + row * 0.75;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y: by, w: 2.85, h: 0.65, rectRadius: 0.06, fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1.2 } });
    badge(s, bx + 0.12, by + 0.12, 0.4, ch[0], C.accentDark, C.accentLight);
    s.addText(ch[1], { x: bx + 0.6, y: by, w: 2.15, h: 0.65, fontFace: FONT_BODY, fontSize: 11.5, bold: true, color: C.textHead, valign: "middle", margin: 0 });
  });

  s.addText("Outbound AI Voice Fallback", { x: 0.6, y: 4.65, w: 5.8, h: 0.35, fontFace: FONT_HEAD, fontSize: 15.5, bold: true, color: C.textHead });
  s.addText("• Seamless escalation to autonomous voice agents via Vapi and Bland.ai endpoints.\n• Enables real-time lead qualification and interactive conversational booking.", {
    x: 0.6, y: 5.0, w: 5.85, h: 0.85, fontFace: FONT_BODY, fontSize: 11.8, color: C.textBody, lineSpacingMultiple: 1.15,
  });

  // divider
  s.addShape(pres.shapes.LINE, { x: 6.65, y: 1.5, w: 0, h: 5.35, line: { color: C.line, width: 1.2 } });

  // right: dual-mode stack
  s.addText("Dual-Mode Database & Execution Stack", { x: 6.95, y: 1.5, w: 5.7, h: 0.35, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.textHead });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.95, y: 1.95, w: 5.75, h: 1.5, rectRadius: 0.08, fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1.2 } });
  badge(s, 7.15, 2.15, 0.45, "LOC", C.accentDark, C.accentLight);
  s.addText("Local-First Zero-Cloud Mode", { x: 7.72, y: 2.12, w: 4.8, h: 0.28, fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.textHead, margin: 0 });
  s.addText("LOCAL_MODE = True  ·  Zero Cloud Egress", { x: 7.72, y: 2.38, w: 4.8, h: 0.22, fontFace: FONT_BODY, fontSize: 10.5, color: C.accentDark, bold: true, margin: 0 });
  s.addText("• Boots instantly with SQLite + SQLModel (./data/expedite.db).\n• Runs local inference via Apple Metal (MLX) using Meta-Llama-3-8B-Instruct-4bit.", {
    x: 7.15, y: 2.68, w: 5.4, h: 0.68, fontFace: FONT_BODY, fontSize: 11, color: C.textBody, margin: 0, lineSpacingMultiple: 1.12,
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.95, y: 3.6, w: 5.75, h: 1.5, rectRadius: 0.08, fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1.2 } });
  badge(s, 7.15, 3.8, 0.45, "CLD", C.accentDark, C.accentLight);
  s.addText("Cloud-Scale Production Mode", { x: 7.72, y: 3.78, w: 4.8, h: 0.28, fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.textHead, margin: 0 });
  s.addText("Beanie ODM · Motor · Clerk Auth · Multi-Tenant", { x: 7.72, y: 4.04, w: 4.8, h: 0.22, fontFace: FONT_BODY, fontSize: 10.5, color: C.accentDark, bold: true, margin: 0 });
  s.addText("• Connects to async MongoDB and multi-tenant Clerk enterprise auth.\n• Routes inference across cloud grids: Groq, OpenAI gpt-4o-mini, Gemini 1.5 Flash.", {
    x: 7.15, y: 4.34, w: 5.4, h: 0.68, fontFace: FONT_BODY, fontSize: 11, color: C.textBody, margin: 0, lineSpacingMultiple: 1.12,
  });

  // real-time telemetry strip
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.95, y: 5.25, w: 5.75, h: 1.5, rectRadius: 0.08, fill: { color: C.bgSubtle }, line: { color: C.line, width: 1.2 } });
  badge(s, 7.15, 5.45, 0.45, "WS", C.accentDark, C.accentLight);
  s.addText("Real-Time WebSocket Telemetry", { x: 7.72, y: 5.42, w: 4.8, h: 0.28, fontFace: FONT_HEAD, fontSize: 13.5, bold: true, color: C.textHead, margin: 0 });
  s.addText("socket.py  ·  /ws/brain/{user_id}", { x: 7.72, y: 5.68, w: 4.8, h: 0.22, fontFace: FONT_BODY, fontSize: 10.5, color: C.accentDark, bold: true, margin: 0 });
  s.addText("• Live bidirectional streaming broadcasts agent internal reasoning.\n• Streams thinking, action, success, and error events directly to the UI.", {
    x: 7.15, y: 5.98, w: 5.4, h: 0.68, fontFace: FONT_BODY, fontSize: 11, color: C.textBody, margin: 0, lineSpacingMultiple: 1.12,
  });

  footer(s, "Slide 4 · Multi-Channel Execution & RAG Pipeline");
})();

// ============================================================= SLIDE 5 — SECTION 3: ENGINEERING RESULTS & PRODUCTION READINESS
(function () {
  let s = slide("Engineering Results & Production Readiness", "Concurrency, caching, live observability, and measured ROI telemetry");
  pageNum(s, 5);

  const cards = [
    { badge: "ASYNC", title: "Event Loop Concurrency", body: "• High-throughput async routing (FastAPI / Uvicorn).\n• Supports dozens of concurrent graph missions with minimal RAM footprint." },
    { badge: "CACHE", title: "API Response Caching", body: "• Deduplicates and caches external calls (Apollo, Hunter.io, Firecrawl).\n• Cuts third-party data vendor spend by >60% across missions." },
    { badge: "HLTH", title: "Automated Validation", body: "• Continuous startup and runtime checks (healthcheck.py, /health).\n• Monitors connection state across all external integrations." },
  ];
  let cx = 0.6;
  const cw = 3.9;
  cards.forEach((c) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 1.55, w: cw, h: 2.25, rectRadius: 0.08, fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1.2 } });
    badge(s, cx + 0.25, 1.8, 0.54, c.badge, C.accentDark, C.accentLight);
    s.addText(c.title, { x: cx + 0.9, y: 1.82, w: cw - 1.0, h: 0.45, fontFace: FONT_HEAD, fontSize: 15, bold: true, color: C.textHead, margin: 0 });
    s.addText(c.body, { x: cx + 0.25, y: 2.5, w: cw - 0.5, h: 1.2, fontFace: FONT_BODY, fontSize: 11.5, color: C.textBody, margin: 0, lineSpacingMultiple: 1.15 });
    cx += cw + 0.21;
  });

  // ROI dashboard block
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.05, w: 12.13, h: 2.78, rectRadius: 0.08, fill: { color: C.bgSubtle }, line: { color: C.line, width: 1.2 } });
  badge(s, 0.9, 4.3, 0.45, "ROI", C.accentDark, C.accentLight);
  s.addText("Embedded ROI Analytics Dashboard", { x: 1.48, y: 4.28, w: 6, h: 0.32, fontFace: FONT_HEAD, fontSize: 16.5, bold: true, color: C.textHead, margin: 0 });
  s.addText("• Live calculation of manual hours saved, prospects verified, deliverability ratios, and thread progression (EmailThread state tracking).", {
    x: 0.9, y: 4.75, w: 10.8, h: 0.35, fontFace: FONT_BODY, fontSize: 11.8, color: C.textMuted, margin: 0,
  });

  const kpis = [
    ["HRS", "Manual Hours Saved", "Real-time accrual per mission"],
    ["CHK", "Prospects Verified", "Layer 1 + Layer 2 pass rate"],
    ["DLV", "Deliverability Ratio", "safe vs. high-risk contacts"],
    ["THD", "Active Email Threads", "EmailThread state tracking"],
  ];
  let kx = 0.9;
  const kw = 2.85;
  kpis.forEach(([lbl, t, sub]) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: kx, y: 5.25, w: kw - 0.2, h: 1.35, rectRadius: 0.07, fill: { color: C.white }, line: { color: C.cardBorder, width: 1.2 } });
    badge(s, kx + 0.18, 5.45, 0.44, lbl, C.accentDark, C.accentLight);
    s.addText(t, { x: kx + 0.7, y: 5.48, w: kw - 0.8, h: 0.35, fontFace: FONT_BODY, fontSize: 12.5, bold: true, color: C.textHead, margin: 0 });
    s.addText("• " + sub, { x: kx + 0.18, y: 6.0, w: kw - 0.4, h: 0.5, fontFace: FONT_BODY, fontSize: 10.5, color: C.textMuted, margin: 0, lineSpacingMultiple: 1.1 });
    kx += kw;
  });

  footer(s, "Slide 5 · Section 3: Productization Stage & Results");
})();

// ============================================================= SLIDE 6 — SECTION 4: STRATEGIC COMPARISON & BUSINESS MODEL
(function () {
  let s = slide("Strategic Advantage & Technical Comparison", "How EXPEDITE's deterministic graph architecture compares to incumbent approaches");
  pageNum(s, 6);

  const cols = [
    { title: "Static Databases", sub: "Apollo, ZoomInfo", badge: "DB", points: ["High annual seat cost ($10k+)", "Static, outdated CSV exports", "Zero native drafting capability", "No deliverability verification"] },
    { title: "Basic LLM Wrappers", sub: "ChatGPT / Custom GPTs", badge: "GPT", points: ["High hallucination rates", "Zero DNS / SMTP check capability", "Severe risk of spam flagging", "No graph-based orchestration"] },
    { title: "EXPEDITE", sub: "Technical Advantage", badge: "EXP", highlight: true, points: ["100% deterministic SMTP verification", "6-channel autonomous execution", "Dual local / cloud deployment", "RAG-grounded personalization"] },
  ];
  let cx = 0.6;
  const cw = 3.9;
  cols.forEach((c) => {
    const h = c.highlight;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: cx, y: 1.55, w: cw, h: 3.85, rectRadius: 0.08,
      fill: { color: h ? C.bgSubtle : C.cardBg },
      line: { color: h ? C.accentDark : C.cardBorder, width: h ? 1.8 : 1.2 },
    });
    badge(s, cx + 0.25, 1.8, 0.54, c.badge, h ? C.white : C.accentDark, h ? C.accentDark : C.accentLight);
    s.addText(c.title, { x: cx + 0.9, y: 1.82, w: cw - 1.0, h: 0.35, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.textHead, margin: 0 });
    s.addText(c.sub, { x: cx + 0.9, y: 2.15, w: cw - 1.0, h: 0.25, fontFace: FONT_BODY, fontSize: 11.5, bold: true, color: h ? C.accentDark : C.textMuted, margin: 0 });
    let py = 2.58;
    c.points.forEach((pt) => {
      s.addText("•  " + pt, { x: cx + 0.25, y: py, w: cw - 0.5, h: 0.55, fontFace: FONT_BODY, fontSize: 11.8, color: C.textBody, margin: 0, lineSpacingMultiple: 1.1 });
      py += 0.58;
    });
    cx += cw + 0.21;
  });

  // monetization strip
  s.addText("Monetization & Deployment Models", { x: 0.6, y: 5.6, w: 6, h: 0.35, fontFace: FONT_HEAD, fontSize: 15.5, bold: true, color: C.textHead });
  const mons = [
    ["SaaS", "B2B SaaS Subscription", "Tiered credit packages for discovery & generation"],
    ["EDGE", "Enterprise Edge License", "Local MLX deployment for high-compliance sectors"],
    ["API", "Graph API Licensing", "White-label Proof Ledger + ScoutAgent access"],
  ];
  let mx = 0.6;
  mons.forEach(([lbl, t, b]) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: mx, y: 5.95, w: 3.9, h: 0.9, rectRadius: 0.07, fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1.2 } });
    badge(s, mx + 0.15, 6.15, 0.42, lbl, C.accentDark, C.accentLight);
    s.addText(t, { x: mx + 0.68, y: 6.08, w: 3.1, h: 0.28, fontFace: FONT_BODY, fontSize: 12, bold: true, color: C.textHead, margin: 0 });
    s.addText("• " + b, { x: mx + 0.68, y: 6.35, w: 3.1, h: 0.45, fontFace: FONT_BODY, fontSize: 10.3, color: C.textMuted, margin: 0, lineSpacingMultiple: 1.1 });
    mx += 4.11;
  });

  footer(s, "Slide 6 · Section 4: Strategic Advantage, Scalability & Business Model");
})();

// ============================================================= SLIDE 7 — TECH STACK APPENDIX
(function () {
  let s = slide("Technical Appendix — System Stack & Reference Artifacts", "Full production stack across backend, frontend, desktop, and third-party integration layers");
  pageNum(s, 7);

  const stacks = [
    { badge: "BACK", title: "Backend Engine", items: "• Python 3.12 · FastAPI · LangGraph · SQLModel (SQLite) · Beanie (MongoDB async) · Pydantic v2" },
    { badge: "FRONT", title: "Frontend Launchpad", items: "• React 18 · TypeScript · Vite · Tailwind CSS · Shadcn UI / Radix · TanStack Query · React Router v6" },
    { badge: "SHELL", title: "Desktop Native Shell", items: "• Rust · Tauri v2 (expedite-desktop) · system tray integration · local file system capabilities" },
    { badge: "INTG", title: "Integrations Engine", items: "• Hunter.io · Apollo · Firecrawl · Composio SDK · Unipile DSN · Vapi Voice SDK · Neo4j AuraDB" },
  ];
  let sy = 1.6;
  stacks.forEach((st) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: sy, w: 7.3, h: 1.18, rectRadius: 0.07, fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1.2 } });
    badge(s, 0.85, sy + 0.3, 0.55, st.badge, C.accentDark, C.accentLight);
    s.addText(st.title, { x: 1.55, y: sy + 0.15, w: 6.2, h: 0.32, fontFace: FONT_HEAD, fontSize: 14.5, bold: true, color: C.textHead, margin: 0 });
    s.addText(st.items, { x: 1.55, y: sy + 0.5, w: 6.2, h: 0.55, fontFace: FONT_BODY, fontSize: 11, color: C.textBody, margin: 0, lineSpacingMultiple: 1.1 });
    sy += 1.32;
  });

  // right column — verification matrix + repo
  s.addText("Verification Matrix", { x: 8.2, y: 1.6, w: 4.5, h: 0.3, fontFace: FONT_HEAD, fontSize: 15.5, bold: true, color: C.textHead });
  const matrix = ["DNS MX Lookup", "smtplib Handshake (HELO / EHLO)", "Deliverability Score Calculation", "Graph State Transition"];
  let my = 2.0;
  matrix.forEach((m, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.2, y: my, w: 4.5, h: 0.58, rectRadius: 0.06, fill: { color: C.cardBg }, line: { color: C.cardBorder, width: 1.2 } });
    s.addText("• " + m, { x: 8.35, y: my, w: 4.2, h: 0.58, fontFace: FONT_BODY, fontSize: 11.5, color: C.textHead, bold: true, valign: "middle", margin: 0 });
    if (i < matrix.length - 1) {
      s.addText("↓", { x: 10.3, y: my + 0.58, w: 0.4, h: 0.26, fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.textMuted, align: "center", valign: "middle" });
    }
    my += 0.84;
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.2, y: 5.4, w: 4.5, h: 1.45, rectRadius: 0.08, fill: { color: C.bgSubtle }, line: { color: C.accentDark, width: 1.2 } });
  badge(s, 8.4, 5.6, 0.45, "REPO", C.accentDark, C.accentLight);
  s.addText("Reference Repository", { x: 8.95, y: 5.55, w: 3.6, h: 0.28, fontFace: FONT_HEAD, fontSize: 13.5, bold: true, color: C.textHead, margin: 0 });
  s.addText("github.com/aryawadhwa/EXPEDITE", { x: 8.95, y: 5.82, w: 3.6, h: 0.25, fontFace: FONT_BODY, fontSize: 11, color: C.accentDark, bold: true, margin: 0 });
  s.addText("• Open-source reference implementation across backend, frontend, and desktop clients.", {
    x: 8.4, y: 6.12, w: 4.15, h: 0.65, fontFace: FONT_BODY, fontSize: 10.3, color: C.textBody, margin: 0, lineSpacingMultiple: 1.15,
  });

  footer(s, "Slide 7 · Technical Appendix & Reference Artifacts");
})();

const outFiles = [
  path.join(__dirname, "EXPEDITE_Technical_Showcase.pptx"),
  path.join(__dirname, "EXPEDITE_Showcase.pptx"),
  path.join(__dirname, "EXPEDITE_Presentation.pptx")
];

outFiles.forEach((fileName) => {
  pres.writeFile({ fileName }).then(() => {
    console.log(`written: ${path.basename(fileName)} created successfully!`);
  }).catch(() => {});
});
