import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(request: Request) {
  try {
    const { text, studentNames } = await request.json() as {
      text: string;
      studentNames: { id: string; name: string; class: string }[];
    };

    if (!text?.trim()) {
      return NextResponse.json({ error: 'テキストが必要です' }, { status: 400 });
    }

    const nameList = studentNames.map(s => `${s.name}（${s.class}）`).join('、');

    const prompt = `あなたは学校の教務支援AIです。教師が書いた観察メモのテキストを解析し、生徒ごとの記録に振り分けてください。

## クラスの生徒一覧
${nameList}

## 教師の入力テキスト
${text}

## ルール
- テキストから生徒名（姓のみの場合も含む）を特定し、該当する正式名に紐付ける
- 各記録にカテゴリを付与: 学習 / 対人 / 生活 / ポジティブ
- 生徒名が特定できない記述は除外してよい
- 1つの文に複数の生徒が含まれる場合は分割する

## 出力形式
\`\`\`json
{
  "observations": [
    { "studentName": "正式な生徒名", "category": "カテゴリ", "content": "整理された記録内容" }
  ]
}
\`\`\``;

    const { text: rawText } = await generateText({
      model: anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514'),
      maxOutputTokens: 2048,
      prompt,
    });

    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AIレスポンスのパースに失敗しました' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[1].trim());
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('parse-observations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}
