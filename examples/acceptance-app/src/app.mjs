import { estimate, revenue, validateContact } from './model.mjs';
const byId = id => { const element = document.getElementById(id); if (!element) throw new Error(`Missing element: ${id}`); return element; };
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
let selectedPlan = 'studio';
const design = new URLSearchParams(location.search).get('design');
if (design === 'before' || design === 'after') document.body.classList.toggle('before', design === 'before');
const month = byId('month');
month.addEventListener('change', () => {
  const selected = revenue[Number(month.value)];
  if (!selected) throw new Error('Unknown reporting month');
  byId('revenue').textContent = currency.format(selected.revenue);
  byId('customers').textContent = String(selected.customers);
  byId('per-customer').textContent = currency.format(selected.revenue / selected.customers);
});
const seats = byId('seats'); const annual = byId('annual');
function updateEstimate() {
  try { byId('estimate').textContent = `${selectedPlan[0].toUpperCase()}${selectedPlan.slice(1)} estimate: $${estimate(selectedPlan, Number(seats.value), annual.checked).toFixed(2)} / month`; seats.removeAttribute('aria-invalid'); }
  catch (error) { byId('estimate').textContent = error.message; seats.setAttribute('aria-invalid', 'true'); }
}
seats.addEventListener('input', updateEstimate); annual.addEventListener('change', updateEstimate);
const dialog = byId('plan-dialog'); let opener;
for (const button of document.querySelectorAll('[data-plan]')) button.addEventListener('click', () => {
  selectedPlan = button.dataset.plan; updateEstimate(); opener = button;
  byId('plan-message').textContent = `${selectedPlan} is selected for your local estimate.`; dialog.showModal();
});
byId('dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => opener?.focus());
const name = byId('name'); const email = byId('email');
byId('contact-form').addEventListener('submit', event => {
  event.preventDefault(); name.removeAttribute('aria-invalid'); email.removeAttribute('aria-invalid');
  const error = validateContact(name.value, email.value);
  byId('contact-error').textContent = error?.message ?? '';
  byId('contact-success').textContent = error ? '' : 'Enquiry validated locally. Nothing has been sent.';
  if (error) { const field = byId(error.field); field.setAttribute('aria-invalid', 'true'); field.focus(); }
});
document.documentElement.dataset.tevraReady = 'true';
