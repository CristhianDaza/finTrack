import { switchView } from './ui.js';
import { setupTransactionForm, filterTransactions } from './transactions.js';
import { setupDebtForm, renderDebtList } from './debts.js';
import { renderAccounts, updateAccountSelect, setupAccountForm } from './accounts.js';
import { setupDashboard } from './dashboard.js';
import { setupFilters } from './filters.js';

const toggleModal = (modalId, action) => {
  const modal = document.getElementById(modalId);
  modal.style.display = action === 'open' ? 'block' : 'none';
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-view');
      switchView(target);
    
      if (target === 'dashboard') {
        setupDashboard();
      }
    
      document.querySelectorAll('[data-view]').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  document.querySelector('[data-view="dashboard"]')?.classList.add('active');

  setupTransactionForm();
  setupDebtForm();
  setupFilters();
  setupDashboard();
  renderDebtList();
  renderAccounts();
  updateAccountSelect();
  setupAccountForm();

  const currentYear = new Date().getFullYear();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  document.querySelector(`[data-year="${currentYear}"]`)?.classList.add('active');
  document.querySelector(`[data-month="${currentMonth}"]`)?.classList.add('active');
  filterTransactions();

  document.getElementById('add-transaction-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('transaction-form').reset();
    toggleModal('transaction-modal', 'open');
  });

  document.querySelector('#transaction-modal .close-btn')?.addEventListener('click', () => {
    toggleModal('transaction-modal', 'close');
  });

  document.getElementById('add-debt-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('debt-form').reset();
    toggleModal('debt-modal', 'open');
  });

  document.querySelector('#debt-modal .close-btn')?.addEventListener('click', () => {
    toggleModal('debt-modal', 'close');
  });

  document.getElementById('add-account-btn')?.addEventListener('click', () => {
    document.getElementById('account-modal').style.display = 'block';
  });

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
    });
  });

  document.querySelector('.hamburger')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('open');
  });

  document.querySelectorAll('.sidebar nav button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.remove('open');
    });
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registrado:', reg))
      .catch(err => console.log('Error SW:', err));
  });
}
