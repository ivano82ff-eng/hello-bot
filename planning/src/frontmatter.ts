import type { LessonMeta, PaymentStatus, StudentMeta } from './types';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?([\s\S]*)$/;

function parseYamlBlock(block: string): Record<string, string | number | boolean> {
  const data: Record<string, string | number | boolean> = {};
  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][\w-]*)\s*:\s*(.+)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim();
    if (value === 'true') data[key] = true;
    else if (value === 'false') data[key] = false;
    else if (/^-?\d+(\.\d+)?$/.test(value)) data[key] = Number(value);
    else data[key] = value.replace(/^['"]|['"]$/g, '');
  }
  return data;
}

function tryJsonBlock(block: string): Record<string, unknown> | null {
  try {
    return JSON.parse(block) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseIssueBody(body: string | null | undefined): {
  fields: Record<string, string | number | boolean>;
  notes: string;
} {
  const text = (body ?? '').trim();
  if (!text) return { fields: {}, notes: '' };
  const match = text.match(FRONTMATTER_RE);
  if (!match) return { fields: {}, notes: text };
  const [, frontmatter, rest] = match;
  const yaml = parseYamlBlock(frontmatter);
  if (Object.keys(yaml).length) return { fields: yaml, notes: rest.trim() };
  const json = tryJsonBlock(frontmatter);
  const fields: Record<string, string | number | boolean> = {};
  if (json) {
    for (const [key, value] of Object.entries(json)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        fields[key] = value;
      }
    }
  }
  return { fields, notes: rest.trim() };
}

export function serializeIssueBody(
  fields: Record<string, string | number | boolean | undefined>,
  notes: string,
): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    lines.push(`${key}: ${value}`);
  }
  lines.push('---');
  if (notes.trim()) lines.push('', notes.trim());
  return lines.join('\n');
}

export function parseStudentBody(body: string | null | undefined): {
  meta: StudentMeta | null;
  notes: string;
} {
  const { fields, notes } = parseIssueBody(body);
  if (!fields.course) return { meta: null, notes };
  const status = String(fields.paymentStatus ?? 'unpaid') as PaymentStatus;
  return {
    meta: {
      course: String(fields.course),
      paymentStatus: status === 'paid' || status === 'partial' ? status : 'unpaid',
      paymentAmount: Number(fields.paymentAmount ?? 0),
      photoUrl: fields.photoUrl ? String(fields.photoUrl) : undefined,
    },
    notes,
  };
}

export function serializeStudentBody(meta: StudentMeta, notes: string): string {
  return serializeIssueBody(
    {
      course: meta.course,
      paymentStatus: meta.paymentStatus,
      paymentAmount: meta.paymentAmount,
      photoUrl: meta.photoUrl,
    },
    notes,
  );
}

export function parseLessonBody(body: string | null | undefined): {
  meta: LessonMeta | null;
  notes: string;
} {
  const { fields, notes } = parseIssueBody(body);
  if (!fields.start || !fields.end || !fields.studentNumber) return { meta: null, notes };
  return {
    meta: {
      studentNumber: Number(fields.studentNumber),
      start: String(fields.start),
      end: String(fields.end),
    },
    notes,
  };
}

export function serializeLessonBody(meta: LessonMeta, notes: string): string {
  return serializeIssueBody(
    {
      studentNumber: meta.studentNumber,
      start: meta.start,
      end: meta.end,
    },
    notes,
  );
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function lessonOnDay(meta: LessonMeta, day: Date): boolean {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const start = new Date(meta.start);
  const end = new Date(meta.end);
  return start <= dayEnd && end >= dayStart;
}

export function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function fromDateInputValue(value: string): string {
  return new Date(value).toISOString();
}
