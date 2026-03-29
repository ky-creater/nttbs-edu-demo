import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
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

    const { text } = await generateText({
      model: anthropic(process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'),
      maxOutputTokens: 1024,
      prompt,
    });

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
