import {
  CAT_BUSTED_LINES,
  CAT_HAPPY_LINES,
  ITEMS,
  OWNER_CATCH_LINES,
  OWNER_SUSPICIOUS_LINES,
  OWNER_WORK_LINES,
  RESPAWN_LINES,
  rankFor,
} from './data';
import type { Item } from './data';
import { isMuted, sfx, toggleMuted, unlock } from './audio';

const SLOT_COUNT = 5;
const ROUND_MS = 60_000;
const MAX_LIVES = 3;
const STUN_MS = 1300;
const MAX_MULTIPLIER = 5;
const BEST_KEY = 'kot-vreditel:best';

type Phase = 'work' | 'suspicious' | 'watch';
type Mode = 'menu' | 'playing' | 'over';

type Slot = {
  index: number;
  button: HTMLButtonElement;
  itemEl: HTMLSpanElement;
  item: Item | null;
  respawnAt: number;
  busy: boolean;
};

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Не найден элемент #${id}`);
  return node as T;
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, t));
}

function weightedItem(exclude: Item | null): Item {
  const pool = ITEMS.filter((item) => item !== exclude);
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of pool) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return pool[0];
}

export class Game {
  private readonly stage = el<HTMLElement>('stage');
  private readonly slotsRoot = el<HTMLElement>('slots');
  private readonly scoreEl = el<HTMLElement>('score');
  private readonly timerEl = el<HTMLElement>('timer');
  private readonly livesEl = el<HTMLElement>('lives');
  private readonly comboEl = el<HTMLElement>('combo');
  private readonly comboBox = el<HTMLElement>('combo-box');
  private readonly ownerFace = el<HTMLElement>('owner-face');
  private readonly ownerBubble = el<HTMLElement>('owner-bubble');
  private readonly catFace = el<HTMLElement>('cat-face');
  private readonly catBubble = el<HTMLElement>('cat-bubble');
  private readonly debris = el<HTMLElement>('debris');
  private readonly fx = el<HTMLElement>('fx');
  private readonly toasts = el<HTMLElement>('toasts');
  private readonly overlay = el<HTMLElement>('overlay');
  private readonly card = el<HTMLElement>('card');
  private readonly soundToggle = el<HTMLButtonElement>('sound-toggle');
  private readonly soundIcon = el<HTMLElement>('sound-icon');

  private slots: Slot[] = [];
  private mode: Mode = 'menu';
  private score = 0;
  private lives = MAX_LIVES;
  private streak = 0;
  private multiplier = 1;
  private dropped = 0;
  private timeLeft = ROUND_MS;
  private phase: Phase = 'work';
  private phaseEndsAt = 0;
  private stunUntil = 0;
  private lastSecondShown = -1;
  private lastFrame = 0;
  private timers = new Set<number>();

  start(): void {
    this.buildSlots();
    this.bindControls();
    this.syncSoundButton();
    this.renderLives();
    this.showMenu();
    requestAnimationFrame(this.frame);
  }

  private buildSlots(): void {
    this.slotsRoot.replaceChildren();
    this.slots = Array.from({ length: SLOT_COUNT }, (_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slot';
      button.dataset.index = String(index);
      button.setAttribute('aria-label', `Место ${index + 1} на столе`);

      const itemEl = document.createElement('span');
      itemEl.className = 'slot__item';
      const hint = document.createElement('span');
      hint.className = 'slot__key';
      hint.textContent = String(index + 1);
      button.append(itemEl, hint);

      button.addEventListener('click', () => this.push(index));
      this.slotsRoot.append(button);

      return { index, button, itemEl, item: null, respawnAt: 0, busy: false } satisfies Slot;
    });
  }

  private bindControls(): void {
    this.soundToggle.addEventListener('click', () => {
      const nowMuted = toggleMuted();
      this.syncSoundButton();
      if (!nowMuted) {
        unlock();
        sfx.swipe();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      const slotIndex = Number(event.key) - 1;
      if (Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < SLOT_COUNT) {
        event.preventDefault();
        this.push(slotIndex);
        return;
      }
      if ((event.key === 'Enter' || event.key === ' ') && this.mode !== 'playing') {
        const action = this.card.querySelector<HTMLButtonElement>('.card__button');
        if (action) {
          event.preventDefault();
          action.click();
        }
      }
    });
  }

  private syncSoundButton(): void {
    const muted = isMuted();
    this.soundIcon.textContent = muted ? '🔇' : '🔊';
    this.soundToggle.setAttribute('aria-pressed', muted ? 'false' : 'true');
    this.soundToggle.title = muted ? 'Включить звук' : 'Выключить звук';
  }

  private showMenu(): void {
    this.mode = 'menu';
    this.card.innerHTML = `
      <p class="card__kicker">Аркада про кота и гравитацию</p>
      <h1 class="card__title">Кот-вредитель</h1>
      <p class="card__text">
        Хозяин работает. На столе стоят его вещи. Всё это, по мнению кота, — ошибка,
        которую нужно исправить.
      </p>
      <ul class="card__list">
        <li><b>Жми на вещи</b>, чтобы сбросить их со стола. Или клавиши <kbd>1</kbd>–<kbd>5</kbd>.</li>
        <li>Когда хозяин <b>отвернулся</b> (🧑‍💻) — можно всё.</li>
        <li>Он оборачивается с 🤨, а потом смотрит прямо на тебя (👀). Тогда лапы прочь.</li>
        <li>Поймает трижды — выгонит в коридор. У тебя <b>60 секунд</b>.</li>
      </ul>
      <button class="card__button" type="button">Начать хаос</button>
      <p class="card__footnote">Ни одна кружка не пострадала. Только виртуальные.</p>
    `;
    this.card.querySelector('.card__button')?.addEventListener('click', () => this.beginRound());
    this.overlay.dataset.open = 'true';
  }

  private beginRound(): void {
    unlock();
    this.clearTimers();
    this.mode = 'playing';
    this.score = 0;
    this.lives = MAX_LIVES;
    this.streak = 0;
    this.multiplier = 1;
    this.dropped = 0;
    this.timeLeft = ROUND_MS;
    this.stunUntil = 0;
    this.lastSecondShown = -1;
    this.debris.replaceChildren();
    this.toasts.replaceChildren();
    this.catBubble.textContent = '';
    this.catBubble.dataset.show = 'false';
    this.catFace.textContent = '😺';
    this.stage.classList.remove('is-suspicious', 'is-watching', 'is-stunned');
    this.overlay.dataset.open = 'false';
    this.renderScore();
    this.renderLives();
    this.renderCombo();

    const now = performance.now();
    this.slots.forEach((slot, i) => {
      slot.busy = false;
      slot.item = null;
      slot.itemEl.textContent = '';
      slot.itemEl.className = 'slot__item';
      slot.respawnAt = now + i * 90;
    });
    this.enterPhase('work', now);
    this.toast('Хозяин ничего не подозревает. Пока.', 'neutral');
  }

  private frame = (now: number): void => {
    const delta = this.lastFrame ? now - this.lastFrame : 16;
    this.lastFrame = now;
    if (this.mode === 'playing') this.update(now, delta);
    requestAnimationFrame(this.frame);
  };

  private update(now: number, delta: number): void {
    this.timeLeft = Math.max(0, this.timeLeft - delta);
    const seconds = Math.ceil(this.timeLeft / 1000);
    if (seconds !== this.lastSecondShown) {
      this.lastSecondShown = seconds;
      this.timerEl.textContent = String(seconds);
      this.timerEl.classList.toggle('is-urgent', seconds <= 10);
      if (seconds <= 5 && seconds > 0) {
        sfx.tick();
        this.timerEl.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
          { duration: 260, easing: 'ease-out' },
        );
      }
    }

    if (now >= this.phaseEndsAt) this.advancePhase(now);

    if (this.stunUntil && now >= this.stunUntil) {
      this.stunUntil = 0;
      this.stage.classList.remove('is-stunned');
      this.catFace.textContent = '😺';
      this.catBubble.dataset.show = 'false';
    }

    for (const slot of this.slots) {
      if (!slot.item && !slot.busy && now >= slot.respawnAt) this.fillSlot(slot);
    }

    if (this.timeLeft === 0) this.endRound('time');
  }

  private advancePhase(now: number): void {
    const next: Phase = this.phase === 'work' ? 'suspicious' : this.phase === 'suspicious' ? 'watch' : 'work';
    this.enterPhase(next, now);
  }

  private enterPhase(phase: Phase, now: number): void {
    this.phase = phase;
    const progress = 1 - this.timeLeft / ROUND_MS;
    this.stage.classList.toggle('is-suspicious', phase === 'suspicious');
    this.stage.classList.toggle('is-watching', phase === 'watch');

    if (phase === 'work') {
      const base = lerp(2500, 1150, progress);
      this.phaseEndsAt = now + rand(base * 0.75, base * 1.25);
      this.ownerFace.textContent = '🧑‍💻';
      this.say(Math.random() < 0.45 ? pick(OWNER_WORK_LINES) : '');
    } else if (phase === 'suspicious') {
      this.phaseEndsAt = now + lerp(640, 420, progress);
      this.ownerFace.textContent = '🤨';
      this.say(pick(OWNER_SUSPICIOUS_LINES));
      sfx.suspicious();
    } else {
      const base = lerp(950, 1550, progress);
      this.phaseEndsAt = now + rand(base * 0.85, base * 1.15);
      this.ownerFace.textContent = '👀';
      this.say('');
    }
  }

  private say(text: string): void {
    this.ownerBubble.textContent = text;
    this.ownerBubble.dataset.show = text ? 'true' : 'false';
    this.ownerBubble.classList.remove('is-shout');
  }

  private shout(text: string): void {
    this.ownerBubble.textContent = text;
    this.ownerBubble.dataset.show = 'true';
    this.ownerBubble.classList.add('is-shout');
  }

  private fillSlot(slot: Slot): void {
    const item = weightedItem(slot.item);
    slot.item = item;
    slot.itemEl.textContent = item.emoji;
    slot.itemEl.className = 'slot__item is-placed';
    slot.button.setAttribute('aria-label', `${item.name} — сбросить со стола`);
    slot.button.dataset.value = item.points >= 30 ? 'high' : 'normal';
    if (Math.random() < 0.1) this.toast(pick(RESPAWN_LINES), 'neutral');
  }

  private push(index: number): void {
    if (this.mode !== 'playing') return;
    const slot = this.slots[index];
    if (!slot || !slot.item || slot.busy) return;

    unlock();

    if (this.stunUntil) {
      this.nudge(slot.button);
      return;
    }

    if (this.phase === 'watch') {
      this.caught(slot);
      return;
    }

    const item = slot.item;
    slot.busy = true;
    this.streak += 1;
    const nextMultiplier = Math.min(MAX_MULTIPLIER, 1 + Math.floor(this.streak / 3));
    if (nextMultiplier > this.multiplier) {
      this.multiplier = nextMultiplier;
      sfx.combo(nextMultiplier);
      this.comboBox.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(-3deg)' }, { transform: 'scale(1)' }],
        { duration: 320, easing: 'ease-out' },
      );
    }
    const gained = item.points * this.multiplier;
    this.score += gained;
    this.dropped += 1;
    this.renderScore();
    this.renderCombo();

    sfx.swipe();
    this.paw(slot);
    slot.itemEl.classList.remove('is-placed');
    slot.itemEl.classList.add('is-falling');
    slot.itemEl.style.setProperty('--spin', `${rand(-540, 540)}deg`);
    slot.itemEl.style.setProperty('--drift', `${rand(-40, 40)}px`);
    this.floatScore(slot, `+${gained}`);
    this.catFace.textContent = '😼';

    this.after(150, () => {
      if (item.points >= 60) sfx.jackpot();
      sfx.drop();
      this.shake(this.stage, item.points >= 30 ? 8 : 4);
    });

    this.after(520, () => {
      this.addDebris(item);
      slot.itemEl.textContent = '';
      slot.itemEl.className = 'slot__item';
      slot.itemEl.style.removeProperty('--spin');
      slot.itemEl.style.removeProperty('--drift');
      slot.item = null;
      slot.busy = false;
      slot.button.removeAttribute('data-value');
      slot.button.setAttribute('aria-label', `Место ${slot.index + 1} на столе`);
      slot.respawnAt = performance.now() + rand(700, 1800);
      if (!this.stunUntil) this.catFace.textContent = '😺';
    });

    this.toast(`${item.name}: ${pick(item.quips)}`, 'good');
    if (this.streak > 0 && this.streak % 4 === 0) this.catSay(pick(CAT_HAPPY_LINES));
  }

  private caught(slot: Slot): void {
    this.lives -= 1;
    this.streak = 0;
    this.multiplier = 1;
    this.stunUntil = performance.now() + STUN_MS;
    this.renderLives();
    this.renderCombo();
    this.stage.classList.add('is-stunned');
    this.nudge(slot.button);
    this.shake(this.stage, 14);
    this.shout(pick(OWNER_CATCH_LINES));
    this.catFace.textContent = '🙀';
    sfx.caught();
    this.toast('Пойман с поднятой лапой.', 'bad');

    this.after(520, () => {
      if (this.mode !== 'playing') return;
      this.catFace.textContent = '😽';
      this.catSay(pick(CAT_BUSTED_LINES));
    });

    if (this.lives <= 0) this.after(700, () => this.endRound('caught'));
  }

  private endRound(reason: 'time' | 'caught'): void {
    if (this.mode !== 'playing') return;
    this.mode = 'over';
    this.clearTimers();
    this.stage.classList.remove('is-suspicious', 'is-watching', 'is-stunned');
    this.catFace.textContent = reason === 'caught' ? '😾' : '😸';
    this.ownerFace.textContent = reason === 'caught' ? '😤' : '🫠';
    this.say(reason === 'caught' ? 'ВОН ИЗ КАБИНЕТА' : 'кто это сделал…');
    sfx.gameOver();

    const best = Math.max(this.score, Number(localStorage.getItem(BEST_KEY) ?? 0));
    localStorage.setItem(BEST_KEY, String(best));
    const rank = rankFor(this.score);
    const isRecord = this.score > 0 && this.score >= best;

    this.card.innerHTML = `
      <p class="card__kicker">${reason === 'caught' ? 'Тебя выгнали в коридор' : 'Рабочий день закончился'}</p>
      <h2 class="card__title">${rank.title}</h2>
      <p class="card__text">${rank.note}</p>
      <div class="card__stats">
        <div class="stat"><span class="stat__value">${this.score}</span><span class="stat__label">хаоса</span></div>
        <div class="stat"><span class="stat__value">${this.dropped}</span><span class="stat__label">вещей на полу</span></div>
        <div class="stat"><span class="stat__value">${best}</span><span class="stat__label">рекорд</span></div>
      </div>
      ${isRecord ? '<p class="card__record">Новый рекорд! Кот доволен собой.</p>' : ''}
      <button class="card__button" type="button">Ещё раз</button>
      <p class="card__footnote">${
        reason === 'caught'
          ? 'Совет: пока хозяин с 👀 — лапы при себе.'
          : 'Совет: три вещи подряд без промаха — и множитель растёт.'
      }</p>
    `;
    this.card.querySelector('.card__button')?.addEventListener('click', () => this.beginRound());
    this.overlay.dataset.open = 'true';
  }

  private renderScore(): void {
    this.scoreEl.textContent = String(this.score);
    this.scoreEl.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], {
      duration: 180,
      easing: 'ease-out',
    });
  }

  private renderLives(): void {
    this.livesEl.replaceChildren();
    for (let i = 0; i < MAX_LIVES; i += 1) {
      const heart = document.createElement('span');
      heart.className = i < this.lives ? 'life' : 'life is-lost';
      heart.textContent = i < this.lives ? '❤️' : '💔';
      this.livesEl.append(heart);
    }
  }

  private renderCombo(): void {
    this.comboEl.textContent = `x${this.multiplier}`;
    this.comboBox.hidden = this.multiplier <= 1;
    this.comboBox.dataset.level = String(this.multiplier);
  }

  private catSay(text: string): void {
    this.catBubble.textContent = text;
    this.catBubble.dataset.show = 'true';
    this.after(1400, () => {
      if (this.catBubble.textContent === text) this.catBubble.dataset.show = 'false';
    });
  }

  private paw(slot: Slot): void {
    const paw = document.createElement('span');
    paw.className = 'paw';
    paw.textContent = '🐾';
    const rect = slot.button.getBoundingClientRect();
    const stageRect = this.stage.getBoundingClientRect();
    paw.style.left = `${rect.left - stageRect.left + rect.width / 2}px`;
    paw.style.top = `${rect.bottom - stageRect.top}px`;
    this.fx.append(paw);
    this.after(420, () => paw.remove());
  }

  private floatScore(slot: Slot, text: string): void {
    const bubble = document.createElement('span');
    bubble.className = 'float-score';
    bubble.textContent = text;
    const rect = slot.button.getBoundingClientRect();
    const stageRect = this.stage.getBoundingClientRect();
    bubble.style.left = `${rect.left - stageRect.left + rect.width / 2}px`;
    bubble.style.top = `${rect.top - stageRect.top}px`;
    this.fx.append(bubble);
    this.after(900, () => bubble.remove());
  }

  private addDebris(item: Item): void {
    const piece = document.createElement('span');
    piece.className = 'debris__piece';
    piece.textContent = item.emoji;
    piece.style.left = `${rand(4, 92)}%`;
    piece.style.setProperty('--tilt', `${rand(-70, 70)}deg`);
    piece.style.setProperty('--depth', `${rand(-6, 10)}px`);
    this.debris.append(piece);
    while (this.debris.childElementCount > 36) this.debris.firstElementChild?.remove();
  }

  private nudge(target: HTMLElement): void {
    target.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 180, easing: 'ease-in-out' },
    );
  }

  private shake(target: HTMLElement, amount: number): void {
    target.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: `translate(${amount}px, ${amount / 2}px)` },
        { transform: `translate(${-amount}px, ${-amount / 3}px)` },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 240, easing: 'ease-out' },
    );
  }

  private toast(text: string, tone: 'good' | 'bad' | 'neutral'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast--${tone}`;
    toast.textContent = text;
    this.toasts.append(toast);
    while (this.toasts.childElementCount > 3) this.toasts.firstElementChild?.remove();
    this.after(2400, () => {
      toast.dataset.hide = 'true';
      this.after(320, () => toast.remove());
    });
  }

  private after(ms: number, action: () => void): void {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      action();
    }, ms);
    this.timers.add(id);
  }

  private clearTimers(): void {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers.clear();
  }
}
