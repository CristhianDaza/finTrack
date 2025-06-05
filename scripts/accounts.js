  import { getAccounts, saveAccounts } from './storage.js';
  import { NotificationService } from './components/notification.js';
  import { formatCOP } from './utils.js';
  import { updateDashboard } from './dashboard.js';

  let isEditing = false;
  let currentAccountId = null;

  const generateUniqueId = () => {
    return '_' + Math.random().toString(36).substr(2, 9);
  };

  export const renderAccounts = () => {
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
  };

  export const updateAccountSelect = () => {
    const accounts = getAccounts();
    const accountSelect = document.getElementById('account');
    accountSelect.innerHTML = '';
    accounts.forEach(account => {
      const option = document.createElement('option');
      option.value = account.id;
      option.textContent = account.name;
      accountSelect.appendChild(option);
    });
  };

  export const setupAccountForm = () => {
    const form = document.getElementById('account-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('account-name');
      const balanceInput = document.getElementById('account-balance');
      const newName = nameInput.value.trim();
      let newBalance = parseFloat(balanceInput.value);
      if (isNaN(newBalance)) newBalance = 0;

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
          const newAccount = {
            id: generateUniqueId(),
            name: newName,
            balance: newBalance
          };
          accounts.push(newAccount);
          NotificationService.success('Cuenta creada con éxito.');
        }

        saveAccounts(accounts);
        renderAccounts();
        updateAccountSelect();
        updateDashboard();

        isEditing = false;
        currentAccountId = null;
        form.reset();
        document.getElementById('account-modal').style.display = 'none';
      }
    };
  };

  const editAccount = (accountId) => {
    isEditing = true;
    currentAccountId = accountId;
    const accounts = getAccounts();
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      document.getElementById('account-name').value = account.name;
      document.getElementById('account-balance').value = account.balance;
      document.getElementById('account-modal').style.display = 'block';
    }
  };

  const deleteAccount = (accountId) => {
    const accounts = getAccounts().filter(acc => acc.id !== accountId);
    saveAccounts(accounts);
    renderAccounts();
    updateAccountSelect();
  };

  const confirmDeleteAccount = (accountId) => {
    const modal = document.getElementById('confirm-delete-account-modal');
    modal.style.display = 'block';

    document.getElementById('confirm-delete-account-btn').onclick = () => {
      deleteAccount(accountId);
      modal.style.display = 'none';
      NotificationService.success('Cuenta eliminada con éxito.');
      updateDashboard();
    };

    document.getElementById('cancel-delete-account-btn').onclick = () => {
      modal.style.display = 'none';
    };
  };
