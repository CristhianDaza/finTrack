import { saveTransaction, getTransactions, deleteTransaction as deleteTransactionStorage, updateTransaction, saveAccounts, getAccounts, saveDebt, getDebts, deleteDebt as deleteDebtStorage, updateDebt } from './storage.js';
import { NotificationService } from './components/notification.js';
import { translateAccount, formatCOP } from './components/utils.js';

let editingTransactionId = null;
let transactionToDelete = null;
let editingDebtId = null;
let debtToDelete = null;

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
    console.log("Form submitted");
    console.log(editingTransactionId);
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
      console.log("Editing transaction");
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
      console.log("Transaction updated");
      NotificationService.success("Transacción actualizada con éxito!");
    } else {
      if (type === "income" || type === "expense") {
        updateAccountBalance(account, amount, type === 'income');
      }
  
      saveTransaction(transaction);
      NotificationService.success("Transacción guardada con éxito!");
    }
  
    renderTransactionList();
    updateDashboard();
  
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
      updateDashboard();
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
    const descriptionInput = document.getElementById("description");
    
    typeSelect.value = transaction.type;
    if (transaction.type === "debt") {
      debtSelect.value = transaction.category;
    } else {
      categorySelect.value = transaction.category.toLowerCase();
    }
    accountSelect.value = transaction.account;
    amountInput.value = transaction.amount;
    dateInput.value = transaction.date;
    descriptionInput.value = transaction.description;
    
    editingTransactionId = id;
    const modal = document.getElementById('transaction-modal');
    modal.style.display = 'block';
  }
};

const deleteTransaction = (id) => {
  const transactions = getTransactions();
  const transaction = transactions.find(tx => tx.id === id);
  if (transaction) {
    const accounts = getAccounts();
    const account = accounts.find(acc => acc.id === transaction.account);
    if (account) {
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else if (transaction.type === 'expense') {
        account.balance += transaction.amount;
      }
      saveAccounts(accounts);
      renderAccounts();
    }
    deleteTransactionStorage(id);
    renderTransactionList();
    NotificationService.success("Transacción eliminada con éxito!");
    updateDashboard();
  }
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
    updateDashboard();

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
      updateDashboard();
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
  updateDashboard();
};

const generateUniqueId = () => {
  return '_' + Math.random().toString(36).substr(2, 9);
};

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

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'space-between';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Editar';
    editBtn.classList.add('edit-account-btn');
    editBtn.onclick = () => editAccount(account.id);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.classList.add('delete-account-btn');
    deleteBtn.onclick = () => confirmDeleteAccount(account.id);

    buttonsContainer.appendChild(editBtn);
    buttonsContainer.appendChild(deleteBtn);

    li.appendChild(name);
    li.appendChild(balance);
    li.appendChild(buttonsContainer);
    container.appendChild(li);
  });
}

const updateAccountSelect = () => {
  const accounts = getAccounts();
  const accountSelect = document.getElementById('account');
  accountSelect.innerHTML = '';
  accounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = account.name;
    accountSelect.appendChild(option);
  });
}

let isEditing = false;
let currentAccountId = null;

const setupAccountForm = () => {
  const form = document.getElementById('account-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('account-name');
    const balanceInput = document.getElementById('account-balance');
    const newName = nameInput.value.trim();
    let newBalance = parseFloat(balanceInput.value);
    if (isNaN(newBalance)) {
      newBalance = 0;
    }
    if (newName) {
      const accounts = getAccounts();
      if (isEditing && currentAccountId !== null) {
        const account = accounts.find(acc => acc.id === currentAccountId);
        if (account) {
          account.name = newName;
          account.balance = newBalance;
          NotificationService.success('Cuenta editada con éxito.');
        }
      } else {
        const newAccount = { id: generateUniqueId(), name: newName, balance: newBalance };
        accounts.push(newAccount);
        NotificationService.success('Cuenta creada con éxito.');
      }
      saveAccounts(accounts);
      renderAccounts();
      updateAccountSelect();
      updateDashboard();
      isEditing = false;
      currentAccountId = null;
    }
    const modal = document.getElementById('account-modal');
    modal.style.display = 'none';
  };
}

const confirmDeleteAccount = (accountId) => {
  const modal = document.getElementById('confirm-delete-account-modal');
  modal.style.display = 'block';
  const confirmBtn = document.getElementById('confirm-delete-account-btn');
  confirmBtn.onclick = () => {
    deleteAccount(accountId);
    modal.style.display = 'none';
    NotificationService.success('Cuenta eliminada con éxito.');
    updateDashboard();
  };
  const cancelBtn = document.getElementById('cancel-delete-account-btn');
  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

const deleteAccount = (accountId) => {
  const accounts = getAccounts().filter(acc => acc.id !== accountId);
  saveAccounts(accounts);
  renderAccounts();
}

const openAccountModalForCreation = () => {
  isEditing = false;
  currentAccountId = null;
  const nameInput = document.getElementById('account-name');
  const balanceInput = document.getElementById('account-balance');
  nameInput.value = '';
  balanceInput.value = '';
  const modal = document.getElementById('account-modal');
  modal.style.display = 'block';
}

const addAccountButton = document.getElementById('add-account-btn');
if (addAccountButton) {
  addAccountButton.onclick = openAccountModalForCreation;
}

const editAccount = (accountId) => {
  isEditing = true;
  currentAccountId = accountId;
  const accounts = getAccounts();
  const account = accounts.find(acc => acc.id === accountId);
  if (account) {
    const nameInput = document.getElementById('account-name');
    const balanceInput = document.getElementById('account-balance');
    nameInput.value = account.name;
    balanceInput.value = account.balance;
    const modal = document.getElementById('account-modal');
    modal.style.display = 'block';
  }
}

setupAccountForm();
renderAccounts();
updateAccountSelect();

let incomeExpenseChart;

const drawIncomeExpenseChart = (month) => {
  const ctx = document.getElementById('income-expense-chart').getContext('2d');
  ctx.canvas.width = ctx.canvas.parentNode.offsetWidth * 0.8;
  ctx.canvas.height = ctx.canvas.width * 0.5;
  const transactions = getTransactions().filter(tx => tx.date.split('-')[1] === month);

  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const data = {
    labels: ['Ingresos', 'Gastos'],
    datasets: [{
      label: 'Finanzas Mensuales',
      data: [totalIncome, totalExpenses],
      backgroundColor: ['#4caf50', '#f44336'],
      borderColor: ['#388e3c', '#d32f2f'],
      borderWidth: 1,
      borderRadius: 5,
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Comparación de Ingresos y Gastos'
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutBounce',
    }
  };

  if (incomeExpenseChart) {
    incomeExpenseChart.destroy();
  }

  incomeExpenseChart = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: options
  });
};

const monthSelect = document.getElementById('month-select');

const currentMonth = new Date().getMonth() + 1;
monthSelect.value = currentMonth.toString().padStart(2, '0');

monthSelect.addEventListener('change', (e) => {
  drawIncomeExpenseChart(e.target.value);
});

drawIncomeExpenseChart(monthSelect.value);

const calculateFinancialSummary = () => {
  const accounts = getAccounts();
  const transactions = getTransactions();

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  document.getElementById('total-balance').textContent = formatCOP(totalBalance);
  document.getElementById('total-income').textContent = formatCOP(totalIncome);
  document.getElementById('total-expenses').textContent = formatCOP(totalExpenses);
};

const updateDashboard = () => {
  calculateFinancialSummary();
  drawIncomeExpenseChart(monthSelect.value);
};

setupTransactionForm();
calculateFinancialSummary();
drawIncomeExpenseChart(monthSelect.value);
