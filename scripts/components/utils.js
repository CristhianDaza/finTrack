export function translateAccount(account) {
  const map = {
    savings: "Ahorro",
    cash: "Efectivo",
    bank: "Banco"
  };
  return map[account] || account;
}

export function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}