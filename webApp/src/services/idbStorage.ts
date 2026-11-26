export interface InvoiceCustomer {
  name: string;
  address: string;
  contact: string;
  state: string;
}

export interface InvoiceItem {
  id: number;
  name: string;
  serial: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  baseRate?: number;
  mrp?: number;
}

export interface InvoiceTotals {
  totalCount: number;
  totalUnits: number;
  totalSum: number;
}

export interface InvoiceData {
  invoiceNo: string;
  date: string;
  payMode: string;
  place: string;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  totals: InvoiceTotals;
  invoiceMode?: 'RETAIL' | 'WHOLESALE' | 'B2B';
  gstinBuyer?: string;
  gstinSeller?: string;
  gstStatus?: string;
  companyMobile?: string;
  companyEmail?: string;
  companyAddress?: string;
  companySubHeader?: string;
  savedAt: string;
}

const DB_NAME = 'XondhanBillingDB';
const DB_VERSION = 1;
const STORE_INVOICES = 'invoices';
const STORE_ASSETS = 'assets';

const LOCAL_STORAGE_KEY_INVOICES = 'xondhan_saved_invoices_v1';
const LOCAL_STORAGE_KEY_LOGO = 'xondhan_app_logo';
const LOCAL_STORAGE_KEY_SIGN = 'xondhan_app_signature';

function openDB(): Promise<IDBDatabase> {
  // Request Chrome persistent storage protection so data is never evicted
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((isPersisted) => {
      if (!isPersisted) {
        navigator.storage.persist().catch(() => {});
      }
    }).catch(() => {});
  }

  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_INVOICES)) {
        db.createObjectStore(STORE_INVOICES, { keyPath: 'invoiceNo' });
      }
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Invoices CRUD Operations
export async function getStoredInvoices(): Promise<InvoiceData[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_INVOICES, 'readonly');
      const store = tx.objectStore(STORE_INVOICES);
      const req = store.getAll();

      req.onsuccess = () => {
        const result = req.result as InvoiceData[];
        // Sort descending by savedAt date or invoiceNo
        result.sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime());
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // LocalStorage fallback
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_INVOICES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export async function saveInvoice(invoice: InvoiceData): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_INVOICES, 'readwrite');
      const store = tx.objectStore(STORE_INVOICES);
      const req = store.put(invoice);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // LocalStorage fallback
    try {
      const invoices = await getStoredInvoices();
      const existingIdx = invoices.findIndex((b) => b.invoiceNo === invoice.invoiceNo);
      if (existingIdx >= 0) {
        invoices[existingIdx] = invoice;
      } else {
        invoices.unshift(invoice);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to save invoice to localStorage fallback', e);
    }
  }
}

export async function deleteInvoice(invoiceNo: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_INVOICES, 'readwrite');
      const store = tx.objectStore(STORE_INVOICES);
      const req = store.delete(invoiceNo);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const invoices = (await getStoredInvoices()).filter((b) => b.invoiceNo !== invoiceNo);
      localStorage.setItem(LOCAL_STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to delete invoice from localStorage fallback', e);
    }
  }
}

// Assets CRUD (Logo & Scanned Digital Signature)
export async function getAsset(key: 'logo' | 'signature'): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ASSETS, 'readonly');
      const store = tx.objectStore(STORE_ASSETS);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result ? req.result.value : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const storageKey = key === 'logo' ? LOCAL_STORAGE_KEY_LOGO : LOCAL_STORAGE_KEY_SIGN;
    return localStorage.getItem(storageKey);
  }
}

export async function saveAsset(key: 'logo' | 'signature', base64Data: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_ASSETS, 'readwrite');
      const store = tx.objectStore(STORE_ASSETS);
      const req = store.put({ key, value: base64Data });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const storageKey = key === 'logo' ? LOCAL_STORAGE_KEY_LOGO : LOCAL_STORAGE_KEY_SIGN;
    localStorage.setItem(storageKey, base64Data);
  }
}

export async function deleteAsset(key: 'logo' | 'signature'): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_ASSETS, 'readwrite');
      const store = tx.objectStore(STORE_ASSETS);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const storageKey = key === 'logo' ? LOCAL_STORAGE_KEY_LOGO : LOCAL_STORAGE_KEY_SIGN;
    localStorage.removeItem(storageKey);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_INVOICES, STORE_ASSETS], 'readwrite');
    tx.objectStore(STORE_INVOICES).clear();
    tx.objectStore(STORE_ASSETS).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    localStorage.removeItem(LOCAL_STORAGE_KEY_INVOICES);
    localStorage.removeItem(LOCAL_STORAGE_KEY_LOGO);
    localStorage.removeItem(LOCAL_STORAGE_KEY_SIGN);
  }
}
