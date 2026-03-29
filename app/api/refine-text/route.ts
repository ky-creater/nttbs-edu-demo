import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { currentText, instruction } = await request.json();

    if (!currentText || !instruction) {
      return NextResponse.json({ error: 'currentText and instruction are required' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `以下の文書を、指示に従って修正してください。

## 現在の文書
${currentText}

## 修正指示
${instruction}

## ルール
- 修正指示に従って文書を修正してください
- 文書全体の整合性を保ってください
- 修正箇所以外は極力変更しないでください
- 修正後の文書のみを出力してください（説明や前置きは不要）`,
      }],
    });

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error('refine-text error:', error);
    return NextResponse.json({ error: '修正中にエラーが発生しました。' }, { status: 500 });
  }
}
