export const GRID_START_HOUR = 8;
export const GRID_END_HOUR = 22;
export const GRID_SNAP_MINUTES = 15;

export function gridSlotCount(): number {
  return GRID_END_HOUR - GRID_START_HOUR;
}

export function gridLabelCount(): number {
  return gridSlotCount() + 1;
}

export function gridTotalMinutes(): number {
  return (GRID_END_HOUR - GRID_START_HOUR) * 60;
}

export function gridStartMinutes(): number {
  return GRID_START_HOUR * 60;
}

export function snapMinuteOfDay(minutes: number): number {
  return Math.round(minutes / GRID_SNAP_MINUTES) * GRID_SNAP_MINUTES;
}

export function minuteFromCanvasY(clientY: number, canvas: HTMLElement): number {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  const raw = gridStartMinutes() + ratio * gridTotalMinutes();
  return snapMinuteOfDay(raw);
}

export function topPercentFromMinute(minuteOfDay: number): number {
  return ((minuteOfDay - gridStartMinutes()) / gridTotalMinutes()) * 100;
}

export function minuteFromTopPercent(topPercent: number): number {
  return gridStartMinutes() + (topPercent / 100) * gridTotalMinutes();
}

export function clampLessonStartMinute(startMin: number, durationMs: number): number {
  const durationMin = durationMs / 60_000;
  const gridStart = gridStartMinutes();
  const gridEnd = GRID_END_HOUR * 60;
  let clamped = snapMinuteOfDay(startMin);
  if (clamped < gridStart) clamped = gridStart;
  if (clamped + durationMin > gridEnd) clamped = gridEnd - durationMin;
  return Math.max(gridStart, clamped);
}

export function datesFromStartMinute(
  day: Date,
  startMin: number,
  durationMs: number,
): { start: Date; end: Date } {
  const clamped = clampLessonStartMinute(startMin, durationMs);
  const start = new Date(day);
  start.setHours(Math.floor(clamped / 60), clamped % 60, 0, 0);
  const end = new Date(start.getTime() + durationMs);
  return { start, end };
}

export function maxTopPercent(durationMs: number): number {
  const durationMin = durationMs / 60_000;
  const lastStart = GRID_END_HOUR * 60 - durationMin;
  return topPercentFromMinute(lastStart);
}
