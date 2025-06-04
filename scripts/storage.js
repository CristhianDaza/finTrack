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
