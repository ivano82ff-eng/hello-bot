import type {
  CreateLessonInput,
  CreateStudentInput,
  Lesson,
  PlanningApi,
  Student,
  UpdateLessonInput,
  UpdateStudentInput,
} from './types';

let mockStudents: Student[] | null = null;
let mockLessons: Lesson[] | null = null;
let mockNextStudent = 100;
let mockNextLesson = 200;

function todayAt(hour: number, minute = 0): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function seedStudents(): Student[] {
  return [
    {
      id: 1,
      number: 101,
      name: 'Анна Смирнова',
      notes: 'Предпочитает утренние занятия.',
      meta: {
        course: 'Английский B2',
        paymentStatus: 'paid',
        paymentAmount: 15000,
        photoUrl: '',
      },
      state: 'open',
    },
    {
      id: 2,
      number: 102,
      name: 'Илья Козлов',
      notes: '',
      meta: {
        course: 'Математика (ЕГЭ)',
        paymentStatus: 'partial',
        paymentAmount: 8000,
        photoUrl: '',
      },
      state: 'open',
    },
  ];
}

function seedLessons(): Lesson[] {
  const start1 = todayAt(10, 0);
  const end1 = todayAt(11, 0);
  const start2 = todayAt(10, 30);
  const end2 = todayAt(11, 30);
  return [
    {
      id: 1,
      number: 201,
      title: 'Занятие: Анна Смирнова',
      notes: '',
      meta: { studentNumber: 101, start: start1, end: end1 },
      state: 'open',
    },
    {
      id: 2,
      number: 202,
      title: 'Занятие: Илья Козлов',
      notes: 'Перехлёст с Анной — демо',
      meta: { studentNumber: 102, start: start2, end: end2 },
      state: 'open',
    },
    {
      id: 3,
      number: 203,
      title: 'Занятие: Анна Смирнова',
      notes: '',
      meta: { studentNumber: 101, start: todayAt(14, 0), end: todayAt(15, 0) },
      state: 'open',
    },
  ];
}

function getStudents(): Student[] {
  if (!mockStudents) mockStudents = seedStudents();
  return mockStudents;
}

function getLessons(): Lesson[] {
  if (!mockLessons) mockLessons = seedLessons();
  return mockLessons;
}

export class MockPlanningApi implements PlanningApi {
  async listStudents(): Promise<Student[]> {
    await delay(200);
    return getStudents().filter((student) => student.state === 'open');
  }

  async createStudent(input: CreateStudentInput): Promise<Student> {
    await delay(200);
    const number = ++mockNextStudent;
    const student: Student = {
      id: number,
      number,
      name: input.name,
      notes: input.notes,
      meta: input.meta,
      state: 'open',
    };
    getStudents().push(student);
    return student;
  }

  async updateStudent(input: UpdateStudentInput): Promise<Student> {
    await delay(200);
    const students = getStudents();
    const index = students.findIndex((student) => student.number === input.number);
    if (index === -1) throw new Error('Ученик не найден');
    const updated: Student = {
      ...students[index],
      name: input.name,
      notes: input.notes,
      meta: input.meta,
    };
    students[index] = updated;
    return updated;
  }

  async deleteStudent(number: number): Promise<void> {
    await delay(200);
    const students = getStudents();
    const index = students.findIndex((student) => student.number === number);
    if (index === -1) throw new Error('Ученик не найден');
    students[index] = { ...students[index], state: 'closed' };
  }

  async uploadStudentPhoto(studentNumber: number, file: File): Promise<string> {
    await delay(150);
    const dataUrl = await readAsDataUrl(file);
    const students = getStudents();
    const student = students.find((item) => item.number === studentNumber);
    if (student) student.meta = { ...student.meta, photoUrl: dataUrl };
    return dataUrl;
  }

  async listLessons(): Promise<Lesson[]> {
    await delay(200);
    return getLessons().filter((lesson) => lesson.state === 'open');
  }

  async createLesson(input: CreateLessonInput): Promise<Lesson> {
    await delay(200);
    const number = ++mockNextLesson;
    const lesson: Lesson = {
      id: number,
      number,
      title: input.title,
      notes: input.notes,
      meta: input.meta,
      state: 'open',
    };
    getLessons().push(lesson);
    return lesson;
  }

  async updateLesson(input: UpdateLessonInput): Promise<Lesson> {
    await delay(200);
    const lessons = getLessons();
    const index = lessons.findIndex((lesson) => lesson.number === input.number);
    if (index === -1) throw new Error('Занятие не найдено');
    const updated: Lesson = {
      ...lessons[index],
      title: input.title,
      notes: input.notes,
      meta: input.meta,
    };
    lessons[index] = updated;
    return updated;
  }

  async deleteLesson(number: number): Promise<void> {
    await delay(200);
    const lessons = getLessons();
    const index = lessons.findIndex((lesson) => lesson.number === number);
    if (index === -1) throw new Error('Занятие не найдено');
    lessons[index] = { ...lessons[index], state: 'closed' };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
