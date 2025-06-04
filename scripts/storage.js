export function saveTransaction(transaction) {
  const transactions = getTransactions();
  transactions.push(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

export function getTransactions() {
  const data = localStorage.getItem('transactions');
  return data ? JSON.parse(data) : [];
}
