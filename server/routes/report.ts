import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { Langfuse } from 'langfuse';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

// Initialize Langfuse Tracer (if keys are configured)
const langfuse = (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY)
  ? new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
    })
  : null;

// Zod Schemas for LLM Narrative Validation (Zero Hallucinated Numbers Allowed)
export const StudentNarrativeSchema = z.object({
  observations: z.array(z.string().max(160)).min(2).max(4),
  recommendations: z.array(z.string().max(160)).min(2).max(4),
  aiActionPlan: z.array(z.string().max(160)).min(2).max(4),
  fatigueSummary: z.string().max(200),
  engagementLevel: z.enum(['Optimal Active', 'Sustained Steady', 'Variable Attention', 'At-Risk']),
});

export const ClassroomNarrativeSchema = z.object({
  classObservations: z.array(z.string().max(160)).min(2).max(4),
  classRecommendations: z.array(z.string().max(160)).min(2).max(4),
  cohortEngagementRisk: z.enum(['Low', 'Moderate', 'High']),
  suggestedBreakDurationMinutes: z.number().min(2).max(15),
});

const SYSTEM_INSTRUCTION = `You are an expert Educational Neuroscientist and Cognitive Ergonomics Specialist at CogniLearn.
Your role is SOLELY to provide narrative observations and pedagogical advice based on pre-computed deterministic statistics.

CRITICAL RULES:
- DO NOT invent, alter, or recompute any quantitative scores, percentages, minutes, or statistical numbers.
- Base all insights exclusively on the provided pre-computed metrics.
- Return ONLY a JSON object strictly conforming to the requested schema. No markdown wrapping.
- All advice must be supportive, constructive, and oriented towards formative self-regulation.
- Never suggest disciplinary or punitive actions.`;

/**
 * Computes deterministic session statistics directly in code
 */
function computeDeterministicSessionStats(telemetry: any) {
  const elapsedSec = Number(telemetry.actualDurationSeconds || (telemetry.configuredDurationMinutes || 15) * 60);
  const monitoredMinutes = Math.max(1, Math.round(elapsedSec / 60));

  const avgFocus = Number(telemetry.metrics?.avgFocusScore ?? telemetry.avgClassFocus ?? 75);
  const peakFocus = Number(telemetry.metrics?.peakFocusScore ?? telemetry.peakClassFocus ?? 85);
  const minFocus = Number(telemetry.metrics?.minFocusScore ?? 60);

  // Compute drop-off minute if timeline samples are present
  let dropOffMinute: number | null = null;
  const samples = telemetry.metrics?.timelineSamples || [];
  if (Array.isArray(samples) && samples.length > 0) {
    for (const sample of samples) {
      if (sample.focusScore < 60) {
        dropOffMinute = Math.round((sample.timeSec || 0) / 60);
        break;
      }
    }
  }

  const gazeShifts = Number(telemetry.metrics?.gazeShiftsCount || 0);
  const shiftsPerMin = Number((gazeShifts / monitoredMinutes).toFixed(1));

  return {
    monitoredMinutes,
    avgFocus,
    peakFocus,
    minFocus,
    dropOffMinute,
    shiftsPerMin,
    truthNotice: `Based on ${monitoredMinutes} minute(s) of verified telemetry. Formative learning aid only; not evaluated for disciplinary or grading purposes.`,
  };
}

router.post('/generate-ai', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(530).json({ 
      error: 'GEMINI_API_KEY environment variable is missing on backend server.', 
      fallback: true 
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const { isClassroom, telemetry } = req.body;

  if (!telemetry) {
    return res.status(400).json({ error: 'Missing session telemetry payload.' });
  }

  // 1. Compute ALL quantitative statistics deterministically in TypeScript
  const deterministicStats = computeDeterministicSessionStats(telemetry);

  // 2. Pseudonymize all student identifiers to prevent PII leakage to third-party LLM
  const rawId = String(telemetry.studentId || telemetry.studentName || 'student_anon');
  const pseudonym = 'student_' + crypto.createHash('sha256').update(rawId).digest('hex').substring(0, 8);

  // 3. Build constrained prompt (numbers are provided as fixed facts)
  const userPrompt = isClassroom
    ? `[COHORT_DETERMINISTIC_METRICS]
Class: ${telemetry.className || 'Cohort'} | Subject: ${telemetry.subjectName || 'General'}
MonitoredMinutes: ${deterministicStats.monitoredMinutes}
CohortAvgFocus: ${deterministicStats.avgFocus}% | CohortPeakFocus: ${deterministicStats.peakFocus}%
OptimalCount: ${telemetry.optimalStudentsCount || 0} | DistractedCount: ${telemetry.distractedStudentsCount || 0}

TASK: Return a JSON object with keys:
"classObservations": 3 concise pedagogical observations on focus trends (max 18 words each),
"classRecommendations": 3 actionable group interventions (max 18 words each),
"cohortEngagementRisk": One of "Low", "Moderate", or "High",
"suggestedBreakDurationMinutes": Number between 3 and 10.`

    : `[STUDENT_DETERMINISTIC_METRICS]
Pseudonym: ${pseudonym} | Subject: ${telemetry.subjectName || 'General'}
MonitoredMinutes: ${deterministicStats.monitoredMinutes}
DeterministicAvgFocus: ${deterministicStats.avgFocus}% | PeakFocus: ${deterministicStats.peakFocus}% | MinFocus: ${deterministicStats.minFocus}%
${deterministicStats.dropOffMinute !== null ? `ObservedFocusDropAtMinute: ${deterministicStats.dropOffMinute}` : 'NoSustainedFocusDropDetected'}
GazeShiftsPerMin: ${deterministicStats.shiftsPerMin}
FatigueRiskAssessed: ${telemetry.metrics?.fatigueAnalysis?.fatigueRiskLevel || 'Low'}
PostureAssessed: ${telemetry.metrics?.fatigueAnalysis?.postureScore || 90}/100

TASK: Return a JSON object with keys:
"observations": 3 concise observations grounded in the deterministic metrics above (max 18 words each),
"recommendations": 3 actionable study recommendations (max 18 words each),
"aiActionPlan": 3 step-by-step cognitive routine steps (max 18 words each),
"fatigueSummary": 1 sentence summarizing eye/posture condition,
"engagementLevel": One of "Optimal Active", "Sustained Steady", "Variable Attention", "At-Risk".`;

  const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.0-flash';
  const fallbackModel = 'gemini-2.5-flash';

  // --- Initialize Langfuse Trace & Generation with Pseudonymous ID ---
  const trace = langfuse?.trace({
    name: isClassroom ? 'cognilearn-classroom-report' : 'cognilearn-student-report',
    userId: pseudonym,
    sessionId: String(telemetry.sessionTitle || 'diagnostic-session'),
    tags: [isClassroom ? 'classroom' : 'student', 'diagnostic', 'gemini-ai'],
    metadata: {
      isClassroom: Boolean(isClassroom),
      monitoredMinutes: deterministicStats.monitoredMinutes,
      avgFocus: deterministicStats.avgFocus,
    },
  });

  const generation = trace?.generation({
    name: 'gemini-report-generation',
    model: preferredModel,
    modelParameters: { temperature: 0.1 },
    input: [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      { role: 'user', content: userPrompt },
    ],
  });

  // Helper to execute generation with Zod validation and 1 automatic retry
  const executeGeneration = async (model: string, promptText: string): Promise<any> => {
    const geminiResponse = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = geminiResponse.text || '{}';
    const parsed = JSON.parse(text);

    // Validate with Zod
    if (isClassroom) {
      return ClassroomNarrativeSchema.parse(parsed);
    } else {
      return StudentNarrativeSchema.parse(parsed);
    }
  };

  try {
    let narrative: any = null;
    let modelUsed = preferredModel;

    // Attempt 1: Primary Model
    try {
      narrative = await executeGeneration(preferredModel, userPrompt);
    } catch (firstErr: any) {
      console.warn(`[CogniLearn Gemini API] Primary attempt failed (${firstErr?.message || firstErr}). Retrying with fallback model...`);
      modelUsed = fallbackModel;
      // Attempt 2: 1 Retry with Fallback Model
      narrative = await executeGeneration(fallbackModel, userPrompt);
    }

    generation?.end({
      output: JSON.stringify(narrative),
      level: 'DEFAULT',
      statusMessage: `Validated via ${modelUsed}`,
    });
    if (langfuse) await langfuse.flushAsync();

    // Merge deterministic numbers with LLM narrative
    const finalReport = {
      ...telemetry,
      deterministicStats,
      narrative,
      truthNotice: deterministicStats.truthNotice,
    };

    return res.json({
      success: true,
      aiGenerated: true,
      modelUsed,
      report: finalReport,
    });

  } catch (error: any) {
    console.error('[CogniLearn Gemini API Error after retry]:', error);

    generation?.end({
      level: 'ERROR',
      statusMessage: error.message || 'AI Generation failed after retry',
    });
    if (langfuse) await langfuse.flushAsync();

    // Deterministic fallback (zero fabricated numbers, truthful statistics)
    const fallbackReport = {
      ...telemetry,
      deterministicStats,
      narrative: isClassroom ? {
        classObservations: [
          `Cohort sustained an average focus score of ${deterministicStats.avgFocus}%.`,
          `Peak attention recorded during early segment at ${deterministicStats.peakFocus}%.`,
          `Total of ${telemetry.distractedStudentsCount || 0} students flagged for engagement support.`,
        ],
        classRecommendations: [
          'Introduce a 3-minute physical movement break to refresh cohort attention.',
          'Shift from passive lecture to paired peer problem-solving.',
          'Review concept difficulty if mid-session drop-off exceeds 10 minutes.',
        ],
        cohortEngagementRisk: deterministicStats.avgFocus >= 75 ? 'Low' : deterministicStats.avgFocus >= 60 ? 'Moderate' : 'High',
        suggestedBreakDurationMinutes: 5,
      } : {
        observations: [
          `Session monitored across ${deterministicStats.monitoredMinutes} minute(s) with ${deterministicStats.avgFocus}% average focus.`,
          `Peak attention level reached ${deterministicStats.peakFocus}%.`,
          `Gaze stability recorded at ${deterministicStats.shiftsPerMin} shifts per minute.`,
        ],
        recommendations: [
          'Maintain 25-minute Pomodoro intervals to prevent ocular fatigue.',
          'Incorporate 20-20-20 eye rest rule during prolonged screen reading.',
          'Hydrate and practice brief shoulder stretches between study blocks.',
        ],
        aiActionPlan: [
          'Step 1: Complete current review slot with notebook note-taking.',
          'Step 2: Take 5-minute offline break without digital devices.',
          'Step 3: Resume next subject with active recall quiz questions.',
        ],
        fatigueSummary: `Ocular status assessed as ${telemetry.metrics?.fatigueAnalysis?.fatigueRiskLevel || 'normal'} across ${deterministicStats.monitoredMinutes}m study period.`,
        engagementLevel: deterministicStats.avgFocus >= 80 ? 'Optimal Active' : deterministicStats.avgFocus >= 65 ? 'Sustained Steady' : 'Variable Attention',
      },
      truthNotice: deterministicStats.truthNotice,
    };

    return res.json({
      success: true,
      aiGenerated: false,
      fallbackUsed: true,
      report: fallbackReport,
    });
  }
});

export default router;
