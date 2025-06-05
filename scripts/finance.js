import { saveTransaction, getTransactions, deleteTransaction as deleteTransactionStorage, updateTransaction } from './storage.js';
import { NotificationService } from './components/notification.js';
import { translateAccount, formatCOP } from './components/utils.js';
import { saveDebt, getDebts, deleteDebt as deleteDebtStorage, updateDebt } from './storage.js';

export let editingTransactionId = null;
let transactionToDelete = null;
let editingDebtId = null;
let debtToDelete = null;

export const setupTransactionForm = () => {
  const typeSelect = document.getElementById("type");
  const categorySelect = document.getElementById("category");
  const accountSelect = document.getElementById("account");
  const debtSelect = document.getElementById("debt-select");
  const amountInput = document.getElementById("amount");
  const dateInput = document.getElementById("date");
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
  }

  const updateAccountBalance = (accountName, amount, isIncome) => {
    const accounts = getAccounts();
    const account = accounts.find(acc => acc.name === accountName);
    if (account) {
      account.balance += isIncome ? amount : -amount;
      saveAccounts(accounts);
      renderAccounts();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
  
    const type = typeSelect.value;
    const category = type === "debt" ? debtSelect.value : categorySelect.options[categorySelect.selectedIndex]?.text || "";
    const account = accountSelect.value;
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value || new Date().toISOString().split("T")[0];
  
    if (!type || isNaN(amount) || amount <= 0) {
      NotificationService.error("Por favor completa todos los campos correctamente.");
      return;
    }

    if (type === "income" || type === "expense") {
      updateAccountBalance(account, amount, type === 'income');
    }

    if (type === "debt") {
      const debts = getDebts();
      const debt = debts.find(d => d.name.toLowerCase() === category.toLowerCase());
      if (debt) {
        debt.payments.push({ amount, date });
        debt.remaining -= amount;
        updateDebt(debt);
        renderDebtList();
        NotificationService.success("Pago de deuda registrado con éxito!");

        const transaction = {
          id: crypto.randomUUID(),
          type: "debt-payment",
          category: debt.name,
          account: "",
          amount,
          date
        };
        saveTransaction(transaction);
        renderTransactionList();
      } else {
        NotificationService.error("Deuda no encontrada.");
      }
    } else {
      const transaction = {
        id: editingTransactionId || crypto.randomUUID(),
        type,
        category,
        account,
        amount,
        date
      };

      if (editingTransactionId) {
        updateTransaction(transaction);
        editingTransactionId = null;
        NotificationService.success("Transacción actualizada con éxito!");
      } else {
        saveTransaction(transaction);
        NotificationService.success("Transacción guardada con éxito!");
      }

      renderTransactionList();
    }

    form.reset();
    updateCategoryOptions();

    const modal = document.getElementById('transaction-modal');
    modal.style.display = 'none';
  });

  typeSelect.addEventListener("change", updateCategoryOptions);
  updateCategoryOptions();
  renderTransactionList();
}

const getTransactionListItems = (transactions) => {
  return transactions.map(tx => {
    const li = document.createElement("li");
    li.classList.add(tx.type);
    li.innerHTML = `
      <div class="tx-left">
        <div class="tx-icon">${tx.type === "income" ? "💰" : tx.type === "debt-payment" ? "📝" : "💸"}</div>
        <div class="tx-details">
          <div class="tx-category">${tx.category}</div>
          <div class="tx-account">${translateAccount(tx.account)}</div>
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amount">${formatCOP(tx.amount)}</div>
        <div class="tx-date">${tx.date}</div>
        <button class="edit-btn" data-id="${tx.id}">Editar</button>
        <button class="delete-btn" data-id="${tx.id}">Eliminar</button>
      </div>
    `;
    return li;
  });
};

export const renderTransactionList = (transactions = getTransactions()) => {
  const container = document.getElementById("transactions-container");
  container.innerHTML = "";

  if (transactions.length === 0) {
    container.innerHTML = "<li>No hay transacciones registradas.</li>";
    return;
  }

  const transactionItems = getTransactionListItems(transactions);
  transactionItems.forEach(item => container.appendChild(item));

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

  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const closeDeleteModalBtn = document.querySelector('#confirm-delete-modal .close-btn');

  confirmDeleteBtn.addEventListener('click', () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete);
      transactionToDelete = null;
      const modal = document.getElementById('confirm-delete-modal');
      modal.style.display = 'none';
    }
  });

  cancelDeleteBtn.addEventListener('click', () => {
    transactionToDelete = null;
    const modal = document.getElementById('confirm-delete-modal');
    modal.style.display = 'none';
  });

  closeDeleteModalBtn.addEventListener('click', () => {
    transactionToDelete = null;
    const modal = document.getElementById('confirm-delete-modal');
    modal.style.display = 'none';
  });
};

export const filterTransactions = () => {
  const activeYear = document.querySelector('[data-year].active').getAttribute('data-year');
  const activeMonth = document.querySelector('[data-month].active').getAttribute('data-month');
  const filteredTransactions = getTransactions().filter(tx => {
    const [year, month] = tx.date.split('-');
    return year === activeYear && month === activeMonth;
  });
  renderTransactionList(filteredTransactions);
};

const editTransaction = (id) => {
  const transactions = getTransactions();
  const transaction = transactions.find(tx => tx.id === id);
  if (transaction) {
    const typeSelect = document.getElementById("type");
    const categorySelect = document.getElementById("category");
    const debtSelect = document.getElementById("debt-select");
    const accountSelect = document.getElementById("account");
    const amountInput = document.getElementById("amount");
    const dateInput = document.getElementById("date");
    
    typeSelect.value = transaction.type;
    if (transaction.type === "debt") {
      debtSelect.value = transaction.category;
    } else {
      categorySelect.value = transaction.category.toLowerCase();
    }
    accountSelect.value = transaction.account;
    amountInput.value = transaction.amount;
    dateInput.value = transaction.date;
    
    editingTransactionId = id;
    const modal = document.getElementById('transaction-modal');
    modal.style.display = 'block';
  }
};

const deleteTransaction = (id) => {
  deleteTransactionStorage(id);
  renderTransactionList();
  NotificationService.success("Transacción eliminada con éxito!");
};

export const setupDebtForm = () => {
  const debtForm = document.getElementById('debt-form');

  debtForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const debtName = document.getElementById('debt-name').value;
    const debtTotal = parseFloat(document.getElementById('debt-total').value);
    const debtDueDate = document.getElementById('debt-due-date').value;

    if (!debtName || isNaN(debtTotal) || debtTotal <= 0 || !debtDueDate) {
      NotificationService.error("Por favor completa todos los campos correctamente.");
      return;
    }

    const debt = {
      id: editingDebtId || crypto.randomUUID(),
      name: debtName,
      total: debtTotal,
      dueDate: debtDueDate,
      payments: [],
      remaining: debtTotal
    };

    if (editingDebtId) {
      updateDebt(debt);
      editingDebtId = null;
      NotificationService.success("Deuda actualizada con éxito!");
    } else {
      saveDebt(debt);
      NotificationService.success("Deuda guardada con éxito!");
    }

    debtForm.reset();
    renderDebtList();

    const modal = document.getElementById('debt-modal');
    modal.style.display = 'none';
  });
};

export const renderDebtList = () => {
  const container = document.getElementById("debts-container");
  const debts = getDebts();

  container.innerHTML = "";

  if (debts.length === 0) {
    container.innerHTML = "<li>No hay deudas registradas.</li>";
    return;
  }

  debts.forEach(debt => {
    const li = document.createElement("li");
    const totalPaid = debt.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = debt.remaining - totalPaid;
    const paymentsList = debt.payments.map(payment => `<li>${formatCOP(payment.amount)} - ${payment.date}</li>`).join('');
    li.innerHTML = `
      <div class="debt-details">
        <div class="debt-name">${debt.name}</div>
        <div class="debt-total">Total: ${formatCOP(debt.total)}</div>
        <div class="debt-due-date">Vence: ${debt.dueDate}</div>
        <div class="debt-remaining">Restante: ${formatCOP(remaining)}</div>
        <div class="debt-payments">
          <h4>Pagos Realizados:</h4>
          <ul>${paymentsList}</ul>
        </div>
        <button class="edit-debt-btn" data-id="${debt.id}">Editar</button>
        <button class="delete-debt-btn" data-id="${debt.id}">Eliminar</button>
      </div>
    `;
    container.appendChild(li);
  });

  container.querySelectorAll('.edit-debt-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const debtId = e.target.dataset.id;
      editDebt(debtId);
    });
  });

  container.querySelectorAll('.delete-debt-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      debtToDelete = e.target.dataset.id;
      const modal = document.getElementById('confirm-delete-debt-modal');
      modal.style.display = 'block';
    });
  });

  const confirmDeleteDebtBtn = document.getElementById('confirm-delete-debt-btn');
  const cancelDeleteDebtBtn = document.getElementById('cancel-delete-debt-btn');
  const closeDeleteDebtModalBtn = document.querySelector('#confirm-delete-debt-modal .close-btn');

  confirmDeleteDebtBtn.addEventListener('click', () => {
    if (debtToDelete) {
      deleteDebt(debtToDelete);
      debtToDelete = null;
      const modal = document.getElementById('confirm-delete-debt-modal');
      modal.style.display = 'none';
    }
  });

  cancelDeleteDebtBtn.addEventListener('click', () => {
    debtToDelete = null;
    const modal = document.getElementById('confirm-delete-debt-modal');
    modal.style.display = 'none';
  });

  closeDeleteDebtModalBtn.addEventListener('click', () => {
    debtToDelete = null;
    const modal = document.getElementById('confirm-delete-debt-modal');
    modal.style.display = 'none';
  });
};

const editDebt = (id) => {
  const debts = getDebts();
  const debt = debts.find(d => d.id === id);
  if (debt) {
    const debtNameInput = document.getElementById('debt-name');
    const debtTotalInput = document.getElementById('debt-total');
    const debtDueDateInput = document.getElementById('debt-due-date');

    debtNameInput.value = debt.name;
    debtTotalInput.value = debt.total;
    debtDueDateInput.value = debt.dueDate;

    editingDebtId = id;
    const modal = document.getElementById('debt-modal');
    modal.style.display = 'block';
  }
};

const deleteDebt = (id) => {
  deleteDebtStorage(id);
  renderDebtList();
  NotificationService.success("Deuda eliminada con éxito!");
};

const saveAccounts = (accounts) => {
  localStorage.setItem('accounts', JSON.stringify(accounts));
}

const getAccounts = () => {
  return JSON.parse(localStorage.getItem('accounts')) || [];
}

const renderAccounts = () => {
  const accounts = getAccounts();
  const container = document.getElementById('accounts-container');
  container.innerHTML = '';
  accounts.forEach(account => {
    const li = document.createElement('li');
    li.classList.add('account-card');

    const name = document.createElement('div');
    name.classList.add('account-name');
    name.textContent = account.name;

    const balance = document.createElement('div');
    balance.classList.add('account-balance');
    balance.textContent = `Saldo: ${formatCOP(account.balance)}`;

    li.appendChild(name);
    li.appendChild(balance);
    container.appendChild(li);
  });
}

const updateAccountSelect = () => {
  const accounts = getAccounts();
  const accountSelect = document.getElementById('account');
  accountSelect.innerHTML = '';
  accounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.name;
    option.textContent = account.name;
    accountSelect.appendChild(option);
  });
}

const setupAccountForm = () => {
  const form = document.getElementById('account-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('account-name').value;
    const balance = parseFloat(document.getElementById('account-balance').value);
    const accounts = getAccounts();
    accounts.push({ name, balance });
    saveAccounts(accounts);
    renderAccounts();
    updateAccountSelect();
    form.reset();
    document.getElementById('account-modal').style.display = 'none';
  });
}

setupAccountForm();
renderAccounts();
updateAccountSelect();
