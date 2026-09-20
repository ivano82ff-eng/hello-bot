import type { Lesson, PaymentStatus, Student } from './types';

export interface PaymentSummary {
  totalLessons: number;
  completedLessons: number;
  lessonPrice: number;
  dueNow: number;
  paid: number;
  remainder: number;
  overpayment: number;
}

export function isLessonPast(endIso: string): boolean {
  return new Date(endIso) < new Date();
}

export function defaultLessonCompleted(lesson: Lesson): boolean {
  if (lesson.meta.completed !== undefined) return lesson.meta.completed;
  return isLessonPast(lesson.meta.end);
}

export function lessonsForStudent(studentNumber: number, lessons: Lesson[]): Lesson[] {
  return lessons
    .filter((lesson) => lesson.state === 'open' && lesson.meta.studentNumber === studentNumber)
    .sort((a, b) => new Date(a.meta.start).getTime() - new Date(b.meta.start).getTime());
}

export function computePaymentSummary(
  student: Student,
  lessons: Lesson[],
  completedByLesson?: ReadonlyMap<number, boolean>,
): PaymentSummary {
  const studentLessons = lessonsForStudent(student.number, lessons);
  const completedLessons = studentLessons.filter((lesson) => {
    const override = completedByLesson?.get(lesson.number);
    if (override !== undefined) return override;
    return defaultLessonCompleted(lesson);
  }).length;
  const lessonPrice = student.meta.lessonPrice ?? 0;
  const dueNow = completedLessons * lessonPrice;
  const paid = student.meta.paymentAmount ?? 0;
  return {
    totalLessons: studentLessons.length,
    completedLessons,
    lessonPrice,
    dueNow,
    paid,
    remainder: Math.max(0, dueNow - paid),
    overpayment: Math.max(0, paid - dueNow),
  };
}

export function derivePaymentStatus(summary: PaymentSummary): PaymentStatus {
  if (summary.dueNow === 0) return summary.paid > 0 ? 'paid' : 'unpaid';
  if (summary.remainder <= 0) return 'paid';
  if (summary.paid > 0) return 'partial';
  return 'unpaid';
}

export function normalizeTel(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}
