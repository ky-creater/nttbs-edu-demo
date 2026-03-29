import { Student, DocumentType, Tone } from './types';

export function buildShokenPrompt(student: Student, semester: number): string {
  const gradesSummary = student.grades.map(g => `${g.subject}: ${g.score}点(${g.grade})`).join('、');
  const attendanceSummary = student.attendance
    .filter(a => {
      if (semester === 1) return [4, 5, 6, 7].includes(a.month);
      if (semester === 2) return [9, 10, 11, 12].includes(a.month);
      return [1, 2, 3].includes(a.month);
    })
    .map(a => `${a.month}月: 出席${a.present}日/欠席${a.absent}日/遅刻${a.late}回`)
    .join('、');

  return `あなたは公立中学校の教師です。以下の生徒情報をもとに、通知表の所見を3パターン作成してください。

## 生徒情報
- 氏名: ${student.name}
- ${student.grade}年${student.class}組${student.number}番（${student.gender}）
- 活動: ${student.activities.length ? student.activities.join('、') : '特になし'}
- 担任メモ: ${student.notes}

## 成績（${semester}学期）
${gradesSummary}

## 出欠状況（${semester}学期）
${attendanceSummary}

## 出力形式
以下のJSON形式で出力してください。各パターンは200-300文字程度で、温かみのある文体にしてください。
具体的なエピソードや成長のポイントを盛り込んでください。

\`\`\`json
{
  "variants": [
    "パターン1の所見文",
    "パターン2の所見文",
    "パターン3の所見文"
  ]
}
\`\`\``;
}

const documentTypeLabels: Record<DocumentType, string> = {
  class_newsletter: '学級通信',
  parent_notice: '保護者向け通知文',
  complaint_response: '保護者ご相談への回答文',
  meeting_memo: '面談メモ',
  guidance_record: '指導記録',
  board_report: '教育委員会報告書',
  recommendation: '推薦状・調査書',
  absence_reply: '欠席連絡への返信',
  event_speech: '行事挨拶文',
  training_report: '研修報告',
};

const toneLabels: Record<Tone, string> = {
  formal: 'フォーマル（公式文書向け）',
  friendly: '親しみやすい（保護者との信頼関係を重視）',
  concise: '簡潔（要点を明確に）',
};

export function buildDocumentPrompt(type: DocumentType, context: string, tone: Tone, grade?: number, className?: string): string {
  const classInfo = grade && className ? `${grade}年${className}組` : '';

  return `あなたは公立中学校の教師です。以下の条件で${documentTypeLabels[type]}を作成してください。

## 文書タイプ
${documentTypeLabels[type]}

## 対象
${classInfo || '（学校全体）'}

## 状況・コンテキスト
${context}

## 文体
${toneLabels[tone]}

## 注意事項
- 実際の学校現場で使えるリアルな文書を作成
- 個人情報を含めず、汎用的に使える内容に
- 適切な敬語・丁寧語を使用
- 文書の目的が明確に伝わるように

## 出力形式
以下のJSON形式で出力してください。
\`\`\`json
{
  "content": "文書の本文全体"
}
\`\`\``;
}

export function buildRiskAnalysisPrompt(student: Student, observationNotes?: string): string {
  const recentAttendance = student.attendance.slice(-3);
  const attendanceDetail = recentAttendance
    .map(a => `${a.month}月: 欠席${a.absent}日/遅刻${a.late}回/早退${a.earlyLeave}回`)
    .join('\n');

  return `あなたは不登校対策の専門家です。以下の生徒データを分析し、リスク評価と対応提案を行ってください。

## 生徒情報
- 氏名: ${student.name}
- ${student.grade}年${student.class}組（${student.gender}）
- 活動: ${student.activities.length ? student.activities.join('、') : '参加なし'}
- 教師メモ: ${student.notes}

## 直近3ヶ月の出欠状況
${attendanceDetail}

## 成績概要
${student.grades.map(g => `${g.subject}: ${g.score}点`).join('、')}

## 担任の観察メモ（時系列）
${observationNotes || 'なし'}

## 出力形式
以下のJSON形式で分析結果を出力してください。
\`\`\`json
{
  "riskFactors": ["リスク要因1", "リスク要因2"],
  "protectiveFactors": ["保護要因1", "保護要因2"],
  "immediateActions": ["今すぐやるべきこと1", "今すぐやるべきこと2"],
  "mediumTermPlan": "中期的な支援計画（100-200文字）",
  "stakeholders": ["連携すべき関係者1", "連携すべき関係者2"]
}
\`\`\``;
}
