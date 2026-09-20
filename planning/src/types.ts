export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface StudentMeta {
  course: string;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  photoUrl?: string;
}

export interface Student {
  id: number;
  number: number;
  name: string;
  notes: string;
  meta: StudentMeta;
  state: 'open' | 'closed';
}

export interface LessonMeta {
  studentNumber: number;
  start: string;
  end: string;
}

export interface Lesson {
  id: number;
  number: number;
  title: string;
  notes: string;
  meta: LessonMeta;
  state: 'open' | 'closed';
}

export interface AppConfig {
  owner: string;
  repo: string;
  token: string;
  demoMode: boolean;
}

export interface CreateStudentInput {
  name: string;
  notes: string;
  meta: StudentMeta;
}

export interface UpdateStudentInput extends CreateStudentInput {
  number: number;
}

export interface CreateLessonInput {
  title: string;
  notes: string;
  meta: LessonMeta;
}

export interface UpdateLessonInput extends CreateLessonInput {
  number: number;
}

export interface PlanningApi {
  listStudents(): Promise<Student[]>;
  createStudent(input: CreateStudentInput): Promise<Student>;
  updateStudent(input: UpdateStudentInput): Promise<Student>;
  deleteStudent(number: number): Promise<void>;
  uploadStudentPhoto(studentNumber: number, file: File): Promise<string>;

  listLessons(): Promise<Lesson[]>;
  createLesson(input: CreateLessonInput): Promise<Lesson>;
  updateLesson(input: UpdateLessonInput): Promise<Lesson>;
  deleteLesson(number: number): Promise<void>;
}
