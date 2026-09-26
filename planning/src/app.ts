import { createPlanningApi } from './api';
import {
  fromDateInputValue,
  lessonOnDay,
  startOfDay,
  toDateInputValue,
} from './frontmatter';
import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  gridLabelCount,
  gridSlotCount,
  datesFromStartMinute,
  maxTopPercent,
  minuteFromCanvasY,
  minuteFromTopPercent,
  topPercentFromMinute,
} from './grid';
import { findOverlappingLesson, overlappingLessonNumbers } from './overlap';
import {
  computePaymentSummary,
  defaultLessonCompleted,
  derivePaymentStatus,
  lessonsForStudent,
  normalizeTel,
  type PaymentSummary,
} from './payment';
import {
  courseAccentColor,
  courseShortTag,
  formatCoursesList,
  lessonCourseName,
  normalizeStudentMeta,
  studentCourses,
} from './courses';
import { requestNotificationPermission, startLessonReminders } from './notifications';
import { loadConfig, saveConfig } from './storage';
import { applyTheme, loadTheme, saveTheme, type Theme } from './theme';
import type {
  AppConfig,
  CreateLessonInput,
  CreateStudentInput,
  Lesson,
  LessonMeta,
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
const SLOT_MINUTES = 60;
const DRAG_THRESHOLD_PX = 5;

interface LessonDragState {
  lessonNumber: number;
  pointerId: number;
  startPointerY: number;
  offsetY: number;
  durationMs: number;
  moved: boolean;
  canvas: HTMLElement;
  block: HTMLElement;
}

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
  private readonly modalHost: HTMLElement;
  private readonly toastHost: HTMLElement;
  private escapeHandler: ((event: KeyboardEvent) => void) | null = null;
  private modalLessonCompleted = new Map<number, boolean>();
  private modalCourses: string[] = [];
  private dragState: LessonDragState | null = null;
  private nowTimer: number | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    const modalHost = document.getElementById('planning-modal-host');
    const toastHost = document.getElementById('sync-toast-host');
    if (!modalHost || !toastHost) {
      throw new Error('Не найдены контейнеры модального окна или уведомлений');
    }
    this.modalHost = modalHost;
    this.toastHost = toastHost;
    const now = new Date();
    this.config = loadConfig();
    this.theme = loadTheme();
    this.viewMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.selectedDay = startOfDay(now);
    this.render();
    void this.refreshAll();
  }

  private async refreshAll(showLoading = true): Promise<void> {
    const isInitialLoad = this.students.length === 0 && this.lessons.length === 0;
    if (showLoading && isInitialLoad) {
      this.loading = true;
      this.error = null;
      this.render();
    }
    try {
      const api = createPlanningApi(this.config);
      const [students, lessons] = await Promise.all([api.listStudents(), api.listLessons()]);
      this.students = students;
      this.lessons = lessons;
      this.startRemindersIfNeeded();
      this.error = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (showLoading && isInitialLoad) {
        this.error = message;
      } else {
        this.showSyncToast(message);
      }
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
    `;
    this.bindEvents();
    this.renderModalOverlay();
    this.ensureNowTimer();
  }

  private ensureNowTimer(): void {
    if (this.tab !== 'schedule') {
      this.stopNowTimer();
      return;
    }
    if (this.nowTimer !== null) return;
    this.nowTimer = window.setInterval(() => {
      if (this.tab === 'schedule' && !this.dragState) this.render();
    }, 60_000);
  }

  private stopNowTimer(): void {
    if (this.nowTimer === null) return;
    window.clearInterval(this.nowTimer);
    this.nowTimer = null;
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
                <p class="student-card__course">${escapeHtml(formatCoursesList(studentCourses(student)))}</p>
                ${this.renderStudentCardPayment(student)}
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
            <p class="hint day-panel__hint">Клик по свободному времени — новое занятие. Перетащите блок, чтобы сдвинуть время.</p>
          </div>
          <div class="time-grid">
            <div class="time-grid__labels">
              ${Array.from({ length: gridLabelCount() }, (_, i) => {
                const hour = GRID_START_HOUR + i;
                return `<span>${String(hour).padStart(2, '0')}:00</span>`;
              }).join('')}
            </div>
            <div class="time-grid__canvas" data-action="pick-slot" style="--grid-slots: ${gridSlotCount()}">
              ${this.renderSlotGuides()}
              ${this.renderLessonBlocks(overlapNumbers, lessons)}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  private renderSlotGuides(): string {
    const slots = gridSlotCount();
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
        const happeningNow = isLessonHappeningNow(lesson, this.selectedDay);
        const studentName = student?.name ?? 'Ученик';
        const courseName = lessonCourseName(lesson, student);
        const courses = studentCourses(student);
        const tag = courseShortTag(courseName);
        const tagColor = courseAccentColor(courseName, courses);
        const label = formatLessonBlockLabel(studentName, lesson.meta.start, lesson.meta.end);
        const classes = [
          'lesson-block',
          overlap ? 'lesson-block--overlap' : '',
          happeningNow ? 'lesson-block--now' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return `
          <div
            class="${classes}"
            data-action="lesson-block"
            data-number="${lesson.number}"
            role="button"
            tabindex="0"
            title="${escapeAttr(`${courseName ? `${courseName} · ` : ''}${label}`)}${overlap ? ' · перехлёст' : ''}${happeningNow ? ' · сейчас' : ''}"
            style="top:${top}%;height:${height}%"
          >
            ${courseName ? `<span class="lesson-block__tag" style="--tag-color:${escapeAttr(tagColor)}">${escapeHtml(tag)}</span>` : ''}
            <span class="lesson-block__label">${escapeHtml(label)}</span>
            ${overlap ? '<span class="lesson-block__warn" aria-label="перехлёст">⚠</span>' : ''}
          </div>
        `;
      })
      .join('');
  }

  private currentPhotoPreview(): string | null {
    if (this.photoPreviewUrl) return this.photoPreviewUrl;
    return this.editingStudent?.meta.photoUrl ?? null;
  }

  private initModalLessonCompleted(studentNumber: number): void {
    this.modalLessonCompleted.clear();
    for (const lesson of lessonsForStudent(studentNumber, this.lessons)) {
      this.modalLessonCompleted.set(lesson.number, defaultLessonCompleted(lesson));
    }
  }

  private renderStudentCardPayment(student: Student): string {
    const summary = computePaymentSummary(student, this.lessons);
    const status = derivePaymentStatus(summary);
    const detail =
      summary.overpayment > 0
        ? `переплата ${formatMoney(summary.overpayment)}`
        : summary.remainder > 0
          ? `остаток ${formatMoney(summary.remainder)}`
          : formatMoney(summary.paid);
    return `<p class="student-card__payment payment--${status}">${PAYMENT_LABELS[status]} · ${detail}</p>`;
  }

  private renderStudentModal(): string {
    const student = this.editingStudent;
    const preview = this.currentPhotoPreview();
    const draftStudent: Student = student ?? {
      id: 0,
      number: 0,
      name: '',
      notes: '',
      meta: {
        course: '',
        courses: [],
        paymentStatus: 'unpaid',
        paymentAmount: 0,
        lessonPrice: 0,
      },
      state: 'open',
    };
    const summary = computePaymentSummary(draftStudent, this.lessons, this.modalLessonCompleted);
    const studentLessons = student ? lessonsForStudent(student.number, this.lessons) : [];

    return `
      <div class="modal modal--wide">
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
          ${this.renderCoursesEditor()}

          <section class="form-section payment-section" aria-labelledby="payment-heading">
            <h3 id="payment-heading" class="form-section__title">Оплата</h3>
            <label>Цена одного занятия (₽)
              <input name="lessonPrice" type="number" min="0" step="100" value="${student?.meta.lessonPrice ?? 0}" />
            </label>
            <label>Уже внесено (₽)
              <input name="paymentAmount" type="number" min="0" step="100" value="${student?.meta.paymentAmount ?? 0}" />
            </label>
            ${studentLessons.length ? `
              <div class="lesson-checklist">
                <p class="lesson-checklist__title">Занятия</p>
                ${studentLessons
                  .map((lesson) => {
                    const checked = this.modalLessonCompleted.get(lesson.number) ?? defaultLessonCompleted(lesson);
                    const past = new Date(lesson.meta.end) < new Date();
                    return `
                      <label class="lesson-checklist__item${past ? ' lesson-checklist__item--past' : ''}">
                        <input
                          type="checkbox"
                          name="lesson-completed-${lesson.number}"
                          data-lesson-number="${lesson.number}"
                          ${checked ? 'checked' : ''}
                        />
                        <span class="lesson-checklist__when">${escapeHtml(formatLessonDateTime(lesson.meta.start, lesson.meta.end))}</span>
                        <span class="lesson-checklist__badge">Проведено</span>
                      </label>
                    `;
                  })
                  .join('')}
              </div>
            ` : '<p class="hint">Занятия появятся в расписании — отметки «Проведено» можно будет поставить здесь.</p>'}
            ${renderPaymentSummaryMarkup(summary)}
          </section>

          <section class="form-section contact-section" aria-labelledby="contact-heading">
            <h3 id="contact-heading" class="form-section__title">Родители и связь</h3>
            <label>Телефон родителя 1
              <div class="contact-row">
                <input name="parentPhone1" type="tel" value="${escapeAttr(student?.meta.parentPhone1 ?? '')}" placeholder="+7 900 000-00-00" />
                <span data-contact-link="parentPhone1">${renderPhoneLink(student?.meta.parentPhone1)}</span>
              </div>
            </label>
            <label>Телефон родителя 2
              <div class="contact-row">
                <input name="parentPhone2" type="tel" value="${escapeAttr(student?.meta.parentPhone2 ?? '')}" placeholder="+7 900 000-00-00" />
                <span data-contact-link="parentPhone2">${renderPhoneLink(student?.meta.parentPhone2)}</span>
              </div>
            </label>
            <label>Max (ссылка на чат)
              <div class="contact-row">
                <input name="maxUrl" type="url" value="${escapeAttr(student?.meta.maxUrl ?? '')}" placeholder="https://max.ru/…" />
                <span data-contact-link="maxUrl">${renderMessageLink(student?.meta.maxUrl, 'Max')}</span>
              </div>
            </label>
            <label>Telegram
              <div class="contact-row">
                <input name="telegramUrl" type="url" value="${escapeAttr(student?.meta.telegramUrl ?? '')}" placeholder="https://t.me/…" />
                <span data-contact-link="telegramUrl">${renderMessageLink(student?.meta.telegramUrl, 'Telegram')}</span>
              </div>
            </label>
          </section>

          <label>Заметки<textarea name="notes" rows="3">${escapeHtml(student?.notes ?? '')}</textarea></label>
          <div class="modal__actions">
            ${student ? `<button class="btn btn--danger" type="button" data-action="delete-student">Удалить ученика</button>` : ''}
            <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
            <button class="btn" type="submit">${student ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </div>
    `;
  }

  private renderCoursesEditor(): string {
    const courses = this.modalCourses.length ? this.modalCourses : [''];
    return `
      <section class="form-section courses-section" aria-labelledby="courses-heading">
        <h3 id="courses-heading" class="form-section__title">Курсы</h3>
        <div class="courses-editor" data-courses-editor>
          ${courses
            .map(
              (course, index) => `
                <div class="courses-editor__row">
                  <input name="course-${index}" value="${escapeAttr(course)}" required maxlength="80" placeholder="Название курса" />
                  ${courses.length > 1
                    ? `<button type="button" class="btn btn--ghost btn--sm" data-action="remove-course" data-index="${index}">Удалить</button>`
                    : ''}
                </div>
              `,
            )
            .join('')}
        </div>
        <button type="button" class="btn btn--ghost btn--sm" data-action="add-course">+ Добавить курс</button>
      </section>
    `;
  }

  private renderModalContent(): string {
    if (!this.modal) return '';

    if (this.modal === 'overlap') {
      return `
        <div class="modal modal--danger">
          <div class="modal__body">
            <h2>Перехлёст занятий</h2>
            <p>${escapeHtml(this.overlapMessage ?? 'Два занятия пересекаются по времени.')}</p>
            <div class="modal__actions">
              <button class="btn" type="button" data-action="close-modal">Понятно</button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.modal === 'settings') {
      return `
        <div class="modal">
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
        </div>
      `;
    }

    if (this.modal === 'student') {
      return this.renderStudentModal();
    }

    const lesson = this.editingLesson;
    const defaultStudent = lesson?.meta.studentNumber ?? this.students[0]?.number ?? 0;
    const lessonStudent = this.studentByNumber(defaultStudent);
    const lessonCourses = studentCourses(lessonStudent);
    const selectedCourse =
      lesson?.meta.course ?? lessonCourses[0] ?? '';
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
      <div class="modal">
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
          <label>Курс
            <select name="lessonCourse" required>
              ${lessonCourses
                .map(
                  (course) =>
                    `<option value="${escapeAttr(course)}" ${course === selectedCourse ? 'selected' : ''}>${escapeHtml(course)}</option>`,
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
      </div>
    `;
  }

  private renderModalOverlay(): void {
    if (!this.modal) {
      this.modalHost.innerHTML = '';
      document.body.classList.remove('modal-open');
      this.detachEscapeHandler();
      return;
    }

    this.modalHost.innerHTML = `
      <div class="modal-overlay" data-action="overlay-backdrop" role="dialog" aria-modal="true">
        ${this.renderModalContent()}
      </div>
    `;
    document.body.classList.add('modal-open');
    this.attachEscapeHandler();
    this.bindModalEvents();
  }

  private attachEscapeHandler(): void {
    this.detachEscapeHandler();
    this.escapeHandler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !this.modal) return;
      if (this.modal === 'overlap') {
        this.overlapMessage = null;
        if (this.editingLesson) {
          this.modal = 'lesson';
        } else {
          this.modal = null;
        }
      } else {
        this.closeModal();
      }
      this.render();
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  private detachEscapeHandler(): void {
    if (!this.escapeHandler) return;
    document.removeEventListener('keydown', this.escapeHandler);
    this.escapeHandler = null;
  }

  private snapshotData(): { students: Student[]; lessons: Lesson[] } {
    return {
      students: this.students.map((student) => ({
        ...student,
        meta: { ...student.meta },
      })),
      lessons: this.lessons.map((lesson) => ({
        ...lesson,
        meta: { ...lesson.meta },
      })),
    };
  }

  private restoreSnapshot(snapshot: { students: Student[]; lessons: Lesson[] }): void {
    this.students = snapshot.students;
    this.lessons = snapshot.lessons;
    this.render();
  }

  private showSyncToast(message: string): void {
    this.toastHost.innerHTML = `<div class="sync-toast" role="alert">${escapeHtml(message)}</div>`;
    window.setTimeout(() => {
      this.toastHost.innerHTML = '';
    }, 6000);
  }

  private syncInBackground(promise: Promise<void>, rollback: () => void, errorLabel: string): void {
    void promise.catch((err) => {
      rollback();
      this.showSyncToast(err instanceof Error ? err.message : errorLabel);
    });
  }

  private createTempStudent(input: CreateStudentInput, previewUrl?: string): Student {
    const tempNumber = -Date.now();
    return {
      id: tempNumber,
      number: tempNumber,
      name: input.name,
      notes: input.notes,
      meta: normalizeStudentMeta({
        ...input.meta,
        lessonPrice: input.meta.lessonPrice ?? 0,
        photoUrl: previewUrl ?? input.meta.photoUrl,
      }),
      state: 'open',
    };
  }

  private readStudentInputFromForm(form: HTMLFormElement): CreateStudentInput {
    const data = new FormData(form);
    const lessonPrice = Number(data.get('lessonPrice') ?? 0);
    const paymentAmount = Number(data.get('paymentAmount') ?? 0);
    const optional = (name: string): string | undefined => {
      const value = String(data.get(name) ?? '').trim();
      return value || undefined;
    };
    let paymentStatus: PaymentStatus = paymentAmount > 0 ? 'partial' : 'unpaid';
    if (this.editingStudent) {
      const draft: Student = {
        ...this.editingStudent,
        meta: {
          ...this.editingStudent.meta,
          lessonPrice,
          paymentAmount,
        },
      };
      paymentStatus = derivePaymentStatus(
        computePaymentSummary(draft, this.lessons, this.modalLessonCompleted),
      );
    }
    const courses = [...form.querySelectorAll<HTMLInputElement>('input[name^="course-"]')]
      .map((input) => input.value.trim())
      .filter(Boolean);
    const meta = normalizeStudentMeta({
      course: courses[0] ?? '',
      courses,
      paymentStatus,
      paymentAmount,
      lessonPrice,
      parentPhone1: optional('parentPhone1'),
      parentPhone2: optional('parentPhone2'),
      maxUrl: optional('maxUrl'),
      telegramUrl: optional('telegramUrl'),
      photoUrl: this.editingStudent?.meta.photoUrl,
    });
    return {
      name: String(data.get('name') ?? '').trim(),
      notes: String(data.get('notes') ?? '').trim(),
      meta,
    };
  }

  private collectLessonCompletionUpdates(): Array<{ lesson: Lesson; completed: boolean }> {
    const updates: Array<{ lesson: Lesson; completed: boolean }> = [];
    for (const [number, completed] of this.modalLessonCompleted) {
      const lesson = this.lessons.find((item) => item.number === number);
      if (!lesson) continue;
      if (lesson.meta.completed === completed) continue;
      updates.push({ lesson, completed });
    }
    return updates;
  }

  private updatePaymentSummaryInModal(form: HTMLFormElement): void {
    if (!this.editingStudent) return;
    const lessonPrice = Number(form.querySelector<HTMLInputElement>('[name=lessonPrice]')?.value ?? 0);
    const paymentAmount = Number(form.querySelector<HTMLInputElement>('[name=paymentAmount]')?.value ?? 0);
    const studentLessons = lessonsForStudent(this.editingStudent.number, this.lessons);
    let completedLessons = 0;
    for (const lesson of studentLessons) {
      const checkbox = form.querySelector<HTMLInputElement>(`[data-lesson-number="${lesson.number}"]`);
      if (checkbox?.checked) completedLessons += 1;
    }
    const dueNow = completedLessons * lessonPrice;
    const summary: PaymentSummary = {
      totalLessons: studentLessons.length,
      completedLessons,
      lessonPrice,
      dueNow,
      paid: paymentAmount,
      remainder: Math.max(0, dueNow - paymentAmount),
      overpayment: Math.max(0, paymentAmount - dueNow),
    };
    const target = form.querySelector('[data-payment-summary]');
    if (target) target.outerHTML = renderPaymentSummaryMarkup(summary);
  }

  private updateContactLinksInModal(form: HTMLFormElement): void {
    const phone1 = String(form.querySelector<HTMLInputElement>('[name=parentPhone1]')?.value ?? '').trim();
    const phone2 = String(form.querySelector<HTMLInputElement>('[name=parentPhone2]')?.value ?? '').trim();
    const maxUrl = String(form.querySelector<HTMLInputElement>('[name=maxUrl]')?.value ?? '').trim();
    const telegramUrl = String(form.querySelector<HTMLInputElement>('[name=telegramUrl]')?.value ?? '').trim();
    form.querySelector('[data-contact-link="parentPhone1"]')!.innerHTML = renderPhoneLink(phone1);
    form.querySelector('[data-contact-link="parentPhone2"]')!.innerHTML = renderPhoneLink(phone2);
    form.querySelector('[data-contact-link="maxUrl"]')!.innerHTML = renderMessageLink(maxUrl, 'Max');
    form.querySelector('[data-contact-link="telegramUrl"]')!.innerHTML = renderMessageLink(telegramUrl, 'Telegram');
  }

  private createTempLesson(input: CreateLessonInput): Lesson {
    const tempNumber = -Date.now();
    return {
      id: tempNumber,
      number: tempNumber,
      title: input.title,
      notes: input.notes,
      meta: { ...input.meta },
      state: 'open',
    };
  }

  private bindEvents(): void {
    this.root.querySelector('[data-action="toggle-theme"]')?.addEventListener('click', () => {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      saveTheme(this.theme);
      applyTheme(this.theme);
      this.render();
    });
    this.root.querySelector('[data-action="refresh"]')?.addEventListener('click', () => void this.refreshAll(true));
    this.root.querySelector('[data-action="open-settings"]')?.addEventListener('click', () => {
      this.modal = 'settings';
      this.renderModalOverlay();
    });
    this.root.querySelector('[data-action="notify-permission"]')?.addEventListener('click', () => {
      void requestNotificationPermission().then((granted) => {
        this.error = granted ? null : 'Разрешите уведомления в браузере.';
        this.render();
      });
    });
    this.root.querySelectorAll('[data-action="tab"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.tab = (button as HTMLButtonElement).dataset.tab as Tab;
        this.render();
      });
    });
    this.root.querySelector('[data-action="new-student"]')?.addEventListener('click', () => {
      this.editingStudent = null;
      this.modalCourses = [''];
      this.modalLessonCompleted.clear();
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
    this.bindLessonDrag();
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
  }

  private bindModalEvents(): void {
    const overlay = this.modalHost.querySelector('[data-action="overlay-backdrop"]');
    overlay?.addEventListener('mousedown', (event) => {
      if (event.target !== overlay) return;
      if (this.modal === 'overlap') return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === 'datetime-local') {
        event.preventDefault();
        active.blur();
      }
    });
    overlay?.addEventListener('click', (event) => {
      if (event.target !== overlay) return;
      if (this.modal === 'overlap') return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === 'datetime-local') return;
      this.closeModal();
      this.render();
    });

    this.modalHost.querySelector('[data-action="close-modal"]')?.addEventListener('click', () => {
      if (this.modal === 'overlap') {
        this.overlapMessage = null;
        if (this.editingLesson) {
          this.modal = 'lesson';
          this.renderModalOverlay();
        } else {
          this.modal = null;
          this.renderModalOverlay();
          this.render();
        }
        return;
      }
      this.closeModal();
      this.render();
    });

    const settingsForm = this.modalHost.querySelector<HTMLFormElement>('form[data-form="settings"]');
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
      this.closeModal();
      void this.refreshAll(true);
    });

    const studentForm = this.modalHost.querySelector<HTMLFormElement>('form[data-form="student"]');
    studentForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submitStudentForm(studentForm);
    });
    studentForm?.querySelector('[data-action="pick-photo"]')?.addEventListener('click', () => {
      studentForm.querySelector<HTMLInputElement>('.photo-picker__input')?.click();
    });
    studentForm?.querySelector<HTMLInputElement>('.photo-picker__input')?.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      this.pendingPhoto = file;
      this.revokePhotoPreview();
      this.photoPreviewUrl = URL.createObjectURL(file);
      this.renderModalOverlay();
    });
    if (studentForm) {
      const refreshPayment = () => this.updatePaymentSummaryInModal(studentForm);
      const refreshContacts = () => this.updateContactLinksInModal(studentForm);
      studentForm.querySelectorAll('[name=lessonPrice], [name=paymentAmount]').forEach((input) => {
        input.addEventListener('input', refreshPayment);
      });
      studentForm.querySelectorAll('[data-lesson-number]').forEach((input) => {
        input.addEventListener('change', (event) => {
          const target = event.target as HTMLInputElement;
          const number = Number(target.dataset.lessonNumber);
          this.modalLessonCompleted.set(number, target.checked);
          refreshPayment();
        });
      });
      studentForm
        .querySelectorAll('[name=parentPhone1], [name=parentPhone2], [name=maxUrl], [name=telegramUrl]')
        .forEach((input) => {
          input.addEventListener('input', refreshContacts);
        });
      this.bindCoursesEditor(studentForm);
      studentForm.querySelector('[data-action="delete-student"]')?.addEventListener('click', () => {
        if (!this.editingStudent) return;
        this.deleteStudentWithLessons(this.editingStudent.number);
      });
    }

    const lessonForm = this.modalHost.querySelector<HTMLFormElement>('form[data-form="lesson"]');
    lessonForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submitLessonForm(lessonForm);
    });
    this.modalHost.querySelector('[data-action="delete-lesson"]')?.addEventListener('click', () => {
      if (!this.editingLesson) return;
      this.deleteLesson(this.editingLesson.number);
    });
    if (lessonForm) {
      this.bindDateTimePickerGuard(lessonForm);
      lessonForm.querySelector('[name=studentNumber]')?.addEventListener('change', () => {
        const studentNumber = Number(
          (lessonForm.querySelector('[name=studentNumber]') as HTMLSelectElement).value,
        );
        const student = this.studentByNumber(studentNumber);
        const courses = studentCourses(student);
        const select = lessonForm.querySelector<HTMLSelectElement>('[name=lessonCourse]');
        if (!select) return;
        select.innerHTML = courses
          .map((course) => `<option value="${escapeAttr(course)}">${escapeHtml(course)}</option>`)
          .join('');
      });
    }
  }

  private bindDateTimePickerGuard(form: HTMLFormElement): void {
    form.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]').forEach((input) => {
      input.addEventListener('click', (event) => event.stopPropagation());
      input.addEventListener('mousedown', (event) => event.stopPropagation());
    });
  }

  private bindCoursesEditor(form: HTMLFormElement): void {
    const syncCoursesFromForm = (): void => {
      this.modalCourses = [...form.querySelectorAll<HTMLInputElement>('input[name^="course-"]')].map(
        (input) => input.value,
      );
    };
    form.querySelector('[data-action="add-course"]')?.addEventListener('click', () => {
      syncCoursesFromForm();
      this.modalCourses.push('');
      this.renderModalOverlay();
    });
    form.querySelectorAll('[data-action="remove-course"]').forEach((button) => {
      button.addEventListener('click', () => {
        syncCoursesFromForm();
        const index = Number((button as HTMLButtonElement).dataset.index);
        this.modalCourses = this.modalCourses.filter((_, i) => i !== index);
        if (!this.modalCourses.length) this.modalCourses = [''];
        this.renderModalOverlay();
      });
    });
  }

  private openStudentEdit(number: number): void {
    this.editingStudent = this.students.find((student) => student.number === number) ?? null;
    if (this.editingStudent) {
      this.initModalLessonCompleted(this.editingStudent.number);
      this.modalCourses = [...studentCourses(this.editingStudent)];
    }
    this.clearPhotoPreview();
    this.modal = 'student';
    this.render();
  }

  private openLessonAtClick(event: MouseEvent): void {
    const canvas = event.currentTarget as HTMLElement;
    const minuteOfDay = minuteFromCanvasY(event.clientY, canvas);
    const { start, end } = datesFromStartMinute(this.selectedDay, minuteOfDay, SLOT_MINUTES * 60_000);

    this.editingLesson = null;
    this.modal = 'lesson';
    this.pendingLessonStart = start;
    this.pendingLessonEnd = end;
    this.render();
  }

  private bindLessonDrag(): void {
    this.root.querySelectorAll('[data-action="lesson-block"]').forEach((block) => {
      const element = block as HTMLElement;
      element.addEventListener('pointerdown', (event) => this.onLessonPointerDown(event, element));
      element.addEventListener('keydown', (event) => {
        const keyEvent = event as KeyboardEvent;
        if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return;
        keyEvent.preventDefault();
        const number = Number(element.dataset.number);
        this.editingLesson = this.lessons.find((lesson) => lesson.number === number) ?? null;
        this.modal = 'lesson';
        this.render();
      });
    });
  }

  private onLessonPointerDown(event: PointerEvent, block: HTMLElement): void {
    event.stopPropagation();
    const number = Number(block.dataset.number);
    const lesson = this.lessons.find((item) => item.number === number);
    const canvas = block.closest('[data-action="pick-slot"]') as HTMLElement | null;
    if (!lesson || !canvas) return;

    const start = new Date(lesson.meta.start);
    const end = new Date(lesson.meta.end);
    const blockRect = block.getBoundingClientRect();
    block.setPointerCapture(event.pointerId);
    this.dragState = {
      lessonNumber: number,
      pointerId: event.pointerId,
      startPointerY: event.clientY,
      offsetY: event.clientY - blockRect.top,
      durationMs: end.getTime() - start.getTime(),
      moved: false,
      canvas,
      block,
    };
    block.addEventListener('pointermove', this.onLessonPointerMove);
    block.addEventListener('pointerup', this.onLessonPointerUp);
    block.addEventListener('pointercancel', this.onLessonPointerUp);
  }

  private onLessonPointerMove = (event: PointerEvent): void => {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;
    const dy = event.clientY - this.dragState.startPointerY;
    if (!this.dragState.moved && Math.abs(dy) < DRAG_THRESHOLD_PX) return;

    this.dragState.moved = true;
    const blockTopY = event.clientY - this.dragState.offsetY;
    const startMin = minuteFromCanvasY(blockTopY, this.dragState.canvas);
    const top = Math.max(0, Math.min(topPercentFromMinute(startMin), maxTopPercent(this.dragState.durationMs)));
    this.dragState.block.style.top = `${top}%`;
    this.dragState.block.classList.add('lesson-block--dragging');
  };

  private onLessonPointerUp = (event: PointerEvent): void => {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;
    const { block, moved, lessonNumber, durationMs } = this.dragState;
    block.releasePointerCapture(event.pointerId);
    block.removeEventListener('pointermove', this.onLessonPointerMove);
    block.removeEventListener('pointerup', this.onLessonPointerUp);
    block.removeEventListener('pointercancel', this.onLessonPointerUp);
    block.classList.remove('lesson-block--dragging');
    this.dragState = null;

    if (!moved) {
      this.editingLesson = this.lessons.find((lesson) => lesson.number === lessonNumber) ?? null;
      this.modal = 'lesson';
      this.render();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const topPercent = Number.parseFloat(block.style.top);
    const startMin = minuteFromTopPercent(topPercent);
    const { start, end } = datesFromStartMinute(this.selectedDay, startMin, durationMs);
    this.applyLessonDrag(lessonNumber, start, end);
  };

  private applyLessonDrag(lessonNumber: number, newStart: Date, newEnd: Date): void {
    const lesson = this.lessons.find((item) => item.number === lessonNumber);
    if (!lesson) {
      this.render();
      return;
    }

    const newMeta: LessonMeta = {
      ...lesson.meta,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    };
    const conflict = findOverlappingLesson(newMeta, this.lessons, lessonNumber);
    if (conflict) {
      const otherStudent = this.studentByNumber(conflict.meta.studentNumber);
      this.overlapMessage = `Пересечение с «${otherStudent?.name ?? 'учеником'}» (${formatTimeRange(conflict.meta.start, conflict.meta.end)}).`;
      this.editingLesson = null;
      this.modal = 'overlap';
      this.render();
      return;
    }

    const snapshot = this.snapshotData();
    const index = this.lessons.findIndex((item) => item.number === lessonNumber);
    if (index >= 0) {
      this.lessons[index] = { ...lesson, meta: newMeta };
    }
    this.render();
    this.syncInBackground(
      (async () => {
        const api = createPlanningApi(this.config);
        const updated = await api.updateLesson({
          number: lesson.number,
          title: lesson.title,
          notes: lesson.notes,
          meta: newMeta,
        });
        const updatedIndex = this.lessons.findIndex((item) => item.number === lessonNumber);
        if (updatedIndex >= 0) this.lessons[updatedIndex] = updated;
        this.render();
      })(),
      () => this.restoreSnapshot(snapshot),
      'Не удалось переместить занятие',
    );
  }

  private closeModal(): void {
    this.modal = null;
    this.editingStudent = null;
    this.editingLesson = null;
    this.pendingPhoto = null;
    this.pendingLessonStart = null;
    this.pendingLessonEnd = null;
    this.overlapMessage = null;
    this.modalLessonCompleted.clear();
    this.modalCourses = [];
    this.clearPhotoPreview();
    this.modalHost.innerHTML = '';
    document.body.classList.remove('modal-open');
    this.detachEscapeHandler();
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

  private submitStudentForm(form: HTMLFormElement): void {
    const input = this.readStudentInputFromForm(form);
    const photo = this.pendingPhoto;
    const previewUrl = photo ? URL.createObjectURL(photo) : undefined;
    const editing = this.editingStudent;
    const lessonUpdates = this.collectLessonCompletionUpdates();
    const snapshot = this.snapshotData();

    this.closeModal();
    this.render();

    for (const { lesson, completed } of lessonUpdates) {
      const index = this.lessons.findIndex((item) => item.number === lesson.number);
      if (index >= 0) {
        this.lessons[index] = { ...lesson, meta: { ...lesson.meta, completed } };
      }
    }

    if (editing) {
      const index = this.students.findIndex((student) => student.number === editing.number);
      if (index >= 0) {
        this.students[index] = {
          ...editing,
          name: input.name,
          notes: input.notes,
          meta: { ...input.meta, photoUrl: previewUrl ?? input.meta.photoUrl },
        };
      }
      this.render();
      this.syncInBackground(
        (async () => {
          const api = createPlanningApi(this.config);
          let student = await api.updateStudent({ ...input, number: editing.number });
          if (photo) {
            const photoUrl = await api.uploadStudentPhoto(student.number, photo);
            student = await api.updateStudent({
              ...input,
              number: student.number,
              meta: { ...input.meta, photoUrl },
            });
          }
          for (const { lesson, completed } of lessonUpdates) {
            const updatedLesson = await api.updateLesson({
              number: lesson.number,
              title: lesson.title,
              notes: lesson.notes,
              meta: { ...lesson.meta, completed },
            });
            const lessonIndex = this.lessons.findIndex((item) => item.number === lesson.number);
            if (lessonIndex >= 0) this.lessons[lessonIndex] = updatedLesson;
          }
          const updatedIndex = this.students.findIndex((item) => item.number === editing.number);
          if (updatedIndex >= 0) this.students[updatedIndex] = student;
          this.render();
        })(),
        () => this.restoreSnapshot(snapshot),
        'Не удалось сохранить ученика',
      );
      return;
    }

    const tempStudent = this.createTempStudent(input, previewUrl);
    this.students.push(tempStudent);
    this.render();
    this.syncInBackground(
      (async () => {
        const api = createPlanningApi(this.config);
        let student = await api.createStudent(input);
        if (photo) {
          const photoUrl = await api.uploadStudentPhoto(student.number, photo);
          student = await api.updateStudent({
            ...input,
            number: student.number,
            meta: { ...input.meta, photoUrl },
          });
        }
        const index = this.students.findIndex((item) => item.number === tempStudent.number);
        if (index >= 0) this.students[index] = student;
        this.render();
      })(),
      () => this.restoreSnapshot(snapshot),
      'Не удалось создать ученика',
    );
  }

  private submitLessonForm(form: HTMLFormElement): void {
    const data = new FormData(form);
    const studentNumber = Number(data.get('studentNumber'));
    const student = this.studentByNumber(studentNumber);
    const course =
      String(data.get('lessonCourse') ?? '').trim() || studentCourses(student)[0] || '';
    const meta = {
      studentNumber,
      start: fromDateInputValue(String(data.get('start'))),
      end: fromDateInputValue(String(data.get('end'))),
      course,
    };

    const conflict = findOverlappingLesson(meta, this.lessons, this.editingLesson?.number);
    if (conflict) {
      const otherStudent = this.studentByNumber(conflict.meta.studentNumber);
      this.overlapMessage = `Пересечение с «${otherStudent?.name ?? 'учеником'}» (${formatTimeRange(conflict.meta.start, conflict.meta.end)}).`;
      this.modal = 'overlap';
      this.renderModalOverlay();
      return;
    }

    const input: CreateLessonInput = {
      title: `Занятие: ${student?.name ?? 'Ученик'}`,
      notes: String(data.get('notes') ?? '').trim(),
      meta,
    };
    const editing = this.editingLesson;
    const snapshot = this.snapshotData();

    this.closeModal();
    this.render();

    if (editing) {
      const index = this.lessons.findIndex((lesson) => lesson.number === editing.number);
      if (index >= 0) {
        this.lessons[index] = {
          ...editing,
          title: input.title,
          notes: input.notes,
          meta: input.meta,
        };
      }
      this.render();
      this.syncInBackground(
        (async () => {
          const api = createPlanningApi(this.config);
          const lesson = await api.updateLesson({ ...input, number: editing.number });
          const updatedIndex = this.lessons.findIndex((item) => item.number === editing.number);
          if (updatedIndex >= 0) this.lessons[updatedIndex] = lesson;
          this.render();
        })(),
        () => this.restoreSnapshot(snapshot),
        'Не удалось сохранить занятие',
      );
      return;
    }

    const tempLesson = this.createTempLesson(input);
    this.lessons.push(tempLesson);
    this.render();
    this.syncInBackground(
      (async () => {
        const api = createPlanningApi(this.config);
        const lesson = await api.createLesson(input);
        const index = this.lessons.findIndex((item) => item.number === tempLesson.number);
        if (index >= 0) this.lessons[index] = lesson;
        this.render();
      })(),
      () => this.restoreSnapshot(snapshot),
      'Не удалось создать занятие',
    );
  }

  private deleteLesson(number: number): void {
    if (!confirm('Отменить занятие (issue будет закрыт)?')) return;
    const snapshot = this.snapshotData();
    this.closeModal();
    this.lessons = this.lessons.filter((lesson) => lesson.number !== number);
    this.render();
    this.syncInBackground(
      createPlanningApi(this.config).deleteLesson(number).then(() => undefined),
      () => this.restoreSnapshot(snapshot),
      'Не удалось удалить занятие',
    );
  }

  private deleteStudentWithLessons(number: number): void {
    const student = this.students.find((item) => item.number === number);
    if (!student) return;
    const lessonNumbers = this.lessons
      .filter((lesson) => lesson.state === 'open' && lesson.meta.studentNumber === number)
      .map((lesson) => lesson.number);
    const message =
      lessonNumbers.length > 0
        ? `Удалить ученика «${student.name}» и закрыть ${lessonNumbers.length} занятий?`
        : `Удалить ученика «${student.name}»?`;
    if (!confirm(message)) return;

    const snapshot = this.snapshotData();
    this.closeModal();
    this.students = this.students.filter((item) => item.number !== number);
    this.lessons = this.lessons.filter((lesson) => lesson.meta.studentNumber !== number);
    this.render();
    this.syncInBackground(
      (async () => {
        const api = createPlanningApi(this.config);
        for (const lessonNumber of lessonNumbers) {
          await api.deleteLesson(lessonNumber);
        }
        await api.deleteStudent(number);
      })(),
      () => this.restoreSnapshot(snapshot),
      'Не удалось удалить ученика',
    );
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

function formatCompactTimeRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return `${new Date(start).toLocaleTimeString('ru-RU', opts)}–${new Date(end).toLocaleTimeString('ru-RU', opts)}`;
}

function formatLessonBlockLabel(name: string, start: string, end: string): string {
  return `${name} ${formatCompactTimeRange(start, end)}`;
}

function isLessonHappeningNow(lesson: Lesson, selectedDay: Date): boolean {
  const now = new Date();
  if (!sameDay(selectedDay, now)) return false;
  const start = new Date(lesson.meta.start);
  const end = new Date(lesson.meta.end);
  return now >= start && now < end;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}

function formatLessonDateTime(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const datePart = startDate.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const timePart = `${startDate.toLocaleTimeString('ru-RU', timeOpts)} – ${endDate.toLocaleTimeString('ru-RU', timeOpts)}`;
  return `${datePart}, ${timePart}`;
}

function renderPaymentSummaryMarkup(summary: PaymentSummary): string {
  const balanceLine =
    summary.overpayment > 0
      ? `<p class="payment-summary__row payment-summary__row--overpay"><span>Переплата</span><strong>${formatMoney(summary.overpayment)}</strong></p>`
      : `<p class="payment-summary__row payment-summary__row--debt"><span>Остаток</span><strong>${formatMoney(summary.remainder)}</strong></p>`;
  return `
    <div class="payment-summary" data-payment-summary>
      <p class="payment-summary__row"><span>Занятий</span><strong>${summary.completedLessons} / ${summary.totalLessons} проведено</strong></p>
      <p class="payment-summary__row payment-summary__row--highlight"><span>Сейчас к оплате</span><strong>${formatMoney(summary.dueNow)}</strong></p>
      <p class="payment-summary__row"><span>Уже внесено</span><strong>${formatMoney(summary.paid)}</strong></p>
      ${balanceLine}
    </div>
  `;
}

function renderPhoneLink(phone?: string): string {
  const value = phone?.trim();
  if (!value) return '';
  const href = `tel:${normalizeTel(value)}`;
  return `<a class="btn btn--ghost btn--sm contact-link" href="${escapeAttr(href)}">Позвонить</a>`;
}

function renderMessageLink(url?: string, label = 'Написать'): string {
  const value = url?.trim();
  if (!value) return '';
  return `<a class="btn btn--ghost btn--sm contact-link" href="${escapeAttr(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
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
