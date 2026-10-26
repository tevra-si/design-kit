export const plans = Object.freeze({ starter: 19, studio: 49, team: 99 });
export const revenue = Object.freeze([{ month: 'April', revenue: 18200, customers: 320 }, { month: 'May', revenue: 21700, customers: 364 }, { month: 'June', revenue: 25400, customers: 410 }]);
export function estimate(plan, seats, annual) {
  if (typeof plan !== 'string' || typeof annual !== 'boolean' || !Object.hasOwn(plans, plan) || !Number.isInteger(seats) || seats < 1 || seats > 100) throw new Error('Choose a plan and between 1 and 100 seats.');
  return Math.round(plans[plan] * seats * (annual ? 0.8 : 1) * 100) / 100;
}
export function validateContact(name, email) {
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) return { field: 'name', message: 'Enter a name between 2 and 80 characters.' };
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return { field: 'email', message: 'Enter a valid email address.' };
  return null;
}
