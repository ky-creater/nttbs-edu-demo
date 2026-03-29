export interface Student {
  id: string;
  name: string;
  grade: number;
  class: number;
  number: number;
  gender: '男' | '女';
  attendance: MonthlyAttendance[];
  grades: SubjectGrade[];
  activities: string[];
  notes: string;
  riskScore?: number;
}

export interface MonthlyAttendance {
  month: number;
  present: number;
  absent: number;
  late: number;
  earlyLeave: number;
}

export interface SubjectGrade {
  subject: string;
  score: number;
  grade: 'A' | 'B' | 'C';
  comment?: string;
}

export type DocumentType = 'class_newsletter' | 'parent_notice' | 'complaint_response' | 'meeting_memo';

export type Tone = 'formal' | 'friendly' | 'concise';

export interface ShokenRequest {
  studentId: string;
  semester: 1 | 2 | 3;
}

export interface DocumentRequest {
  documentType: DocumentType;
  context: string;
  tone: Tone;
  grade?: number;
  className?: string;
}

export interface RiskAnalysisRequest {
  studentId: string;
}

export interface GenerationResult {
  content: string;
  variants?: string[];
}

export type RiskLevel = 'high' | 'medium' | 'low';
