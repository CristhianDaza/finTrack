import { saveTransaction, getTransactions } from './storage.js';
import { NotificationService } from './components/notification.js';

export function setupTransactionForm() {
  const typeSelect = document.getElementById("type");
  const categorySelect = document.getElementById("category");
  const accountSelect = document.getElementById("account");
  const amountInput = document.getElementById("amount");
  const dateInput = document.getElementById("date");
  const form = document.getElementById("transaction-form");

  const categories = {
    income: ["Salario", "Freelance", "Prestamo", "Otros"],
    expense: ["Gastos", "Comida", "Educacion", "Transporte", "Otros"]
  };

  function updateCategoryOptions() {
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
      id: crypto.randomUUID(),
      type,
      category,
      account,
      amount,
      date
    };

    saveTransaction(transaction);
    form.reset();
    updateCategoryOptions();
    NotificationService.success("Transacción guardada con éxito!");
    renderTransactionList();

    // Cerrar el modal después de guardar la transacción
    const modal = document.getElementById('transaction-modal');
    modal.style.display = 'none';
  });

  typeSelect.addEventListener("change", updateCategoryOptions);
  updateCategoryOptions();
  renderTransactionList();
}

function translateAccount(account) {
  const map = {
    savings: "Ahorro",
    cash: "Efectivo",
    bank: "Banco"
  };
  return map[account] || account;
}

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}


export function renderTransactionList() {
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
    console.log(tx);
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
