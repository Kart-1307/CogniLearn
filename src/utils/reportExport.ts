import { StudentDiagnosticReport, ClassDiagnosticReport } from '../types';

/**
 * Downloads a structured CSV file of the diagnostic report.
 */
export function exportReportToCSV(report: StudentDiagnosticReport | ClassDiagnosticReport, isClass: boolean = false) {
  const rows: string[][] = [];

  if (isClass) {
    const classRep = report as ClassDiagnosticReport;
    rows.push(['COGNILERAN CLASSROOM ATTENTION DIAGNOSTIC REPORT']);
    rows.push(['Generated At', new Date().toISOString()]);
    rows.push(['Class Name', classRep.className || 'Class']);
    rows.push(['Session Topic', classRep.sessionTitle || 'Diagnostic Session']);
    rows.push(['Date', classRep.date || '']);
    rows.push(['Status', classRep.status || 'Completed']);
    rows.push(['Configured Duration (min)', String(classRep.configuredDurationMinutes)]);
    rows.push(['Actual Duration (sec)', String(classRep.actualDurationSeconds)]);
    rows.push(['Class Average Focus (%)', `${classRep.avgClassFocus}%`]);
    rows.push(['Peak Cohort Focus (%)', `${classRep.peakClassFocus}%`]);
    rows.push(['Total Students Tracked', String(classRep.studentsCount)]);
    rows.push(['Optimal Students (>75%)', String(classRep.optimalStudentsCount)]);
    rows.push(['Distracted Students (<60%)', String(classRep.distractedStudentsCount)]);
    rows.push([]);

    rows.push(['STUDENT ROSTER PERFORMANCE BREAKDOWN']);
    rows.push(['Student ID', 'Student Name', 'Avg Focus (%)', 'Peak Focus (%)', 'Optimal Focus (%)', 'Gaze Shifts', 'Mesh Quality']);
    (classRep.studentReports || []).forEach((s) => {
      rows.push([
        String(s.studentId),
        `"${s.studentName}"`,
        String(s.metrics?.avgFocusScore || 0),
        String(s.metrics?.peakFocusScore || 0),
        String(s.metrics?.optimalFocusPercent || 0),
        String(s.metrics?.gazeShiftsCount || 0),
        `"${s.metrics?.meshQuality || 'Standard'}"`,
      ]);
    });

    rows.push([]);
    rows.push(['PEDAGOGICAL OBSERVATIONS']);
    (classRep.classObservations || []).forEach((obs) => {
      rows.push([`"${obs.replace(/"/g, '""')}"`]);
    });

    rows.push([]);
    rows.push(['RECOMMENDED INTERVENTIONS']);
    (classRep.classRecommendations || []).forEach((rec) => {
      rows.push([`"${rec.replace(/"/g, '""')}"`]);
    });
  } else {
    const stdRep = report as StudentDiagnosticReport;
    rows.push(['COGNILERAN INDIVIDUAL STUDENT ATTENTION DIAGNOSTIC REPORT']);
    rows.push(['Generated At', new Date().toISOString()]);
    rows.push(['Student Name', `"${stdRep.studentName}"`]);
    rows.push(['Student ID', String(stdRep.studentId)]);
    rows.push(['Session Title', `"${stdRep.sessionTitle}"`]);
    rows.push(['Date', stdRep.date]);
    rows.push(['Status', stdRep.status]);
    rows.push(['Configured Duration (min)', String(stdRep.configuredDurationMinutes)]);
    rows.push(['Actual Duration (sec)', String(stdRep.actualDurationSeconds)]);
    rows.push([]);

    rows.push(['CORE ATTENTION METRICS']);
    rows.push(['Average Focus Score (%)', `${stdRep.metrics?.avgFocusScore}%`]);
    rows.push(['Peak Focus Score (%)', `${stdRep.metrics?.peakFocusScore}%`]);
    rows.push(['Minimum Focus Score (%)', `${stdRep.metrics?.minFocusScore}%`]);
    rows.push(['Optimal Gaze (%)', `${stdRep.metrics?.optimalFocusPercent}%`]);
    rows.push(['Distracted Gaze (%)', `${stdRep.metrics?.distractedPercent}%`]);
    rows.push(['Gaze Shift Events', String(stdRep.metrics?.gazeShiftsCount || 0)]);
    rows.push(['Mesh Coordinate Quality', `"${stdRep.metrics?.meshQuality || 'Optimal'}"`]);
    rows.push([]);

    if (stdRep.metrics?.gazeBreakdown) {
      rows.push(['3D SPATIAL GAZE DISTRIBUTION']);
      rows.push(['Direct Center Screen (%)', String(stdRep.metrics.gazeBreakdown.centerPercent)]);
      rows.push(['Off Screen Left (%)', String(stdRep.metrics.gazeBreakdown.offScreenLeftPercent)]);
      rows.push(['Off Screen Right (%)', String(stdRep.metrics.gazeBreakdown.offScreenRightPercent)]);
      rows.push(['Looking Down (%)', String(stdRep.metrics.gazeBreakdown.lookingDownPercent)]);
      rows.push(['Looking Up (%)', String(stdRep.metrics.gazeBreakdown.lookingUpPercent)]);
      rows.push(['Eyes Closed (%)', String(stdRep.metrics.gazeBreakdown.eyesClosedPercent)]);
      rows.push([]);
    }

    if (stdRep.metrics?.fatigueAnalysis) {
      rows.push(['OCULAR FATIGUE ANALYSIS']);
      rows.push(['Risk Level', stdRep.metrics.fatigueAnalysis.fatigueRiskLevel]);
      rows.push(['Blink Rate (per min)', String(stdRep.metrics.fatigueAnalysis.blinkRatePerMin)]);
      rows.push(['Average Eye Openness (EAR)', String(stdRep.metrics.fatigueAnalysis.averageEyeOpenness)]);
      rows.push(['Posture Score (out of 100)', String(stdRep.metrics.fatigueAnalysis.postureScore)]);
      rows.push(['Clinical Summary', `"${stdRep.metrics.fatigueAnalysis.fatigueDescription.replace(/"/g, '""')}"`]);
      rows.push([]);
    }

    rows.push(['BEHAVIORAL OBSERVATIONS']);
    (stdRep.observations || []).forEach((obs) => {
      rows.push([`"${obs.replace(/"/g, '""')}"`]);
    });

    rows.push([]);
    rows.push(['AI RECOMMENDATIONS & ACTION PLAN']);
    (stdRep.recommendations || []).forEach((rec) => {
      rows.push([`"${rec.replace(/"/g, '""')}"`]);
    });
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const fileName = `CogniLearn_${isClass ? 'Class' : 'Student'}_Report_${Date.now()}.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers a clean, high-resolution printable HTML/PDF view for the diagnostic summary.
 */
export function exportReportToPDF(report: StudentDiagnosticReport | ClassDiagnosticReport, isClass: boolean = false) {
  const printWindow = window.open('', '_blank', 'width=900,height=1100');
  if (!printWindow) {
    window.print();
    return;
  }

  const isClassRep = isClass;
  const classRep = report as ClassDiagnosticReport;
  const stdRep = report as StudentDiagnosticReport;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CogniLearn Diagnostic Report - ${isClassRep ? classRep.className : stdRep.studentName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #FFFFFF;
      padding: 32px 40px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #E5E7EB;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 4px 0;
    }
    .tagline {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #FF5A5F;
      margin: 0;
    }
    .meta-badge {
      font-size: 11px;
      font-family: monospace;
      color: #4B5563;
      background: #F3F4F6;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #E5E7EB;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .stat-label {
      font-size: 10px;
      font-family: monospace;
      text-transform: uppercase;
      color: #6B7280;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 800;
      color: #0F172A;
      font-family: monospace;
    }
    .section {
      margin-bottom: 24px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px 20px;
    }
    .section-title {
      font-size: 13px;
      font-family: monospace;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 800;
      color: #111827;
      margin-top: 0;
      margin-bottom: 12px;
      border-bottom: 1px solid #F3F4F6;
      padding-bottom: 6px;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      font-size: 12px;
      color: #374151;
    }
    li {
      margin-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 8px;
    }
    th {
      background: #F3F4F6;
      text-align: left;
      padding: 8px 10px;
      font-family: monospace;
      text-transform: uppercase;
      border-bottom: 1px solid #D1D5DB;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #E5E7EB;
    }
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #E5E7EB;
      font-size: 10px;
      color: #9CA3AF;
      font-family: monospace;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 12mm; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <p class="tagline">CogniLearn Precision Attention Diagnostics</p>
      <h1 class="title">${isClassRep ? `Class Diagnostic — ${classRep.className}` : `Student Diagnostic — ${stdRep.studentName}`}</h1>
      <p style="font-size: 12px; color: #4B5563; margin: 0;">Session: ${isClassRep ? classRep.sessionTitle : stdRep.sessionTitle} • Date: ${isClassRep ? classRep.date : stdRep.date}</p>
    </div>
    <div class="meta-badge">
      ${isClassRep ? `Tracked: ${classRep.studentsCount} Students` : `Status: ${stdRep.status}`}
    </div>
  </div>

  <div class="grid">
    <div class="stat-card">
      <div class="stat-label">${isClassRep ? 'Class Avg Focus' : 'Average Focus'}</div>
      <div class="stat-value" style="color: #E11D48;">${isClassRep ? classRep.avgClassFocus : stdRep.metrics?.avgFocusScore}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Peak Focus</div>
      <div class="stat-value" style="color: #059669;">${isClassRep ? classRep.peakClassFocus : stdRep.metrics?.peakFocusScore}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Optimal Lock</div>
      <div class="stat-value" style="color: #2563EB;">${isClassRep ? classRep.optimalStudentsCount : stdRep.metrics?.optimalFocusPercent}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">${isClassRep ? 'Distracted Count' : 'Distraction Shifts'}</div>
      <div class="stat-value" style="color: #D97706;">${isClassRep ? classRep.distractedStudentsCount : stdRep.metrics?.gazeShiftsCount}</div>
    </div>
  </div>

  ${isClassRep && classRep.studentReports ? `
  <div class="section">
    <h3 class="section-title">Classroom Student Performance Roster</h3>
    <table>
      <thead>
        <tr>
          <th>Student Name</th>
          <th>Avg Focus</th>
          <th>Peak Focus</th>
          <th>Optimal Gaze %</th>
          <th>Gaze Shifts</th>
          <th>Mesh Integrity</th>
        </tr>
      </thead>
      <tbody>
        ${classRep.studentReports.map(s => `
          <tr>
            <td><strong>${s.studentName}</strong></td>
            <td style="font-weight: bold; color: #E11D48;">${s.metrics?.avgFocusScore}%</td>
            <td>${s.metrics?.peakFocusScore}%</td>
            <td>${s.metrics?.optimalFocusPercent}%</td>
            <td>${s.metrics?.gazeShiftsCount}</td>
            <td>${s.metrics?.meshQuality || 'Standard'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h3 class="section-title">Diagnostic Observations</h3>
    <ul>
      ${(isClassRep ? classRep.classObservations : stdRep.observations || []).map(obs => `<li>${obs}</li>`).join('')}
    </ul>
  </div>

  <div class="section" style="background: #FFFBEB; border-color: #FDE68A;">
    <h3 class="section-title" style="color: #92400E; border-color: #FDE68A;">Intervention & Action Plan</h3>
    <ul>
      ${(isClassRep ? classRep.classRecommendations : stdRep.recommendations || []).map(rec => `<li style="color: #78350F;"><strong>✓</strong> ${rec}</li>`).join('')}
    </ul>
  </div>

  <div class="footer">
    <span>CogniLearn Attention Vector Engine v3.0</span>
    <span>Export Generated: ${new Date().toLocaleString()}</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
