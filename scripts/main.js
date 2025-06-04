import { switchView } from './ui.js';
import { setupTransactionForm, editingTransactionId } from './finance.js';
import { setupFilters } from './filters.js';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-view');
      switchView(target);

      // Remove active class from all buttons
      document.querySelectorAll('[data-view]').forEach(btn => btn.classList.remove('active'));

      // Add active class to the clicked button
      button.classList.add('active');
    });
  });

  // Highlight the default active button (Dashboard)
  const defaultActiveButton = document.querySelector('[data-view="dashboard"]');
  if (defaultActiveButton) {
    defaultActiveButton.classList.add('active');
  }

  setupTransactionForm();
  setupFilters();

  const modal = document.getElementById('transaction-modal');
  const addTransactionBtn = document.getElementById('add-transaction-btn');
  const closeBtn = modal.querySelector('.close-btn');

  addTransactionBtn.addEventListener('click', () => {
    const form = document.getElementById('transaction-form');
    form.reset();
    modal.style.display = 'block';
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  });
});
