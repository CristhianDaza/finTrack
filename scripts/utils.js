export const formatCOP = (value) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

export const translateAccount = (accountId) => {
  const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
  const found = accounts.find(acc => acc.id === accountId);
  return found ? found.name : accountId;
};
