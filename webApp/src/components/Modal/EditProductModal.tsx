import React, { useState, useEffect } from 'react';
import { InvoiceItem } from '../../services/idbStorage';

interface EditProductModalProps {
  isOpen: boolean;
  item: InvoiceItem | null;
  invoiceMode: 'RETAIL' | 'WHOLESALE' | 'B2B';
  onClose: () => void;
  onSave: (updatedItem: InvoiceItem) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  item,
  invoiceMode,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const [hsn, setHsn] = useState('');
  const [unit, setUnit] = useState('NOS');
  const [baseRate, setBaseRate] = useState<number | ''>('');
  const [rate, setRate] = useState<number | ''>('');
  const [qty, setQty] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isWholesale = invoiceMode === 'WHOLESALE' || (invoiceMode as string) === 'B2B';
  const marginPct = isWholesale ? 1.10 : 1.30;
  const pctLabel = isWholesale ? '+10%' : '+30%';

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setSerial(item.serial || '');
      setHsn(item.hsn || '');
      setUnit(item.unit || 'NOS');
      const bRate = typeof item.baseRate === 'number' && item.baseRate > 0
        ? item.baseRate
        : Math.round(item.rate / marginPct);
      setBaseRate(bRate);
      setRate(item.rate);
      setQty(item.qty || 1);
      setErrorMsg(null);
    }
  }, [item, isOpen, marginPct]);

  if (!isOpen || !item) return null;

  const currentBaseRate = typeof baseRate === 'number' ? baseRate : Math.round((typeof rate === 'number' ? rate : 0) / marginPct);
  const minAllowedRate = currentBaseRate * 0.90; // 10% lower than Base Rate
  const currentRateNum = typeof rate === 'number' ? rate : 0;
  const isRateInvalid = isWholesale && currentRateNum < minAllowedRate;

  const handleBaseRateChange = (val: string) => {
    if (val === '') {
      setBaseRate('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setBaseRate(num);
      const autoRate = Math.round(num * marginPct);
      setRate(autoRate);
      if (isWholesale && autoRate < num * 0.90) {
        setErrorMsg(`In Wholesale Mode, Rate cannot be set below ₹${(num * 0.90).toFixed(2)}`);
      } else {
        setErrorMsg(null);
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
      if (isWholesale && num < minAllowedRate) {
        setErrorMsg(`Wholesale Guard: Rate cannot be less than 10% below Base Rate (Min ₹${minAllowedRate.toFixed(2)})`);
      } else {
        setErrorMsg(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isRateInvalid) {
      setErrorMsg(`Cannot save: Rate (₹${currentRateNum}) is below 10% of Base Rate (Min ₹${minAllowedRate.toFixed(2)})`);
      return;
    }

    const finalRate = typeof rate === 'number' ? rate : Math.round(currentBaseRate * 1.10);
    const finalBaseRate = typeof baseRate === 'number' ? baseRate : Math.round(finalRate / 1.10);

    onSave({
      ...item,
      name: name.trim(),
      serial: serial.trim(),
      hsn: hsn.trim(),
      unit,
      baseRate: finalBaseRate,
      rate: finalRate,
      qty: qty > 0 ? qty : 1
    });

    onClose();
  };

  const totalAmount = currentRateNum * (qty > 0 ? qty : 1);

  return (
    <div className="no-print fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
        {/* Header with Material Gradient & Icon */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-blue-800 p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <span className="material-icons text-xl">edit_note</span>
            </div>
            <div>
              <h3 className="text-base font-bold uppercase tracking-wide leading-tight">Edit Line Item</h3>
              <p className="text-[11px] text-blue-200 font-medium">Material Item Customizer & Rate Calculator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <span className="material-icons text-base">close</span>
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Item Description */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
              <span className="material-icons text-sm text-brand-700">description</span>
              Product Description / Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DVR 8 CH CPPLUS"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-900 bg-slate-50/50 focus:bg-white transition"
            />
          </div>

          {/* Serial Numbers */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
              <span className="material-icons text-sm text-brand-700">fingerprint</span>
              Serial Numbers (S/N)
            </label>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="e.g. DDELD1D3E8LWDPHU, ZTS2OGV764JZWTU3"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs text-slate-800 bg-slate-50/50 focus:bg-white transition"
            />
          </div>

          {/* HSN & Unit Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                <span className="material-icons text-sm text-brand-700">qr_code</span>
                HSN Code
              </label>
              <input
                type="text"
                required
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-mono text-center font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                <span className="material-icons text-sm text-brand-700">category</span>
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 outline-none bg-slate-50/50 focus:bg-white font-bold text-slate-900 cursor-pointer transition"
              >
                <option value="NOS">NOS</option>
                <option value="PCS">PCS</option>
                <option value="ROLL">ROLL</option>
                <option value="PKT">PKT</option>
                <option value="MTR">MTR</option>
                <option value="SET">SET</option>
              </select>
            </div>
          </div>

          {/* Rates & Quantity Grid */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                <span className="material-icons text-sm text-brand-700">sell</span>
                Base Rate (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={baseRate}
                onChange={(e) => handleBaseRateChange(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-800 bg-slate-100 text-right transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                <span className="material-icons text-sm text-emerald-700">payments</span>
                Rate ({pctLabel})
              </label>
              <input
                type="number"
                required
                step="any"
                min="0"
                value={rate}
                onChange={(e) => handleRateChange(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 font-bold text-right transition ${
                  isRateInvalid
                    ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-400'
                    : 'border-slate-300 focus:ring-brand-500 text-slate-900 bg-white'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                <span className="material-icons text-sm text-brand-700">unfold_more</span>
                Quantity
              </label>
              <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center active:bg-slate-400 transition"
                >
                  -
                </button>
                <input
                  type="number"
                  required
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center font-bold outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-7 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center active:bg-slate-400 transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Inline Validation Warning Badge */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold flex items-start gap-2 animate-shake">
              <span className="material-icons text-base text-red-600 flex-shrink-0">warning</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Computed Amount Display Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-brand-950 text-white flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Line Item Total Amount</span>
              <span className="text-xs text-blue-200 font-medium">Rate (₹{currentRateNum}) × Qty ({qty})</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-emerald-400 tracking-tight">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRateInvalid}
              className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-lg transition flex items-center gap-2 ${
                isRateInvalid
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95'
              }`}
            >
              <span className="material-icons text-sm">check_circle</span>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
