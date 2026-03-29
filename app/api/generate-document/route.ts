import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildDocumentPrompt } from '@/lib/prompts';
import type { DocumentType, Tone } from '@/lib/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      documentType,
      context,
      tone,
      grade,
      className,
    }: {
      documentType: DocumentType;
      context: string;
      tone: Tone;
      grade?: number;
      className?: string;
    } = body;

    const prompt = buildDocumentPrompt(documentType, context, tone, grade, className);

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'レスポンスのパースに失敗しました。' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[1].trim());

    return NextResponse.json({ content: parsed.content as string });
  } catch (error) {
    console.error('generate-document error:', error);
    return NextResponse.json(
      { error: '文書の生成中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
