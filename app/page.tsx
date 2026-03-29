import { mockStudents } from '@/data/mock-students';
import { calculateRiskScore, getRiskLevel, calculateRiskBreakdown } from '@/lib/risk-calculator';
import { Users, FileText, AlertTriangle, TrendingUp, Calendar, CalendarDays, ClipboardCheck, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

function countAbsenceIncreasing(students: typeof mockStudents): number {
  return students.filter(s => {
    const attendance = s.attendance;
    if (attendance.length < 6) return false;
    const early = attendance.slice(0, 3);
    const recent = attendance.slice(-3);
    const earlyAvg = early.reduce((sum, m) => sum + m.absent, 0) / 3;
    const recentAvg = recent.reduce((sum, m) => sum + m.absent, 0) / 3;
    return recentAvg > earlyAvg * 2 && recentAvg > 0;
  }).length;
}

function countGradeLow(students: typeof mockStudents): number {
  return students.filter(s => {
    const avg = s.grades.reduce((sum, g) => sum + g.score, 0) / (s.grades.length || 1);
    return avg < 55;
  }).length;
}

function countLatenessTendency(students: typeof mockStudents): number {
  return students.filter(s => {
    const recent = s.attendance.slice(-3);
    const totalLate = recent.reduce((sum, m) => sum + m.late, 0);
    return totalLate >= 5;
  }).length;
}

function getTopRiskFactor(student: (typeof mockStudents)[0]): string {
  const bd = calculateRiskBreakdown(student);
  const factors = [
    { label: '欠席増加', score: bd.trend.score },
    { label: '欠席多数', score: bd.absence.score },
    { label: '遅刻傾向', score: bd.lateness.score },
    { label: '成績低下', score: bd.grades.score },
  ];
  const top = factors.reduce((prev, cur) => (cur.score > prev.score ? cur : prev));
  return top.score > 0 ? top.label : '複合要因';
}

const workflowCategories = [
  {
    title: '日常業務',
    subtitle: '毎日・毎週',
    icon: Calendar,
    color: 'blue',
    tasks: [
      { name: '出欠管理・欠席連絡対応', ai: true, link: '/documents?type=absence_reply', aiLabel: '欠席連絡返信を自動生成' },
      { name: '授業準備・教材作成', ai: false, aiLabel: '' },
      { name: '保護者対応・連絡', ai: true, link: '/documents?type=complaint_response', aiLabel: '保護者ご相談への回答文を生成' },
      { name: '指導記録・生徒観察', ai: true, link: '/documents?type=guidance_record', aiLabel: '指導記録を構造化' },
      { name: '学級通信の作成', ai: true, link: '/documents?type=class_newsletter', aiLabel: '学級通信ドラフトを生成' },
    ],
  },
  {
    title: '定期業務',
    subtitle: '学期ごと',
    icon: ClipboardCheck,
    color: 'emerald',
    tasks: [
      { name: '所見作成・通知表', ai: true, link: '/shoken', aiLabel: 'AIが3パターン生成' },
      { name: '成績処理・分析', ai: true, link: '/risk', aiLabel: '成績データをAI分析' },
      { name: '保護者面談の準備', ai: true, link: '/meeting-prep', aiLabel: '面談準備シートを自動生成' },
      { name: 'テスト作成・採点', ai: false, aiLabel: '（今後対応予定）' },
    ],
  },
  {
    title: '年次業務',
    subtitle: '年に1-2回',
    icon: CalendarDays,
    color: 'violet',
    tasks: [
      { name: '行事運営・挨拶文', ai: true, link: '/documents?type=event_speech', aiLabel: '行事挨拶文を生成' },
      { name: '教育委員会への報告', ai: true, link: '/documents?type=board_report', aiLabel: '報告書ドラフトを生成' },
      { name: '進路指導・推薦状', ai: true, link: '/documents?type=recommendation', aiLabel: '推薦状・調査書を生成' },
      { name: '引き継ぎ・年度末処理', ai: false, aiLabel: '（今後対応予定）' },
      { name: '研修報告の作成', ai: true, link: '/documents?type=training_report', aiLabel: '研修報告を生成' },
    ],
  },
  {
    title: '突発対応',
    subtitle: '随時',
    icon: AlertTriangle,
    color: 'red',
    tasks: [
      { name: '不登校・問題行動への対応', ai: true, link: '/risk', aiLabel: 'リスク分析+対応提案' },
      { name: 'いじめ・トラブル対応', ai: true, link: '/documents?type=guidance_record', aiLabel: '対応記録+報告書' },
      { name: '保護者ご相談対応', ai: true, link: '/documents?type=complaint_response', aiLabel: 'ご相談対応の回答文作成' },
    ],
  },
];

const colorMap: Record<string, { border: string; bg: string; iconBg: string; iconText: string; badge: string; badgeText: string; bar: string }> = {
  blue: {
    border: 'border-blue-200',
    bg: 'bg-blue-50/30',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    badge: 'bg-blue-100',
    badgeText: 'text-blue-700',
    bar: 'bg-blue-500',
  },
  emerald: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/30',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    badge: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    bar: 'bg-emerald-500',
  },
  violet: {
    border: 'border-violet-200',
    bg: 'bg-violet-50/30',
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
    badge: 'bg-violet-100',
    badgeText: 'text-violet-700',
    bar: 'bg-violet-500',
  },
  red: {
    border: 'border-red-200',
    bg: 'bg-red-50/30',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    badge: 'bg-red-100',
    badgeText: 'text-red-700',
    bar: 'bg-red-500',
  },
};

const totalTasks = workflowCategories.reduce((sum, c) => sum + c.tasks.length, 0);
const totalAiTasks = workflowCategories.reduce((sum, c) => sum + c.tasks.filter(t => t.ai).length, 0);
const totalAiPct = Math.round((totalAiTasks / totalTasks) * 100);

export default function DashboardPage() {
  const studentsWithRisk = mockStudents.map(s => ({
    ...s,
    riskScore: calculateRiskScore(s),
  }));

  const totalStudents = studentsWithRisk.length;
  const absenceIncreasing = countAbsenceIncreasing(mockStudents);
  const gradeLow = countGradeLow(mockStudents);
  const latenessTendency = countLatenessTendency(mockStudents);

  const kpis = [
    {
      label: '生徒数',
      value: totalStudents,
      unit: '名',
      icon: Users,
      color: 'bg-primary-50 text-primary-600',
      source: '校務支援システム（学籍）',
    },
    {
      label: '欠席増加中',
      value: absenceIncreasing,
      unit: '名',
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      source: '校務支援システム（出欠管理）',
    },
    {
      label: '成績低下',
      value: gradeLow,
      unit: '名',
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
      source: '校務支援システム（成績管理）',
    },
    {
      label: '遅刻傾向',
      value: latenessTendency,
      unit: '名',
      icon: FileText,
      color: 'bg-orange-50 text-orange-600',
      source: '校務支援システム（出欠管理）',
    },
  ];

  const features = [
    {
      href: '/shoken',
      title: '所見ドラフト生成',
      description: '生徒データをもとにAIが通知表所見を3パターン自動生成。編集・コピーしてそのまま活用できます。',
      badge: 'AI生成',
    },
    {
      href: '/documents',
      title: '通知文・文書生成',
      description: '学級通信、保護者通知、保護者ご相談への回答文をAIがドラフト。文体も選択可能。',
      badge: 'AI生成',
    },
    {
      href: '/risk',
      title: '不登校リスク分析',
      description: '出欠データから不登校リスクを自動スコアリング。AIが対応提案も生成します。',
      badge: 'AI分析',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">校務支援AIプラットフォーム &#8212; デモ環境</p>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
                <span className="text-sm text-gray-400">{kpi.unit}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">📊 {kpi.source}</p>
            </div>
          );
        })}
      </div>

      {/* 業務マップ */}
      <div className="mb-8" id="workflow">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">業務マップ — AIで支援できる業務</h2>
            <p className="text-xs text-gray-500 mt-0.5">先生の業務全体像と、AIによる支援可能範囲</p>
          </div>
        </div>

        {/* 全体サマリー */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 font-medium">
              全業務 {totalTasks}項目中 <span className="text-primary-600 font-bold">{totalAiTasks}項目</span>がAI支援可能
            </span>
            <span className="text-sm font-bold text-primary-600">{totalAiPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${totalAiPct}%` }}
            />
          </div>
        </div>

        {/* カテゴリカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflowCategories.map(category => {
            const Icon = category.icon;
            const c = colorMap[category.color];
            const aiCount = category.tasks.filter(t => t.ai).length;
            const total = category.tasks.length;
            const pct = Math.round((aiCount / total) * 100);

            return (
              <div
                key={category.title}
                className={`bg-white rounded-lg border ${c.border} ${c.bg} p-4 shadow-sm`}
              >
                {/* カードヘッダー */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                    <Icon className={`w-4 h-4 ${c.iconText}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-[10px] text-gray-400">{category.subtitle}</p>
                  </div>
                </div>

                {/* タスク一覧 */}
                <ul className="space-y-1.5 mb-3">
                  {category.tasks.map(task => (
                    <li key={task.name}>
                      {task.ai && task.link ? (
                        <Link
                          href={task.link}
                          className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white/70 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm text-gray-800 group-hover:text-primary-600 transition-colors leading-tight">
                                {task.name}
                              </span>
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${c.badge} ${c.badgeText} flex-shrink-0`}>
                                AI
                              </span>
                            </div>
                            {task.aiLabel && (
                              <p className="text-xs text-gray-400 mt-0.5">→ {task.aiLabel}</p>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-start gap-2 px-2 py-1.5">
                          <Circle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-400 leading-tight">{task.name}</span>
                            {task.aiLabel && (
                              <p className="text-xs text-gray-300 mt-0.5 italic">{task.aiLabel}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {/* AI支援率プログレス */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">AI支援率: {aiCount}/{total}（{pct}%）</span>
                    <span className="text-[10px] font-medium text-gray-500">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${c.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI機能カード */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">AI機能</h2>
      <div className="grid grid-cols-3 gap-4">
        {features.map((feature, i) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-[10px] font-medium bg-primary-50 text-primary-600 rounded-full">
                {feature.badge}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* 要注意生徒一覧 */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-900">支援が必要な生徒一覧</h2>
          <span className="text-[10px] text-gray-400">📊 出欠・成績データに基づく自動判定</span>
        </div>
        <div className="space-y-2">
          {studentsWithRisk
            .filter(s => getRiskLevel(s.riskScore!) !== 'low')
            .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
            .slice(0, 5)
            .map(student => (
              <div key={student.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{student.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{student.grade}年{student.class}組</span>
                    <p className="text-xs text-gray-400">主要因: {getTopRiskFactor(student)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        getRiskLevel(student.riskScore!) === 'high' ? 'bg-red-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${student.riskScore}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    getRiskLevel(student.riskScore!) === 'high' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {student.riskScore}点
                  </span>
                </div>
              </div>
            ))}
        </div>
        <Link
          href="/risk"
          className="mt-3 inline-block text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          全生徒のリスク分析を見る →
        </Link>
      </div>
    </div>
  );
}
