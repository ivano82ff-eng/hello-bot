import { PlanningApp } from './app';
import { applyTheme, loadTheme } from './theme';
import './style.css';

applyTheme(loadTheme());

const root = document.getElementById('app');
if (!root) {
  throw new Error('Не найден корневой элемент #app');
}

new PlanningApp(root);
