import { getDebts, saveDebt, updateDebt, deleteDebt as deleteDebtStorage } from './storage.js';
import { NotificationService } from './components/notification.js';
import { formatCOP } from './utils.js';
import { updateDashboard } from './dashboard.js';

let editingDebtId = null;
let debtToDelete = null;

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

    document.getElementById('debt-modal').style.display = 'none';
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
    const remaining = debt.total - totalPaid;
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
      document.getElementById('confirm-delete-debt-modal').style.display = 'block';
    });
  });

  document.getElementById('confirm-delete-debt-btn').onclick = () => {
    if (debtToDelete) {
      deleteDebt(debtToDelete);
      debtToDelete = null;
      document.getElementById('confirm-delete-debt-modal').style.display = 'none';
      updateDashboard();
    }
  };

  document.getElementById('cancel-delete-debt-btn').onclick =
  document.querySelector('#confirm-delete-debt-modal .close-btn').onclick = () => {
    debtToDelete = null;
    document.getElementById('confirm-delete-debt-modal').style.display = 'none';
  };
};

const editDebt = (id) => {
  const debts = getDebts();
  const debt = debts.find(d => d.id === id);
  if (debt) {
    document.getElementById('debt-name').value = debt.name;
    document.getElementById('debt-total').value = debt.total;
    document.getElementById('debt-due-date').value = debt.dueDate;

    editingDebtId = id;
    document.getElementById('debt-modal').style.display = 'block';
  }
};

const deleteDebt = (id) => {
  deleteDebtStorage(id);
  renderDebtList();
  NotificationService.success("Deuda eliminada con éxito!");
};
