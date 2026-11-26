import React, { useState } from 'react';
import { InvoiceItem } from '../../services/idbStorage';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<InvoiceItem, 'id'>) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const [hsn, setHsn] = useState('852580');
  const [unit, setUnit] = useState('NOS');
  const [baseRate, setBaseRate] = useState<number | ''>('');
  const [rate, setRate] = useState<number | ''>('');
  const [qty, setQty] = useState<number>(1);

  if (!isOpen) return null;

  const handleBaseRateChange = (val: string) => {
    if (val === '') {
      setBaseRate('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setBaseRate(num);
      if (rate === '' || rate === 0) {
        setRate(Math.round(num * 1.10));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalRate = typeof rate === 'number' ? rate : (typeof baseRate === 'number' ? Math.round(baseRate * 1.10) : 0);
    const finalBaseRate = typeof baseRate === 'number' ? baseRate : Math.round(finalRate / 1.10);

    onAdd({
      name: name.trim(),
      serial: serial.trim(),
      hsn: hsn.trim(),
      unit,
      rate: finalRate,
      baseRate: finalBaseRate,
      qty: qty > 0 ? qty : 1
    });

    setName('');
    setSerial('');
    setHsn('852580');
    setUnit('NOS');
    setBaseRate('');
    setRate('');
    setQty(1);
    onClose();
  };

  return (
    <div className="no-print fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-scale-up">
        <h3 className="text-base font-bold text-brand-800 flex items-center gap-2 mb-4">
          <span className="material-icons text-lg">add_box</span>
          Add Product Line Item
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
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
          <div className="grid grid-cols-3 gap-2">
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
              <label className="block font-semibold text-slate-700 mb-1">Rate (+10%)</label>
              <input
                type="number"
                required
                step="any"
                min="0"
                placeholder="1400"
                value={rate}
                onChange={(e) => setRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full border border-slate-300 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
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
