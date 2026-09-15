'use client';

import React from 'react';
import {
  Printer,
  CheckCircle2,
  X,
  MessageCircle,
  Calendar,
  Clock,
  User,
  Phone,
  Banknote,
  Smartphone,
  CreditCard,
  Tag,
  Store,
} from 'lucide-react';
import { CreatedBillResult, BillItemInput, PaymentBreakdown } from '@/lib/createbillStore';
import { Customer } from '@/lib/customersStore';
import { AssociateRecord } from '@/lib/adminassociateStore';
import { sendWhatsAppBill } from '@/lib/whatsapp';
import { generateBillPdf } from '@/lib/generateBillPdf';

export interface PrintBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: CreatedBillResult | null;
  items: BillItemInput[];
  customer?: Customer | null;
  associate?: AssociateRecord | null;
  payments?: PaymentBreakdown;
  onNextBill?: () => void;
}

export default function PrintBillModal({
  isOpen,
  onClose,
  bill,
  items,
  customer,
  associate,
  payments,
  onNextBill,
}: PrintBillModalProps) {
  if (!isOpen || !bill) return null;


  const handleDownloadPdf = () => {
  if (!bill) return;

  generateBillPdf({
    bill,
    items,
    customer,
    associate,
    payments,
  });
};

  const handleSendWhatsApp = () => {
    if (!bill) return;
    sendWhatsAppBill(bill, items, customer);
  };

  const handleDone = () => {
    onClose();
    if (onNextBill) {
      onNextBill();
    }
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const billDate = bill.created_at ? new Date(bill.created_at) : new Date();
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

  return (
    <>
      {/* Dedicated Print Media Styles to only print receipt content */}
      <style>{`
        @media print {
          /* Hide all UI elements outside the printable receipt */
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #bill-receipt-printable-root,
          #bill-receipt-printable-root * {
            visibility: visible !important;
          }
          #bill-receipt-printable-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 10px 14px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            display: block !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>

      <div
        id="print-bill-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs erp-fade-in overflow-y-auto print:hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDone();
        }}
      >
        <div
          id="print-bill-modal-card"
          className="w-full max-w-lg bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden erp-slide-up my-4"
        >
          {/* Header Banner */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-subtle)]/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--success-light)] border border-[var(--success)]/30 flex items-center justify-center text-[var(--success)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                  Bill Saved Successfully!
                </h3>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {bill.bill_id}
                </span>
              </div>
            </div>
            <button
              id="close-print-bill-modal-btn"
              type="button"
              onClick={handleDone}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Receipt Container (Screen & Print view) */}
          <div className="p-4 sm:p-5 max-h-[65vh] overflow-y-auto bg-[var(--background)]">
            <div
              id="bill-receipt-printable-root"
              className="p-5 bg-white text-black rounded-xl border border-gray-200 shadow-xs font-mono text-xs space-y-3.5 select-text"
            >
              {/* Store Details Header */}
              <div className="text-center border-b border-dashed border-gray-300 pb-3 space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-gray-800 font-bold text-sm tracking-tight uppercase">
                  <Store className="w-3.5 h-3.5 inline print:hidden text-gray-700" />
                  <span>Lakshmi Satyanarayana Enterprises</span>
                </div>
                <p className="text-[10px] text-gray-600">
                  Opp. Andhra Bank, Main Road, Amaravathi
                </p>
                <p className="text-[10px] text-gray-600 font-semibold">
                  Mobile: 9063532585
                </p>

                {/* Metadata Row */}
                <div className="mt-2 text-[10.5px] flex items-center justify-between border-t border-gray-200 pt-1.5 text-gray-700">
                  <span className="font-bold">Bill: {bill.bill_id}</span>
                  <span>
                    {formattedDate} {formattedTime}
                  </span>
                </div>
              </div>

              {/* Customer and Associate Information */}
              {(customer || associate) && (
                <div className="border-b border-dashed border-gray-300 pb-2.5 text-[11px] space-y-1 text-gray-800">
                  {customer && (
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-gray-500">Customer: </span>
                        <strong>{customer.name}</strong>
                      </div>
                      {customer.mobile && (
                        <div className="text-gray-600">{customer.mobile}</div>
                      )}
                    </div>
                  )}
                  {associate && (
                    <div className="text-[10px] text-gray-600 flex justify-between">
                      <span>Associate: {associate.profile?.name || associate.associate_id}</span>
                      <span>Code: {associate.associate_id}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              <div>
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-800 font-bold text-gray-900">
                      <th className="py-1 text-left"># Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Rate</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="py-1 pr-1 font-medium">
                          <span className="text-gray-500 mr-1">{idx + 1}.</span>
                          <span>{item.product_name}</span>
                          {item.unit && (
                            <span className="text-[9.5px] text-gray-500 ml-1">
                              ({item.unit})
                            </span>
                          )}
                        </td>
                        <td className="py-1 px-1 text-center font-semibold">
                          {item.quantity}
                        </td>
                        <td className="py-1 px-1 text-right text-gray-700">
                          ₹{Number(item.selling_price).toFixed(2)}
                        </td>
                        <td className="py-1 pl-1 text-right font-bold text-gray-900">
                          ₹{Number(item.row_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Calculations */}
              <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[11.5px] text-right">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(bill.sub_total)}</span>
                </div>
                {Number(bill.discount || 0) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(bill.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black border-t border-b border-gray-800 py-1 text-black">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(bill.total)}</span>
                </div>
              </div>

              {/* Payments Breakdown */}
              {payments && (
                <div className="border-b border-dashed border-gray-300 pb-2 text-[10px] space-y-0.5 text-gray-700">
                  <div className="font-bold text-[10.5px] text-gray-800 uppercase">
                    Payment Mode:
                  </div>
                  <div className="flex justify-between flex-wrap gap-2 pt-0.5">
                    {payments.cash > 0 && (
                      <span>Cash: {formatCurrency(payments.cash)}</span>
                    )}
                    {payments.upi > 0 && (
                      <span>UPI: {formatCurrency(payments.upi)}</span>
                    )}
                    {payments.credit > 0 && (
                      <span>Credit: {formatCurrency(payments.credit)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Notice */}
              <div className="text-center text-[10px] text-gray-500 border-t border-dashed border-gray-300 pt-2.5 space-y-0.5">
                <p className="font-semibold text-gray-700">Thank you for your business!</p>
                <p>Goods once sold cannot be returned without bill.</p>
                <p className="text-[9px]">Visit Again</p>
              </div>
            </div>
          </div>

          {/* Modal Action Controls (Hidden on Print) */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 print:hidden">
            {/* WhatsApp Button */}
            <button
              id="whatsapp-bill-btn"
              type="button"
              onClick={handleSendWhatsApp}
              className="erp-btn bg-[#25D366] hover:bg-[#20ba59] text-white border-transparent text-xs font-semibold flex items-center justify-center gap-1.5 py-2 px-3.5 cursor-pointer shadow-xs transition-colors"
              title="Send bill summary via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Bill</span>
            </button>

            {/* Next Bill & Print Buttons */}
            <div className="flex items-center justify-end gap-2">
              <button
                id="next-bill-btn"
                type="button"
                onClick={handleDone}
                className="erp-btn erp-btn-outline text-xs py-2 px-3 cursor-pointer flex-1 sm:flex-none justify-center"
              >
                Done / Next Bill
              </button>
              <button
  id="download-bill-pdf-btn"
  type="button"
  onClick={handleDownloadPdf}
  className="erp-btn erp-btn-primary text-xs font-bold py-2 px-4 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs flex-1 sm:flex-none"
>
  <Printer className="w-4 h-4" />
  <span>Download PDF</span>
</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
