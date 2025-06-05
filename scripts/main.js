import { switchView } from './ui.js';
import { setupTransactionForm, editingTransactionId, setupDebtForm, renderDebtList, filterTransactions } from './finance.js';
import { setupFilters } from './filters.js';

const toggleModal = (modalId, action) => {
  const modal = document.getElementById(modalId);
  if (action === 'open') {
    modal.style.display = 'block';
  } else if (action === 'close') {
    modal.style.display = 'none';
  }
};

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

  const currentYear = new Date().getFullYear();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  document.querySelector(`[data-year="${currentYear}"]`).classList.add('active');
  document.querySelector(`[data-month="${currentMonth}"]`).classList.add('active');
  filterTransactions();

  const addTransactionBtn = document.getElementById('add-transaction-btn');
  const closeTransactionModalBtn = document.querySelector('#transaction-modal .close-btn');

  addTransactionBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const form = document.getElementById('transaction-form');
    form.reset();
    toggleModal('transaction-modal', 'open');
  });

  closeTransactionModalBtn.addEventListener('click', () => {
    toggleModal('transaction-modal', 'close');
  });

  window.addEventListener('click', (event) => {
    if (event.target == document.getElementById('transaction-modal')) {
      toggleModal('transaction-modal', 'close');
    }
  });

  const addDebtBtn = document.getElementById('add-debt-btn');
  const closeDebtModalBtn = document.querySelector('#debt-modal .close-btn');

  addDebtBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const form = document.getElementById('debt-form');
    form.reset();
    toggleModal('debt-modal', 'open');
  });

  closeDebtModalBtn.addEventListener('click', () => {
    toggleModal('debt-modal', 'close');
  });

  window.addEventListener('click', (event) => {
    if (event.target == document.getElementById('debt-modal')) {
      toggleModal('debt-modal', 'close');
    }
  });

  document.getElementById('add-account-btn').addEventListener('click', () => {
    document.getElementById('account-modal').style.display = 'block';
  });

  document.getElementById('account-form').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('account-modal').style.display = 'none';
  });

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
    });
  });
});
