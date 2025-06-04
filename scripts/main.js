import { switchView } from './ui.js';
import { setupTransactionForm } from './finance.js';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-view');
      switchView(target);
    });
  });

  setupTransactionForm();
});
