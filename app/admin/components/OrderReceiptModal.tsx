'use client';

import { useRef } from 'react';
import { X, Printer, CheckCircle2, Store, Calendar, Phone, Mail } from 'lucide-react';

export interface ReceiptItem {
  name: string;
  year: string;
  price: number;
  qty: number;
}

export interface ReceiptData {
  orderNumber: string;
  orderId?: string;
  orderType?: 'online' | 'in_store';
  createdAt: string;
  amount: number;
  paymentMethod?: string;
  paymentId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  addressLine1?: string;
  city?: string;
  notes?: string;
  items: ReceiptItem[];
}

interface OrderReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export function OrderReceiptModal({ receipt, onClose }: OrderReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(receipt.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Container Dialog */}
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E2D9] overflow-hidden">
        {/* Modal Top Actions (Hidden on Print) */}
        <div className="p-4 bg-[#FAF7F2] border-b border-[#E8E2D9] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-xs font-bold text-[#2E2A27] uppercase tracking-wider">
              Store Order Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5A7A56] hover:bg-[#486345] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer size={14} /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#7A7367] hover:bg-[#E8E2D9] hover:text-[#2E2A27] transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-sans text-[#2E2A27]" ref={receiptRef} id="printable-receipt">
          {/* Store Branding Header */}
          <div className="text-center pb-5 border-b border-dashed border-[#DCD6CC]">
            <div className="w-12 h-12 rounded-2xl bg-[#5A7A56] text-white font-bold text-xl flex items-center justify-center mx-auto mb-2 shadow-xs">
              AN
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#2E2A27]" style={{ fontFamily: "'Fraunces', serif" }}>
              AttireNest
            </h2>
            <p className="text-xs text-[#7A7367] mt-0.5">Kids Apparel & Essentials</p>
            <p className="text-[11px] text-[#8C8479]">Bangalore, Karnataka • attirenest.kids</p>
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D9] text-[10px] font-bold text-[#5A7A56]">
              {receipt.orderType === 'in_store' ? (
                <>
                  <Store size={10} /> In-Store Counter Sale
                </>
              ) : (
                'Online Order'
              )}
            </div>
          </div>

          {/* Receipt Metadata */}
          <div className="py-4 border-b border-dashed border-[#DCD6CC] text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#8C8479]">Receipt / Order #:</span>
              <span className="font-extrabold text-[#2E2A27]">{receipt.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C8479]">Date & Time:</span>
              <span className="font-medium text-[#4A443B]">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C8479]">Customer:</span>
              <span className="font-bold text-[#2E2A27]">
                {receipt.customerName || 'Walk-in Customer'}
              </span>
            </div>
            {receipt.customerPhone && (
              <div className="flex justify-between">
                <span className="text-[#8C8479]">Phone:</span>
                <span className="font-medium text-[#4A443B]">{receipt.customerPhone}</span>
              </div>
            )}
            {receipt.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-[#8C8479]">Payment Mode:</span>
                <span className="font-bold uppercase text-emerald-800">
                  {receipt.paymentMethod}
                </span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-4 border-b border-dashed border-[#DCD6CC]">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#8C8479] text-[10px] uppercase border-b border-[#E8E2D9] pb-1">
                  <th className="text-left py-1 font-bold">Item & Size</th>
                  <th className="text-center py-1 font-bold">Qty</th>
                  <th className="text-right py-1 font-bold">Rate</th>
                  <th className="text-right py-1 font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE6]">
                {receipt.items.map((item, index) => (
                  <tr key={index} className="py-2">
                    <td className="py-2 pr-2">
                      <div className="font-bold text-[#2E2A27]">{item.name}</div>
                      <div className="text-[10px] text-[#7A7367]">Size: {item.year}</div>
                    </td>
                    <td className="text-center py-2 text-[#4A443B] font-medium">{item.qty}</td>
                    <td className="text-right py-2 text-[#7A7367]">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="text-right py-2 font-bold text-[#2E2A27]">
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Grand Amount */}
          <div className="py-4 border-b border-dashed border-[#DCD6CC] space-y-1.5 text-xs">
            <div className="flex justify-between font-extrabold text-base pt-1 text-[#2E2A27]">
              <span>Grand Total</span>
              <span className="text-[#5A7A56]">₹{receipt.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1 pt-1">
              <CheckCircle2 size={13} /> Paid in Full
            </div>
          </div>

          {/* Notes if any */}
          {receipt.notes && (
            <div className="py-3 text-[11px] text-[#665F55] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9] mt-3">
              <strong>Order Notes:</strong> {receipt.notes}
            </div>
          )}

          {/* Footer note */}
          <div className="text-center pt-6 text-[10px] text-[#8C8479] space-y-1">
            <p className="font-semibold text-[#5A7A56]">Thank you for shopping with AttireNest! ✨</p>
            <p>Exchange allowed within 7 days with this bill in original condition.</p>
            <p className="text-[9px] text-[#A39B8F] pt-2">Generated by AttireNest Store POS</p>
          </div>
        </div>

        {/* Modal Bottom Close Button (Hidden on Print) */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E2D9] flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#DCD6CC] text-xs font-semibold text-[#4A443B] hover:bg-[#F3EFE6] transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5A7A56] hover:bg-[#486345] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer size={14} /> Print Bill
          </button>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
