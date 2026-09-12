export interface WhatsAppBillItem {
  product_name: string;
  quantity: number | string;
  selling_price: number | string;
  row_total: number | string;
}

export interface WhatsAppBillData {
  bill_id: string;
  created_at?: string | number | Date;
  sub_total: number | string;
  discount?: number | string;
  total: number | string;
}

export interface WhatsAppCustomerData {
  name?: string;
  mobile?: string;
}

/**
 * Generates formatted text message for WhatsApp billing
 * Clean text without emoji icons, with business address and contact info.
 */
export function generateWhatsAppBillMessage(
  bill: WhatsAppBillData,
  items: WhatsAppBillItem[],
  customer?: WhatsAppCustomerData | null
): string {
  const billDate = new Date(
    bill.created_at || Date.now()
  ).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const itemsList = items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.product_name}*\n   Qty: ${item.quantity} | Rate: Rs.${Number(item.selling_price).toFixed(2)} | Total: Rs.${Number(item.row_total).toFixed(2)}`
    )
    .join('\n');

  let message = `*LAKSHMI SATYANARAYANA ENTERPRISES*\n`;
  message += `Opp. andhra bank, main road, amaravathi\n`;
  message += `Mobile: 9063532585\n`;
  message += `------------------------------------\n`;
  message += `Bill No: ${bill.bill_id}\n`;
  message += `Date: ${billDate}\n`;
  if (customer?.name) {
    message += `Customer: ${customer.name}${
      customer.mobile ? ` (${customer.mobile})` : ''
    }\n`;
  }
  message += `------------------------------------\n`;
  message += `PURCHASED ITEMS:\n${itemsList}\n`;
  message += `------------------------------------\n`;
  message += `Subtotal: Rs.${Number(bill.sub_total).toFixed(2)}\n`;
  if (Number(bill.discount || 0) > 0) {
    message += `Discount: -Rs.${Number(bill.discount).toFixed(2)}\n`;
  }
  message += `Grand Total: Rs.${Number(bill.total).toFixed(2)}\n`;
  message += `------------------------------------\n`;
  message += `Thank you for your business!\nVisit Again!`;

  return message;
}

/**
 * Direct function to open WhatsApp with bill details for a customer
 */
export function sendWhatsAppBill(
  bill: WhatsAppBillData,
  items: WhatsAppBillItem[],
  customer?: WhatsAppCustomerData | null
): void {
  const message = generateWhatsAppBillMessage(bill, items, customer);
  const custMobile = customer?.mobile ? customer.mobile.replace(/\D/g, '') : '';
  let formattedPhone = custMobile;
  if (formattedPhone.length === 10) {
    formattedPhone = `91${formattedPhone}`;
  }

  const encodedMessage = encodeURIComponent(message);
  const waUrl = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;

  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }
}
