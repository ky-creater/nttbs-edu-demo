import { Student, RiskLevel } from './types';

export interface RiskBreakdown {
  total: number;
  absence: { score: number; max: 40; label: string };
  lateness: { score: number; max: 20; label: string };
  trend: { score: number; max: 30; label: string };
  grades: { score: number; max: 10; label: string };
}

export function calculateRiskBreakdown(student: Student): RiskBreakdown {
  const attendance = student.attendance;
  if (!attendance.length) {
    return {
      total: 0,
      absence: { score: 0, max: 40, label: '欠席なし' },
      lateness: { score: 0, max: 20, label: '遅刻なし' },
      trend: { score: 0, max: 30, label: '変化なし' },
      grades: { score: 0, max: 10, label: '問題なし' },
    };
  }

  const totalAbsent = attendance.reduce((sum, m) => sum + m.absent, 0);
  const totalLate = attendance.reduce((sum, m) => sum + m.late, 0);
  const totalDays = attendance.reduce((sum, m) => sum + m.present + m.absent, 0);

  const absentRate = totalAbsent / totalDays;
  const lateRate = totalLate / totalDays;

  const recent = attendance.slice(-3);
  const early = attendance.slice(0, 3);
  const recentAbsentAvg = recent.reduce((s, m) => s + m.absent, 0) / 3;
  const earlyAbsentAvg = early.reduce((s, m) => s + m.absent, 0) / 3;
  const trendFactor = Math.max(0, (recentAbsentAvg - earlyAbsentAvg) / 5);

  const absenceScore = Math.min(Math.round(absentRate * 200), 40);
  const latenessScore = Math.min(Math.round(lateRate * 100), 20);
  const trendScore = Math.min(Math.round(trendFactor * 30), 30);

  const avgGrade = student.grades.reduce((s, g) => s + g.score, 0) / (student.grades.length || 1);
  const gradesScore = avgGrade < 40 ? 10 : avgGrade < 55 ? 5 : 0;

  const total = Math.min(absenceScore + latenessScore + trendScore + gradesScore, 100);

  return {
    total,
    absence: {
      score: absenceScore,
      max: 40,
      label: `年間${totalAbsent}日欠席（出席率${Math.round((1 - absentRate) * 100)}%）`,
    },
    lateness: {
      score: latenessScore,
      max: 20,
      label: `年間${totalLate}回遅刻`,
    },
    trend: {
      score: trendScore,
      max: 30,
      label: trendScore > 0
        ? `直近3ヶ月で悪化傾向（月平均欠席 ${earlyAbsentAvg.toFixed(1)}日→${recentAbsentAvg.toFixed(1)}日）`
        : '悪化傾向なし',
    },
    grades: {
      score: gradesScore,
      max: 10,
      label: gradesScore > 0 ? `平均${Math.round(avgGrade)}点（学力面の懸念あり）` : `平均${Math.round(avgGrade)}点（問題なし）`,
    },
  };
}

export function calculateRiskScore(student: Student): number {
  return calculateRiskBreakdown(student).total;
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
