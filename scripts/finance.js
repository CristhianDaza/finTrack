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
  const amountInput = document.getElementById("amount");
  const dateInput = document.getElementById("date");
  const form = document.getElementById("transaction-form");

  const categories = {
    income: ["Salario", "Freelance", "Prestamo", "Intereses", "Dividendos", "Regalos", "Venta", "Otros"],
    expense: ["Gastos", "Comida", "Educacion", "Transporte", "Salud", "Entretenimiento", "Ropa", "Viajes", "Hogar", "Servicios", "Impuestos", "Jardín", "Otros"]
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
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
  
    const type = typeSelect.value;
    const category = categorySelect.options[categorySelect.selectedIndex].text;
    const account = accountSelect.value;
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value || new Date().toISOString().split("T")[0];
  
    if (!type || !category || !account || isNaN(amount) || amount <= 0) {
      NotificationService.error("Por favor completa todos los campos correctamente.");
      return;
    }
  
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

    form.reset();
    updateCategoryOptions();
    renderTransactionList();

    const modal = document.getElementById('transaction-modal');
    modal.style.display = 'none';
  });

  typeSelect.addEventListener("change", updateCategoryOptions);
  updateCategoryOptions();
  renderTransactionList();
}

export const renderTransactionList = () => {
  const container = document.getElementById("transactions-container");
  const transactions = getTransactions();

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
        <div class="tx-icon">${tx.type === "income" ? "💰" : "💸"}</div>
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

const editTransaction = (id) => {
  const transactions = getTransactions();
  const transaction = transactions.find(tx => tx.id === id);
  if (transaction) {
    const typeSelect = document.getElementById("type");
    const categorySelect = document.getElementById("category");
    const accountSelect = document.getElementById("account");
    const amountInput = document.getElementById("amount");
    const dateInput = document.getElementById("date");
    
    typeSelect.value = transaction.type;
    categorySelect.value = transaction.category.toLowerCase();
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
    li.innerHTML = `
      <div class="debt-details">
        <div class="debt-name">${debt.name}</div>
        <div class="debt-total">Total: ${formatCOP(debt.total)}</div>
        <div class="debt-due-date">Vence: ${debt.dueDate}</div>
        <div class="debt-remaining">Restante: ${formatCOP(debt.remaining)}</div>
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
