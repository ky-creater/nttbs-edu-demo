import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { mockStudents } from '@/data/mock-students';
import { buildRiskAnalysisPrompt } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const { studentId, observationNotes } = await req.json() as { studentId: string; observationNotes?: string };

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const student = mockStudents.find(s => s.id === studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const prompt = buildRiskAnalysisPrompt(student, observationNotes);

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    const text = rawContent.text;

    // Extract JSON from ```json ... ``` block
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error('JSON block not found in AI response');
    }

    const analysis = JSON.parse(jsonMatch[1].trim());

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Risk analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
