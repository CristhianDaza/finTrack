import { getTransactions } from './storage.js';
import { translateAccount, formatCOP } from './components/utils.js';

const activateButton = (button, selector) => {
  const activeButton = document.querySelector(selector);
  if (activeButton) activeButton.classList.remove('active');
  button.classList.add('active');
};

export const setupFilters = () => {
  const yearButtonsContainer = document.getElementById('year-buttons');
  const monthButtons = document.querySelectorAll('.month-buttons button');

  const transactions = getTransactions();
  const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
  const currentYear = new Date().getFullYear();

  years.add(currentYear);

  years.forEach(year => {
    const button = document.createElement('button');
    button.textContent = year;
    button.dataset.year = year;
    if (year === currentYear) button.classList.add('active');
    yearButtonsContainer.appendChild(button);
  });

  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  monthButtons.forEach(button => {
    if (button.dataset.month === currentMonth) {
      button.classList.add('active');
    }
  });

  updateCurrentFilterDisplay(currentYear, currentMonth);

  yearButtonsContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      activateButton(e.target, '.year-buttons .active');
      updateCurrentFilterDisplay(e.target.dataset.year, document.querySelector('.month-buttons .active').dataset.month);
      filterTransactions();
    }
  });

  monthButtons.forEach(button => {
    button.addEventListener('click', () => {
      activateButton(button, '.month-buttons .active');
      updateCurrentFilterDisplay(document.querySelector('.year-buttons .active').dataset.year, button.dataset.month);
      filterTransactions();
    });
  });
}

const filterTransactions = () => {
  const activeYear = document.querySelector('.year-buttons .active').dataset.year;
  const activeMonth = document.querySelector('.month-buttons .active').dataset.month;
  const transactions = getTransactions();
  const filtered = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getFullYear() == activeYear && String(date.getMonth() + 1).padStart(2, '0') == activeMonth;
  });
  renderFilteredTransactions(filtered);
}

const renderFilteredTransactions = (transactions) => {
  const container = document.getElementById('transactions-container');
  container.innerHTML = '';
  transactions.forEach(tx => {
    const li = document.createElement('li');
    li.classList.add(tx.type);
    li.innerHTML = `
      <div class="tx-left">
        <div class="tx-icon">${tx.type === "income" ? "💰" : tx.type === "debt-payment" ? "📝" : "💸"}</div>
        <div class="tx-details">
          <div class="tx-category">${tx.category}</div>
          <div class="tx-account">${translateAccount(tx.account)}</div>
          <div class="tx-description">${tx.description}</div>
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amount">${formatCOP(tx.amount)}</div>
        <div class="tx-date">${tx.date}</div>
        <button class="edit-btn" data-id="${tx.id}">Editar</button>
        <button class="delete-btn" data-id="${tx.id}">Eliminar</button>
      </div>
    `;
    container.appendChild(li);
  });
}

const updateCurrentFilterDisplay = (year, month) => {
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const currentFilterDisplay = document.getElementById('current-filter');
  currentFilterDisplay.textContent = `Mostrando: ${monthNames[parseInt(month, 10) - 1]} ${year}`;
}
