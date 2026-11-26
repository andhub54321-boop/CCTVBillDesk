import React, { useState } from 'react';
import { InvoiceItem } from '../../services/idbStorage';

interface AddProductModalProps {
  isOpen: boolean;
  invoiceMode?: 'RETAIL' | 'WHOLESALE' | 'B2B';
  onClose: () => void;
  onAdd: (item: Omit<InvoiceItem, 'id'>) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  invoiceMode = 'RETAIL',
  onClose,
  onAdd
}) => {
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const [hsn, setHsn] = useState('852580');
  const [unit, setUnit] = useState('NOS');
  const [baseRate, setBaseRate] = useState<number | ''>('');
  const [rate, setRate] = useState<number | ''>('');
  const [mrp, setMrp] = useState<number | ''>('');
  const [qty, setQty] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isWholesale = invoiceMode === 'WHOLESALE' || (invoiceMode as string) === 'B2B';
  const marginPct = isWholesale ? 1.10 : 1.30;
  const pctLabel = isWholesale ? '+10%' : '+30%';

  const handleBaseRateChange = (val: string) => {
    if (val === '') {
      setBaseRate('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setBaseRate(num);
      if (rate === '' || rate === 0) {
        const calculatedRate = Math.round(num * marginPct);
        setRate(calculatedRate);
        if (typeof mrp === 'number' && mrp > 0 && calculatedRate > mrp) {
          setErrorMsg(`Rate (₹${calculatedRate}) cannot exceed MRP (₹${mrp})`);
        } else {
          setErrorMsg(null);
        }
      }
    }
  };

  const handleRateChange = (val: string) => {
    if (val === '') {
      setRate('');
      setErrorMsg(null);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setRate(num);
      const bRate = typeof baseRate === 'number' ? baseRate : 0;
      const minWholesale = Math.round((bRate * 1.10) * 100) / 100;
      if (typeof mrp === 'number' && mrp > 0 && num > mrp) {
        setErrorMsg(`Selling Rate (₹${num}) cannot exceed MRP (₹${mrp})`);
      } else if (isWholesale && bRate > 0 && num < (minWholesale - 0.001)) {
        setErrorMsg(`Wholesale Guard: Rate (₹${num}) cannot be below Base Rate + 10% (Min ₹${minWholesale.toFixed(2)})`);
      } else {
        setErrorMsg(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalRate = typeof rate === 'number' ? rate : (typeof baseRate === 'number' ? Math.round(baseRate * marginPct) : 0);
    const finalBaseRate = typeof baseRate === 'number' ? baseRate : Math.round(finalRate / marginPct);
    const finalMrp = typeof mrp === 'number' && mrp > 0 ? mrp : 0;
    const minWholesale = Math.round((finalBaseRate * 1.10) * 100) / 100;

    if (finalMrp > 0 && finalRate > finalMrp) {
      setErrorMsg(`Selling Rate (₹${finalRate}) exceeds MRP (₹${finalMrp}). Changes blocked.`);
      return;
    }

    if (isWholesale && finalBaseRate > 0 && finalRate < (minWholesale - 0.001)) {
      setErrorMsg(`Wholesale Guard: Rate (₹${finalRate}) cannot be below Base Rate + 10% (Min ₹${minWholesale.toFixed(2)})`);
      return;
    }

    onAdd({
      name: name.trim(),
      serial: serial.trim(),
      hsn: hsn.trim(),
      unit,
      rate: finalRate,
      baseRate: finalBaseRate,
      mrp: finalMrp,
      qty: qty > 0 ? qty : 1
    });

    setName('');
    setSerial('');
    setHsn('852580');
    setUnit('NOS');
    setBaseRate('');
    setRate('');
    setMrp('');
    setQty(1);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="no-print fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-scale-up my-auto max-h-[90vh] flex flex-col overflow-hidden">
        <h3 className="text-base font-bold text-brand-800 flex items-center gap-2 mb-3 flex-shrink-0">
          <span className="material-icons text-lg">add_box</span>
          Add Product Line Item
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs overflow-y-auto">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Description</label>
            <input
              type="text"
              required
              placeholder="e.g. CP PLUS CAMERA 2.4MP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Serial Number(s)</label>
            <input
              type="text"
              placeholder="e.g. SN12345678, SN98765432"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">HSN Code</label>
              <input
                type="text"
                required
                placeholder="852580"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 outline-none bg-white font-medium"
              >
                <option value="NOS">NOS</option>
                <option value="PCS">PCS</option>
                <option value="ROLL">ROLL</option>
                <option value="PKT">PKT</option>
                <option value="MTR">MTR</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Base Rate (₹)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="1272"
                value={baseRate}
                onChange={(e) => handleBaseRateChange(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-semibold bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">MRP (₹) (Hidden Calc)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0 (Optional)"
                value={mrp}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                  setMrp(val);
                  if (typeof val === 'number' && val > 0 && typeof rate === 'number' && rate > val) {
                    setErrorMsg(`Rate (₹${rate}) exceeds MRP (₹${val})`);
                  } else {
                    setErrorMsg(null);
                  }
                }}
                className="w-full border border-slate-300 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-semibold bg-amber-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rate (₹) ({pctLabel})</label>
              <input
                type="number"
                required
                step="any"
                min="0"
                placeholder="1400"
                value={rate}
                onChange={(e) => handleRateChange(e.target.value)}
                className={`w-full border rounded-xl px-2.5 py-2 outline-none focus:ring-2 font-semibold ${
                  errorMsg ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300 focus:ring-brand-500'
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="w-full border border-slate-300 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5">
              <span className="material-icons text-sm text-red-600">error</span>
              <span>{errorMsg}</span>
            </div>
          )}
          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-800 text-white hover:bg-brand-900 font-semibold shadow-lg transition"
            >
              Add to Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
