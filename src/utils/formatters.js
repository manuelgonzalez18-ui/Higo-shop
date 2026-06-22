/**
 * Format a number as US dollars.
 * @param {number} amount
 * @returns {string} e.g. '$ 12.50'
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '$ 0.00';
  return `$ ${Number(amount).toFixed(2)}`;
}

/**
 * Format a Date object or ISO string to a readable date.
 * @param {Date|string} date
 * @returns {string} e.g. '21/05/2026'
 */
export function formatDate(date) {
  // Postgres 'date' columns come back as plain 'YYYY-MM-DD' strings. Parsing
  // those with `new Date()` treats them as UTC midnight, which shifts to the
  // previous day once formatted in a negative UTC-offset timezone. Parse the
  // parts directly to keep the calendar date the user actually picked.
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
  }
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a Date object or ISO string to a readable time.
 * @param {Date|string} date
 * @returns {string} e.g. '2:35 PM'
 */
export function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Format a phone number string to 04XX-XXXXXXX format.
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return phone;
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalizeFirst(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
