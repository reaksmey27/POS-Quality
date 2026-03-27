const formatCurrency = (amount, symbol = '$') => `${symbol}${Number(amount).toFixed(2)}`;

const generateReceipt = (order, items, payment, storeName = 'POS Quality') => {
  const divider = '─'.repeat(40);
  const now = new Date(order.created_at || Date.now());
  const dateStr = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  let receipt = '';
  receipt += `\n${storeName.toUpperCase().padStart(28, ' ')}\n`;
  receipt += `${'Station 01'.padStart(28, ' ')}\n`;
  receipt += `${divider}\n`;
  receipt += `Order #: ${String(order.id).padStart(6, '0').toUpperCase()}\n`;
  receipt += `Date   : ${dateStr}\n`;
  receipt += `Cashier: ${order.cashier_name || 'Staff'}\n`;
  receipt += `${divider}\n`;
  receipt += `${'ITEM'.padEnd(25)}${'QTY'.padEnd(5)}${'PRICE'.padStart(10)}\n`;
  receipt += `${divider}\n`;

  for (const item of items) {
    const nameCol = item.product_name.substring(0, 24).padEnd(25);
    const qtyCol = String(item.quantity).padEnd(5);
    const priceCol = formatCurrency(item.total_price).padStart(10);
    receipt += `${nameCol}${qtyCol}${priceCol}\n`;
  }

  receipt += `${divider}\n`;
  receipt += `${'Subtotal'.padEnd(30)}${formatCurrency(order.subtotal).padStart(10)}\n`;

  if (order.discount_amount > 0) {
    receipt += `${'Discount'.padEnd(30)}${('-' + formatCurrency(order.discount_amount)).padStart(10)}\n`;
  }
  receipt += `${'Tax (5%)'.padEnd(30)}${formatCurrency(order.tax).padStart(10)}\n`;
  receipt += `${divider}\n`;
  receipt += `${'TOTAL'.padEnd(30)}${formatCurrency(order.total).padStart(10)}\n`;
  receipt += `${divider}\n`;

  if (payment) {
    receipt += `${'Payment'.padEnd(20)}${payment.payment_method.toUpperCase().padStart(20)}\n`;
    const details = typeof payment.payment_details === 'string'
      ? JSON.parse(payment.payment_details || '{}')
      : (payment.payment_details || {});
    if (details.cashGiven) {
      receipt += `${'Cash Given'.padEnd(20)}${formatCurrency(details.cashGiven).padStart(20)}\n`;
      receipt += `${'Change'.padEnd(20)}${formatCurrency(details.change || 0).padStart(20)}\n`;
    }
  }

  receipt += `${divider}\n`;
  receipt += `${'Thank you for your visit!'.padStart(32, ' ')}\n`;
  receipt += `${'Please come again :)'.padStart(30, ' ')}\n\n`;

  return receipt;
};

module.exports = { generateReceipt, formatCurrency };
