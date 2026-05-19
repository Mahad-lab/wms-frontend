import { useState } from 'react';
import type { Order } from '../types';

interface Props {
  order: Order;
  onClose: () => void;
}

export function BillPreview({ order, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);

  async function downloadImage() {
    setDownloading(true);
    const el = document.getElementById('bill-content');
    if (!el) return;

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.download = `${order.client_name}-${order.order_date}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloading(false);
  }

  async function downloadPDF() {
    setDownloading(true);
    const el = document.getElementById('bill-content');
    if (!el) return;

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const ratio = canvas.height / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfWidth * ratio);
    pdf.save(`${order.client_name}-${order.order_date}.pdf`);
    setDownloading(false);
  }

  const grouped = (order.lines || []).reduce((acc, line) => {
    const cat = line.category || 'Others';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(line);
    return acc;
  }, {} as Record<string, typeof order.lines>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex gap-2">
          <button onClick={downloadImage} disabled={downloading} className="bg-blue-600 text-white px-4 py-2 rounded">
            Image
          </button>
          <button onClick={downloadPDF} disabled={downloading} className="bg-red-600 text-white px-4 py-2 rounded">
            PDF
          </button>
          <button onClick={() => window.print()} className="bg-gray-600 text-white px-4 py-2 rounded">
            Print
          </button>
          <button onClick={onClose} className="ml-auto text-gray-500">✕ Close</button>
        </div>

        <div id="bill-content" className="p-6 bg-white">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Purchase Bill</h2>
            <div className="mt-2 flex justify-between">
              <span><strong>Client:</strong> {order.client_name}</span>
              <span><strong>Date:</strong> {order.order_date}</span>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">ITEM</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Weight</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([cat, lines]) => (
                <>
                  <tr key={cat} className="bg-gray-100">
                    <td colSpan={4} className="py-1 font-bold">{cat}</td>
                  </tr>
                  {lines?.map((l, i) => (
                    <tr key={i}>
                      <td className="py-1">{l.item_name}</td>
                      <td className="text-right">{l.rate}</td>
                      <td className="text-right">{l.weight} {l.unit}</td>
                      <td className="text-right">{l.total.toFixed(1)}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>

          <div className="mt-4 border-t pt-2">
            <div className="flex justify-between">
              <span>Total</span>
              <span>₹{order.current_total.toFixed(1)}</span>
            </div>
            {order.old_balance > 0 && (
              <div className="flex justify-between">
                <span>Old Balance</span>
                <span>₹{order.old_balance.toFixed(1)}</span>
              </div>
            )}
            {order.paid > 0 && (
              <div className="flex justify-between">
                <span>Paid</span>
                <span>- ₹{order.paid.toFixed(1)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Final Balance</span>
              <span>₹{order.balance_due.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}