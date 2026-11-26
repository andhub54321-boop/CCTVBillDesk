import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import {
  InvoiceData,
  InvoiceItem,
  InvoiceCustomer,
  getStoredInvoices,
  saveInvoice,
  deleteInvoice,
  getAsset,
  saveAsset,
  deleteAsset,
  clearAllData,
} from '../../services/idbStorage';
import { formatINR, numberToWords } from '../../utils/numberToWords';
import { AddProductModal } from '../Modal/AddProductModal';
import { MaterialDialog, DialogOptions } from '../Dialog/MaterialDialog';
import { ToastContainer, ToastMessage } from '../Toast/ToastContainer';
import { InstallPrompt } from '../InstallPrompt/InstallPrompt';

const DEFAULT_SEED_ITEMS: InvoiceItem[] = [
  { id: 1, name: "DVR 8 CH CPPLUS", serial: "DDELD1D3E8LWDPHU", hsn: "852190", qty: 2, unit: "NOS", rate: 4500, baseRate: 4091 },
  { id: 2, name: "DVR 4 CH CPPLUS", serial: "DDELD1D3E8LWDPHU", hsn: "852190", qty: 1, unit: "NOS", rate: 2450, baseRate: 2227 },
  { id: 3, name: "CAMERA 2.4 BULLET COLOUR(ILLUMAX)", serial: "CAUAT80DM2DWH0CQ, ZTS2OGV764JZWTU3, 713BIXK7SG4TGQ2, 22JF0GZL5JVGG7H", hsn: "852580", qty: 4, unit: "PCS", rate: 1400, baseRate: 1273 },
  { id: 4, name: "CAMERA 2.4 DOME COLOUR(ILLUMAX)", serial: "", hsn: "85258900", qty: 1, unit: "PCS", rate: 1400, baseRate: 1273 },
  { id: 5, name: "POWER SUPPLY 10 AMPS PD08", serial: "B5LLPQHSUGU81OL", hsn: "850440", qty: 1, unit: "PCS", rate: 700, baseRate: 636 },
  { id: 6, name: "HDD 500GB DAICHI", serial: "DGZE00C03268", hsn: "847170", qty: 1, unit: "NOS", rate: 2500, baseRate: 2273 },
  { id: 7, name: "MONITOR", serial: "", hsn: "85285200", qty: 1, unit: "NOS", rate: 2570, baseRate: 2336 },
  { id: 8, name: "CABLE 3+1 CC CPPLUS (90MTR)", serial: "", hsn: "854449", qty: 1, unit: "ROLL", rate: 1450, baseRate: 1318 },
  { id: 9, name: "RACK 2U CP PLUS", serial: "", hsn: "84733099", qty: 1, unit: "NOS", rate: 650, baseRate: 591 },
  { id: 10, name: "PVC BOX 4*4", serial: "", hsn: "39261011", qty: 4, unit: "NOS", rate: 55, baseRate: 50 },
  { id: 11, name: "BNC JACK", serial: "", hsn: "85366990", qty: 8, unit: "NOS", rate: 25, baseRate: 23 },
  { id: 12, name: "DC JACK", serial: "", hsn: "85366990", qty: 4, unit: "PCS", rate: 15, baseRate: 14 },
  { id: 13, name: "DVM WALL MOUNT", serial: "", hsn: "73262090", qty: 1, unit: "NOS", rate: 250, baseRate: 227 },
  { id: 14, name: "U CLIP(3917)A", serial: "", hsn: "3917", qty: 2, unit: "PKT", rate: 100, baseRate: 91 }
];

const getFormattedCurrentDate = () => {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(now.getDate()).padStart(2, '0')}-${months[now.getMonth()]}-${now.getFullYear()}`;
};

export const InvoiceDashboard: React.FC = () => {
  // Main Dashboard State
  const [items, setItems] = useState<InvoiceItem[]>(DEFAULT_SEED_ITEMS);
  const [customer, setCustomer] = useState<InvoiceCustomer>({
    name: 'Walk-in Customer',
    address: 'Kaliabor, Nagaon, Assam',
    contact: '+91 98540 XXXXX',
    state: 'Assam (18)'
  });
  const [invNo, setInvNo] = useState('XE-2026-014');
  const [invDate, setInvDate] = useState(getFormattedCurrentDate());
  const [payMode, setPayMode] = useState('UPI / Cash');
  const [place, setPlace] = useState('Assam (18)');

  // Custom Header & Summary States
  const [gstStatus, setGstStatus] = useState('All prices inclusive of GST');
  const [companyMobile, setCompanyMobile] = useState('+91 98540 XXXXX');
  const [companyEmail, setCompanyEmail] = useState('xondhan.electronics@gmail.com');
  const [companyAddress, setCompanyAddress] = useState('Borghuli, Kaliabor, Nagaon, Assam-782120');
  const [companySubHeader, setCompanySubHeader] = useState('CCTV Surveillance Systems & Security Solutions');

  // Billing Mode Selection (Retail vs B2B)
  const [invoiceMode, setInvoiceMode] = useState<'RETAIL' | 'B2B'>('RETAIL');
  const [gstinBuyer, setGstinBuyer] = useState('18AAAAA0000A1Z5');
  const [gstinSeller, setGstinSeller] = useState('18XXXXX0000X1Z1');

  // Assets & Saved Data
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [signUrl, setSignUrl] = useState<string | null>(null);
  const [savedBills, setSavedBills] = useState<InvoiceData[]>([]);

  // UI Interactive States
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRateId, setEditingRateId] = useState<number | null>(null);
  const [tempRate, setTempRate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setCanInstall] = useState(false);

  // Full Row Editing States
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editRowData, setEditRowData] = useState<InvoiceItem | null>(null);

  // Material Dialog System State
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: DialogOptions;
    resolveRef?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: { title: '', message: '' }
  });

  // Toast System State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helper: Show Toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  };

  // Helper: Confirm Dialog Promise
  const confirmDialog = (options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        resolveRef: resolve
      });
    });
  };

  const handleDialogConfirm = () => {
    if (dialogState.resolveRef) dialogState.resolveRef(true);
    setDialogState({ isOpen: false, options: { title: '', message: '' } });
  };

  const handleDialogCancel = () => {
    if (dialogState.resolveRef) dialogState.resolveRef(false);
    setDialogState({ isOpen: false, options: { title: '', message: '' } });
  };

  // Hydration on mount
  useEffect(() => {
    async function loadData() {
      const storedInvoices = await getStoredInvoices();
      setSavedBills(storedInvoices);

      const logo = await getAsset('logo');
      if (logo) setLogoUrl(logo);

      const sign = await getAsset('signature');
      if (sign) setSignUrl(sign);
    }
    loadData();
  }, []);

  // Filtered Line Items
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(term) ||
        (it.serial && it.serial.toLowerCase().includes(term)) ||
        it.hsn.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  // Totals Calculation
  const totals = useMemo(() => {
    const totalCount = items.length;
    const totalUnits = items.reduce((acc, curr) => acc + Number(curr.qty), 0);
    const totalSum = items.reduce((acc, curr) => acc + curr.rate * curr.qty, 0);
    return { totalCount, totalUnits, totalSum };
  }, [items]);

  // Item Handlers
  const handleUpdateQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
    );
  };

  const handleDeleteItem = async (id: number) => {
    const confirmed = await confirmDialog({
      title: 'Delete Line Item',
      message: 'Are you sure you want to remove this line item from the active invoice?',
      icon: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true
    });
    if (confirmed) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('Item deleted successfully');
    }
  };

  const handleReorder = (index: number, direction: number) => {
    const target = index + direction;
    if (target >= 0 && target < items.length) {
      const copy = [...items];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      setItems(copy);
    }
  };

  const handleStartRateEdit = (id: number, currentRate: number) => {
    setEditingRateId(id);
    setTempRate(String(currentRate));
  };

  const handleSaveRate = async (id: number) => {
    const parsed = parseFloat(tempRate);
    const validRate = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    const targetItem = items.find((i) => i.id === id);

    if (targetItem) {
      const baseRate = targetItem.baseRate || Math.round(targetItem.rate / 1.10);
      const minAllowed = baseRate * 0.90; // 10% lower than Base Rate

      if (invoiceMode === 'B2B' && validRate < minAllowed) {
        setEditingRateId(null);
        await confirmDialog({
          title: 'Rate Below B2B Minimum Limit!',
          message: `In B2B Mode, Rate cannot be reduced below 10% lower than Base Rate (Minimum allowed: ₹${minAllowed.toFixed(2)} for Base Rate ₹${baseRate}). Changes rejected.`,
          icon: 'warning',
          confirmText: 'OK',
          cancelText: '',
          isDanger: true
        });
        return;
      }
    }

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, rate: validRate } : i)));
    setEditingRateId(null);
  };

  const handleAddItem = (newItem: Omit<InvoiceItem, 'id'>) => {
    setItems((prev) => [...prev, { ...newItem, id: Date.now() }]);
    showToast('Product added to invoice');
  };

  // Full Row Editing Handlers
  const handleStartEditRow = (item: InvoiceItem) => {
    setEditingRowId(item.id);
    const baseRateVal = item.baseRate || Math.round(item.rate / 1.10);
    setEditRowData({ ...item, baseRate: baseRateVal });
  };

  const handleSaveEditRow = async () => {
    if (!editRowData) return;

    const baseRateVal = typeof editRowData.baseRate === 'number' && editRowData.baseRate > 0
      ? editRowData.baseRate
      : Math.round(editRowData.rate / 1.10);

    const minAllowed = baseRateVal * 0.90;

    if (invoiceMode === 'B2B' && editRowData.rate < minAllowed) {
      await confirmDialog({
        title: 'Rate Below B2B Minimum Limit!',
        message: `In B2B Mode, Rate (₹${editRowData.rate}) cannot be set lower than 10% of Base Rate (Minimum allowed: ₹${minAllowed.toFixed(2)} for Base Rate ₹${baseRateVal}). Changes rejected.`,
        icon: 'warning',
        confirmText: 'OK',
        cancelText: '',
        isDanger: true
      });
      return;
    }

    const updatedItem: InvoiceItem = {
      ...editRowData,
      baseRate: baseRateVal
    };

    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    );
    setEditingRowId(null);
    setEditRowData(null);
    showToast('Row updated successfully');
  };

  const handleCancelEditRow = () => {
    setEditingRowId(null);
    setEditRowData(null);
  };

  // Logo & Signature Uploads
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      await saveAsset('logo', base64);
      setLogoUrl(base64);
      showToast('Company logo updated');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    const confirmed = await confirmDialog({
      title: 'Remove Logo',
      message: 'Remove the saved business logo from the invoice?',
      icon: 'warning',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      isDanger: true
    });
    if (confirmed) {
      await deleteAsset('logo');
      setLogoUrl(null);
      showToast('Logo removed');
    }
  };

  const handleSignUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      await saveAsset('signature', base64);
      setSignUrl(base64);
      showToast('Digital signature uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSign = async () => {
    const confirmed = await confirmDialog({
      title: 'Remove Signature',
      message: 'Remove the scanned signature from this bill?',
      icon: 'warning',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      isDanger: true
    });
    if (confirmed) {
      await deleteAsset('signature');
      setSignUrl(null);
      showToast('Signature removed');
    }
  };

  // Saved Invoices Operations
  const generateNextInvoiceNo = () => {
    const currentYear = new Date().getFullYear();
    let maxNum = 14;
    savedBills.forEach((inv) => {
      if (inv.invoiceNo && inv.invoiceNo.startsWith(`XE-${currentYear}-`)) {
        const parts = inv.invoiceNo.split('-');
        const num = parseInt(parts[parts.length - 1]);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `XE-${currentYear}-${nextNum}`;
  };

  const handleCreateNewInvoice = async () => {
    const confirmed = await confirmDialog({
      title: 'New Invoice',
      message: 'Create a new bill with auto-incremented invoice number? Unsaved inputs will be reset.',
      icon: 'help_outline',
      confirmText: 'Create New',
      cancelText: 'Cancel'
    });
    if (confirmed) {
      setInvNo(generateNextInvoiceNo());
      setCustomer({
        name: 'Walk-in Customer',
        address: 'Kaliabor, Nagaon, Assam',
        contact: '+91 98540 XXXXX',
        state: 'Assam (18)'
      });
      setInvDate(getFormattedCurrentDate());
      setItems(DEFAULT_SEED_ITEMS);
      showToast('Initialized new invoice');
    }
  };

  const handleSaveCurrentInvoice = async () => {
    const currentInvNo = invNo.trim() || generateNextInvoiceNo();
    const invoiceData: InvoiceData = {
      invoiceNo: currentInvNo,
      date: invDate,
      payMode,
      place,
      customer,
      items,
      totals,
      invoiceMode,
      gstinBuyer,
      gstinSeller,
      gstStatus,
      companyMobile,
      companyEmail,
      companyAddress,
      companySubHeader,
      savedAt: new Date().toISOString()
    };

    await saveInvoice(invoiceData);
    const updatedList = await getStoredInvoices();
    setSavedBills(updatedList);
    showToast(`Invoice ${currentInvNo} saved to IndexedDB!`);
  };

  const handleLoadInvoice = (inv: InvoiceData) => {
    setInvNo(inv.invoiceNo || '');
    setInvDate(inv.date || getFormattedCurrentDate());
    setPayMode(inv.payMode || 'UPI / Cash');
    setPlace(inv.place || 'Assam (18)');
    if (inv.customer) {
      setCustomer(inv.customer);
    }
    setItems(inv.items ? [...inv.items] : []);
    if (inv.invoiceMode) setInvoiceMode(inv.invoiceMode);
    if (inv.gstinBuyer) setGstinBuyer(inv.gstinBuyer);
    if (inv.gstinSeller) setGstinSeller(inv.gstinSeller);
    if (inv.gstStatus) setGstStatus(inv.gstStatus);
    if (inv.companyMobile) setCompanyMobile(inv.companyMobile);
    if (inv.companyEmail) setCompanyEmail(inv.companyEmail);
    if (inv.companyAddress) setCompanyAddress(inv.companyAddress);
    if (inv.companySubHeader) setCompanySubHeader(inv.companySubHeader);
    showToast(`Loaded invoice ${inv.invoiceNo}`);
  };

  const handleDeleteSavedInvoice = async (invoiceNo: string) => {
    const confirmed = await confirmDialog({
      title: 'Delete Saved Bill',
      message: `Permanently delete saved invoice ${invoiceNo}?`,
      icon: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true
    });
    if (confirmed) {
      await deleteInvoice(invoiceNo);
      const updatedList = await getStoredInvoices();
      setSavedBills(updatedList);
      showToast(`Invoice ${invoiceNo} removed`);
    }
  };

  const handleClearAllData = async () => {
    const confirmed = await confirmDialog({
      title: 'Clear All Records',
      message: 'Are you sure you want to delete ALL saved bills and reset custom logo & signature?',
      icon: 'warning',
      confirmText: 'Clear Everything',
      cancelText: 'Cancel',
      isDanger: true
    });
    if (confirmed) {
      await clearAllData();
      setSavedBills([]);
      setLogoUrl(null);
      setSignUrl(null);
      showToast('All local storage data cleared');
    }
  };

  return (
    <div className="aurora-bg font-sans text-slate-900 antialiased min-h-screen relative overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* Dynamic Floating Glow Orbs (Excluded in print) */}
      <div className="aurora-orb fixed top-10 left-12 w-[34rem] h-[34rem] bg-blue-600/25 rounded-full blur-[110px] pointer-events-none animate-ambient-drift no-print" />
      <div className="aurora-orb fixed bottom-8 right-12 w-[38rem] h-[38rem] bg-emerald-500/20 rounded-full blur-[130px] pointer-events-none animate-float-glow no-print" />
      <div
        className="aurora-orb fixed top-1/2 left-1/3 w-[28rem] h-[28rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-ambient-drift no-print"
        style={{ animationDelay: '-6s' }}
      />

      {/* PWA Install Banner */}
      <InstallPrompt onInstallStateChange={setCanInstall} />

      {/* Mobile Top Utility Bar */}
      <header className="no-print lg:hidden p-4 flex items-center justify-between glass-card-dark text-white border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-700 to-blue-500 flex items-center justify-center shadow">
            <span className="material-icons text-base">videocam</span>
          </div>
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider">Xondhan Billing</h1>
            <p className="text-[10px] text-slate-400">Mobile Invoice View</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateNewInvoice}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1"
          >
            <span className="material-icons text-sm">post_add</span> New
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold flex items-center gap-1 shadow"
          >
            <span className="material-icons text-sm">print</span> Print
          </button>
        </div>
      </header>

      {/* Main Responsive Layout Wrapper */}
      <div className="app-layout relative z-10 flex flex-col lg:flex-row justify-center items-center lg:items-start gap-6 p-4 sm:p-6 lg:p-8 max-w-[1720px] mx-auto">
        {/* LEFT SIDEBAR: CARDS, CONTROLS & SAVED BILLS (NO PRINT) */}
        <aside className="sidebar no-print w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-4 animate-fade-in">
          {/* Brand & Hub Status Card */}
          <div className="glass-card rounded-2xl p-4 shadow-xl flex items-center justify-between border border-white/40 hover-glow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-blue-700 text-white flex items-center justify-center shadow-lg transform transition hover:scale-105">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Xondhan Billing</h2>
                <p className="text-[11px] font-medium text-slate-500">IndexedDB & PWA Offline Hub</p>
              </div>
            </div>
            <button
              onClick={handleCreateNewInvoice}
              title="Start New Bill with Auto Invoice No."
              className="text-brand-800 hover:bg-brand-50 active:scale-95 px-3 py-1.5 rounded-xl flex items-center text-xs font-semibold gap-1.5 border border-brand-200 transition shadow-sm"
            >
              <span className="material-icons text-sm">post_add</span> New
            </button>
          </div>

          {/* Billing Mode Selection Card */}
          <div className="glass-card rounded-2xl p-3.5 shadow-md border border-white/50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-icons text-sm text-brand-800">tune</span> Billing Mode
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
                {invoiceMode === 'RETAIL' ? 'Retail Invoice' : 'B2B Tax Invoice'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setInvoiceMode('RETAIL');
                  showToast('Switched to Retail Mode');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                  invoiceMode === 'RETAIL'
                    ? 'bg-gradient-to-r from-brand-900 to-brand-800 text-white shadow-md scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span className="material-icons text-sm">{invoiceMode === 'RETAIL' ? 'check_circle' : 'shopping_bag'}</span>
                Retail Mode
              </button>

              <button
                type="button"
                onClick={() => {
                  setInvoiceMode('B2B');
                  showToast('Switched to B2B Mode');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                  invoiceMode === 'B2B'
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow-md scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span className="material-icons text-sm">{invoiceMode === 'B2B' ? 'check_circle' : 'business'}</span>
                B2B Mode
              </button>
            </div>
          </div>

          {/* Real-Time Interactive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            {/* KPI 1 */}
            <div className="glass-card rounded-2xl p-4 shadow-md border-l-4 border-brand-800 flex items-center justify-between hover-glow">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Line Items</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{totals.totalCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-800 flex items-center justify-center shadow-xs">
                <span className="material-icons text-xl">receipt_long</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="glass-card rounded-2xl p-4 shadow-md border-l-4 border-blue-600 flex items-center justify-between hover-glow">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Total Quantity</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{totals.totalUnits} Units</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                <span className="material-icons text-xl">inventory_2</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="glass-card rounded-2xl p-4 shadow-md border-l-4 border-emerald-600 flex items-center justify-between hover-glow">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Total Bill Amount</span>
                <span className="text-2xl font-bold text-emerald-700 tracking-tight">{formatINR(totals.totalSum)}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <span className="material-icons text-xl">payments</span>
              </div>
            </div>
          </div>

          {/* Live Search & Action Bar */}
          <div className="glass-card rounded-2xl p-4 shadow-xl flex flex-col gap-3 border border-white/40">
            <div className="flex items-center bg-white/80 border border-slate-300 rounded-xl px-3 py-2 gap-2 focus-within:ring-2 focus-within:ring-brand-500 transition shadow-inner">
              <span className="material-icons text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search line items, S/N, or HSN..."
                className="w-full text-xs bg-transparent outline-none text-slate-800 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleSaveCurrentInvoice}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-semibold text-xs py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
              >
                <span className="material-icons text-sm">save</span> Save Bill
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-brand-900 to-slate-900 hover:from-black hover:to-slate-900 active:scale-95 text-white font-semibold text-xs py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
              >
                <span className="material-icons text-sm">add_circle</span> Add Item
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition"
            >
              <span className="material-icons text-sm">print</span> Print / Save PDF (A4 Portrait)
            </button>
          </div>

          {/* Stored Local Bills Drawer */}
          <div className="glass-card rounded-2xl p-4 shadow-xl border border-white/40 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <span className="material-icons text-base text-brand-800">folder_special</span>
                <span>Saved Bills ({savedBills.length})</span>
              </div>
              <button
                onClick={handleClearAllData}
                title="Clear all local bills"
                className="text-[11px] font-semibold text-red-500 hover:text-red-700 hover:underline flex items-center gap-0.5 transition"
              >
                <span className="material-icons text-sm">delete_sweep</span> Clear All
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto mt-1 pr-1">
              {savedBills.length === 0 ? (
                <div className="py-5 text-center text-[11px] text-slate-400 font-medium">
                  No saved bills found in IndexedDB.<br />Click "Save Bill" to store invoices here.
                </div>
              ) : (
                savedBills.map((inv) => (
                  <div
                    key={inv.invoiceNo}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-white/80 px-2 rounded-xl transition-all group"
                  >
                    <div
                      className="cursor-pointer flex-1 min-w-0"
                      onClick={() => handleLoadInvoice(inv)}
                    >
                      <div className="font-bold text-brand-800 text-[11.5px] truncate flex items-center gap-1">
                        <span>{inv.invoiceNo}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {inv.customer ? inv.customer.name : 'Customer'} • {inv.date}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700">
                        {formatINR(inv.totals ? inv.totals.totalSum : 0)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => handleLoadInvoice(inv)}
                        title="Load Bill"
                        className="text-brand-800 hover:bg-blue-100 p-1.5 rounded-lg transition"
                      >
                        <span className="material-icons text-[15px]">drive_file_move</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSavedInvoice(inv.invoiceNo)}
                        title="Delete Bill"
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                      >
                        <span className="material-icons text-[15px]">close</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-medium">
            💡 Click on any <span className="text-white font-semibold underline cursor-pointer" onClick={() => setIsModalOpen(true)}>Rate (₹)</span> or customer field on canvas to edit inline.
          </p>
        </aside>

        {/* RIGHT: INVOICE CANVAS (A4 PRINTABLE VIEWPORT) */}
        <div className="sheet-scroller flex justify-center w-full">
          <main
            className="a4-sheet bg-white p-[10mm_12mm] shadow-[0_24px_60px_rgba(0,0,0,0.55)] border border-slate-800 flex flex-col text-slate-900 rounded-sm animate-scale-up"
            id="invoiceArea"
          >
            {/* Company Header with Left Logo & Center Typography */}
            <header className="border-b-2 border-slate-800 pb-2 flex items-center justify-between gap-4">
              {/* Logo Area (Left of Header) */}
              <div
                className={`relative w-24 h-24 flex-shrink-0 flex items-center justify-center border-2 border-slate-300 rounded-lg group hover:border-brand-800 bg-slate-50 transition overflow-hidden ${
                  !logoUrl ? 'border-dashed' : ''
                }`}
              >
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                )}

                <label
                  htmlFor="logoFileInput"
                  className={`upload-trigger absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-brand-800 text-center p-1 transition ${
                    logoUrl ? 'opacity-0 hover:opacity-100 bg-white/80' : ''
                  }`}
                >
                  <span className="material-icons text-2xl">add_photo_alternate</span>
                  <span className="text-[9px] font-semibold leading-tight mt-0.5">
                    {logoUrl ? 'Change' : 'Add Logo'}
                  </span>
                </label>
                <input
                  type="file"
                  id="logoFileInput"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />

                {logoUrl && (
                  <button
                    onClick={handleRemoveLogo}
                    title="Remove logo"
                    className="remove-asset-btn absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center shadow"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Center Company Header (Editable) */}
              <div className="flex-1 text-center pr-12">
                <h1 className="brand-title text-[26px] font-extrabold text-brand-800 uppercase leading-tight drop-shadow-sm">
                  XONDHAN ELECTRONICS
                </h1>
                <input
                  type="text"
                  value={companySubHeader}
                  onChange={(e) => setCompanySubHeader(e.target.value)}
                  className="editable-field text-[11.5px] font-semibold text-slate-800 mt-0.5 text-center w-full outline-none hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded border border-transparent focus:border-blue-500 transition"
                />
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="editable-field text-[10.5px] text-slate-600 text-center w-full outline-none hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded border border-transparent focus:border-blue-500 transition"
                />
                <div className="flex items-center justify-center gap-1 text-[10.5px] text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-700">Mobile:</span>
                  <input
                    type="text"
                    value={companyMobile}
                    onChange={(e) => setCompanyMobile(e.target.value)}
                    className="editable-field text-slate-900 outline-none hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded border border-transparent focus:border-blue-500 transition font-medium text-center"
                  />
                  <span className="mx-1 text-slate-400">|</span>
                  <span className="font-semibold text-slate-700">Email:</span>
                  <input
                    type="text"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="editable-field text-slate-900 outline-none hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded border border-transparent focus:border-blue-500 transition font-medium text-center"
                  />
                </div>
              </div>
            </header>

            {/* Banner */}
            <div className={`invoice-banner text-white text-center text-xs font-bold tracking-widest py-1 border-x-[1.5px] border-slate-800 transition-colors ${
              invoiceMode === 'RETAIL' ? 'bg-brand-800' : 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900'
            }`}>
              {invoiceMode === 'RETAIL' ? 'RETAIL TAX INVOICE' : 'TAX INVOICE (B2B)'}
            </div>

            {/* Customer & Bill Info Grid */}
            <div className="meta-grid grid grid-cols-2 border-[1.5px] border-slate-800 border-t-0 text-[11px]">
              {/* Left: Customer Details (Editable) */}
              <div className="p-2 border-r-[1.5px] border-slate-800 space-y-1">
                <div className="flex items-center">
                  <span className="w-24 font-semibold text-slate-700">Billed To:</span>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="editable-field font-bold text-slate-900 flex-1 hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded outline-none border border-transparent focus:border-blue-500 transition"
                  />
                </div>
                {invoiceMode === 'B2B' && (
                  <div className="flex items-center text-emerald-900 font-bold bg-emerald-50/80 p-0.5 rounded border border-emerald-300">
                    <span className="w-24 font-semibold text-emerald-950">Buyer GSTIN:</span>
                    <input
                      type="text"
                      value={gstinBuyer}
                      onChange={(e) => setGstinBuyer(e.target.value)}
                      placeholder="e.g. 18AAAAA0000A1Z5"
                      className="editable-field font-mono font-bold text-emerald-950 flex-1 hover:bg-white focus:bg-white px-1 py-0.5 rounded outline-none border border-transparent focus:border-emerald-500 transition"
                    />
                  </div>
                )}
                <div className="flex items-center">
                  <span className="w-24 font-semibold text-slate-700">Address:</span>
                  <input
                    type="text"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="editable-field text-slate-900 flex-1 hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded outline-none border border-transparent focus:border-blue-500 transition"
                  />
                </div>
                <div className="flex items-center">
                  <span className="w-24 font-semibold text-slate-700">Contact:</span>
                  <input
                    type="text"
                    value={customer.contact}
                    onChange={(e) => setCustomer({ ...customer, contact: e.target.value })}
                    className="editable-field text-slate-900 flex-1 hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded outline-none border border-transparent focus:border-blue-500 transition"
                  />
                </div>
                <div className="flex items-center">
                  <span className="w-24 font-semibold text-slate-700">State / Code:</span>
                  <input
                    type="text"
                    value={customer.state}
                    onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                    className="editable-field text-slate-900 flex-1 hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded outline-none border border-transparent focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Right: Invoice Metadata (Editable) */}
              <div className="p-2 space-y-1">
                <div className="flex items-center">
                  <span className="w-28 font-semibold text-slate-700">Invoice No:</span>
                  <input
                    type="text"
                    value={invNo}
                    onChange={(e) => setInvNo(e.target.value)}
                    className="editable-field font-bold text-slate-900 flex-1 hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded outline-none border border-transparent focus:border-blue-500 transition"
                  />
                </div>
                {invoiceMode === 'B2B' && (
                  <div className="flex items-center text-emerald-900 font-bold bg-emerald-50/80 p-0.5 rounded border border-emerald-300">
                    <span className="w-28 font-semibold text-emerald-950">Seller GSTIN:</span>
                    <input
                      type="text"
                      value={gstinSeller}
                      onChange={(e) => setGstinSeller(e.target.value)}
                      placeholder="e.g. 18XXXXX0000X1Z1"
                      className="editable-field font-mono font-bold text-emerald-950 flex-1 hover:bg-white focus:bg-white px-1 py-0.5 rounded outline-none border border-transparent focus:border-emerald-500 transition"
                    />
                  </div>
                )}
                <div className="flex items-center">
                  <span className="w-28 font-semibold text-slate-700">Invoice Date:</span>
                  <input
                    type="text"
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="editable-field text-slate-900 flex-1 hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded outline-none border border-transparent focus:border-blue-500 transition"
                  />
                </div>
                <div className="flex items-center">
                  <span className="w-28 font-semibold text-slate-700">Payment Mode:</span>
                  <input
                    type="text"
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="editable-field text-slate-900 flex-1 hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded outline-none border border-transparent focus:border-blue-500 transition"
                  />
                </div>
                <div className="flex items-center">
                  <span className="w-28 font-semibold text-slate-700">Place of Supply:</span>
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="editable-field text-slate-900 flex-1 hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded outline-none border border-transparent focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Detailed Product Line Items Table */}
            <div className="mt-1.5 border-[1.5px] border-slate-800 border-b-0">
              <table className="w-full text-[10.5px] border-collapse" id="invoiceTable">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b-[1.5px] border-slate-800">
                    <th className="w-8 py-1.5 px-1 text-center border-r border-slate-800">S/N</th>
                    <th className="py-1.5 px-2 text-left border-r border-slate-800">Description of Goods & Serial No.</th>
                    <th className="w-16 py-1.5 px-1 text-center border-r border-slate-800">HSN Code</th>
                    <th className="w-20 py-1.5 px-1 text-center border-r border-slate-800">Qty</th>
                    <th className="w-11 py-1.5 px-1 text-center border-r border-slate-800">Unit</th>
                    <th className="w-20 py-1.5 px-1 text-right border-r border-slate-800 no-print text-brand-900">Base Rate (₹)</th>
                    <th className="w-24 py-1.5 px-1 text-right border-r border-slate-800">Rate (₹)</th>
                    <th className="w-24 py-1.5 px-1 text-right border-r border-slate-800">Amount (₹)</th>
                    <th className="col-actions w-16 py-1.5 px-1 text-center no-print">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => {
                    const isEditingRow = editingRowId === item.id;
                    const isEditingRate = editingRateId === item.id;
                    const rowAmount = isEditingRow && editRowData
                      ? editRowData.rate * editRowData.qty
                      : item.rate * item.qty;

                    if (isEditingRow && editRowData) {
                      return (
                        <tr key={item.id} className="border-b border-blue-400 bg-blue-50/80 transition-colors">
                          <td className="w-8 py-1.5 px-1 text-center font-bold text-blue-700 border-r border-slate-800">{index + 1}</td>
                          <td className="py-1 px-1.5 border-r border-slate-800">
                            <input
                              type="text"
                              value={editRowData.name}
                              onChange={(e) => setEditRowData({ ...editRowData, name: e.target.value })}
                              placeholder="Product Name"
                              className="w-full font-bold text-slate-900 bg-white border border-blue-500 rounded px-1.5 py-0.5 outline-none mb-1 text-[10.5px] shadow-xs"
                            />
                            <input
                              type="text"
                              value={editRowData.serial}
                              onChange={(e) => setEditRowData({ ...editRowData, serial: e.target.value })}
                              placeholder="Serial Numbers (S/N)"
                              className="w-full font-mono text-slate-700 bg-white border border-blue-300 rounded px-1.5 py-0.5 outline-none text-[9.5px] shadow-xs"
                            />
                          </td>
                          <td className="w-16 py-1 px-1 text-center border-r border-slate-800">
                            <input
                              type="text"
                              value={editRowData.hsn}
                              onChange={(e) => setEditRowData({ ...editRowData, hsn: e.target.value })}
                              className="w-full text-center font-mono bg-white border border-blue-500 rounded px-1 py-0.5 outline-none text-[10px] shadow-xs"
                            />
                          </td>
                          <td className="w-20 py-1 px-1 text-center border-r border-slate-800">
                            <input
                              type="number"
                              min="1"
                              value={editRowData.qty}
                              onChange={(e) => setEditRowData({ ...editRowData, qty: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-full text-center font-bold bg-white border border-blue-500 rounded px-1 py-0.5 outline-none text-[10.5px] shadow-xs"
                            />
                          </td>
                          <td className="w-11 py-1 px-1 text-center border-r border-slate-800">
                            <select
                              value={editRowData.unit}
                              onChange={(e) => setEditRowData({ ...editRowData, unit: e.target.value })}
                              className="w-full text-center font-medium bg-white border border-blue-500 rounded px-0.5 py-0.5 outline-none text-[10px] shadow-xs cursor-pointer"
                            >
                              <option value="NOS">NOS</option>
                              <option value="PCS">PCS</option>
                              <option value="ROLL">ROLL</option>
                              <option value="PKT">PKT</option>
                              <option value="MTR">MTR</option>
                              <option value="SET">SET</option>
                            </select>
                          </td>
                          <td className="w-20 py-1 px-1 text-right border-r border-slate-800 no-print">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={editRowData.baseRate ?? Math.round(editRowData.rate / 1.10)}
                              onChange={(e) => {
                                const newBase = parseFloat(e.target.value) || 0;
                                setEditRowData({
                                  ...editRowData,
                                  baseRate: newBase,
                                  rate: Math.round(newBase * 1.10)
                                });
                              }}
                              className="w-full text-right font-semibold text-slate-700 bg-white border border-blue-500 rounded px-1 py-0.5 outline-none text-[10px] shadow-xs"
                            />
                          </td>
                          <td className="w-24 py-1 px-1 text-right border-r border-slate-800">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={editRowData.rate}
                              onChange={(e) => setEditRowData({ ...editRowData, rate: parseFloat(e.target.value) || 0 })}
                              className="w-full text-right font-bold bg-white border border-blue-500 rounded px-1 py-0.5 outline-none text-[10.5px] shadow-xs"
                            />
                          </td>
                          <td className="w-24 py-1.5 px-1 text-right font-bold border-r border-slate-800 text-brand-800">
                            {formatINR(rowAmount)}
                          </td>
                          <td className="col-actions w-16 py-1.5 px-1 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={handleSaveEditRow}
                                title="Save Row Changes"
                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow transition flex items-center justify-center"
                              >
                                <span className="material-icons text-[14px]">check</span>
                              </button>
                              <button
                                onClick={handleCancelEditRow}
                                title="Cancel Editing"
                                className="p-1 bg-slate-400 hover:bg-slate-500 text-white rounded shadow transition flex items-center justify-center"
                              >
                                <span className="material-icons text-[14px]">close</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} className="border-b border-slate-300 hover:bg-blue-50/50 transition-colors group">
                        <td className="w-8 py-1.5 px-1 text-center font-medium border-r border-slate-800">{index + 1}</td>
                        <td
                          className="py-1.5 px-2 border-r border-slate-800 cursor-pointer hover:bg-amber-50/60 transition-colors"
                          onClick={() => handleStartEditRow(item)}
                          title="Click to edit row"
                        >
                          <span className="font-bold text-slate-900 block leading-tight">{item.name}</span>
                          {item.serial ? (
                            <span className="text-[9px] font-mono text-slate-600 block mt-0.5 leading-tight break-all">
                              S/N: {item.serial}
                            </span>
                          ) : null}
                        </td>
                        <td
                          className="w-16 py-1.5 px-1 text-center font-mono text-[10px] border-r border-slate-800 cursor-pointer hover:bg-amber-50/60 transition-colors"
                          onClick={() => handleStartEditRow(item)}
                          title="Click to edit HSN"
                        >
                          {item.hsn}
                        </td>
                        <td className="w-20 py-1.5 px-1 text-center border-r border-slate-800">
                          <div className="inline-flex items-center border border-slate-400 rounded bg-white overflow-hidden shadow-xs">
                            <button
                              className="qty-btn w-4 h-4 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:bg-slate-300 transition"
                              onClick={() => handleUpdateQty(item.id, -1)}
                            >
                              <span className="material-icons text-[11px]">remove</span>
                            </button>
                            <span className="w-6 text-center font-bold text-[10.5px]">{item.qty}</span>
                            <button
                              className="qty-btn w-4 h-4 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:bg-slate-300 transition"
                              onClick={() => handleUpdateQty(item.id, 1)}
                            >
                              <span className="material-icons text-[11px]">add</span>
                            </button>
                          </div>
                        </td>
                        <td
                          className="w-11 py-1.5 px-1 text-center font-medium border-r border-slate-800 cursor-pointer hover:bg-amber-50/60 transition-colors"
                          onClick={() => handleStartEditRow(item)}
                          title="Click to edit unit"
                        >
                          {item.unit}
                        </td>
                        <td
                          className="w-20 py-1.5 px-1 text-right font-mono text-slate-600 border-r border-slate-800 no-print cursor-pointer hover:bg-amber-50/60 transition-colors"
                          onClick={() => handleStartEditRow(item)}
                          title="Click to edit Base Rate (Rate auto-sets +10%)"
                        >
                          {formatINR(item.baseRate ?? Math.round(item.rate / 1.10))}
                        </td>
                        <td className="w-24 py-1.5 px-1 text-right border-r border-slate-800">
                          {isEditingRate ? (
                            <input
                              type="number"
                              autoFocus
                              step="any"
                              min="0"
                              value={tempRate}
                              onChange={(e) => setTempRate(e.target.value)}
                              onBlur={() => handleSaveRate(item.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRate(item.id);
                              }}
                              className="w-20 text-right text-[10.5px] font-bold bg-white border border-blue-500 rounded px-1 py-0.5 outline-none shadow-sm"
                            />
                          ) : (
                            <span
                              onClick={() => handleStartRateEdit(item.id, item.rate)}
                              className="rate-display cursor-pointer hover:bg-amber-100/70 px-1 py-0.5 rounded border border-transparent hover:border-amber-400 transition"
                              title="Click to edit rate"
                            >
                              {formatINR(item.rate)}
                            </span>
                          )}
                        </td>
                        <td className="w-24 py-1.5 px-1 text-right font-bold border-r border-slate-800">{formatINR(rowAmount)}</td>
                        <td className="col-actions w-16 py-1.5 px-1 text-center no-print">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              className="p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition"
                              title="Edit Row"
                              onClick={() => handleStartEditRow(item)}
                            >
                              <span className="material-icons text-[14px]">edit</span>
                            </button>
                            <button
                              className="p-0.5 text-slate-500 hover:text-brand-800 hover:bg-slate-200 rounded transition"
                              title="Move Up"
                              onClick={() => handleReorder(index, -1)}
                            >
                              <span className="material-icons text-[14px]">arrow_upward</span>
                            </button>
                            <button
                              className="p-0.5 text-slate-500 hover:text-brand-800 hover:bg-slate-200 rounded transition"
                              title="Move Down"
                              onClick={() => handleReorder(index, 1)}
                            >
                              <span className="material-icons text-[14px]">arrow_downward</span>
                            </button>
                            <button
                              className="p-0.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <span className="material-icons text-[14px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Subtotal & Grand Total Box */}
            <table className="totals-table w-full border-[1.5px] border-slate-800 text-[10.5px] border-collapse">
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="p-1.5 font-semibold border-r border-slate-800">
                    Total Line Items: {totals.totalCount}
                  </td>
                  <td className="w-20 p-1.5 text-center font-bold border-r border-slate-800">
                    {totals.totalUnits}
                  </td>
                  <td className="w-11 p-1.5 text-center font-bold border-r border-slate-800">Units</td>
                  <td className="w-24 p-1.5 text-right font-bold border-r border-slate-800">Sub Total:</td>
                  <td className="w-24 p-1.5 text-right font-bold">{formatINR(totals.totalSum)}</td>
                </tr>
                <tr className="border-b border-slate-800 text-[10px]">
                  <td colSpan={3} className="p-1.5 text-slate-700 border-r border-slate-800">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700">GST Status:</span>
                      <input
                        type="text"
                        value={gstStatus}
                        onChange={(e) => setGstStatus(e.target.value)}
                        className="editable-field text-slate-900 flex-1 hover:bg-slate-100 focus:bg-blue-50 px-1 py-0.5 rounded outline-none border border-transparent focus:border-blue-500 font-medium transition"
                      />
                    </div>
                  </td>
                  <td className="p-1.5 text-right font-semibold border-r border-slate-800">Round Off:</td>
                  <td className="p-1.5 text-right font-bold">₹0.00</td>
                </tr>
                <tr className="bg-slate-50 font-medium">
                  <td colSpan={3} className="p-1.5 border-r border-slate-800 text-[10px]">
                    Amount Chargeable: {numberToWords(totals.totalSum)}
                  </td>
                  <td className="p-1.5 text-right font-bold text-xs bg-slate-100 border-r border-slate-800">
                    Grand Total:
                  </td>
                  <td className="p-1.5 text-right font-bold text-xs bg-slate-100 text-brand-800">
                    {formatINR(totals.totalSum)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer: Terms & Digital Signature */}
            <div className="invoice-footer mt-1.5 border-[1.5px] border-slate-800 grid grid-cols-[1.6fr_1fr] text-[9.5px]">
              <div className="p-2 border-r-[1.5px] border-slate-800 space-y-1">
                <h4 className="font-bold underline text-[10px]">Terms & Conditions:</h4>
                <ol className="list-decimal pl-3 space-y-0.5 leading-tight">
                  <li>Warranty as per manufacturer terms (DVR / Camera / HDD).</li>
                  <li>Burnt, broken, water-damaged, or tampered parts not covered under warranty.</li>
                  <li>Goods once sold will not be refunded or exchanged.</li>
                </ol>
                <div className="pt-2 font-medium">Customer Signature: __________________________</div>
              </div>

              <div className="p-2 flex flex-col justify-between text-right relative">
                <div className="font-bold text-[10px]">For XONDHAN ELECTRONICS</div>

                {/* Scanned Digital Signature Area */}
                <div className="relative h-14 w-full flex items-center justify-end my-1 group">
                  {signUrl && (
                    <img
                      src={signUrl}
                      alt="Digital Signature"
                      className="max-h-14 max-w-[140px] object-contain"
                    />
                  )}

                  <label
                    htmlFor="signFileInput"
                    className={`upload-trigger flex items-center gap-1 cursor-pointer text-slate-400 hover:text-brand-800 text-[10px] border border-dashed border-slate-300 rounded px-2 py-1 bg-slate-50 transition ${
                      signUrl ? 'hidden' : ''
                    }`}
                  >
                    <span className="material-icons text-xs">gesture</span>
                    <span>Add Sign</span>
                  </label>
                  <input
                    type="file"
                    id="signFileInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignUpload}
                  />

                  {signUrl && (
                    <button
                      onClick={handleRemoveSign}
                      title="Remove signature"
                      className="remove-asset-btn absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center shadow"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div>
                  <span className="inline-block border-t border-dashed border-slate-500 pt-0.5 text-slate-700">
                    Authorized Signatory
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center font-bold text-[10px] text-brand-800 tracking-wider mt-2">
              Thank you for your business!
            </div>
          </main>
        </div>
      </div>

      {/* Add Line Item Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddItem}
      />

      {/* Material Dialog System */}
      <MaterialDialog
        isOpen={dialogState.isOpen}
        title={dialogState.options.title}
        message={dialogState.options.message}
        icon={dialogState.options.icon}
        confirmText={dialogState.options.confirmText}
        cancelText={dialogState.options.cancelText}
        isDanger={dialogState.options.isDanger}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
      />

      {/* Toast Notifications System */}
      <ToastContainer toasts={toasts} />
    </div>
  );
};
