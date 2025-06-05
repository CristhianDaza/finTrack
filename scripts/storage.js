export const saveTransaction = (transaction) => {
  const transactions = getTransactions();
  transactions.push(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

export const getTransactions = () => {
  const data = localStorage.getItem('transactions');
  return data ? JSON.parse(data) : [];
}

export const deleteTransaction = (id) => {
  let transactions = getTransactions();
  transactions = transactions.filter(tx => tx.id !== id);
  localStorage.setItem('transactions', JSON.stringify(transactions));
};

export const updateTransaction = (updatedTransaction) => {
  let transactions = getTransactions();
  const index = transactions.findIndex(tx => tx.id === updatedTransaction.id);
  if (index !== -1) {
    transactions[index] = updatedTransaction;
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }
};

export const saveDebt = (debt) => {
  const debts = getDebts();
  debts.push(debt);
  localStorage.setItem('debts', JSON.stringify(debts));
};

export const getDebts = () => {
  const data = localStorage.getItem('debts');
  return data ? JSON.parse(data) : [];
};

export const updateDebt = (updatedDebt) => {
  let debts = getDebts();
  const index = debts.findIndex(d => d.id === updatedDebt.id);
  if (index !== -1) {
    debts[index] = updatedDebt;
    localStorage.setItem('debts', JSON.stringify(debts));
  }
};

export const deleteDebt = (id) => {
  let debts = getDebts();
  debts = debts.filter(d => d.id !== id);
  localStorage.setItem('debts', JSON.stringify(debts));
};

export const saveAccounts = (accounts) => {
  localStorage.setItem('accounts', JSON.stringify(accounts));
};

export const getAccounts = () => {
  const data = localStorage.getItem('accounts');
  return data ? JSON.parse(data) : [];
};
