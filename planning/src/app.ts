import { createPlanningApi } from './api';
import {
  fromDateInputValue,
  lessonOnDay,
  startOfDay,
  toDateInputValue,
} from './frontmatter';
import { findOverlappingLesson, overlappingLessonNumbers } from './overlap';
import { requestNotificationPermission, startLessonReminders } from './notifications';
import { loadConfig, saveConfig } from './storage';
import { applyTheme, loadTheme, saveTheme, type Theme } from './theme';
import type {
  AppConfig,
  CreateLessonInput,
  CreateStudentInput,
  Lesson,
  PaymentStatus,
  Student,
} from './types';

type Tab = 'students' | 'schedule';
type Modal = 'settings' | 'student' | 'lesson' | 'overlap';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: 'Оплачено',
  partial: 'Частично',
  unpaid: 'Не оплачено',
};
const GRID_START_HOUR = 8;
const GRID_END_HOUR = 22;
const SLOT_MINUTES = 60;

export class PlanningApp {
  private readonly root: HTMLElement;
  private config: AppConfig;
  private theme: Theme;
  private students: Student[] = [];
  private lessons: Lesson[] = [];
  private tab: Tab = 'schedule';
  private viewMonth: Date;
  private selectedDay: Date;
  private editingStudent: Student | null = null;
  private editingLesson: Lesson | null = null;
  private modal: Modal | null = null;
  private overlapMessage: string | null = null;
  private pendingPhoto: File | null = null;
  private photoPreviewUrl: string | null = null;
  private pendingLessonStart: Date | null = null;
  private pendingLessonEnd: Date | null = null;
  private loading = false;
  private error: string | null = null;
  private stopReminders: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    const now = new Date();
    this.config = loadConfig();
    this.theme = loadTheme();
    this.viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.selectedDay = startOfDay(now);
    this.render();
    void this.refreshAll();
  }

  private async refreshAll(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.render();
    try {
      const api = createPlanningApi(this.config);
      const [students, lessons] = await Promise.all([api.listStudents(), api.listLessons()]);
      this.students = students;
      this.lessons = lessons;
      this.startRemindersIfNeeded();
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private startRemindersIfNeeded(): void {
    this.stopReminders?.();
    this.stopReminders = startLessonReminders(
      () => this.lessons,
      () => this.students,
    );
  }

  private studentByNumber(number: number): Student | undefined {
    return this.students.find((student) => student.number === number);
  }

  private lessonsForDay(day: Date): Lesson[] {
    return this.lessons.filter(
      (lesson) => lesson.state === 'open' && lessonOnDay(lesson.meta, day),
    );
  }

  private render(): void {
    const overlapNumbers = overlappingLessonNumbers(this.lessons);
    this.root.innerHTML = `
      <div class="layout">
        <header class="header">
          <div>
            <p class="header__kicker">Планинг</p>
            <h1 class="header__title">Учёт учеников и расписание</h1>
          </div>
          <div class="header__actions">
            <button class="btn btn--ghost" type="button" data-action="toggle-theme" title="День / ночь">
              ${this.theme === 'dark' ? '☀️ День' : '🌙 Ночь'}
            </button>
            <button class="btn btn--ghost" type="button" data-action="open-settings">Настройки</button>
            <button class="btn btn--ghost" type="button" data-action="notify-permission">Напоминания</button>
            <button class="btn" type="button" data-action="refresh" ${this.loading ? 'disabled' : ''}>
              ${this.loading ? 'Загрузка…' : 'Обновить'}
            </button>
          </div>
        </header>

        ${this.error ? `<div class="banner banner--error" role="alert">${escapeHtml(this.error)}</div>` : ''}
        ${this.config.demoMode ? '<div class="banner banner--info">Демо-режим: данные локальные, GitHub не вызывается.</div>' : ''}
        ${overlapNumbers.size ? `<div class="banner banner--warn" role="alert">⚠ Перехлёст занятий: ${overlapNumbers.size} занятий пересекаются по времени.</div>` : ''}

        <nav class="tabs" aria-label="Разделы">
          <button class="tab${this.tab === 'students' ? ' tab--active' : ''}" type="button" data-action="tab" data-tab="students">Ученики</button>
          <button class="tab${this.tab === 'schedule' ? ' tab--active' : ''}" type="button" data-action="tab" data-tab="schedule">Расписание</button>
        </nav>

        <main>${this.tab === 'students' ? this.renderStudents() : this.renderSchedule(overlapNumbers)}</main>
      </div>
      ${this.renderModal()}
    `;
    this.bindEvents();
  }

  private renderStudents(): string {
    if (!this.students.length) {
      return `
        <section class="panel empty-panel">
          <p>Учеников пока нет.</p>
          <button class="btn" type="button" data-action="new-student">+ Добавить ученика</button>
        </section>
      `;
    }

    return `
      <section class="students-toolbar">
        <button class="btn" type="button" data-action="new-student">+ Добавить ученика</button>
      </section>
      <section class="student-grid">
        ${this.students
          .map((student) => `
            <article class="student-card" data-action="edit-student" data-number="${student.number}" role="button" tabindex="0">
              <div class="student-card__photo">
                ${student.meta.photoUrl
                  ? `<img src="${escapeAttr(student.meta.photoUrl)}" alt="" />`
                  : '<span class="student-card__placeholder">👤</span>'}
              </div>
              <div class="student-card__body">
                <h2>${escapeHtml(student.name)}</h2>
                <p class="student-card__course">${escapeHtml(student.meta.course)}</p>
                <p class="student-card__payment payment--${student.meta.paymentStatus}">
                  ${PAYMENT_LABELS[student.meta.paymentStatus]} · ${formatMoney(student.meta.paymentAmount)}
                </p>
                <span class="student-card__edit-hint">Нажмите, чтобы изменить</span>
              </div>
            </article>
          `)
          .join('')}
      </section>
    `;
  }

  private renderSchedule(overlapNumbers: Set<number>): string {
    const lessons = this.lessonsForDay(this.selectedDay);
    return `
      <div class="schedule-grid">
        <section class="panel calendar-panel" aria-label="Календарь месяца">
          <div class="calendar-nav">
            <button class="btn btn--ghost" type="button" data-action="prev-month">‹</button>
            <h2 class="calendar-nav__title">${MONTHS[this.viewMonth.getMonth()]} ${this.viewMonth.getFullYear()}</h2>
            <button class="btn btn--ghost" type="button" data-action="next-month">›</button>
          </div>
          <div class="weekdays">${WEEKDAYS.map((day) => `<span>${day}</span>`).join('')}</div>
          <div class="month-grid">${this.renderMonthCells()}</div>
        </section>

        <section class="panel day-panel" aria-label="Сетка дня">
          <div class="day-panel__header">
            <h2>${formatDayTitle(this.selectedDay)}</h2>
            <p class="hint day-panel__hint">Кликните по свободному времени → выберите ученика</p>
          </div>
          <div class="time-grid">
            <div class="time-grid__labels">
              ${Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => {
                const hour = GRID_START_HOUR + i;
                return `<span>${String(hour).padStart(2, '0')}:00</span>`;
              }).join('')}
            </div>
            <div class="time-grid__canvas" data-action="pick-slot">
              ${this.renderSlotGuides()}
              ${this.renderLessonBlocks(overlapNumbers, lessons)}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  private renderSlotGuides(): string {
    const slots = GRID_END_HOUR - GRID_START_HOUR;
    return Array.from({ length: slots }, (_, i) => {
      const top = (i / slots) * 100;
      const height = (1 / slots) * 100;
      return `<div class="time-slot-guide" style="top:${top}%;height:${height}%"></div>`;
    }).join('');
  }

  private renderMonthCells(): string {
    const year = this.viewMonth.getFullYear();
    const month = this.viewMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = startOfDay(new Date());
    const cells: string[] = [];

    for (let i = 0; i < firstWeekday; i++) {
      cells.push('<div class="day-cell day-cell--empty"></div>');
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const count = this.lessonsForDay(date).length;
      const hasOverlap = overlappingLessonNumbers(this.lessonsForDay(date)).size > 0;
      cells.push(`
        <button
          class="day-cell${sameDay(date, this.selectedDay) ? ' day-cell--selected' : ''}${sameDay(date, today) ? ' day-cell--today' : ''}${hasOverlap ? ' day-cell--overlap' : ''}"
          type="button"
          data-action="select-day"
          data-day="${date.toISOString()}"
        >
          <span class="day-cell__number">${day}</span>
          ${count ? `<span class="day-cell__dots">${'•'.repeat(Math.min(count, 3))}</span>` : ''}
        </button>
      `);
    }
    return cells.join('');
  }

  private renderLessonBlocks(overlapNumbers: Set<number>, lessons: Lesson[]): string {
    if (!lessons.length) return '';

    const totalMinutes = (GRID_END_HOUR - GRID_START_HOUR) * 60;
    const gridStart = GRID_START_HOUR * 60;

    return lessons
      .map((lesson) => {
        const student = this.studentByNumber(lesson.meta.studentNumber);
        const start = new Date(lesson.meta.start);
        const end = new Date(lesson.meta.end);
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endMin = end.getHours() * 60 + end.getMinutes();
        const top = ((startMin - gridStart) / totalMinutes) * 100;
        const height = Math.max(((endMin - startMin) / totalMinutes) * 100, 4);
        const overlap = overlapNumbers.has(lesson.number);
        return `
          <button
            class="lesson-block${overlap ? ' lesson-block--overlap' : ''}"
            type="button"
            data-action="edit-lesson"
            data-number="${lesson.number}"
            style="top:${top}%;height:${height}%"
          >
            <strong>${escapeHtml(student?.name ?? 'Ученик')}</strong>
            <span>${formatTimeRange(lesson.meta.start, lesson.meta.end)}</span>
            ${overlap ? '<span class="lesson-block__warn">⚠ перехлёст</span>' : ''}
          </button>
        `;
      })
      .join('');
  }

  private currentPhotoPreview(): string | null {
    if (this.photoPreviewUrl) return this.photoPreviewUrl;
    return this.editingStudent?.meta.photoUrl ?? null;
  }

  private renderModal(): string {
    if (!this.modal) return '';

    if (this.modal === 'overlap') {
      return `
        <dialog class="modal modal--danger" open>
          <div class="modal__body">
            <h2>Перехлёст занятий</h2>
            <p>${escapeHtml(this.overlapMessage ?? 'Два занятия пересекаются по времени.')}</p>
            <div class="modal__actions">
              <button class="btn" type="button" data-action="close-modal">Понятно</button>
            </div>
          </div>
        </dialog>
      `;
    }

    if (this.modal === 'settings') {
      return `
        <dialog class="modal" open>
          <form class="modal__form" data-form="settings">
            <h2>Настройки GitHub</h2>
            <label>Owner (данные)<input name="owner" value="${escapeAttr(this.config.owner)}" required /></label>
            <label>Repo (данные)<input name="repo" value="${escapeAttr(this.config.repo)}" required /></label>
            <label>PAT<input name="token" type="password" value="${escapeAttr(this.config.token)}" autocomplete="off" /></label>
            <label class="checkbox"><input name="demoMode" type="checkbox" ${this.config.demoMode ? 'checked' : ''} /> Демо-режим</label>
            <p class="hint">Фото хранятся в публичном ${this.config.assetsOwner}/${this.config.assetsRepo}. PAT — только в браузере.</p>
            <div class="modal__actions">
              <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
              <button class="btn" type="submit">Сохранить</button>
            </div>
          </form>
        </dialog>
      `;
    }

    if (this.modal === 'student') {
      const student = this.editingStudent;
      const preview = this.currentPhotoPreview();
      return `
        <dialog class="modal" open>
          <form class="modal__form" data-form="student">
            <h2>${student ? 'Изменить ученика' : 'Новый ученик'}</h2>
            <div class="photo-picker">
              <button class="photo-picker__btn" type="button" data-action="pick-photo">
                ${preview
                  ? `<img src="${escapeAttr(preview)}" alt="" class="photo-picker__img" />`
                  : '<span class="photo-picker__placeholder">👤</span>'}
                <span class="photo-picker__label">${preview ? 'Заменить фото' : 'Добавить фото'}</span>
              </button>
              <input class="photo-picker__input" name="photo" type="file" accept="image/*" hidden />
            </div>
            <label>Имя<input name="name" value="${escapeAttr(student?.name ?? '')}" required maxlength="120" /></label>
            <label>Курс<input name="course" value="${escapeAttr(student?.meta.course ?? '')}" required /></label>
            <label>Статус оплаты
              <select name="paymentStatus">
                <option value="paid" ${student?.meta.paymentStatus === 'paid' ? 'selected' : ''}>Оплачено</option>
                <option value="partial" ${student?.meta.paymentStatus === 'partial' ? 'selected' : ''}>Частично</option>
                <option value="unpaid" ${!student || student.meta.paymentStatus === 'unpaid' ? 'selected' : ''}>Не оплачено</option>
              </select>
            </label>
            <label>Сумма (₽)<input name="paymentAmount" type="number" min="0" step="100" value="${student?.meta.paymentAmount ?? 0}" /></label>
            <label>Заметки<textarea name="notes" rows="3">${escapeHtml(student?.notes ?? '')}</textarea></label>
            <div class="modal__actions">
              <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
              <button class="btn" type="submit">${student ? 'Сохранить' : 'Создать'}</button>
            </div>
          </form>
        </dialog>
      `;
    }

    const lesson = this.editingLesson;
    const defaultStudent = lesson?.meta.studentNumber ?? this.students[0]?.number ?? 0;
    const startValue = lesson
      ? toDateInputValue(lesson.meta.start)
      : this.pendingLessonStart
        ? toLocalInput(this.pendingLessonStart)
        : defaultStart(this.selectedDay);
    const endValue = lesson
      ? toDateInputValue(lesson.meta.end)
      : this.pendingLessonEnd
        ? toLocalInput(this.pendingLessonEnd)
        : defaultEnd(this.selectedDay);

    return `
      <dialog class="modal" open>
        <form class="modal__form" data-form="lesson">
          <h2>${lesson ? 'Изменить занятие' : 'Новое занятие'}</h2>
          <p class="hint">Расписание отдельно от карточки ученика</p>
          <label>Ученик
            <select name="studentNumber" required>
              ${this.students
                .map(
                  (s) =>
                    `<option value="${s.number}" ${s.number === defaultStudent ? 'selected' : ''}>${escapeHtml(s.name)}</option>`,
                )
                .join('')}
            </select>
          </label>
          <label>Начало<input name="start" type="datetime-local" value="${escapeAttr(startValue)}" required /></label>
          <label>Конец<input name="end" type="datetime-local" value="${escapeAttr(endValue)}" required /></label>
          <label>Заметки<textarea name="notes" rows="3">${escapeHtml(lesson?.notes ?? '')}</textarea></label>
          <div class="modal__actions">
            ${lesson ? `<button class="btn btn--danger" type="button" data-action="delete-lesson">Удалить</button>` : ''}
            <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
            <button class="btn" type="submit">${lesson ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </dialog>
    `;
  }

  private bindEvents(): void {
    this.root.querySelector('[data-action="toggle-theme"]')?.addEventListener('click', () => {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      saveTheme(this.theme);
      applyTheme(this.theme);
      this.render();
    });
    this.root.querySelector('[data-action="refresh"]')?.addEventListener('click', () => void this.refreshAll());
    this.root.querySelector('[data-action="open-settings"]')?.addEventListener('click', () => {
      this.modal = 'settings';
      this.render();
    });
    this.root.querySelector('[data-action="notify-permission"]')?.addEventListener('click', () => {
      void requestNotificationPermission().then((granted) => {
        this.error = granted ? null : 'Разрешите уведомления в браузере.';
        this.render();
      });
    });
    this.root.querySelector('[data-action="close-modal"]')?.addEventListener('click', () => {
      if (this.modal === 'overlap') {
        this.modal = 'lesson';
        this.overlapMessage = null;
      } else {
        this.closeModal();
      }
      this.render();
    });
    this.root.querySelectorAll('[data-action="tab"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.tab = (button as HTMLButtonElement).dataset.tab as Tab;
        this.render();
      });
    });
    this.root.querySelector('[data-action="new-student"]')?.addEventListener('click', () => {
      this.editingStudent = null;
      this.clearPhotoPreview();
      this.modal = 'student';
      this.render();
    });
    this.root.querySelectorAll('[data-action="edit-student"]').forEach((el) => {
      el.addEventListener('click', () => this.openStudentEdit(Number((el as HTMLElement).dataset.number)));
      el.addEventListener('keydown', (event) => {
        const keyEvent = event as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          keyEvent.preventDefault();
          this.openStudentEdit(Number((el as HTMLElement).dataset.number));
        }
      });
    });
    this.root.querySelector('[data-action="pick-slot"]')?.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('.lesson-block')) return;
      if (!this.students.length) {
        this.error = 'Сначала добавьте ученика.';
        this.render();
        return;
      }
      this.openLessonAtClick(event as MouseEvent);
    });
    this.root.querySelectorAll('[data-action="edit-lesson"]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const number = Number((button as HTMLButtonElement).dataset.number);
        this.editingLesson = this.lessons.find((lesson) => lesson.number === number) ?? null;
        this.modal = 'lesson';
        this.render();
      });
    });
    this.root.querySelector('[data-action="prev-month"]')?.addEventListener('click', () => {
      this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() - 1, 1);
      this.render();
    });
    this.root.querySelector('[data-action="next-month"]')?.addEventListener('click', () => {
      this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + 1, 1);
      this.render();
    });
    this.root.querySelectorAll('[data-action="select-day"]').forEach((button) => {
      button.addEventListener('click', () => {
        const iso = (button as HTMLButtonElement).dataset.day;
        if (!iso) return;
        this.selectedDay = startOfDay(new Date(iso));
        this.render();
      });
    });

    const settingsForm = this.root.querySelector<HTMLFormElement>('form[data-form="settings"]');
    settingsForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(settingsForm);
      this.config = {
        owner: String(data.get('owner') ?? '').trim(),
        repo: String(data.get('repo') ?? '').trim(),
        token: String(data.get('token') ?? '').trim(),
        demoMode: data.get('demoMode') === 'on',
        assetsOwner: this.config.assetsOwner,
        assetsRepo: this.config.assetsRepo,
      };
      saveConfig(this.config);
      this.modal = null;
      void this.refreshAll();
    });

    const studentForm = this.root.querySelector<HTMLFormElement>('form[data-form="student"]');
    studentForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.submitStudentForm(studentForm);
    });
    this.root.querySelector('[data-action="pick-photo"]')?.addEventListener('click', () => {
      studentForm?.querySelector<HTMLInputElement>('.photo-picker__input')?.click();
    });
    studentForm?.querySelector<HTMLInputElement>('.photo-picker__input')?.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      this.pendingPhoto = file;
      this.revokePhotoPreview();
      this.photoPreviewUrl = URL.createObjectURL(file);
      this.render();
      this.bindPhotoInput(studentForm);
    });

    const lessonForm = this.root.querySelector<HTMLFormElement>('form[data-form="lesson"]');
    lessonForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.submitLessonForm(lessonForm);
    });
    this.root.querySelector('[data-action="delete-lesson"]')?.addEventListener('click', () => {
      if (!this.editingLesson) return;
      void this.deleteLesson(this.editingLesson.number);
    });
  }

  private bindPhotoInput(studentForm: HTMLFormElement | null): void {
    studentForm?.querySelector('[data-action="pick-photo"]')?.addEventListener('click', () => {
      studentForm.querySelector<HTMLInputElement>('.photo-picker__input')?.click();
    });
  }

  private openStudentEdit(number: number): void {
    this.editingStudent = this.students.find((student) => student.number === number) ?? null;
    this.clearPhotoPreview();
    this.modal = 'student';
    this.render();
  }

  private openLessonAtClick(event: MouseEvent): void {
    const canvas = event.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
    const totalMinutes = (GRID_END_HOUR - GRID_START_HOUR) * 60;
    const minuteOfDay = GRID_START_HOUR * 60 + ratio * totalMinutes;
    const hour = Math.floor(minuteOfDay / 60);
    const minute = Math.floor((minuteOfDay % 60) / 15) * 15;

    const start = new Date(this.selectedDay);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + SLOT_MINUTES);

    this.editingLesson = null;
    this.modal = 'lesson';
    this.pendingLessonStart = start;
    this.pendingLessonEnd = end;
    this.render();
  }

  private closeModal(): void {
    this.modal = null;
    this.editingStudent = null;
    this.editingLesson = null;
    this.pendingPhoto = null;
    this.pendingLessonStart = null;
    this.pendingLessonEnd = null;
    this.clearPhotoPreview();
  }

  private clearPhotoPreview(): void {
    this.revokePhotoPreview();
    this.photoPreviewUrl = null;
  }

  private revokePhotoPreview(): void {
    if (this.photoPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
  }

  private async submitStudentForm(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    const input: CreateStudentInput = {
      name: String(data.get('name') ?? '').trim(),
      notes: String(data.get('notes') ?? '').trim(),
      meta: {
        course: String(data.get('course') ?? '').trim(),
        paymentStatus: String(data.get('paymentStatus') ?? 'unpaid') as PaymentStatus,
        paymentAmount: Number(data.get('paymentAmount') ?? 0),
        photoUrl: this.editingStudent?.meta.photoUrl,
      },
    };

    this.loading = true;
    this.render();
    try {
      const api = createPlanningApi(this.config);
      let student: Student;
      if (this.editingStudent) {
        student = await api.updateStudent({ ...input, number: this.editingStudent.number });
      } else {
        student = await api.createStudent(input);
      }
      if (this.pendingPhoto) {
        const photoUrl = await api.uploadStudentPhoto(student.number, this.pendingPhoto);
        student = await api.updateStudent({
          ...input,
          number: student.number,
          meta: { ...input.meta, photoUrl },
        });
      }
      this.closeModal();
      await this.refreshAll();
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      this.loading = false;
      this.render();
    }
  }

  private async submitLessonForm(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    const studentNumber = Number(data.get('studentNumber'));
    const student = this.studentByNumber(studentNumber);
    const meta = {
      studentNumber,
      start: fromDateInputValue(String(data.get('start'))),
      end: fromDateInputValue(String(data.get('end'))),
    };

    const conflict = findOverlappingLesson(meta, this.lessons, this.editingLesson?.number);
    if (conflict) {
      const otherStudent = this.studentByNumber(conflict.meta.studentNumber);
      this.overlapMessage = `Пересечение с «${otherStudent?.name ?? 'учеником'}» (${formatTimeRange(conflict.meta.start, conflict.meta.end)}).`;
      this.modal = 'overlap';
      this.render();
      return;
    }

    const input: CreateLessonInput = {
      title: `Занятие: ${student?.name ?? 'Ученик'}`,
      notes: String(data.get('notes') ?? '').trim(),
      meta,
    };

    this.loading = true;
    this.render();
    try {
      const api = createPlanningApi(this.config);
      if (this.editingLesson) {
        await api.updateLesson({ ...input, number: this.editingLesson.number });
      } else {
        await api.createLesson(input);
      }
      this.closeModal();
      await this.refreshAll();
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      this.loading = false;
      this.render();
    }
  }

  private async deleteLesson(number: number): Promise<void> {
    if (!confirm('Отменить занятие (issue будет закрыт)?')) return;
    this.loading = true;
    this.render();
    try {
      const api = createPlanningApi(this.config);
      await api.deleteLesson(number);
      this.closeModal();
      await this.refreshAll();
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      this.loading = false;
      this.render();
    }
  }
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDayTitle(date: Date): string {
  return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTimeRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return `${new Date(start).toLocaleTimeString('ru-RU', opts)} – ${new Date(end).toLocaleTimeString('ru-RU', opts)}`;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}

function defaultStart(day: Date): string {
  const date = new Date(day);
  date.setHours(10, 0, 0, 0);
  return toLocalInput(date);
}

function defaultEnd(day: Date): string {
  const date = new Date(day);
  date.setHours(11, 0, 0, 0);
  return toLocalInput(date);
}

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", '&#39;');
}
