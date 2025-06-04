import { saveTransaction, getTransactions, deleteTransaction as deleteTransactionStorage, updateTransaction } from './storage.js';
import { NotificationService } from './components/notification.js';
import { translateAccount, formatCOP } from './components/utils.js';

export let editingTransactionId = null;
let transactionToDelete = null;

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
