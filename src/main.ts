import './style.css';
import { Game } from './game';

function showFatal(detail: string): void {
  const card = document.getElementById('card');
  const overlay = document.getElementById('overlay');
  if (!card || !overlay) return;
  card.innerHTML = `
    <p class="card__kicker">Что-то упало не туда</p>
    <h2 class="card__title">Кот сломал игру 🙀</h2>
    <p class="card__text">
      Похоже, он свалил со стола что-то важное. Обнови страницу — обычно помогает.
    </p>
    <pre class="card__error"></pre>
    <button class="card__button" type="button">Обновить страницу</button>
  `;
  const pre = card.querySelector('.card__error');
  if (pre) pre.textContent = detail;
  card.querySelector('.card__button')?.addEventListener('click', () => location.reload());
  overlay.dataset.open = 'true';
}

window.addEventListener('error', (event) => showFatal(event.message));
window.addEventListener('unhandledrejection', (event) => showFatal(String(event.reason)));

try {
  new Game().start();
} catch (error) {
  showFatal(error instanceof Error ? error.message : String(error));
}
