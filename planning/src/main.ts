import { PlanningApp } from './app';
import './style.css';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Не найден корневой элемент #app');
}

new PlanningApp(root);
