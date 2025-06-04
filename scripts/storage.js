export const saveTransaction = (transaction) => {
  const transactions = getTransactions();
  transactions.push(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

export const getTransactions = () => {
  const data = localStorage.getItem('transactions');
  return data ? JSON.parse(data) : [];
}
