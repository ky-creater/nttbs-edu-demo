import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { mockStudents } from '@/data/mock-students';
import { buildShokenPrompt } from '@/lib/prompts';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, semester, pastNotes } = body as { studentId: string; semester: 1 | 2 | 3; pastNotes?: string };

    if (!studentId || !semester) {
      return NextResponse.json(
        { error: 'studentId と semester は必須です' },
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

    let prompt = buildShokenPrompt(student, semester);
    if (pastNotes) {
      prompt += `\n\n## 過去の所見・担任メモ\n${pastNotes}\n\n上記の過去情報を踏まえ、前回からの成長や変化が伝わるように所見を作成してください。同じ表現の繰り返しを避けてください。`;
    }

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('');

    // ```json ... ``` ブロックを抽出
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'AIレスポンスのパースに失敗しました' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[1].trim()) as { variants: string[] };

    if (!Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      return NextResponse.json(
        { error: 'variants が見つかりませんでした' },
        { status: 500 }
      );
    }

    return NextResponse.json({ variants: parsed.variants });
  } catch (error) {
    console.error('generate-shoken error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}
