import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(request: NextRequest) {
  try {
    const { currentText, instruction } = await request.json();

    if (!currentText || !instruction) {
      return NextResponse.json({ error: 'currentText and instruction are required' }, { status: 400 });
    }

    const { text } = await generateText({
      model: anthropic(process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'),
      maxOutputTokens: 2048,
      prompt: `以下の文書を、指示に従って修正してください。

## 現在の文書
${currentText}

## 修正指示
${instruction}

## ルール
- 修正指示に従って文書を修正してください
- 文書全体の整合性を保ってください
- 修正箇所以外は極力変更しないでください
- 修正後の文書のみを出力してください（説明や前置きは不要）`,
    });

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error('refine-text error:', error);
    return NextResponse.json({ error: '修正中にエラーが発生しました。' }, { status: 500 });
  }
}
