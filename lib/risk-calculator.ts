import { Student, RiskLevel } from './types';

export function calculateRiskScore(student: Student): number {
  const attendance = student.attendance;
  if (!attendance.length) return 0;

  const totalAbsent = attendance.reduce((sum, m) => sum + m.absent, 0);
  const totalLate = attendance.reduce((sum, m) => sum + m.late, 0);
  const totalDays = attendance.reduce((sum, m) => sum + m.present + m.absent, 0);

  const absentRate = totalAbsent / totalDays;
  const lateRate = totalLate / totalDays;

  // Trend: compare last 3 months vs first 3 months
  const recent = attendance.slice(-3);
  const early = attendance.slice(0, 3);
  const recentAbsentAvg = recent.reduce((s, m) => s + m.absent, 0) / 3;
  const earlyAbsentAvg = early.reduce((s, m) => s + m.absent, 0) / 3;
  const trendFactor = Math.max(0, (recentAbsentAvg - earlyAbsentAvg) / 5);

  let score = 0;
  score += Math.min(absentRate * 200, 40);
  score += Math.min(lateRate * 100, 20);
  score += Math.min(trendFactor * 30, 30);

  // Grade factor
  const avgScore = student.grades.reduce((s, g) => s + g.score, 0) / (student.grades.length || 1);
  if (avgScore < 40) score += 10;
  else if (avgScore < 55) score += 5;

  return Math.min(Math.round(score), 100);
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
}

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case 'high': return '要注意';
    case 'medium': return '経過観察';
    case 'low': return '安定';
  }
}
