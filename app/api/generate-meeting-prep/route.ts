import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { mockStudents } from '@/data/mock-students';

const meetingTypeLabels: Record<string, string> = {
  regular: '定期面談（学期末の通常面談）',
  concern: '気になる点の共有（成績低下・欠席増加等）',
  incident: '個別対応（トラブル・いじめ等の緊急対応）',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, meetingType, additionalNotes, observationNotes } = body as {
      studentId: string;
      meetingType: 'regular' | 'concern' | 'incident';
      additionalNotes?: string;
      observationNotes?: string;
    };

    if (!studentId || !meetingType) {
      return NextResponse.json(
        { error: 'studentId と meetingType は必須です' },
        { status: 400 }
      );
    }

    const student = mockStudents.find(s => s.id === studentId);
    if (!student) {
      return NextResponse.json(
        { error: `生徒が見つかりません: ${studentId}` },
        { status: 404 }
      );
    }

    const gradesText = student.grades
      .map(g => `${g.subject}: ${g.score}点（評定${g.grade}）`)
      .join('\n');

    // 直近3ヶ月の出欠
    const recentAttendance = student.attendance.slice(-3);
    const attendanceText = recentAttendance
      .map(a => `${a.month}月: 欠席${a.absent}日・遅刻${a.late}回`)
      .join('\n');

    const activitiesText = student.activities.length > 0
      ? student.activities.join('、')
      : 'なし';

    const prompt = `あなたは教育現場に精通したスクールカウンセラーです。以下の生徒情報をもとに、保護者面談の準備シートを作成してください。

## 生徒情報
- 氏名: ${student.name}
- ${student.grade}年${student.class}組${student.number}番（${student.gender}）
- 活動: ${activitiesText}
- 担任メモ: ${student.notes}

## 成績
${gradesText}

## 出欠状況（直近3ヶ月）
${attendanceText}

## 面談種別
${meetingTypeLabels[meetingType] ?? meetingType}

## 担任の観察メモ（時系列）
${observationNotes || 'なし'}

## 追加メモ（教員入力）
${additionalNotes || 'なし'}

## 出力形式
以下のJSON形式で出力してください。
\`\`\`json
{
  "summary": "生徒の現状を2-3文で要約",
  "talkingPoints": [
    { "topic": "論点タイトル", "detail": "具体的に何を話すか", "priority": "high/medium/low" }
  ],
  "questionsForParent": ["質問1", "質問2", "質問3"],
  "positivePoints": ["良い点1", "良い点2"],
  "cautions": ["注意事項1", "注意事項2"],
  "nextActions": ["アクション1", "アクション2"]
}
\`\`\`
`;

    const { text: rawText } = await generateText({
      model: anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514'),
      maxOutputTokens: 2048,
      prompt,
    });

    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'AIレスポンスのパースに失敗しました' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[1].trim());

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('generate-meeting-prep error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}
