import type { Lesson, Student, StudentMeta } from './types';

const TAG_COLORS = ['#4f8cff', '#3ecf8e', '#ffb347', '#c77dff', '#ff6b7a', '#5cc8ff'];

export function parseCoursesField(fields: Record<string, string | number | boolean>): string[] {
  const raw = fields.courses;
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // ignore invalid JSON
    }
  }
  if (fields.course) return [String(fields.course).trim()].filter(Boolean);
  return [];
}

export function studentCourses(student: Student | undefined): string[] {
  if (!student) return [];
  if (student.meta.courses?.length) return [...student.meta.courses];
  if (student.meta.course) return [student.meta.course];
  return [];
}

export function normalizeStudentMeta(meta: StudentMeta): StudentMeta {
  const courses =
    meta.courses?.length ? [...meta.courses] : meta.course ? [meta.course] : [];
  const course = courses[0] ?? meta.course ?? '';
  return { ...meta, courses, course };
}

export function formatCoursesList(courses: string[]): string {
  return courses.join(' · ');
}

export function courseShortTag(course: string): string {
  const trimmed = course.trim();
  if (!trimmed) return '—';
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 4);
  return words
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 4);
}

export function courseAccentColor(course: string, courses: string[]): string {
  const index = courses.indexOf(course);
  const seed = index >= 0 ? index : course.length;
  return TAG_COLORS[seed % TAG_COLORS.length];
}

export function lessonCourseName(lesson: Lesson, student: Student | undefined): string {
  if (lesson.meta.course) return lesson.meta.course;
  return studentCourses(student)[0] ?? '';
}

export function serializeCoursesYaml(courses: string[]): string {
  return JSON.stringify(courses);
}
