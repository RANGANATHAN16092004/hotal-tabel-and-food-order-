export function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount) || 0);
  } catch (e) {
    return `₹${(Number(amount) || 0).toFixed(2)}`;
  }
}
