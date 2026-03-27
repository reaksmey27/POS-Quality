const { v4: uuidv4 } = require('uuid');

const generateSKU = (category = 'PROD', index = 0) => {
  const prefix = category.substring(0, 3).toUpperCase();
  const num = String(index).padStart(3, '0');
  return `${prefix}-${num}`;
};

const generateBarcode = (prefix = 'POS') => {
  const rand = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return `${prefix}${rand}`;
};

const validateEAN13 = (barcode) => {
  if (!/^\d{13}$/.test(barcode)) return false;
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop();
  const sum = digits.reduce((acc, d, i) => acc + (i % 2 === 0 ? d : d * 3), 0);
  return (10 - (sum % 10)) % 10 === checkDigit;
};

module.exports = { generateSKU, generateBarcode, validateEAN13 };
