import Link from 'next/link';
import { mockStudents } from '@/data/mock-students';
import { calculateRiskScore, getRiskLevel, getRiskColor, getRiskLabel } from '@/lib/risk-calculator';
import { ArrowLeft, FileText, Users, AlertTriangle, PenTool, UserCheck, Mail } from 'lucide-react';
import { ObservationTimeline } from '@/components/observation-timeline';

const MONTH_LABELS: Record<number, string> = {
  4: '4月', 5: '5月', 6: '6月', 7: '7月',
  9: '9月', 10: '10月', 11: '11月', 12: '12月',
  1: '1月', 2: '2月', 3: '3月',
};

const GRADE_COLOR: Record<'A' | 'B' | 'C', string> = {
  A: 'text-emerald-700 bg-emerald-50',
  B: 'text-blue-700 bg-blue-50',
  C: 'text-amber-700 bg-amber-50',
};

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const student = mockStudents.find(s => s.id === id);

  if (!student) {
    return (
      <div>
        <Link href="/students" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> 生徒一覧に戻る
        </Link>
        <p className="mt-6 text-gray-500">生徒が見つかりません</p>
      </div>
    );
  }

  const score = calculateRiskScore(student);
  const level = getRiskLevel(score);
  const colorClass = getRiskColor(level);
  const label = getRiskLabel(level);

  const avgScore = Math.round(
    student.grades.reduce((s, g) => s + g.score, 0) / (student.grades.length || 1)
  );

  const totalPresent = student.attendance.reduce((s, m) => s + m.present, 0);
  const totalAbsent = student.attendance.reduce((s, m) => s + m.absent, 0);
  const totalLate = student.attendance.reduce((s, m) => s + m.late, 0);
  const totalEarlyLeave = student.attendance.reduce((s, m) => s + m.earlyLeave, 0);

  return (
    <div className="max-w-4xl">
      {/* 戻るリンク */}
      <Link href="/students" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" />
        生徒一覧
      </Link>

      {/* 基本情報ヘッダー */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {student.grade}年{student.class}組 {student.number}番 / {student.gender}
            </p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full border font-medium ${colorClass}`}>
            {label}（スコア {score}）
          </span>
        </div>
      </div>

      {/* AIアクションハブ — この生徒に対してできること */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-5 mb-5">
        <p className="text-xs font-medium text-primary-700 mb-3">この生徒のデータを使って...</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Link
            href={`/shoken?studentId=${student.id}`}
            className="bg-white rounded-lg border border-primary-200 p-3 hover:bg-primary-50 hover:border-primary-400 transition-colors flex items-center gap-3"
          >
            <FileText className="w-5 h-5 text-primary-600 shrink-0" />
            <div>
              <span className="text-sm font-medium text-gray-800 block whitespace-nowrap">所見を書く</span>
              <span className="text-[11px] text-gray-500">3パターン自動生成</span>
            </div>
          </Link>
          <Link
            href={`/meeting-prep?studentId=${student.id}`}
            className="bg-white rounded-lg border border-primary-200 p-3 hover:bg-primary-50 hover:border-primary-400 transition-colors flex items-center gap-3"
          >
            <UserCheck className="w-5 h-5 text-primary-600 shrink-0" />
            <div>
              <span className="text-sm font-medium text-gray-800 block whitespace-nowrap">面談準備</span>
              <span className="text-[11px] text-gray-500">論点・質問案を生成</span>
            </div>
          </Link>
          <Link
            href={`/documents?type=absence_reply&studentName=${encodeURIComponent(student.name)}&className=${student.grade}年${student.class}組`}
            className="bg-white rounded-lg border border-primary-200 p-3 hover:bg-primary-50 hover:border-primary-400 transition-colors flex items-center gap-3"
          >
            <Mail className="w-5 h-5 text-primary-600 shrink-0" />
            <div>
              <span className="text-sm font-medium text-gray-800 block whitespace-nowrap">保護者に連絡</span>
              <span className="text-[11px] text-gray-500">欠席返信・通知文を生成</span>
            </div>
          </Link>
          <Link
            href={`/risk?studentId=${student.id}&action=analyze`}
            className="bg-white rounded-lg border border-primary-200 p-3 hover:bg-primary-50 hover:border-primary-400 transition-colors flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="text-sm font-medium text-gray-800 block whitespace-nowrap">詳しく分析</span>
              <span className="text-[11px] text-gray-500">リスク評価・対応提案</span>
            </div>
          </Link>
        </div>
      </div>

      {/* セクション1: 出欠状況 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">出欠状況<span className="text-[10px] text-gray-400 font-normal ml-2">📊 校務支援システム（出欠管理）</span></h2>

        <div className="space-y-2 mb-4">
          {student.attendance.map(m => {
            const total = m.present + m.absent;
            const presentPct = Math.round((m.present / total) * 100);
            const absentPct = Math.round((m.absent / total) * 100);
            const latePct = Math.min(Math.round((m.late / total) * 100), 100 - presentPct - absentPct);

            return (
              <div key={m.month} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-gray-500 shrink-0">{MONTH_LABELS[m.month]}</span>
                <div className="flex flex-1 h-4 rounded-sm overflow-hidden bg-gray-100">
                  {presentPct > 0 && (
                    <div
                      className="bg-emerald-400 h-full"
                      style={{ width: `${presentPct}%` }}
                      title={`出席 ${m.present}日`}
                    />
                  )}
                  {absentPct > 0 && (
                    <div
                      className="bg-red-400 h-full"
                      style={{ width: `${absentPct}%` }}
                      title={`欠席 ${m.absent}日`}
                    />
                  )}
                  {latePct > 0 && (
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${latePct}%` }}
                      title={`遅刻 ${m.late}回`}
                    />
                  )}
                </div>
                <span className="text-gray-400 shrink-0 w-24 text-right">
                  出{m.present} 欠{m.absent} 遅{m.late}
                </span>
              </div>
            );
          })}
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />出席</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />欠席</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />遅刻</span>
        </div>

        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-center">
          <div>
            <p className="text-lg font-bold text-emerald-600">{totalPresent}</p>
            <p className="text-xs text-gray-500">出席日数</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{totalAbsent}</p>
            <p className="text-xs text-gray-500">欠席日数</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{totalLate}</p>
            <p className="text-xs text-gray-500">遅刻回数</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-600">{totalEarlyLeave}</p>
            <p className="text-xs text-gray-500">早退回数</p>
          </div>
        </div>
      </div>

      {/* セクション2: 成績一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">成績一覧<span className="text-[10px] text-gray-400 font-normal ml-2">📊 校務支援システム（成績管理）</span></h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-3 py-2 font-medium rounded-tl-md">教科</th>
              <th className="text-right px-3 py-2 font-medium">点数</th>
              <th className="text-center px-3 py-2 font-medium rounded-tr-md">評定</th>
            </tr>
          </thead>
          <tbody>
            {student.grades.map((g, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-700">{g.subject}</td>
                <td className="px-3 py-2 text-right text-gray-800 font-medium">{g.score}点</td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${GRADE_COLOR[g.grade]}`}>
                    {g.grade}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-3 py-2 font-semibold text-gray-700">平均</td>
              <td className="px-3 py-2 text-right font-bold text-gray-900">{avgScore}点</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* セクション3: 活動・メモ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-3">活動・担任メモ<span className="text-[10px] text-gray-400 font-normal ml-2">📝 教員入力</span></h2>
        {student.activities.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {student.activities.map((act, i) => (
              <span key={i} className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full">
                {act}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mb-4">活動登録なし</p>
        )}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1 font-medium">担任メモ</p>
          <p className="text-sm text-gray-700 leading-relaxed">{student.notes}</p>
        </div>
      </div>

      {/* セクション4: 観察メモ */}
      <ObservationTimeline studentId={student.id} />

    </div>
  );
}
