import { saveTransaction } from './storage.js';

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
    const category = categorySelect.value;
    const account = accountSelect.value;
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value || new Date().toISOString().split('T')[0];
  
    if (!type || !category || !account || isNaN(amount) || amount <= 0) {
      alert("Por favor completa todos los campos correctamente.");
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
    alert("Transacción guardada!");
  });

  typeSelect.addEventListener("change", updateCategoryOptions);
  updateCategoryOptions();
}
