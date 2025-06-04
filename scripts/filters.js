import { getTransactions } from './storage.js';
import { translateAccount, formatCOP } from './components/utils.js';

export function setupFilters() {
  const yearButtonsContainer = document.getElementById('year-buttons');
  const monthButtons = document.querySelectorAll('.month-buttons button');
  const currentFilterDisplay = document.getElementById('current-filter');

  const transactions = getTransactions();
  const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
  const currentYear = new Date().getFullYear();

  // Añadir el año actual
  years.add(currentYear);

  // Crear botones de año
  years.forEach(year => {
    const button = document.createElement('button');
    button.textContent = year;
    button.dataset.year = year;
    if (year === currentYear) button.classList.add('active');
    yearButtonsContainer.appendChild(button);
  });

  // Activar el mes actual
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  monthButtons.forEach(button => {
    if (button.dataset.month === currentMonth) {
      button.classList.add('active');
    }
  });

  updateCurrentFilterDisplay(currentYear, currentMonth);

  // Event listeners para filtrar
  yearButtonsContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const activeYearButton = document.querySelector('.year-buttons .active');
      if (activeYearButton) activeYearButton.classList.remove('active');
      e.target.classList.add('active');
      updateCurrentFilterDisplay(e.target.dataset.year, document.querySelector('.month-buttons .active').dataset.month);
      filterTransactions();
    }
  });

  monthButtons.forEach(button => {
    button.addEventListener('click', () => {
      const activeMonthButton = document.querySelector('.month-buttons .active');
      if (activeMonthButton) activeMonthButton.classList.remove('active');
      button.classList.add('active');
      updateCurrentFilterDisplay(document.querySelector('.year-buttons .active').dataset.year, button.dataset.month);
      filterTransactions();
    });
  });
}

function filterTransactions() {
  const activeYear = document.querySelector('.year-buttons .active').dataset.year;
  const activeMonth = document.querySelector('.month-buttons .active').dataset.month;
  const transactions = getTransactions();
  const filtered = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getFullYear() == activeYear && String(date.getMonth() + 1).padStart(2, '0') == activeMonth;
  });
  renderFilteredTransactions(filtered);
}

function renderFilteredTransactions(transactions) {
  const container = document.getElementById('transactions-container');
  container.innerHTML = '';
  transactions.forEach(tx => {
    const li = document.createElement('li');
    li.classList.add(tx.type);
    li.innerHTML = `
      <div class="tx-left">
        <div class="tx-icon">${tx.type === "income" ? "💰" : "💸"}</div>
        <div class="tx-details">
          <div class="tx-category">${tx.category}</div>
          <div class="tx-account">${translateAccount(tx.account)}</div>
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amount">${formatCOP(tx.amount)}</div>
        <div class="tx-date">${tx.date}</div>
      </div>
    `;
    container.appendChild(li);
  });
}

function updateCurrentFilterDisplay(year, month) {
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const currentFilterDisplay = document.getElementById('current-filter');
  currentFilterDisplay.textContent = `Mostrando: ${monthNames[parseInt(month, 10) - 1]} ${year}`;
}
