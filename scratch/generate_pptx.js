import pptxgen from 'pptxgenjs';
import path from 'path';

const pptx = new pptxgen();

// Configure 16:9 Widescreen Layout
pptx.layout = 'LAYOUT_16x9';
pptx.title = 'CogniLearn AI — System Architecture & Feature Specification';
pptx.author = 'CogniLearn Team';
pptx.company = 'CogniLearn Educational Intelligence';

// Design Theme Colors
const C_BG_DARK = '0B1120';      // Deep slate / navy
const C_BG_CARD = '1E293B';      // Card background
const C_BG_CARD_LIGHT = 'F8FAFC';
const C_TEXT_LIGHT = 'F8FAFC';   // White / light text
const C_TEXT_MUTED = '94A3B8';   // Slate muted text
const C_PRIMARY = '6366F1';      // Indigo accent
const C_SUCCESS = '10B981';      // Emerald
const C_WARNING = 'F59E0B';      // Amber
const C_DANGER = 'EF4444';       // Coral / Red
const C_CYAN = '0EA5E9';         // Sky Blue
const C_PURPLE = '8B5CF6';       // Violet

// Helper to add standard slide header
function addSlideHeader(slide, title, category = 'SYSTEM SPECIFICATION') {
  // Top category badge
  slide.addText(category.toUpperCase(), {
    x: 0.6,
    y: 0.35,
    w: 8.0,
    h: 0.25,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    color: C_PRIMARY,
  });

  // Slide Title
  slide.addText(title, {
    x: 0.6,
    y: 0.6,
    w: 12.0,
    h: 0.5,
    fontSize: 20,
    fontFace: 'Arial',
    bold: true,
    color: C_TEXT_LIGHT,
  });

  // Accent divider line
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6,
    y: 1.15,
    w: 12.13,
    h: 0,
    line: { color: C_PRIMARY, width: 2 },
  });
}

// Helper to add standard slide footer
function addSlideFooter(slide, currentSlide, totalSlides = 23) {
  slide.addText(`CogniLearn AI Architecture Specification  |  Slide ${currentSlide} of ${totalSlides}`, {
    x: 0.6,
    y: 7.1,
    w: 12.13,
    h: 0.3,
    fontSize: 8.5,
    fontFace: 'Arial',
    color: '64748B',
  });
}

// ============================================================================
// SLIDE 1: TITLE SLIDE
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };

  // Decorative banner shapes
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.2,
    w: 3.2,
    h: 0.35,
    fill: { color: '1E1B4B' },
    line: { color: C_PRIMARY, width: 1 },
    rectRadius: 0.1,
  });

  slide.addText('PROJECT ARCHITECTURE SPECIFICATION', {
    x: 0.8,
    y: 1.2,
    w: 3.2,
    h: 0.35,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    color: 'A5B4FC',
    align: 'center',
  });

  // Title
  slide.addText('CogniLearn AI', {
    x: 0.8,
    y: 1.7,
    w: 11.5,
    h: 1.2,
    fontSize: 44,
    fontFace: 'Arial',
    bold: true,
    color: C_TEXT_LIGHT,
  });

  // Subtitle
  slide.addText('Intelligent Cognitive Attention Analytics, Real-Time Computer Vision Tracking & Educational Telemetry Platform', {
    x: 0.8,
    y: 2.9,
    w: 11.5,
    h: 0.7,
    fontSize: 16,
    fontFace: 'Arial',
    color: 'CBD5E1',
  });

  // Overview Cards
  const cards = [
    { title: 'Classroom Tracking', desc: 'DeepSORT-lite 6-face tracking with Kalman filters, Hungarian matching & AR HUD', color: C_CYAN },
    { title: 'Individual Portal', desc: 'Focus timer, gamified XP engine (+150 XP), adaptive Box Breathing & ergonomic breaks', color: C_SUCCESS },
    { title: 'Edge Computer Vision', desc: 'MediaPipe 468-mesh, MobileFaceNet 512-D ONNX embeddings & Euler gaze rays', color: C_PRIMARY },
    { title: 'DPDP Act Compliance', desc: 'Client-side WebCrypto AES-GCM 256-bit encryption. Zero raw photos stored', color: C_WARNING },
  ];

  cards.forEach((c, i) => {
    const x = 0.8 + i * 2.95;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 3.9,
      w: 2.75,
      h: 2.4,
      fill: { color: C_BG_CARD },
      line: { color: '334155', width: 1 },
      rectRadius: 0.15,
    });

    slide.addText(c.title, {
      x: x + 0.15,
      y: 4.1,
      w: 2.45,
      h: 0.4,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: c.color,
    });

    slide.addText(c.desc, {
      x: x + 0.15,
      y: 4.6,
      w: 2.45,
      h: 1.5,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: 'CBD5E1',
      lineSpacing: 14,
    });
  });

  addSlideFooter(slide, 1);
}

// ============================================================================
// SLIDE 2: EXECUTIVE OVERVIEW & PEDAGOGICAL PHILOSOPHY
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Pedagogical Motivation & Supervisory Psychology', 'EXECUTIVE OVERVIEW');

  // Left Column: The Problem & Non-Punitive Philosophy
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.4,
    w: 5.8,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Core Problem & Ethical Grounding', {
    x: 0.9,
    y: 1.6,
    w: 5.2,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: C_CYAN,
  });

  slide.addText(
    '• Cognitive Fragmentation: Digital learning creates continuous micro-distractions and eye strain that traditional LMS tools fail to detect.\n\n' +
    '• Failure of Punitive Proctoring: Traditional proctoring tools flag natural human movements as "violations". CogniLearn rejects this punitive model.\n\n' +
    '• Supervisory Psychology: Human learning requires diverse mental modes—reading, problem-solving, reflection, and natural eye blinks.\n\n' +
    '• Formative Metacognition: Students receive self-regulation awareness and adaptive breaks, while educators gain classroom-level engagement telemetry.',
    {
      x: 0.9,
      y: 2.1,
      w: 5.2,
      h: 4.4,
      fontSize: 10,
      fontFace: 'Arial',
      color: 'E2E8F0',
      lineSpacing: 16,
    }
  );

  // Right Column: The 4 Cognitive States
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.4,
    w: 5.9,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('The 4 Formative Cognitive States', {
    x: 7.1,
    y: 1.6,
    w: 5.3,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: C_SUCCESS,
  });

  const states = [
    { title: '1. Screen Engagement (Green)', desc: 'Direct visual gaze on course materials with alert blink rhythms (EAR ~ 0.25+). Peak attention mode.', color: C_SUCCESS },
    { title: '2. Desk Work / Note-Taking (Blue)', desc: 'Downward pitch (15°-35°) with stable posture (low pitch variance). Indicates active calculation or writing.', color: C_CYAN },
    { title: '3. Cognitive Reflection (Amber)', desc: 'Brief glance away (< 3.5s) while synthesizing complex ideas. Natural conceptual processing, not penalized.', color: C_WARNING },
    { title: '4. Genuine Distraction / Fatigue (Red)', desc: 'Sustained off-target gaze (> 3.5s) or high PERCLOS eyelid closure (> 35%). Triggers adaptive break.', color: C_DANGER },
  ];

  states.forEach((s, idx) => {
    const y = 2.15 + idx * 1.1;
    slide.addText(s.title, {
      x: 7.1,
      y: y,
      w: 5.3,
      h: 0.3,
      fontSize: 11,
      fontFace: 'Arial',
      bold: true,
      color: s.color,
    });
    slide.addText(s.desc, {
      x: 7.1,
      y: y + 0.3,
      w: 5.3,
      h: 0.7,
      fontSize: 9.2,
      fontFace: 'Arial',
      color: 'CBD5E1',
      lineSpacing: 13,
    });
  });

  addSlideFooter(slide, 2);
}

// ============================================================================
// SLIDE 3: COMPREHENSIVE TECHNOLOGY STACK MATRIX
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Complete Full-Stack Technology Matrix', 'ARCHITECTURE STACK');

  // Table Data
  const rows = [
    [
      { text: 'Subsystem', options: { bold: true, color: 'FFFFFF', fill: { color: '312E81' } } },
      { text: 'Core Technologies & Version', options: { bold: true, color: 'FFFFFF', fill: { color: '312E81' } } },
      { text: 'Architectural Role in CogniLearn AI', options: { bold: true, color: 'FFFFFF', fill: { color: '312E81' } } },
    ],
    [
      { text: 'Frontend UI', options: { bold: true, color: C_CYAN } },
      { text: 'React 19.0.1\nTypeScript 5.8\nVite 6.2.3' },
      { text: 'Component lifecycle management, sub-second HMR, strict type safety, responsive dark glassmorphic design system.' },
    ],
    [
      { text: 'Edge Perception', options: { bold: true, color: C_SUCCESS } },
      { text: '@mediapipe/tasks-vision 0.10.18\nonnxruntime-web 1.30.0' },
      { text: '468 3D facial landmarks + 10 iris reticles at 30 fps via WebGL GPU shaders; MobileFaceNet 512-D ONNX inference via WASM SIMD.' },
    ],
    [
      { text: 'Spatial Tracking', options: { bold: true, color: C_PRIMARY } },
      { text: 'Discrete Kalman Filter\nHungarian Kuhn-Munkres O(N³)' },
      { text: '8-state constant velocity bounding box tracking; optimal bipartite matching avoiding student identity switches.' },
    ],
    [
      { text: 'Backend Server', options: { bold: true, color: C_WARNING } },
      { text: 'Node.js 24 + Express 4.21\nexpress-rate-limit 8.7' },
      { text: 'API Gateway (/api/*), 10MB payload limit for biometrics/avatars, brute-force auth defense (10/15min) & AI rate limiter.' },
    ],
    [
      { text: 'Cloud Database', options: { bold: true, color: C_PURPLE } },
      { text: 'Supabase PostgreSQL\nSupabase Realtime Broadcast' },
      { text: 'Relational persistence with pgcrypto, RLS policies; 1 Hz throttled websocket telemetry streaming (classroom:CLASS_ID).' },
    ],
    [
      { text: 'Biometrics & Security', options: { bold: true, color: C_DANGER } },
      { text: 'WebCrypto API (AES-GCM 256)\nDPDP Act 2023 Compliance' },
      { text: 'On-device encrypted IndexedDB store (cognilearn_biometrics_db). Never transmits or stores raw video/photos.' },
    ],
    [
      { text: 'Generative AI', options: { bold: true, color: 'F472B6' } },
      { text: 'Google Gemini 2.0 (@google/genai)\nLangfuse 3.39 + Zod 4.6' },
      { text: 'Pedagogical narrative reports from deterministic stats; SHA-256 student PII pseudonymization; Zod schema enforcement.' },
    ],
  ];

  slide.addTable(rows, {
    x: 0.6,
    y: 1.4,
    w: 12.13,
    h: 5.4,
    fontSize: 9,
    fontFace: 'Arial',
    color: 'E2E8F0',
    fill: { color: C_BG_CARD },
    border: { color: '334155', width: 0.5 },
    autoPage: false,
    colW: [1.8, 3.2, 7.13],
  });

  addSlideFooter(slide, 3);
}

// ============================================================================
// SLIDE 4: END-TO-END SYSTEM ARCHITECTURE
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'End-to-End Multi-Tier Architectural Topology', 'SYSTEM ARCHITECTURE');

  const tiers = [
    { num: 'TIER 1', title: 'Perception Layer', items: ['HTML5 WebCam Capture (30 fps)', 'MediaPipe 468 Landmark Mesh', 'Euler Yaw/Pitch/Roll Decomposition', 'Laplacian Blur Gate (Var ≥ 32)'], color: C_CYAN },
    { num: 'TIER 2', title: 'Tracking & ML Engine', items: ['DeepSORT-lite Spatial Association', '8-State Kalman Box Predictor', 'Hungarian O(N³) Bipartite Solver', '45s Cognitive Buffer & Softmax'], color: C_SUCCESS },
    { num: 'TIER 3', title: 'Transport & Realtime', items: ['Supabase Realtime Broadcast', '1 Hz Throttled Telemetry Packets', 'Window CustomEvent Fallback', 'WebSocket Subscriptions'], color: C_PRIMARY },
    { num: 'TIER 4', title: 'Persistence & AI Core', items: ['Express 4.21 Gateway & Rate Limits', 'Supabase PostgreSQL + RLS', 'WebCrypto AES-GCM Biometric Store', 'Gemini 2.0 + Langfuse Observability'], color: C_WARNING },
  ];

  tiers.forEach((t, i) => {
    const x = 0.6 + i * 3.1;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.4,
      w: 2.85,
      h: 4.5,
      fill: { color: C_BG_CARD },
      line: { color: t.color, width: 1.5 },
      rectRadius: 0.15,
    });

    slide.addText(t.num, {
      x: x + 0.15,
      y: 1.6,
      w: 2.55,
      h: 0.25,
      fontSize: 8.5,
      fontFace: 'Arial',
      bold: true,
      color: '94A3B8',
    });

    slide.addText(t.title, {
      x: x + 0.15,
      y: 1.85,
      w: 2.55,
      h: 0.45,
      fontSize: 13,
      fontFace: 'Arial',
      bold: true,
      color: t.color,
    });

    slide.addShape(pptx.ShapeType.line, {
      x: x + 0.15,
      y: 2.35,
      w: 2.55,
      h: 0,
      line: { color: '334155', width: 1 },
    });

    const bodyText = t.items.map(it => `• ${it}`).join('\n\n');
    slide.addText(bodyText, {
      x: x + 0.15,
      y: 2.55,
      w: 2.55,
      h: 3.1,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: 'CBD5E1',
      lineSpacing: 15,
    });
  });

  // Bottom Callout on Edge-First Benefits
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 6.1,
    w: 12.13,
    h: 0.8,
    fill: { color: '1E1B4B' },
    line: { color: C_PRIMARY, width: 1 },
    rectRadius: 0.1,
  });

  slide.addText(
    'EDGE-FIRST PRIVACY BENEFIT: All video frames are processed exclusively on the user\'s local GPU/CPU. ' +
    'Zero raw video is transmitted across the network, guaranteeing total privacy and sub-33ms real-time responsiveness.',
    {
      x: 0.8,
      y: 6.15,
      w: 11.7,
      h: 0.7,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: 'E0E7FF',
      bold: true,
      align: 'center',
    }
  );

  addSlideFooter(slide, 4);
}

// ============================================================================
// SLIDE 5: CLASSROOM TRACKING — MULTI-FACE DETECTION & 6-TARGET CAPACITY
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Classroom Tracking: Multi-Target Vision Architecture', 'EDUCATOR EXPERIENCE');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.4,
    w: 5.8,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Multi-Target MediaPipe Configuration', {
    x: 0.9,
    y: 1.6,
    w: 5.2,
    h: 0.4,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: C_CYAN,
  });

  slide.addText(
    '• Simultaneous Detection: Configured via getMultiFaceLandmarker() to track up to 6 student faces concurrently.\n\n' +
    '• Confidence Thresholds: minFaceDetectionConfidence: 0.45, minFacePresenceConfidence: 0.45, minTrackingConfidence: 0.45.\n\n' +
    '• Dual Execution Delegate: Primary GPU acceleration via WebGL with seamless CPU WASM fallback if WebGL contexts fail.\n\n' +
    '• Independent Outputs: Produces 468 landmarks, 4x4 metric transformation matrices, and facial blendshapes per detected pupil.',
    {
      x: 0.9,
      y: 2.1,
      w: 5.2,
      h: 4.4,
      fontSize: 10,
      fontFace: 'Arial',
      color: 'CBD5E1',
      lineSpacing: 16,
    }
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.4,
    w: 5.9,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Dual Dashboard Operating Modes', {
    x: 7.1,
    y: 1.6,
    w: 5.3,
    h: 0.4,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: C_SUCCESS,
  });

  slide.addText(
    '• Overview Mode: Real-time cohort analytics cards, attendance strength, aggregate 94.8% average engagement index, at-risk attention flags, and diagnostic history.\n\n' +
    '• Classroom Room Mode: High-impact full-screen video stream rendering dynamic AR HUD overlays on all visible students simultaneously.\n\n' +
    '• Click-to-Calibrate: Educator can click directly on any detected face bounding box on the canvas to inspect real-time metrics or trigger quick 5-sample biometric calibration.\n\n' +
    '• Mobile Camera Switching: Supports front (user) and rear (environment) camera toggles for mobile and tablet educator devices.',
    {
      x: 7.1,
      y: 2.1,
      w: 5.3,
      h: 4.4,
      fontSize: 10,
      fontFace: 'Arial',
      color: 'CBD5E1',
      lineSpacing: 16,
    }
  );

  addSlideFooter(slide, 5);
}

// ============================================================================
// SLIDE 6: CLASSROOM TRACKING — DEEPSORT-LITE & HUNGARIAN ASSIGNMENT
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'DeepSORT-lite Spatial Tracking & Hungarian Matching', 'TRACKING ALGORITHMS');

  const steps = [
    { num: 'STEP 1', title: 'Kalman Prediction', desc: 'Predicts next bounding box state [cx, cy, w, h] using an 8-state constant velocity motion model for each active track.', color: C_CYAN },
    { num: 'STEP 2', title: 'Cost Matrix Assembly', desc: 'Calculates composite cost = 0.50*(1-IoU) + 0.20*(CentroidDist) + 0.30*(EmbeddingDist). Spatial gating forbids distant matches.', color: C_SUCCESS },
    { num: 'STEP 3', title: 'Hungarian Solving', desc: 'Executes Kuhn-Munkres O(N³) bipartite algorithm to find optimal minimum-cost pairing between live detections and tracks.', color: C_PRIMARY },
    { num: 'STEP 4', title: 'Identity Hysteresis', desc: 'Locks student identities across frames. Requires multi-frame sustained candidate match before switching IDs to eliminate flicker.', color: C_WARNING },
  ];

  steps.forEach((s, idx) => {
    const x = 0.6 + idx * 3.1;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 1.4,
      w: 2.85,
      h: 3.5,
      fill: { color: C_BG_CARD },
      line: { color: s.color, width: 1.5 },
      rectRadius: 0.15,
    });

    slide.addText(s.num, { x: x + 0.15, y: 1.6, w: 2.55, h: 0.25, fontSize: 8.5, fontFace: 'Arial', bold: true, color: '94A3B8' });
    slide.addText(s.title, { x: x + 0.15, y: 1.85, w: 2.55, h: 0.45, fontSize: 12, fontFace: 'Arial', bold: true, color: s.color });
    slide.addText(s.desc, { x: x + 0.15, y: 2.4, w: 2.55, h: 2.2, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 15 });
  });

  // Track State Lifecycle Callout
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 5.1,
    w: 12.13,
    h: 1.8,
    fill: { color: '0F172A' },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Track Lifecycle State Machine:', { x: 0.9, y: 5.25, w: 11.5, h: 0.35, fontSize: 11, fontFace: 'Arial', bold: true, color: C_PRIMARY });
  slide.addText(
    '• TENTATIVE: New face detected; assigned trackId but requires >= 3 consecutive frames of hits before displaying to educator.\n' +
    '• CONFIRMED: Stable track active; rendered with full AR HUD overlays, identity pill, and focus score progress bars.\n' +
    '• LOST: Detection missed (e.g., student briefly looked away); Kalman filter predicts trajectory for up to 30 frames before deletion.',
    { x: 0.9, y: 5.6, w: 11.5, h: 1.1, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 }
  );

  addSlideFooter(slide, 6);
}

// ============================================================================
// SLIDE 7: CLASSROOM TRACKING — CANVAS AR HUD & VISUAL OVERLAYS
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'High-Tech Canvas AR Head-Up Display (HUD) Overlays', 'VISUAL INTERFACE');

  const hudElements = [
    { title: 'Bracket Corner Reticles', desc: 'Precision 2px corner brackets framing student faces. Color-coded dynamically to cognitive state (Emerald, Blue, Amber, Coral).', color: C_SUCCESS },
    { title: 'Top Identity Pill', desc: 'Displays verified student name and confidence rating (e.g., "✔ Ananya Sharma (96%)") or "❓ UNKNOWN" for unregistered visitors.', color: C_CYAN },
    { title: '3D Directional Gaze Rays', desc: 'Metric pitch/yaw vector beams projected from pupil centers with terminal target reticles, indicating precise gaze vectors in 3D.', color: C_PRIMARY },
    { title: 'Bottom Telemetry Pill', desc: 'Real-time state label (NOTE-TAKING, SCREEN FOCUS), numeric focus score (88%), Eye Aspect Ratio (EAR: 0.26), and mini progress bar.', color: C_PURPLE },
    { title: 'Drowsiness Warning Badges', desc: 'Alert pill triggered when PERCLOS exceeds 40%: "⚠️ DROWSY (PERCLOS ALERT)". Avoids false alarms on simple downward reading.', color: C_DANGER },
    { title: 'Delicate Eye Mesh Outlines', desc: 'Subtle 0.8px contour lines outlining palpebral fissures and key landmarks without obscuring video visibility.', color: C_WARNING },
  ];

  hudElements.forEach((h, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.6 + col * 4.15;
    const y = 1.4 + row * 2.75;

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 3.85,
      h: 2.5,
      fill: { color: C_BG_CARD },
      line: { color: h.color, width: 1.2 },
      rectRadius: 0.12,
    });

    slide.addText(h.title, { x: x + 0.15, y: y + 0.15, w: 3.55, h: 0.35, fontSize: 11.5, fontFace: 'Arial', bold: true, color: h.color });
    slide.addText(h.desc, { x: x + 0.15, y: y + 0.55, w: 3.55, h: 1.7, fontSize: 9.2, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 });
  });

  addSlideFooter(slide, 7);
}

// ============================================================================
// SLIDE 8: CLASSROOM TRACKING — DPDP ACT 2023 BIOMETRIC CALIBRATION
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'DPDP Act 2023 Multi-Angle Biometric Calibration Flow', 'BIOMETRIC ENROLLMENT');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.4,
    w: 12.13,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('5-Sample Progressive Calibration Sequence (ClassroomAutoTracker.tsx)', {
    x: 0.9,
    y: 1.6,
    w: 11.5,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: C_PURPLE,
  });

  const samples = [
    { s: 'Sample 1/5', pose: 'Frontal Gaze', desc: 'Student faces camera directly. Captures baseline ocular distances and inter-pupillary ratio.' },
    { s: 'Sample 2/5', pose: 'Slight Yaw Turn', desc: 'Student turns head slightly left or right. Captures lateral facial contour and cheek proportions.' },
    { s: 'Sample 3/5', pose: 'Slight Pitch Tilt', desc: 'Student tilts head up or down. Calibrates nasal foreshortening and forehead-to-chin proportions.' },
    { s: 'Sample 4/5', pose: 'Natural Expression', desc: 'Captures smile or speech expression to ensure invariance against facial muscle deformations.' },
    { s: 'Sample 5/5', pose: 'Template Confirmation', desc: 'Synthesizes mean 512-D vector across samples, L2-normalizes, and commits to encrypted storage.' },
  ];

  samples.forEach((sm, i) => {
    const x = 0.9 + i * 2.32;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.2,
      w: 2.15,
      h: 3.2,
      fill: { color: '0F172A' },
      line: { color: C_PRIMARY, width: 1 },
      rectRadius: 0.1,
    });

    slide.addText(sm.s, { x: x + 0.1, y: 2.35, w: 1.95, h: 0.25, fontSize: 9, fontFace: 'Arial', bold: true, color: C_CYAN });
    slide.addText(sm.pose, { x: x + 0.1, y: 2.6, w: 1.95, h: 0.4, fontSize: 11, fontFace: 'Arial', bold: true, color: C_TEXT_LIGHT });
    slide.addText(sm.desc, { x: x + 0.1, y: 3.05, w: 1.95, h: 2.1, fontSize: 8.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 13 });
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.9,
    y: 5.6,
    w: 11.53,
    h: 1.0,
    fill: { color: '064E3B' },
    line: { color: C_SUCCESS, width: 1 },
    rectRadius: 0.1,
  });

  slide.addText(
    'LEGAL COMPLIANCE: Adheres to the Indian Digital Personal Data Protection (DPDP) Act 2023. ' +
    'Requires an explicit consent checkbox before camera execution. Stores ONLY 512-D encrypted float vectors in local IndexedDB. ' +
    'Zero raw images or videos are ever stored on disk or server.',
    { x: 1.1, y: 5.65, w: 11.1, h: 0.9, fontSize: 9.2, fontFace: 'Arial', color: 'ECFDF5', bold: true }
  );

  addSlideFooter(slide, 8);
}

// ============================================================================
// SLIDE 9: ACADEMIC COHORTS & ROSTER ARCHITECTURE
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Academic Cohort Hierarchies & Scoped Rosters', 'DATA ARCHITECTURE');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.4,
    w: 5.8,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('School vs College Tier Scoping', { x: 0.9, y: 1.6, w: 5.2, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_CYAN });
  slide.addText(
    '• School Track (Grades 6–12):\n' +
    '  - Standards: Class 6 through Class 12\n' +
    '  - Sections: A, B, C, D\n' +
    '  - Curriculums: CBSE, ICSE, State Boards\n' +
    '  - Subject Catalogs: Mathematics, Physics, Chemistry, Biology, Social Science\n\n' +
    '• Higher Education Track (College / University):\n' +
    '  - Degrees: B.Tech, B.Sc, BCA, M.Tech\n' +
    '  - Departments: Computer Science & Engineering, Electronics, Mechanical\n' +
    '  - Semesters: Semester 1 through Semester 8\n' +
    '  - Subjects: Operating Systems, Distributed Systems, Algorithms',
    { x: 0.9, y: 2.1, w: 5.2, h: 4.4, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 15 }
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.4,
    w: 5.9,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Unique Class Codes & Scoped Roll Numbers', { x: 7.1, y: 1.6, w: 5.3, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_SUCCESS });
  slide.addText(
    '• Unique 6-Character Join Codes:\n' +
    '  - Generated via generateCohortCode(): "SCH-8X2A" or "COL-4M9K"\n' +
    '  - Unambiguous character set (no confusing 0/O or 1/I)\n' +
    '  - Allows students to instantly join class cohorts\n\n' +
    '• Scoped Roll Number Uniqueness:\n' +
    '  - Database enforces UNIQUE(cohort_id, roll_no)\n' +
    '  - Students can hold Roll #14 in Section A without collision with Section B\n\n' +
    '• Instant Sync:\n' +
    '  - Enrolled students immediately populate the teacher\'s multi-face recognition gallery.',
    { x: 7.1, y: 2.1, w: 5.3, h: 4.4, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 15 }
  );

  addSlideFooter(slide, 9);
}

// ============================================================================
// SLIDE 10: REAL-TIME TELEMETRY & CLASS DIAGNOSTIC TESTING
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Real-Time Telemetry & Class Diagnostic Testing', 'EDUCATOR TELEMETRY');

  const items = [
    { title: '1 Hz Throttled WebSocket Stream', desc: 'Lightweight JSON state packets ({ studentId, state, focusScore, timestamp }) broadcast over Supabase Realtime channels (classroom:CLASS_ID). Generates < 50 KB/s across 500 devices.', color: C_CYAN },
    { title: 'Timed Diagnostic Sessions', desc: 'Educator launches a synchronous class diagnostic test (15m, 30m, 45m). Dashboard monitors live class average focus and individual engagement curves.', color: C_SUCCESS },
    { title: 'Drop-Off Minute Detection', desc: 'System automatically flags lecture drop-off moments when aggregate engagement dips below 60%, signaling the teacher to pause and check for understanding.', color: C_WARNING },
    { title: 'Multi-Format Report Export', desc: 'Generates comprehensive diagnostic reports exportable to PDF and CSV, breaking down student metrics, ocular fatigue, and AI recommendations.', color: C_PRIMARY },
  ];

  items.forEach((it, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 6.2;
    const y = 1.4 + row * 2.75;

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.9,
      h: 2.5,
      fill: { color: C_BG_CARD },
      line: { color: it.color, width: 1.5 },
      rectRadius: 0.12,
    });

    slide.addText(it.title, { x: x + 0.2, y: y + 0.2, w: 5.5, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: it.color });
    slide.addText(it.desc, { x: x + 0.2, y: y + 0.65, w: 5.5, h: 1.6, fontSize: 9.8, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 15 });
  });

  addSlideFooter(slide, 10);
}

// ============================================================================
// SLIDE 11: INDIVIDUAL TRACKING — ONBOARDING & LIVE VISION FEED
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Individual Student Experience: Onboarding & Live Feed', 'STUDENT PORTAL');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.4,
    w: 5.8,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('3-Step Interactive Onboarding Wizard', { x: 0.9, y: 1.6, w: 5.2, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_CYAN });
  slide.addText(
    '• Step 1: Account Credentials & Password Meter\n' +
    '  Live zxcvbn entropy calculation displaying Weak (Red), Fair (Yellow), Good (Blue), and Strong (Green).\n\n' +
    '• Step 2: MediaPipe AI Face Reticle Calibration\n' +
    '  Live WebCam oval overlay providing feedback: "CENTER FACE INSIDE RING", "FACE CAMERA DIRECTLY", "LIGHTING OPTIMAL".\n\n' +
    '• Step 3: Academic Track & Learning Styles\n' +
    '  Configures grade/department, exam tracks (CBSE/JEE/NEET), and sensory learning styles (Visual, Auditory, Kinesthetic).',
    { x: 0.9, y: 2.1, w: 5.2, h: 4.4, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 15 }
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.4,
    w: 5.9,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Student Camera Feed (StudentCameraFeed.tsx)', { x: 7.1, y: 1.6, w: 5.3, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_SUCCESS });
  slide.addText(
    '• High-Precision Single-Face Pipeline:\n' +
    '  Processes 468 facial mesh landmarks and 10 iris reticles with sub-30ms frame latency.\n\n' +
    '• 3D Gaze Vectors & Iris Glowing Rings:\n' +
    '  Draws fine dashed directional gaze rays and outer iris rings, showing students where their attention is directed.\n\n' +
    '• Instantaneous Status Telemetry Badge:\n' +
    '  Pill at bottom of feed showing OPTIMAL FOCUS, NOTE-TAKING, or REFLECTION with live focus score and EAR value.\n\n' +
    '• Local Privacy Guarantee:\n' +
    '  Feed stays on-device; only numerical scores reach the server.',
    { x: 7.1, y: 2.1, w: 5.3, h: 4.4, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 15 }
  );

  addSlideFooter(slide, 11);
}

// ============================================================================
// SLIDE 12: INDIVIDUAL TRACKING — GAMIFIED FOCUS & XP PROGRESSION
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Gamified Focus Engine & XP Level Progression', 'STUDENT PORTAL');

  const cards = [
    { title: 'Pomodoro & Deep Work Timers', desc: 'Configurable slots: 15m (Sprint), 25m (Standard Pomodoro), 45m (Deep Work), 60m (Mastery). Countdown persists state across tabs.', color: C_CYAN },
    { title: 'XP Rewards & Level Progression', desc: 'Completing a focus session awards +150 XP. Points accumulate toward student level-ups, unlocking milestone badges and ranks.', color: C_SUCCESS },
    { title: 'Active Focus Streaks (🔥)', desc: 'Daily study habits are rewarded with streak counters. Encourages continuous positive reinforcement and formative consistency.', color: C_WARNING },
    { title: 'Automated Cloud Persistence', desc: 'Sessions commit directly to Supabase study_sessions table with durationMinutes, xpEarned, and average focus score.', color: C_PRIMARY },
  ];

  cards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 6.2;
    const y = 1.4 + row * 2.75;

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.9,
      h: 2.5,
      fill: { color: C_BG_CARD },
      line: { color: c.color, width: 1.5 },
      rectRadius: 0.12,
    });

    slide.addText(c.title, { x: x + 0.2, y: y + 0.2, w: 5.5, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: c.color });
    slide.addText(c.desc, { x: x + 0.2, y: y + 0.65, w: 5.5, h: 1.6, fontSize: 9.8, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 15 });
  });

  addSlideFooter(slide, 12);
}

// ============================================================================
// SLIDE 13: INDIVIDUAL TRACKING — ADAPTIVE FOCUS BREAKS
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Adaptive In-Session Focus Break Interventions', 'COGNITIVE ERGONOMICS');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.4,
    w: 12.13,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Automated Fatigue Detection Trigger (FocusBreakModal.tsx)', {
    x: 0.9,
    y: 1.6,
    w: 11.5,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: C_SUCCESS,
  });

  const breaks = [
    { title: 'Box Breathing (4-4-4-4)', desc: 'Guided interactive expanding/contracting circle. Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Regulates autonomic nervous system and lowers anxiety.', color: C_CYAN },
    { title: '20-20-20 Ocular Relief', desc: 'Prompts student to focus on an object 20 feet away for 20 seconds. Relaxes ciliary eye muscles, restores tear film, and stops eye strain.', color: C_SUCCESS },
    { title: 'Ergonomic Neck Stretch', desc: 'Guided physical stretches relieving cervical spine tension caused by prolonged downward desk work and screen posture.', color: C_WARNING },
  ];

  breaks.forEach((b, i) => {
    const x = 0.9 + i * 3.9;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.2,
      w: 3.7,
      h: 3.2,
      fill: { color: '0F172A' },
      line: { color: b.color, width: 1.5 },
      rectRadius: 0.1,
    });

    slide.addText(b.title, { x: x + 0.15, y: 2.4, w: 3.4, h: 0.4, fontSize: 12, fontFace: 'Arial', bold: true, color: b.color });
    slide.addText(b.desc, { x: x + 0.15, y: 2.9, w: 3.4, h: 2.2, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 });
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.9,
    y: 5.6,
    w: 11.53,
    h: 1.0,
    fill: { color: '1E1B4B' },
    line: { color: C_PRIMARY, width: 1 },
    rectRadius: 0.1,
  });

  slide.addText(
    'POSITIVE REINFORCEMENT: Completing any guided focus break rewards the student with +25 Bonus XP and logs ' +
    'the event to public.focus_breaks. The system treats mental fatigue with scientific ergonomic care rather than penalties.',
    { x: 1.1, y: 5.65, w: 11.1, h: 0.9, fontSize: 9.5, fontFace: 'Arial', color: 'E0E7FF', bold: true }
  );

  addSlideFooter(slide, 13);
}

// ============================================================================
// SLIDE 14: MATHEMATICAL FORMULATIONS — EYE METRICS & EULER HEAD POSE
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Mathematical Formulations: Ocular Metrics & Euler Pose', 'MATHEMATICAL ALGORITHMS');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.4,
    w: 5.8,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('6-Point Eye Aspect Ratio (EAR) & PERCLOS', { x: 0.9, y: 1.6, w: 5.2, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_CYAN });
  slide.addText(
    '• 6-Point EAR Formula (in isotropic pixel space):\n' +
    '  EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)\n' +
    '  Left Eye: 33, 160, 158, 133, 153, 144\n' +
    '  Right Eye: 263, 385, 386, 362, 373, 374\n' +
    '  avgEAR = (EAR_Left + EAR_Right) / 2\n\n' +
    '• PERCLOS Drowsiness Metric (45-second sliding buffer):\n' +
    '  PERCLOS = (1 / N) * Σ I(avgEAR_i < θ_closed)\n' +
    '  If PERCLOS > 0.35 => Drowsiness alert triggered.\n\n' +
    '• Dynamic Calibration:\n' +
    '  θ_closed = max(0.12, min(0.22, P_10 * 0.85)) sampled during the initial 25 seconds of session.',
    { x: 0.9, y: 2.1, w: 5.2, h: 4.4, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 }
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.4,
    w: 5.9,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Euler Angles from 4x4 Matrix Decomposition', { x: 7.1, y: 1.6, w: 5.3, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_SUCCESS });
  slide.addText(
    '• MediaPipe Column-Major 4x4 Matrix:\n' +
    '  Extracts 3x3 rotation matrix R from entries [d0...d10]:\n' +
    '  R00=d[0], R10=d[1], R20=d[2]\n' +
    '  R01=d[4], R11=d[5], R21=d[6]\n' +
    '  R02=d[8], R12=d[9], R22=d[10]\n\n' +
    '• True Metric Euler Angle Derivations:\n' +
    '  Pitch (X-axis) = atan2(-R12, hypot(R02, R22)) * (180 / π)\n' +
    '  Yaw (Y-axis)   = atan2(R02, R22) * (180 / π)\n' +
    '  Roll (Z-axis)  = atan2(R10, R11) * (180 / π)\n\n' +
    '• Eliminates vertical aspect ratio distortion by evaluating directly in 3D metric degrees.',
    { x: 7.1, y: 2.1, w: 5.3, h: 4.4, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 }
  );

  addSlideFooter(slide, 14);
}

// ============================================================================
// SLIDE 15: MATHEMATICAL FORMULATIONS — ALIGNMENT & DEEP EMBEDDINGS
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Facial Alignment, Blur Gating & Deep Metric Embeddings', 'MATHEMATICAL ALGORITHMS');

  const algos = [
    {
      title: 'Laplacian Blur Gating',
      formula: 'σ² = (1/N) * Σ (∇²I - μ)²',
      desc: 'Convolves nasal crop with 3x3 discrete Laplacian kernel [0,1,0; 1,-4,1; 0,1,0]. Rejects crops with σ² < 32 due to motion blur.',
      color: C_CYAN,
    },
    {
      title: 'Umeyama 5-Point Transform',
      formula: 'min_{s,R,t} Σ ||y_i - (s*R*x_i + t)||²',
      desc: 'Solves least-squares orthogonal Procrustes problem aligning pupils, nose tip, and mouth corners to ArcFace 112x112 target coordinates.',
      color: C_SUCCESS,
    },
    {
      title: 'MobileFaceNet Deep Embeddings',
      formula: 'v_norm = v / ||v||₂  (512 Dimensions)',
      desc: 'Runs ONNX Runtime Web via WASM SIMD. Generates 512-D L2-normalized float embeddings on a unit hypersphere.',
      color: C_PRIMARY,
    },
    {
      title: 'Deep Cosine Metric Similarity',
      formula: 'Sim(u, v) = u · v = Σ u_i * v_i',
      desc: 'Cosine similarity on L2-normalized vectors. Scaled confidence = max(0, min(99, floor(((Sim - 0.15) / 0.65) * 100))).',
      color: C_WARNING,
    },
  ];

  algos.forEach((a, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.6 + col * 6.2;
    const y = 1.4 + row * 2.75;

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.9,
      h: 2.5,
      fill: { color: C_BG_CARD },
      line: { color: a.color, width: 1.5 },
      rectRadius: 0.12,
    });

    slide.addText(a.title, { x: x + 0.2, y: y + 0.15, w: 5.5, h: 0.35, fontSize: 12, fontFace: 'Arial', bold: true, color: a.color });
    slide.addText(a.formula, { x: x + 0.2, y: y + 0.55, w: 5.5, h: 0.35, fontSize: 10, fontFace: 'Courier New', bold: true, color: 'FBBF24' });
    slide.addText(a.desc, { x: x + 0.2, y: y + 0.95, w: 5.5, h: 1.4, fontSize: 9.2, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 });
  });

  addSlideFooter(slide, 15);
}

// ============================================================================
// SLIDE 16: MATHEMATICAL FORMULATIONS — KALMAN & HUNGARIAN TRACKING
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, '8-State Kalman Filter & DeepSORT-lite Cost Association', 'TRACKING ALGORITHMS');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.4,
    w: 5.8,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('8-State Constant-Velocity Kalman Filter', { x: 0.9, y: 1.6, w: 5.2, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_CYAN });
  slide.addText(
    '• State Vector (BoundingBoxKalmanFilter):\n' +
    '  x = [cx, cy, w, h, v_cx, v_cy, v_w, v_h]ᵀ\n' +
    '  Maintains center coordinates, dimensions, and dynamic velocities.\n\n' +
    '• State Prediction Step (F * x with dt = 1.0):\n' +
    '  cx_k = cx_{k-1} + v_cx\n' +
    '  cy_k = cy_{k-1} + v_cy\n' +
    '  P_{k|k-1} = F * P_{k-1} * Fᵀ + Q\n\n' +
    '• Measurement Update Step (z = [cx, cy, w, h]ᵀ):\n' +
    '  y = z - H * x  (Innovation residual)\n' +
    '  S = H * P * Hᵀ + R  (Innovation covariance)\n' +
    '  K = P * Hᵀ * S⁻¹  (Kalman Gain)\n' +
    '  x_k = x + K * y\n' +
    '  P_k = (I - K * H) * P',
    { x: 0.9, y: 2.1, w: 5.2, h: 4.4, fontSize: 9.2, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 13 }
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.4,
    w: 5.9,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('DeepSORT-lite Cost Matrix & Hungarian Matching', { x: 7.1, y: 1.6, w: 5.3, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_SUCCESS });
  slide.addText(
    '• Composite Cost Function Matrix C[d, t]:\n' +
    '  Cost = 0.50 * (1 - IoU(B_d, B_t))\n' +
    '       + 0.20 * min(1.5, ||c_d - c_t|| / w_t)\n' +
    '       + 0.30 * (1 - CosSim(e_d, e_t))\n\n' +
    '• Spatial Gating Constraint:\n' +
    '  If IoU == 0 AND CentroidDist > 1.5 * w_t =>\n' +
    '  Cost = 100,000 (Match Strictly Forbidden)\n\n' +
    '• Hungarian Algorithm (Kuhn-Munkres O(N³)):\n' +
    '  Pads rectangular M x N matrix to square dim.\n' +
    '  Maintains dual potential variables (u_i, v_j) to solve globally optimal minimum-cost assignment.',
    { x: 7.1, y: 2.1, w: 5.3, h: 4.4, fontSize: 9.2, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 }
  );

  addSlideFooter(slide, 16);
}

// ============================================================================
// SLIDE 17: MATHEMATICAL FORMULATIONS — COGNITIVE SOFTMAX & EMA
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Cognitive Ergonomics Decision Tree & EMA Smoothing', 'COGNITIVE MODEL');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.4,
    w: 5.8,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Softmax Multi-Class Probability Tree', { x: 0.9, y: 1.6, w: 5.2, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_CYAN });
  slide.addText(
    '• Heuristic Score Contributions:\n' +
    '  - Screen Focus: effPitch ∈ [0.20, 0.34], |Yaw| ≤ 0.15 => pScreen += 0.85\n' +
    '  - Note Taking: effPitch ∈ [0.33, 0.54], |Yaw| ≤ 0.19 => pNote += 0.82\n' +
    '    (if PitchVariance < 0.005 => pNote += 0.10)\n' +
    '  - Reflection: effPitch < 0.20 or gentle side glance => pReflect += 0.65\n' +
    '  - Distraction: |Yaw| > 0.28 or steep downward drop => pDistract += 0.80\n\n' +
    '• Temporal Penalty Shift:\n' +
    '  If gentle glance persists > 3.5s => shifts from reflection into genuine distraction.\n\n' +
    '• Softmax Probability Normalization:\n' +
    '  P(k) = exp(s_k) / Σ exp(s_j)',
    { x: 0.9, y: 2.1, w: 5.2, h: 4.4, fontSize: 9.2, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 }
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.4,
    w: 5.9,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Exponential Moving Average (EMA) Smoothing', { x: 7.1, y: 1.6, w: 5.3, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_SUCCESS });
  slide.addText(
    '• Exponential Moving Average Formula:\n' +
    '  Score_EMA(t) = α * TargetScore(t) + (1 - α) * Score_EMA(t - 1)\n' +
    '  Smoothing Factor: α = 0.12\n\n' +
    '• Eliminates Visual Jitter:\n' +
    '  Prevents single-frame detection drops from causing visual flickering on the dashboard.\n\n' +
    '• Target Score Mapping:\n' +
    '  - SCREEN_ENGAGEMENT: Target = 96 - 35*|Yaw| - 40*|IrisX|\n' +
    '  - NOTE_TAKING: Target = 88 - 30*|Yaw|\n' +
    '  - REFLECTION: Target = max(76, 84 - 2*min(3, dwellSeconds))\n' +
    '  - DISTRACTION: Target = max(18, 70 - min(55, 20 + 8*dwellSeconds))',
    { x: 7.1, y: 2.1, w: 5.3, h: 4.4, fontSize: 9.2, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 }
  );

  addSlideFooter(slide, 17);
}

// ============================================================================
// SLIDE 18: DATABASE SCHEMAS & PERSISTENCE ARCHITECTURE
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Relational Database Schema & Data Models', 'PERSISTENCE SPECIFICATION');

  const tables = [
    { name: 'public.users', desc: 'UUID PK, email UNIQUE, password_hash (bcrypt), full_name, role (student|teacher|admin), tier (school|college), xp, total_hours, academic_profile JSONB.' },
    { name: 'public.cohorts', desc: 'UUID PK, code UNIQUE (e.g., "SCH-8X2A"), tier, name, standard, department, section, subject, room, teacher_id FK. Scopes student classes.' },
    { name: 'public.enrollments', desc: 'UUID PK, cohort_id FK, student_id FK, roll_no, enrolled_subjects TEXT[]. Composite constraint UNIQUE(cohort_id, roll_no).' },
    { name: 'public.study_sessions', desc: 'UUID PK, student_id FK, duration_minutes, xp_earned, avg_focus_score, session_type, telemetry JSONB. Enabled in supabase_realtime publication.' },
    { name: 'public.baseline_scores', desc: 'UUID PK, student_id FK, subject, cognitive_score, focus_index, retention_rate, notes. Tracks diagnostic progress.' },
    { name: 'public.focus_breaks', desc: 'UUID PK, student_id FK, break_type (box-breathing|20-20-20-eyes|neck-stretch), duration_seconds, trigger_focus_score, completed BOOL.' },
  ];

  tables.forEach((tb, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.6 + col * 6.2;
    const y = 1.4 + row * 1.8;

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.9,
      h: 1.6,
      fill: { color: C_BG_CARD },
      line: { color: '334155', width: 1 },
      rectRadius: 0.1,
    });

    slide.addText(tb.name, { x: x + 0.2, y: y + 0.15, w: 5.5, h: 0.35, fontSize: 11, fontFace: 'Courier New', bold: true, color: C_CYAN });
    slide.addText(tb.desc, { x: x + 0.2, y: y + 0.55, w: 5.5, h: 0.95, fontSize: 8.8, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 13 });
  });

  addSlideFooter(slide, 18);
}

// ============================================================================
// SLIDE 19: SECURITY, PRIVACY & DPDP ACT 2023 COMPLIANCE
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Security, Privacy & DPDP Act 2023 Compliance', 'DATA PROTECTION');

  const pillars = [
    { num: 'PILLAR 1', title: 'Explicit Informed Consent', desc: 'Biometric calibration requires a mandatory explicit user consent checkbox. Consent timestamps are cryptographically recorded alongside templates.', color: C_CYAN },
    { num: 'PILLAR 2', title: 'Hardware Data Localization', desc: '512-D face vectors are encrypted with WebCrypto AES-GCM 256-bit keys and stored solely in local IndexedDB. Zero video frames leave the device.', color: C_SUCCESS },
    { num: 'PILLAR 3', title: 'Right to Erasure (Danger Zone)', desc: 'Self-service permanent account deletion dialog requiring students to type "DELETE MY ACCOUNT" to purge all database records and crypto keys.', color: C_WARNING },
    { num: 'PILLAR 4', title: 'LLM PII Pseudonymization', desc: 'Student names, emails, and roll numbers are replaced with deterministic SHA-256 hashes before invocation of Google Gemini 2.0 API.', color: C_PRIMARY },
  ];

  pillars.forEach((p, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.6 + col * 6.2;
    const y = 1.4 + row * 2.75;

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 5.9,
      h: 2.5,
      fill: { color: C_BG_CARD },
      line: { color: p.color, width: 1.5 },
      rectRadius: 0.12,
    });

    slide.addText(p.num, { x: x + 0.2, y: y + 0.15, w: 5.5, h: 0.25, fontSize: 8.5, fontFace: 'Arial', bold: true, color: '94A3B8' });
    slide.addText(p.title, { x: x + 0.2, y: y + 0.4, w: 5.5, h: 0.35, fontSize: 13, fontFace: 'Arial', bold: true, color: p.color });
    slide.addText(p.desc, { x: x + 0.2, y: y + 0.85, w: 5.5, h: 1.45, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 15 });
  });

  addSlideFooter(slide, 19);
}

// ============================================================================
// SLIDE 20: GUIDE DEFENSE Q&A — PART 1
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Project Guide Defense: Top Questions & Answers (Part 1)', 'EVALUATION PREPARATION');

  const qas = [
    {
      q: 'Q1: Why run computer vision in the browser rather than on a Python backend?',
      a: '1) Latency: Browser-native WebGL/WASM executes in < 33ms (30 fps) without network round-trips. 2) Bandwidth & Cost: Streaming HD video from 40 classroom students requires > 100 Mbps uplink and heavy server GPUs. 3) Privacy by Design: Video frames never leave the device, satisfying DPDP Act 2023.',
    },
    {
      q: 'Q2: How do you differentiate note-taking vs playing on a concealed smartphone?',
      a: '1) Pitch Angle: Note-taking exhibits 15°-35° downward pitch (effPitch ∈ [0.33, 0.54]), whereas phone browsing exhibits steep drops (> 45°). 2) Pitch Variance: Writing produces steady head posture (variance < 0.005), while phone browsing introduces frequent glances up and down.',
    },
    {
      q: 'Q3: How does multi-student tracking prevent identity switching?',
      a: 'Via DeepSORT-lite: 1) Kalman filter predicts bounding box motion. 2) Cost matrix combines (1-IoU), normalized centroid distance, and deep embedding similarity with spatial gating. 3) Hungarian algorithm finds global minimum assignment. 4) Identity hysteresis prevents label flicker.',
    },
  ];

  qas.forEach((qa, idx) => {
    const y = 1.4 + idx * 1.8;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y,
      w: 12.13,
      h: 1.6,
      fill: { color: C_BG_CARD },
      line: { color: '334155', width: 1 },
      rectRadius: 0.1,
    });

    slide.addText(qa.q, { x: 0.8, y: y + 0.15, w: 11.7, h: 0.35, fontSize: 11, fontFace: 'Arial', bold: true, color: C_CYAN });
    slide.addText(qa.a, { x: 0.8, y: y + 0.55, w: 11.7, h: 0.95, fontSize: 9.2, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 });
  });

  addSlideFooter(slide, 20);
}

// ============================================================================
// SLIDE 21: GUIDE DEFENSE Q&A — PART 2
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Project Guide Defense: Top Questions & Answers (Part 2)', 'EVALUATION PREPARATION');

  const qas = [
    {
      q: 'Q4: What prevents natural eyelid blinks from dropping focus scores?',
      a: 'Human blinks last 150-300ms. 1) PERCLOS evaluates eye closure aggregated across a 45-second sliding buffer, where a 200ms blink represents < 0.7% (negligible). 2) Dynamic EAR calibration samples open eyelids during the first 25s. 3) EMA score smoothing (α = 0.12) prevents abrupt visual drops.',
    },
    {
      q: 'Q5: How does telemetry stream from multiple devices without server lag?',
      a: 'Instead of streaming continuous video feeds, each device transmits only lightweight 1 Hz JSON telemetry packets: { studentId, state, focusScore, timestamp } (~90 bytes) over Supabase Realtime websocket channels. Even 500 active students consume < 50 KB/s total bandwidth.',
    },
    {
      q: 'Q6: Can the Google Gemini AI hallucinate student attention scores?',
      a: 'No. All quantitative statistics (average focus score, peak focus, drop-off minute, gaze shift count) are computed deterministically in TypeScript before invoking Gemini. System instructions prohibit inventing numbers, and Zod runtime schemas enforce strict output validation.',
    },
  ];

  qas.forEach((qa, idx) => {
    const y = 1.4 + idx * 1.8;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y,
      w: 12.13,
      h: 1.6,
      fill: { color: C_BG_CARD },
      line: { color: '334155', width: 1 },
      rectRadius: 0.1,
    });

    slide.addText(qa.q, { x: 0.8, y: y + 0.15, w: 11.7, h: 0.35, fontSize: 11, fontFace: 'Arial', bold: true, color: C_SUCCESS });
    slide.addText(qa.a, { x: 0.8, y: y + 0.55, w: 11.7, h: 0.95, fontSize: 9.2, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 14 });
  });

  addSlideFooter(slide, 21);
}

// ============================================================================
// SLIDE 22: CONCLUSION & FUTURE ROADMAP
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };
  addSlideHeader(slide, 'Summary of Achievements & Future Roadmap', 'CONCLUSION');

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.4,
    w: 5.8,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Key System Achievements', { x: 0.9, y: 1.6, w: 5.2, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_CYAN });
  slide.addText(
    '✔ Browser-Native Perception: Real-time 30 fps 468 landmark tracking and 512-D ONNX embedding inference with zero server GPU overhead.\n\n' +
    '✔ Robust Multi-Face Tracking: DeepSORT-lite architecture eliminates identity switching across students.\n\n' +
    '✔ Ergonomic Formative Insights: Accurately differentiates desk problem-solving from genuine distraction.\n\n' +
    '✔ Full Regulatory Compliance: Hardware-encrypted on-device storage strictly conforming to the DPDP Act 2023.',
    { x: 0.9, y: 2.1, w: 5.2, h: 4.4, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 16 }
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.4,
    w: 5.9,
    h: 5.4,
    fill: { color: C_BG_CARD },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide.addText('Future Engineering Roadmap', { x: 7.1, y: 1.6, w: 5.3, h: 0.4, fontSize: 13, fontFace: 'Arial', bold: true, color: C_SUCCESS });
  slide.addText(
    '• Multi-Camera Classroom Fusion: Synthesizing multiple wide-angle classroom cameras into a unified 3D spatial occupancy grid.\n\n' +
    '• Gaze Saliency Heatmaps: Tracking student eye fixation points on projected slide presentations and smartboards.\n\n' +
    '• Edge SLM Pedagogical Assistant: Running on-device Small Language Models (e.g. Gemma 2B via WebGPU) for fully offline report generation.\n\n' +
    '• Smart Classroom IoT Integration: Automatic environmental adjustments (lighting, HVAC) triggered by collective cognitive fatigue.',
    { x: 7.1, y: 2.1, w: 5.3, h: 4.4, fontSize: 9.5, fontFace: 'Arial', color: 'CBD5E1', lineSpacing: 16 }
  );

  addSlideFooter(slide, 22);
}

// ============================================================================
// SLIDE 23: CLOSING SLIDE
// ============================================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: C_BG_DARK };

  slide.addText('Thank You', {
    x: 0.8,
    y: 2.2,
    w: 11.5,
    h: 1.0,
    fontSize: 48,
    fontFace: 'Arial',
    bold: true,
    color: C_TEXT_LIGHT,
    align: 'center',
  });

  slide.addText('CogniLearn AI — Empowering Deep Learning Through Ethical Attention Analytics', {
    x: 0.8,
    y: 3.3,
    w: 11.5,
    h: 0.5,
    fontSize: 16,
    fontFace: 'Arial',
    color: 'CBD5E1',
    align: 'center',
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 4.1,
    y: 4.2,
    w: 4.9,
    h: 1.2,
    fill: { color: C_BG_CARD },
    line: { color: C_PRIMARY, width: 1 },
    rectRadius: 0.1,
  });

  slide.addText('Questions & Discussion Welcome\nDocumentation: CogniLearn System Architecture & Features Specification', {
    x: 4.2,
    y: 4.35,
    w: 4.7,
    h: 0.9,
    fontSize: 10,
    fontFace: 'Arial',
    color: 'E2E8F0',
    align: 'center',
    lineSpacing: 14,
  });

  addSlideFooter(slide, 23);
}

// Write the PowerPoint File to disk
const outputPath = path.resolve('CogniLearn_System_Architecture_and_Features.pptx');
pptx.writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`Successfully generated presentation at: ${outputPath}`);
  })
  .catch((err) => {
    console.error('Failed to generate presentation:', err);
    process.exit(1);
  });
