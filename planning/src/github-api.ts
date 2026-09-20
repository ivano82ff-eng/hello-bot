import {
  parseLessonBody,
  parseStudentBody,
  serializeLessonBody,
  serializeStudentBody,
} from './frontmatter';
import type {
  CreateLessonInput,
  CreateStudentInput,
  Lesson,
  PlanningApi,
  Student,
  UpdateLessonInput,
  UpdateStudentInput,
} from './types';

const STUDENT_LABEL = 'student';
const LESSON_LABEL = 'lesson';

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: Array<{ name: string }>;
}

interface ContentsResponse {
  sha: string;
}

export class GitHubPlanningApi implements PlanningApi {
  private readonly owner: string;
  private readonly repo: string;
  private readonly token: string;

  constructor(owner: string, repo: string, token: string) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
  }

  async listStudents(): Promise<Student[]> {
    const issues = await this.listIssues(STUDENT_LABEL);
    return issues
      .map((issue) => this.toStudent(issue))
      .filter((student) => student.meta !== null) as Student[];
  }

  async createStudent(input: CreateStudentInput): Promise<Student> {
    const issue = await this.request<GitHubIssue>(`/repos/${this.owner}/${this.repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title: input.name,
        body: serializeStudentBody(input.meta, input.notes),
        labels: [STUDENT_LABEL],
      }),
    });
    const student = this.toStudent(issue);
    if (!student.meta) throw new Error('Не удалось разобрать карточку ученика');
    return student as Student;
  }

  async updateStudent(input: UpdateStudentInput): Promise<Student> {
    const issue = await this.request<GitHubIssue>(
      `/repos/${this.owner}/${this.repo}/issues/${input.number}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          title: input.name,
          body: serializeStudentBody(input.meta, input.notes),
        }),
      },
    );
    const student = this.toStudent(issue);
    if (!student.meta) throw new Error('Не удалось разобрать карточку ученика');
    return student as Student;
  }

  async deleteStudent(number: number): Promise<void> {
    await this.closeIssue(number);
  }

  async uploadStudentPhoto(studentNumber: number, file: File): Promise<string> {
    const path = `students/${studentNumber}-${Date.now()}.${extension(file.name)}`;
    const content = await fileToBase64(file);
    const existing = await this.getFileSha(path);
    await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Фото ученика #${studentNumber}`,
        content,
        ...(existing ? { sha: existing } : {}),
      }),
    });
    return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/${path}`;
  }

  async listLessons(): Promise<Lesson[]> {
    const issues = await this.listIssues(LESSON_LABEL);
    return issues
      .map((issue) => this.toLesson(issue))
      .filter((lesson) => lesson.meta !== null) as Lesson[];
  }

  async createLesson(input: CreateLessonInput): Promise<Lesson> {
    const issue = await this.request<GitHubIssue>(`/repos/${this.owner}/${this.repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        body: serializeLessonBody(input.meta, input.notes),
        labels: [LESSON_LABEL],
      }),
    });
    const lesson = this.toLesson(issue);
    if (!lesson.meta) throw new Error('Не удалось разобрать занятие');
    return lesson as Lesson;
  }

  async updateLesson(input: UpdateLessonInput): Promise<Lesson> {
    const issue = await this.request<GitHubIssue>(
      `/repos/${this.owner}/${this.repo}/issues/${input.number}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          title: input.title,
          body: serializeLessonBody(input.meta, input.notes),
        }),
      },
    );
    const lesson = this.toLesson(issue);
    if (!lesson.meta) throw new Error('Не удалось разобрать занятие');
    return lesson as Lesson;
  }

  async deleteLesson(number: number): Promise<void> {
    await this.closeIssue(number);
  }

  private async listIssues(label: string): Promise<GitHubIssue[]> {
    const issues = await this.request<GitHubIssue[]>(
      `/repos/${this.owner}/${this.repo}/issues?state=all&per_page=100&labels=${label}`,
    );
    return issues.filter((issue) => !issue.labels.some((item) => item.name === 'pull_request'));
  }

  private async closeIssue(number: number): Promise<void> {
    await this.request(`/repos/${this.owner}/${this.repo}/issues/${number}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed' }),
    });
  }

  private async getFileSha(path: string): Promise<string | null> {
    try {
      const response = await this.request<ContentsResponse>(
        `/repos/${this.owner}/${this.repo}/contents/${path}`,
      );
      return response.sha;
    } catch {
      return null;
    }
  }

  private toStudent(issue: GitHubIssue): Omit<Student, 'meta'> & { meta: Student['meta'] | null } {
    const { meta, notes } = parseStudentBody(issue.body);
    return {
      id: issue.id,
      number: issue.number,
      name: issue.title,
      notes,
      meta,
      state: issue.state,
    };
  }

  private toLesson(issue: GitHubIssue): Omit<Lesson, 'meta'> & { meta: Lesson['meta'] | null } {
    const { meta, notes } = parseLessonBody(issue.body);
    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      notes,
      meta,
      state: issue.state,
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      let message = `GitHub API ${response.status}`;
      try {
        const json = JSON.parse(text) as { message?: string };
        if (json.message) message = json.message;
      } catch {
        if (text) message = text;
      }
      throw new Error(message);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}

function extension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.at(-1)!.toLowerCase() : 'jpg';
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
