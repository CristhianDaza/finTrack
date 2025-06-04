import { switchView } from './ui.js';

document.querySelectorAll('[data-view]').forEach(button => {
  button.addEventListener('click', () => {
    const target = button.getAttribute('data-view');
    switchView(target);
  });
});
