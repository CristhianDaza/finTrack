const categories = {
  income: ["Salario", "Freelance", "Prestamo", "Otros"],
  expense: ["Gastos", "Comida", "Educacion", "Transporte", "Otros"]
};

export function setupTransactionForm() {
  const typeSelect = document.getElementById("type");
  const categorySelect = document.getElementById("category");

  function updateCategoryOptions() {
    const type = typeSelect.value;
    console.log(type);
    categorySelect.innerHTML = "";
    categories[type].forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.toLowerCase();
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  typeSelect.addEventListener("change", updateCategoryOptions);
  updateCategoryOptions();
}
