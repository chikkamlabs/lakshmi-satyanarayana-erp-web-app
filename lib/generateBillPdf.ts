import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BillItemInput, CreatedBillResult, PaymentBreakdown } from './createbillStore';
import { Customer } from './customersStore';
import { AssociateRecord } from './adminassociateStore';

interface GenerateBillPdfParams {
  bill: CreatedBillResult;
  items: BillItemInput[];
  customer?: Customer | null;
  associate?: AssociateRecord | null;
  payments?: PaymentBreakdown;
}

const formatCurrency = (value: number | string | undefined) => {
  const num = Number(value || 0);

  return `Rs.${num.toFixed(2)}`;
};

export function generateBillPdf({
  bill,
  items,
  customer,
  associate,
  payments,
}: GenerateBillPdfParams) {
  /*
   * 80mm thermal-receipt style PDF.
   *
   * jsPDF dimensions are in mm.
   * 80mm width is suitable for an 80mm receipt.
   */
  const pageWidth = 80;

  /*
   * Calculate approximate height first.
   * This prevents jsPDF from creating unnecessary pages.
   */
  const baseHeight = 95;
  const itemHeight = Math.max(items.length, 1) * 8;
  const customerHeight = customer || associate ? 12 : 0;
  const paymentHeight = payments ? 12 : 0;

  const pageHeight =
    baseHeight +
    itemHeight +
    customerHeight +
    paymentHeight;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  const centerX = pageWidth / 2;

  let y = 7;

  // ---------------------------------------------------------
  // STORE HEADER
  // ---------------------------------------------------------

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);

  doc.text(
    'LAKSHMI SATYANARAYANA',
    centerX,
    y,
    { align: 'center' }
  );

  y += 4.5;

  doc.text(
    'ENTERPRISES',
    centerX,
    y,
    { align: 'center' }
  );

  y += 4.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);

  doc.text(
    'Opp. Andhra Bank, Main Road, Amaravathi',
    centerX,
    y,
    { align: 'center' }
  );

  y += 3.5;

  doc.setFont('courier', 'bold');

  doc.text(
    'Mobile: 9063532585',
    centerX,
    y,
    { align: 'center' }
  );

  y += 5;

  // ---------------------------------------------------------
  // SEPARATOR
  // ---------------------------------------------------------

  doc.setLineWidth(0.2);
  doc.line(4, y, pageWidth - 4, y);

  y += 4;

  // ---------------------------------------------------------
  // BILL DETAILS
  // ---------------------------------------------------------

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);

  doc.text(`Bill: ${bill.bill_id}`, 4, y);

  const billDate = bill.created_at
    ? new Date(bill.created_at)
    : new Date();

  const formattedDate = billDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = billDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);

  doc.text(
    `${formattedDate} ${formattedTime}`,
    pageWidth - 4,
    y,
    { align: 'right' }
  );

  y += 5;

  // ---------------------------------------------------------
  // CUSTOMER
  // ---------------------------------------------------------

  if (customer) {
    doc.setFontSize(7.5);

    doc.text(
      `Customer: ${customer.name}`,
      4,
      y
    );

    y += 3.5;

    if (customer.mobile) {
      doc.text(
        `Mobile: ${customer.mobile}`,
        4,
        y
      );

      y += 3.5;
    }
  }

  // ---------------------------------------------------------
  // ASSOCIATE
  // ---------------------------------------------------------

  if (associate) {
    doc.setFontSize(7);

    doc.text(
      `Associate: ${associate.profile?.name || associate.associate_id}`,
      4,
      y
    );

    y += 3.5;
  }

  if (customer || associate) {
    doc.line(4, y, pageWidth - 4, y);
    y += 4;
  }

  // ---------------------------------------------------------
  // ITEMS TABLE
  // ---------------------------------------------------------

  const tableBody = items.map((item, index) => [
    `${index + 1}. ${item.product_name}${item.unit ? ` (${item.unit})` : ''}`,
    String(item.quantity),
    Number(item.selling_price || 0).toFixed(2),
    Number(item.row_total || 0).toFixed(2),
  ]);

  autoTable(doc, {
    startY: y,

    head: [
      ['Item', 'Qty', 'Rate', 'Total'],
    ],

    body: tableBody,

    theme: 'plain',

    styles: {
      font: 'courier',
      fontSize: 7,
      textColor: [0, 0, 0],
      cellPadding: {
        top: 1.5,
        bottom: 1.5,
        left: 0.5,
        right: 0.5,
      },
      lineWidth: 0,
    },

    headStyles: {
      font: 'courier',
      fontStyle: 'bold',
      fontSize: 7,
      textColor: [0, 0, 0],
      lineWidth: 0,
      cellPadding: {
        top: 1.5,
        bottom: 1.5,
        left: 0.5,
        right: 0.5,
      },
    },

    bodyStyles: {
      font: 'courier',
      fontSize: 7,
      textColor: [0, 0, 0],
    },

    columnStyles: {
      0: {
        cellWidth: 39,
        halign: 'left',
      },
      1: {
        cellWidth: 9,
        halign: 'center',
      },
      2: {
        cellWidth: 14,
        halign: 'right',
      },
      3: {
        cellWidth: 14,
        halign: 'right',
      },
    },

    margin: {
      left: 4,
      right: 4,
    },

    didDrawCell: (data) => {
      // Header bottom line
      if (data.section === 'head') {
        doc.setLineWidth(0.25);

        doc.line(
          4,
          data.cell.y + data.cell.height,
          pageWidth - 4,
          data.cell.y + data.cell.height
        );
      }
    },
  });

  // Get position after table
  y = (doc as any).lastAutoTable.finalY + 4;

  // ---------------------------------------------------------
  // TOTALS
  // ---------------------------------------------------------

  doc.setLineWidth(0.2);
  doc.line(4, y, pageWidth - 4, y);

  y += 4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);

  doc.text('Subtotal:', 4, y);

  doc.text(
    formatCurrency(bill.sub_total),
    pageWidth - 4,
    y,
    { align: 'right' }
  );

  y += 4;

  if (Number(bill.discount || 0) > 0) {
    doc.text('Discount:', 4, y);

    doc.text(
      `-${formatCurrency(bill.discount)}`,
      pageWidth - 4,
      y,
      { align: 'right' }
    );

    y += 4;
  }

  // Grand total box

  doc.setLineWidth(0.3);

  doc.line(4, y, pageWidth - 4, y);

  y += 5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);

  doc.text('GRAND TOTAL:', 4, y);

  doc.text(
    formatCurrency(bill.total),
    pageWidth - 4,
    y,
    { align: 'right' }
  );

  y += 5;

  doc.line(4, y, pageWidth - 4, y);

  // ---------------------------------------------------------
  // PAYMENT
  // ---------------------------------------------------------

  if (payments) {
    y += 4;

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);

    doc.text('PAYMENT MODE', 4, y);

    y += 4;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);

    if (payments.cash > 0) {
      doc.text(
        `Cash: ${formatCurrency(payments.cash)}`,
        4,
        y
      );

      y += 3.5;
    }

    if (payments.upi > 0) {
      doc.text(
        `UPI: ${formatCurrency(payments.upi)}`,
        4,
        y
      );

      y += 3.5;
    }

    if (payments.credit > 0) {
      doc.text(
        `Credit: ${formatCurrency(payments.credit)}`,
        4,
        y
      );

      y += 3.5;
    }
  }

  // ---------------------------------------------------------
  // FOOTER
  // ---------------------------------------------------------

  y += 3;

  doc.setLineWidth(0.2);
  doc.line(4, y, pageWidth - 4, y);

  y += 5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);

  doc.text(
    'Thank you for your business!',
    centerX,
    y,
    { align: 'center' }
  );

  y += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);

  doc.text(
    'Goods once sold cannot be returned without bill.',
    centerX,
    y,
    { align: 'center' }
  );

  y += 3.5;

  doc.setFont('courier', 'bold');
  doc.text(
    'Visit Again',
    centerX,
    y,
    { align: 'center' }
  );

  // ---------------------------------------------------------
  // DOWNLOAD
  // ---------------------------------------------------------

  doc.save(`${bill.bill_id}.pdf`);
}