const formatDate = (date, locale = 'en-US') => {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
};

const formatDateTime = (date, locale = 'en-US') => {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
};

const toMySQLDate = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
};

const toMySQLDateTime = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const daysBetween = (a, b) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round(Math.abs(new Date(b) - new Date(a)) / msPerDay);
};

module.exports = { formatDate, formatDateTime, toMySQLDate, toMySQLDateTime, startOfDay, endOfDay, daysBetween };
