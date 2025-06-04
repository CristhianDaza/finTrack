import { switchView } from './ui.js';
import { setupTransactionForm, editingTransactionId, setupDebtForm, renderDebtList } from './finance.js';
import { setupFilters } from './filters.js';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-view');
      switchView(target);

      document.querySelectorAll('[data-view]').forEach(btn => btn.classList.remove('active'));

      button.classList.add('active');
    });
  });

  const defaultActiveButton = document.querySelector('[data-view="dashboard"]');
  if (defaultActiveButton) {
    defaultActiveButton.classList.add('active');
  }

  setupTransactionForm();
  setupDebtForm();
  setupFilters();
  renderDebtList();

  const modal = document.getElementById('transaction-modal');
  const addTransactionBtn = document.getElementById('add-transaction-btn');
  const closeBtn = modal.querySelector('.close-btn');

  addTransactionBtn.addEventListener('click', (e) => {
    e.preventDefault();
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

  const debtModal = document.getElementById('debt-modal');
  const addDebtBtn = document.getElementById('add-debt-btn');
  const closeDebtBtn = debtModal.querySelector('.close-btn');

  addDebtBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const form = document.getElementById('debt-form');
    form.reset();
    debtModal.style.display = 'block';
  });

  closeDebtBtn.addEventListener('click', () => {
    debtModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target == debtModal) {
      debtModal.style.display = 'none';
    }
  });
});
