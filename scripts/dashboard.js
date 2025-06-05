import { getTransactions, getAccounts } from './storage.js';
import { formatCOP } from './utils.js';

let incomeExpenseChart;

export const calculateFinancialSummary = () => {
  const accounts = getAccounts();
  const transactions = getTransactions();

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  document.getElementById('total-balance').textContent = formatCOP(totalBalance);
  document.getElementById('total-income').textContent = formatCOP(totalIncome);
  document.getElementById('total-expenses').textContent = formatCOP(totalExpenses);
};

export const drawIncomeExpenseChart = (month) => {
  const ctx = document.getElementById('income-expense-chart').getContext('2d');
  ctx.canvas.width = ctx.canvas.parentNode.offsetWidth * 0.8;
  ctx.canvas.height = ctx.canvas.width * 0.5;

  const transactions = getTransactions().filter(tx => tx.date.split('-')[1] === month);

  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const data = {
    labels: ['Ingresos', 'Gastos'],
    datasets: [{
      label: 'Finanzas Mensuales',
      data: [totalIncome, totalExpenses],
      backgroundColor: ['#4caf50', '#f44336'],
      borderColor: ['#388e3c', '#d32f2f'],
      borderWidth: 1,
      borderRadius: 5,
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Comparación de Ingresos y Gastos'
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutBounce',
    }
  };

  if (incomeExpenseChart) incomeExpenseChart.destroy();

  incomeExpenseChart = new Chart(ctx, {
    type: 'bar',
    data,
    options
  });
};

export const setupDashboard = () => {
  const monthSelect = document.getElementById('month-select');
  const currentMonth = new Date().getMonth() + 1;
  monthSelect.value = currentMonth.toString().padStart(2, '0');

  monthSelect.addEventListener('change', (e) => {
    drawIncomeExpenseChart(e.target.value);
  });

  calculateFinancialSummary();
  drawIncomeExpenseChart(monthSelect.value);
};

export const updateDashboard = () => {
  calculateFinancialSummary();
  const selectedMonth = document.getElementById('month-select').value;
  drawIncomeExpenseChart(selectedMonth);
};
