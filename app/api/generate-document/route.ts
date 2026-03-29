import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildDocumentPrompt } from '@/lib/prompts';
import type { DocumentType, Tone } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType, context, tone, grade, className }: {
      documentType: DocumentType;
      context: string;
      tone: Tone;
      grade?: number;
      className?: string;
    } = body;

    const prompt = buildDocumentPrompt(documentType, context, tone, grade, className);

    const { text } = await generateText({
      model: anthropic(process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'),
      prompt,
      maxOutputTokens: 2048,
    });

    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'レスポンスのパースに失敗しました。' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[1].trim());
    return NextResponse.json({ content: parsed.content as string });
  } catch (error) {
    console.error('generate-document error:', error);
    return NextResponse.json({ error: '文書の生成中にエラーが発生しました。' }, { status: 500 });
  }
}
