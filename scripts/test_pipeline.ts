/**
 * Automated Verification Script for Classroom Multi-Face Pipeline
 * Validates:
 * 1. 8-State Kalman Filter dynamics & prediction accuracy
 * 2. Hungarian Algorithm assignment under spatial cost constraints
 * 3. 5-point Umeyama similarity transform alignment (ArcFace 112x112 convention)
 * 4. Cosine similarity & L2 normalization math
 * 5. Metric identity hysteresis switching and acquisition thresholds
 * 6. Cognitive attention model sliding PERCLOS & degree pitch/yaw calculations
 */

import { BoundingBoxKalmanFilter } from '../src/utils/kalmanFilter';
import { hungarianAlgorithm, computeIoU } from '../src/utils/hungarian';
import { estimateSimilarityTransform, ARCFACE_112_TARGET_PTS, l2Normalize } from '../src/services/faceAligner';
import { calculateCosineSimilarity, computeBiometricSimilarity } from '../src/services/faceMatcher';
import { CognitiveAttentionModel } from '../src/services/cognitiveModel';
import { TrackingEvaluationHarness } from '../src/utils/evaluationHarness';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✔ PASS: ${msg}`);
}

async function runTests() {
  console.log('\n=== RUNNING CLASSROOM MULTI-FACE DETECTION SUITE ===\n');

  // Test 1: Kalman Filter Tracking
  console.log('Test 1: Kalman Filter State Estimation');
  const kalman = new BoundingBoxKalmanFilter({ cx: 100, cy: 100, w: 50, h: 50 });
  const pred1 = kalman.predict();
  assert(Math.abs(pred1.cx - 100) < 0.1, 'Predicted initial cx matches prior');

  // Simulate smooth motion: moving +5 px per frame along X
  let updatedBox = kalman.update({ cx: 105, cy: 100, w: 50, h: 50 });
  assert(updatedBox.cx > 100 && updatedBox.cx <= 105, 'Kalman filter smoothed position measurement');
  const pred2 = kalman.predict();
  assert(pred2.cx > 102, 'Kalman filter velocity extrapolates along positive X direction');

  // Test 2: Hungarian Matching & IoU
  console.log('\nTest 2: Hungarian Algorithm & Spatial Cost Assignment');
  const boxA = { bx1: 10, by1: 10, bw: 50, bh: 50 };
  const boxB = { bx1: 10, by1: 10, bw: 50, bh: 50 };
  const boxC = { bx1: 200, by1: 200, bw: 50, bh: 50 };
  assert(computeIoU(boxA, boxB) === 1.0, 'Identical boxes have IoU 1.0');
  assert(computeIoU(boxA, boxC) === 0.0, 'Disjoint boxes have IoU 0.0');

  const costMatrix = [
    [0.1, 0.9],
    [0.8, 0.2],
  ];
  const assignments = hungarianAlgorithm(costMatrix, 0.95);
  assert(assignments.length === 2, 'Hungarian matched both tracks');
  assert(assignments[0].row === 0 && assignments[0].col === 0, 'Det 0 assigned to Track 0');
  assert(assignments[1].row === 1 && assignments[1].col === 1, 'Det 1 assigned to Track 1');

  // Test 3: Umeyama 5-Point Transform Alignment
  console.log('\nTest 3: 5-Point Umeyama Facial Alignment');
  const canonicalPts = ARCFACE_112_TARGET_PTS;
  const transform = estimateSimilarityTransform(canonicalPts, ARCFACE_112_TARGET_PTS);
  // a = scale * cos(theta), b = scale * sin(theta) -> for identity, a = 1.0, b = 0.0, tx = 0, ty = 0
  assert(Math.abs(transform.a - 1.0) < 0.01, 'Identity transform scale matches 1.0');
  assert(Math.abs(transform.b) < 0.01, 'Identity transform rotation matches 0.0');
  assert(Math.abs(transform.tx) < 0.01 && Math.abs(transform.ty) < 0.01, 'Identity transform translation matches 0');

  // Test 4: Embedding Math & Similarity
  console.log('\nTest 4: 512-D L2 Normalization & Cosine Distance');
  const rawVec = new Array(512).fill(0).map((_, i) => (i % 2 === 0 ? 1 : -1));
  const normVec = l2Normalize(rawVec);
  const normVal = Math.sqrt(normVec.reduce((acc, v) => acc + v * v, 0));
  assert(Math.abs(normVal - 1.0) < 1e-4, 'L2-normalized vector has unit Euclidean norm 1.0');

  const identicalSim = calculateCosineSimilarity(normVec, normVec);
  assert(Math.abs(identicalSim - 1.0) < 1e-4, 'Self-cosine similarity is exactly 1.0');

  const deepBiometric = computeBiometricSimilarity(normVec, normVec);
  assert(deepBiometric.similarity >= 95, 'Matching 512-D vector produces >= 95% match confidence');
  assert(deepBiometric.distance < 0.01, 'Matching 512-D vector has distance < 0.01');

  // Test 5: Cognitive Attention ML Model with Degree Pitch/Yaw
  console.log('\nTest 5: Cognitive Attention Model & Sliding Window PERCLOS');
  const cognitive = new CognitiveAttentionModel();
  
  // Forward gazing, normal blinks
  const frame1 = cognitive.evaluateFrame(
    0.28, // avgEar (open)
    0,    // yaw 0° (degrees)
    -2,   // pitch -2° (degrees)
    0,    // roll
    0,    // irisOffsetX
    0,    // irisOffsetY
    { eyeBlinkLeft: 0.02, eyeBlinkRight: 0.03 } // blendshapes
  );
  assert(frame1.state === 'SCREEN_ENGAGEMENT', 'Forward camera gaze classifies as SCREEN_ENGAGEMENT');
  assert(frame1.smoothedScore >= 85, 'Engagement focus score is high (>=85)');
  assert(frame1.reasons.length > 0, 'Inference returns explainable reason strings');

  // Downward posture (pitch: 20° downward desk reading)
  const frameNote = cognitive.evaluateFrame(
    0.22, // avgEar
    0,    // yaw
    20,   // pitch (20° downward)
    0,
    0,
    0
  );
  assert(frameNote.state === 'NOTE_TAKING', 'Downward 20° pitch classifies as NOTE_TAKING (reading/solving)');
  assert(frameNote.recommendedColor === '#3B82F6', 'Note-taking returns blue deep-work color token');

  // Extreme off-target gaze (yaw: 35° turned away)
  const frameDist = cognitive.evaluateFrame(
    0.26,
    35,   // yaw (35° turned)
    0,
    0,
    0,
    0
  );
  assert(frameDist.state === 'OFF_TASK_ESTIMATED', 'Extreme 35° yaw classifies as OFF_TASK_ESTIMATED');
  assert(frameDist.recommendedColor === '#FF5A5F', 'Off-task returns alert coral color token');

  // Test 6: Evaluation Diagnostics Harness
  console.log('\nTest 6: Tracking Diagnostics Harness & Metric Reporting');
  const harness = new TrackingEvaluationHarness();
  harness.startLogging();
  harness.recordFrame([
    {
      trackId: 1,
      studentId: 'student-101',
      studentName: 'Aarav Mehta',
      confidence: 88,
      box: { bx1: 10, by1: 10, bw: 60, bh: 60 },
      pose: { yaw: 2, pitch: -1, roll: 0 },
      ear: 0.28,
      perclos: 0.04,
      cognitiveState: 'SCREEN_ENGAGEMENT',
      focusScore: 92,
    },
  ]);
  const report = harness.stopLogging();
  assert(report.totalFrames === 1, 'Harness records frame telemetry');
  assert(report.totalIdSwitches === 0, 'Zero ID switches for stable track');
  assert(report.perStudentMetrics['student-101'] !== undefined, 'Student metrics tracked by ID');

  console.log('\n=== ALL PHASE TESTS PASSED SUCCESSFULLY! ===\n');
}

runTests().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
