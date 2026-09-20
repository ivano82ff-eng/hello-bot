import type { Lesson, Student } from './types';

const REMINDER_MINUTES = 15;
const CHECK_INTERVAL_MS = 60_000;
const notified = new Set<number>();

export function startLessonReminders(
  getLessons: () => Lesson[],
  getStudents: () => Student[],
): () => void {
  if (!('Notification' in window)) return () => undefined;

  const tick = () => {
    if (document.hidden) return;
    if (Notification.permission !== 'granted') return;
    const now = Date.now();
    const soon = REMINDER_MINUTES * 60_000;
    for (const lesson of getLessons()) {
      if (lesson.state !== 'open' || notified.has(lesson.number)) continue;
      const start = new Date(lesson.meta.start).getTime();
      const delta = start - now;
      if (delta > 0 && delta <= soon) {
        const student = getStudents().find((item) => item.number === lesson.meta.studentNumber);
        new Notification('Скоро занятие', {
          body: `${student?.name ?? 'Ученик'} — ${formatTime(lesson.meta.start)}`,
          tag: `lesson-${lesson.number}`,
        });
        notified.add(lesson.number);
      }
    }
  };

  const interval = window.setInterval(tick, CHECK_INTERVAL_MS);
  tick();
  return () => window.clearInterval(interval);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
