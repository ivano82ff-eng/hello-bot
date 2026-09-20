import type { Lesson, LessonMeta } from './types';

export interface OverlapPair {
  a: number;
  b: number;
}

export function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && startB < endA;
}

export function lessonMetaOverlaps(a: LessonMeta, b: LessonMeta): boolean {
  return rangesOverlap(new Date(a.start), new Date(a.end), new Date(b.start), new Date(b.end));
}

export function findOverlappingLesson(
  candidate: LessonMeta,
  lessons: Lesson[],
  excludeNumber?: number,
): Lesson | null {
  for (const lesson of lessons) {
    if (lesson.state !== 'open') continue;
    if (excludeNumber && lesson.number === excludeNumber) continue;
    if (lessonMetaOverlaps(candidate, lesson.meta)) return lesson;
  }
  return null;
}

export function findAllOverlapPairs(lessons: Lesson[]): OverlapPair[] {
  const open = lessons.filter((lesson) => lesson.state === 'open');
  const pairs: OverlapPair[] = [];
  for (let i = 0; i < open.length; i++) {
    for (let j = i + 1; j < open.length; j++) {
      if (lessonMetaOverlaps(open[i].meta, open[j].meta)) {
        pairs.push({ a: open[i].number, b: open[j].number });
      }
    }
  }
  return pairs;
}

export function overlappingLessonNumbers(lessons: Lesson[]): Set<number> {
  const numbers = new Set<number>();
  for (const pair of findAllOverlapPairs(lessons)) {
    numbers.add(pair.a);
    numbers.add(pair.b);
  }
  return numbers;
}
