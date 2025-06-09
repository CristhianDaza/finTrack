import {
  saveTransaction,
  getTransactions,
  deleteTransaction as deleteTransactionStorage,
  updateTransaction,
  getAccounts,
  saveAccounts,
  getDebts
} from './storage.js';
import { NotificationService } from './components/notification.js';
import { translateAccount, formatCOP } from './utils.js';
import { updateDashboard } from './dashboard.js';
import { renderDebtList } from './debts.js';
import { renderAccounts } from './accounts.js';

let editingTransactionId = null;
let transactionToDelete = null;
let formSubmitHandler;

export const setupTransactionForm = () => {
  const typeSelect = document.getElementById("type");
  const categorySelect = document.getElementById("category");
  const accountSelect = document.getElementById("account");
  const debtSelect = document.getElementById("debt-select");
  const amountInput = document.getElementById("amount");
  const dateInput = document.getElementById("date");
  const descriptionInput = document.getElementById("description");
  const form = document.getElementById("transaction-form");

  const categories = {
    income: ["Salario", "Freelance", "Prestamo", "Intereses", "Dividendos", "Regalos", "Venta", "Otros"],
    expense: ["Gastos", "Comida", "Educacion", "Transporte", "Salud", "Entretenimiento", "Ropa", "Viajes", "Hogar", "Servicios", "Impuestos", "Jardín", "Otros"],
    debt: []
  };

  const updateDebtOptions = () => {
    const debts = getDebts();
    debtSelect.innerHTML = "";
    debts.forEach(debt => {
      const opt = document.createElement("option");
      opt.value = debt.name;
      opt.textContent = debt.name;
      debtSelect.appendChild(opt);
    });
  };

  const updateCategoryOptions = () => {
    const type = typeSelect.value;
    const currentCategories = categories[type] || [];
    categorySelect.innerHTML = "";

    currentCategories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.toLowerCase();
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });

    if (type === "debt") {
      categorySelect.parentElement.style.display = "none";
      accountSelect.parentElement.style.display = "none";
      debtSelect.parentElement.style.display = "flex";
      updateDebtOptions();
    } else {
      categorySelect.parentElement.style.display = "flex";
      accountSelect.parentElement.style.display = "flex";
      debtSelect.parentElement.style.display = "none";
    }
  };

  const updateAccountBalance = (accountName, amount, isIncome) => {
    const accounts = getAccounts();
    const account = accounts.find(acc => acc.id === accountName);
    if (account) {
      account.balance += isIncome ? amount : -amount;
      saveAccounts(accounts);
      renderAccounts();
    }
  };

  if (formSubmitHandler) {
    form.removeEventListener("submit", formSubmitHandler);
  }

  formSubmitHandler = (e) => {
    e.preventDefault();
    const type = typeSelect.value;
    const category = type === "debt"
      ? debtSelect.value
      : categorySelect.options[categorySelect.selectedIndex]?.text || "";
    const account = accountSelect.value;
    const rawAmount = amountInput.value;
    const amount = parseFloat(rawAmount);
    const date = dateInput.value || new Date().toISOString().split("T")[0];
    const description = descriptionInput.value || "";

    if (!type || isNaN(amount) || amount <= 0 || (!account && type !== 'debt')) {
      NotificationService.error("Por favor completa todos los campos correctamente.");
      return;
    }

    const transaction = {
      id: editingTransactionId || crypto.randomUUID(),
      type,
      category,
      account,
      amount,
      date,
      description
    };

    if (editingTransactionId) {
      const previous = getTransactions().find(tx => tx.id === editingTransactionId);
      if (previous && previous.type !== 'debt-payment') {
        const accounts = getAccounts();
        const oldAccount = accounts.find(acc => acc.id === previous.account);
        const newAccount = accounts.find(acc => acc.id === account);

        if (oldAccount) {
          oldAccount.balance += previous.type === 'income' ? -previous.amount : previous.amount;
        }
        if (newAccount) {
          newAccount.balance += type === 'income' ? amount : -amount;
        }

        saveAccounts(accounts);
        renderAccounts();
      }

      updateTransaction(transaction);
      editingTransactionId = null;
      NotificationService.success("Transacción actualizada con éxito!");
    } else {
      if (type === "income" || type === "expense") {
        updateAccountBalance(account, amount, type === 'income');
      }
    
      if (type === "debt") {
        updateAccountBalance(account, amount, false);
      
        const debts = getDebts();
        const debt = debts.find(d => d.name === category);
        if (debt) {
          if (!Array.isArray(debt.payments)) debt.payments = [];
          debt.payments.push({ amount, date });
          debt.remaining = debt.total - debt.payments.reduce((sum, p) => sum + p.amount, 0);
          localStorage.setItem('debts', JSON.stringify(debts));
        }
      
        transaction.type = "debt-payment";
        renderDebtList();
      }
    
      saveTransaction(transaction);
      NotificationService.success("Transacción guardada con éxito!");
    }

    renderTransactionList();
    updateDashboard();
    updateMonthSelect();

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setTimeout(() => submitButton.disabled = false, 1000);

    form.reset();
    updateCategoryOptions();
    document.getElementById('transaction-modal').style.display = 'none';
  };

  form.addEventListener("submit", formSubmitHandler);
  typeSelect.addEventListener("change", updateCategoryOptions);
  updateCategoryOptions();
  renderTransactionList();
};

export const renderTransactionList = (transactions = getTransactions()) => {
  const container = document.getElementById("transactions-container");
  container.innerHTML = "";

  if (transactions.length === 0) {
    container.innerHTML = "<li>No hay transacciones registradas.</li>";
    return;
  }

  transactions.forEach(tx => {
    const li = document.createElement("li");
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

  container.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const transactionId = e.target.dataset.id;
      editTransaction(transactionId);
    });
  });

  container.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      transactionToDelete = e.target.dataset.id;
      const modal = document.getElementById('confirm-delete-modal');
      modal.style.display = 'block';
    });
  });

  document.getElementById('confirm-delete-btn').onclick = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete);
      transactionToDelete = null;
      document.getElementById('confirm-delete-modal').style.display = 'none';
      updateDashboard();
    }
  };

  document.getElementById('cancel-delete-btn').onclick =
  document.querySelector('#confirm-delete-modal .close-btn').onclick = () => {
    transactionToDelete = null;
    document.getElementById('confirm-delete-modal').style.display = 'none';
  };
};

const editTransaction = (id) => {
  const transactions = getTransactions();
  const transaction = transactions.find(tx => tx.id === id);
  if (transaction) {
    const typeSelect = document.getElementById("type");
    const categorySelect = document.getElementById("category");
    const debtSelect = document.getElementById("debt-select");
    const debtLabel = document.getElementById("debt-select-label");
    const accountSelect = document.getElementById("account");
    const amountInput = document.getElementById("amount");
    const dateInput = document.getElementById("date");
    const descriptionInput = document.getElementById("description");

    typeSelect.value = transaction.type;
    if (transaction.type === "debt-payment") {
      NotificationService.error("No se puede editar un pago de deuda. Elimina y vuelve a crear.");
      return;
    }    
    if (transaction.type === "debt") {
      debtLabel.style.display = "block";
      debtSelect.value = transaction.category;
      categorySelect.innerHTML = ""; // Limpia categorías si no aplica
    } else {
      debtLabel.style.display = "none";
      categorySelect.value = transaction.category.toLowerCase();
    }

    accountSelect.value = transaction.account;
    amountInput.value = transaction.amount;
    dateInput.value = transaction.date;
    descriptionInput.value = transaction.description;

    editingTransactionId = id;
    document.getElementById('transaction-modal').style.display = 'block';
  }
};


const deleteTransaction = (id) => {
  const transactions = getTransactions();
  const transaction = transactions.find(tx => tx.id === id);
  if (!transaction) return;

  const accounts = getAccounts();
  const account = accounts.find(acc => acc.id === transaction.account);

  if (account) {
    if (transaction.type === 'income') {
      account.balance -= transaction.amount;
    } else if (transaction.type === 'expense' || transaction.type === 'debt-payment') {
      account.balance += transaction.amount;
    }
    saveAccounts(accounts);
    renderAccounts();
  }

  if (transaction.type === "debt-payment") {
    const debts = getDebts();
    const debt = debts.find(d => d.name === transaction.category);
    if (debt && Array.isArray(debt.payments)) {
      debt.payments = debt.payments.filter(p => !(p.amount === transaction.amount && p.date === transaction.date));
      debt.remaining = debt.total - debt.payments.reduce((sum, p) => sum + p.amount, 0);
      localStorage.setItem('debts', JSON.stringify(debts));
      renderDebtList();
    }
  }

  deleteTransactionStorage(id);
  renderTransactionList();
  NotificationService.success("Transacción eliminada con éxito!");
  updateDashboard();
};

export const filterTransactions = () => {
  const activeYear = document.querySelector('[data-year].active')?.getAttribute('data-year');
  const activeMonth = document.querySelector('[data-month].active')?.getAttribute('data-month');

  if (!activeYear || !activeMonth) return;

  const filteredTransactions = getTransactions().filter(tx => {
    const [year, month] = tx.date.split('-');
    return year === activeYear && month === activeMonth;
  });

  renderTransactionList(filteredTransactions);
};

function updateMonthSelect() {
  const transactions = getTransactions();
  renderMonthSelect(transactions);
}

function renderMonthSelect(transactions) {
  const monthSelectContainer = document.querySelector('.month-select-container');
  const monthSelect = document.createElement('select');
  const monthsWithTransactions = new Set(transactions.map(tx => new Date(tx.date).getMonth()));
  monthSelectContainer.innerHTML = '';

  monthsWithTransactions.forEach(month => {
    const monthOption = document.createElement('option');
    monthOption.value = month;
    monthOption.textContent = new Date(0, month).toLocaleString('default', { month: 'long' }).replace(/^./, str => str.toUpperCase());
    monthSelect.appendChild(monthOption);
  });

  monthSelect.addEventListener('change', (event) => {
    const selectedMonth = parseInt(event.target.value, 10);
    filterTransactionsByMonth(selectedMonth);
  });

  monthSelectContainer.appendChild(monthSelect);

  const currentMonth = new Date().getMonth();
  if (monthsWithTransactions.has(currentMonth)) {
    monthSelect.value = currentMonth;
    filterTransactionsByMonth(currentMonth);
  }
}

function filterTransactionsByMonth(month) {
  const activeYear = document.querySelector('[data-year].active')?.getAttribute('data-year');
  if (!activeYear) return;

  const filteredTransactions = getTransactions().filter(tx => {
    const [year, txMonth] = tx.date.split('-');
    return year === activeYear && txMonth === String(month + 1).padStart(2, '0');
  });

  renderTransactionList(filteredTransactions);
}

renderMonthSelect(getTransactions());
