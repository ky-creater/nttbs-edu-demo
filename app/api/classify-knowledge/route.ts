import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { files } = await request.json() as {
      files: { fileName: string; content: string }[];
    };

    if (!files?.length) {
      return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 });
    }

    const fileList = files.map((f, i) => `[ファイル${i + 1}] ${f.fileName}\n${f.content.slice(0, 500)}${f.content.length > 500 ? '...' : ''}`).join('\n\n');

    const prompt = `あなたは学校の教務支援AIです。アップロードされた文書を以下の4カテゴリに分類してください。

## カテゴリ
- template: 書式・テンプレート（通知文・通信・報告書のひな形）
- past_document: 過去の文書（昨年度の学級通信・報告書など実例）
- school_info: 学校・クラス情報（校則・年間行事・クラス目標など）
- handover: 引き継ぎ・申し送り（前任からのメモ・要注意事項）

## アップロードされたファイル
${fileList}

## 出力形式
\`\`\`json
{
  "classifications": [
    { "fileName": "ファイル名", "category": "カテゴリID" }
  ]
}
\`\`\``;

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('');

    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AIレスポンスのパースに失敗しました' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[1].trim());
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('classify-knowledge error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '内部エラーが発生しました' },
      { status: 500 }
    );
  }
}
