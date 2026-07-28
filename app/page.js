'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ---- MİNİMAL TEK RENK İKON SETİ (stroke-based, currentColor) ----
const Icon = ({ path, size = 20, className = '', strokeWidth = 1.6, fill = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className} style={{ flexShrink: 0 }}>
    {path}
  </svg>
);
const IconPaths = {
  box: <><path d="M21 8V21H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></>,
  chart: <><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></>,
  wallet: <><path d="M20 12V8H4a2 2 0 010-4h14v4"/><path d="M4 8v10a2 2 0 002 2h14v-8H6a2 2 0 01-2-2z"/><circle cx="17" cy="14" r="1"/></>,
  trending: <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
  receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M8 7h8M8 11h8M8 15h5"/></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>,
  cash: <><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></>,
  meal: <><path d="M4 3v7a2 2 0 002 2v9M6 3v6M8 3v6M8 3v6"/><path d="M18 3c-1.5 0-3 2-3 5s1.5 4 3 4v9"/></>,
  arrowDown: <><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></>,
  arrowUp: <><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></>,
  trash: <><path d="M3 6h18"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
  file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></>,
  crown: <><path d="M2 18h20M3 8l4 4 5-7 5 7 4-4-2 10H5z"/></>,
  alert: <><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0z"/></>,
  note: <><path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4"/><path d="M8 9h8M8 13h5"/></>,
  send: <><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></>,
  back: <><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  check: <><path d="M20 6L9 17l-5-5"/></>,
  close: <><path d="M18 6L6 18M6 6l12 12"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  leaf: <><path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></>,
};


export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('login');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [cashMovements, setCashMovements] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getTurkeyDate());
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showEditSupplier, setShowEditSupplier] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(null);
  const [showAddReport, setShowAddReport] = useState(false);
  const [showEditReport, setShowEditReport] = useState(false);
  const [showEditTransaction, setShowEditTransaction] = useState(null);
  const [showAddCashMovement, setShowAddCashMovement] = useState(null);
  const [showExpenseConfirm, setShowExpenseConfirm] = useState(null); // 'add' veya 'edit'
  const [viewInvoice, setViewInvoice] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, step: 1, type: null, id: null, name: '' });
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '', rememberMe: false });
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', notes: '' });
  const [transactionForm, setTransactionForm] = useState({ amount: '', date: getTurkeyDate(), description: '', payment_method: 'nakit', invoice: null });
  const [reportForm, setReportForm] = useState({ date: getTurkeyDate(), credit_card: '', cash: '', meal_cards: '', actual_cash: '', notes: '' });
  // Adisyo entegrasyonu (sadece adında Restaurant/Restoran geçen şubede)
  const [adisyoPayments, setAdisyoPayments] = useState([]); // [{payment_type_id, payment_name, amount, is_meal_card, is_debit}]
  const [adisyoLoading, setAdisyoLoading] = useState(false);
  const [adisyoError, setAdisyoError] = useState('');
  const [adisyoProgress, setAdisyoProgress] = useState(''); // "3 / 8 sayfa" gibi ilerleme metni
  const [expensesList, setExpensesList] = useState([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', employee_id: '', is_external: false });
  const [expenseSearch, setExpenseSearch] = useState({ open: false, query: '', from: '', to: '' });
  const [cashMovementForm, setCashMovementForm] = useState({ amount: '', description: '', date: getTurkeyDate() });
  const [error, setError] = useState('');
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  // ---- MAAŞ MODÜLÜ state ----
  const [employees, setEmployees] = useState([]);
  const [salaryItems, setSalaryItems] = useState([]); // aylık tahakkuk (employee_id, month, year, amount)
  const [salaryPayments, setSalaryPayments] = useState([]); // parçalı ödemeler
  const [salaryStartYear] = useState(2026);
  const [salaryStartMonth] = useState(6); // Haziran 2026 başlangıç
  // 12 aylık dönem: {year, month, key:'YYYY-MM', label}
  const SALARY_PERIOD = (() => {
    const labels = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const arr = [];
    let y = 2026, m = 6;
    for (let i = 0; i < 12; i++) {
      arr.push({ year: y, month: m, key: `${y}-${String(m).padStart(2,'0')}`, label: `${labels[m-1]} ${y}` });
      m++; if (m > 12) { m = 1; y++; }
    }
    return arr;
  })();
  const salaryMonths = SALARY_PERIOD; // geriye dönük isim
  const periodKey = (year, month) => `${year}-${String(month).padStart(2,'0')}`;
  const [salarySortBy, setSalarySortBy] = useState('rem-desc');
  const [salarySortKey, setSalarySortKey] = useState(SALARY_PERIOD[3].key); // Eylül 2026
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryDetailKey, setSalaryDetailKey] = useState(SALARY_PERIOD[3].key);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ name: '', salary: '', startKey: SALARY_PERIOD[0].key, payment_day: 27 });
  const [salaryPaymentForm, setSalaryPaymentForm] = useState({ amount: '', note: '' });
  const [editPaymentModal, setEditPaymentModal] = useState(null); // düzeltilecek ödeme
  const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', note: '' });
  const [editSalaryModal, setEditSalaryModal] = useState(null); // { employee, period }
  const [editSalaryValue, setEditSalaryValue] = useState('');
  const [terminateModal, setTerminateModal] = useState(null);
  const [editingName, setEditingName] = useState(null); // { id, value } - personel adı düzenleme

  function getTurkeyDate() {
    // Türkiye yerel tarihini YYYY-MM-DD olarak, UTC kaymasına takılmadan üret
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    return parts; // en-CA formatı zaten YYYY-MM-DD verir
  }

  function getTurkeyDateTime() {
    return new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
  }

  const formatDateTR = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;
  };

  const formatTimeTR = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
  };

  // Tarih + saat birlikte (gg.aa.yyyy SS:dd)
  const formatDateTimeTR = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatMoney = (amt) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amt || 0);

  useEffect(() => {
    const checkRememberedUser = async () => {
      try {
        const remembered = localStorage.getItem('ege_takip_user');
        if (remembered) {
          const userData = JSON.parse(remembered);
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userData.id)
            .single();
          
          if (data && !error) {
            setUser(data);
            setScreen('menu');
          } else {
            localStorage.removeItem('ege_takip_user');
          }
        }
      } catch (e) {
        localStorage.removeItem('ege_takip_user');
      }
      setInitialLoading(false);
    };
    
    checkRememberedUser();
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (user) {
      loadSuppliers();
      loadTransactions();
      loadDailyReports();
      loadCashMovements();
      // Personel listesi ve maaş verileri herkese yüklenir (gider->maaş entegrasyonu için gerekli)
      // Maaş Takibi EKRANI yine sadece admin'e açık
      loadEmployees();
      loadSalaryItems();
      loadSalaryPayments();
    }
  }, [user]);

  useEffect(() => {
    if (screen === 'gunsonu') {
      setSelectedDate(getTurkeyDate());
    }
  }, [screen]);

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase.from('businesses').select('*');
      if (error) throw error;
      if (data) setBusinesses(data);
    } catch (e) {
      console.error('Business load error:', e);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      if (data) setSuppliers(data);
    } catch (e) {
      console.error('Suppliers load error:', e);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, users(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setTransactions(data.map(t => ({ ...t, fullName: t.users?.full_name })));
    } catch (e) {
      console.error('Transactions load error:', e);
    }
  };

  const loadDailyReports = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*, users(full_name), expenses(*), daily_report_payments(*)')
        .order('date', { ascending: false });
      if (error) throw error;
      if (data) setDailyReports(data.map(r => ({ ...r, fullName: r.users?.full_name, expenses: r.expenses || [] })));
    } catch (e) {
      console.error('Reports load error:', e);
    }
  };

  const loadCashMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*, users(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setCashMovements(data.map(c => ({ ...c, fullName: c.users?.full_name })));
    } catch (e) {
      console.error('Cash movements load error:', e);
    }
  };

  // ---- MAAŞ MODÜLÜ veri yükleyiciler ----
  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      if (data) setEmployees(data);
    } catch (e) {
      console.error('Employees load error:', e);
    }
  };

  const loadSalaryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('salary_items')
        .select('*');
      if (error) throw error;
      if (data) setSalaryItems(data);
    } catch (e) {
      console.error('Salary items load error:', e);
    }
  };

  const loadSalaryPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('salary_payments')
        .select('*, users(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setSalaryPayments(data.map(p => ({ ...p, fullName: p.users?.full_name })));
    } catch (e) {
      console.error('Salary payments load error:', e);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', loginForm.username)
        .eq('password_hash', loginForm.password)
        .single();
      
      if (error || !data) {
        setError('Kullanıcı adı veya şifre hatalı!');
      } else {
        setUser(data);
        setScreen('menu');
        if (loginForm.rememberMe) {
          localStorage.setItem('ege_takip_user', JSON.stringify(data));
        }
      }
    } catch (e) {
      setError('Bağlantı hatası!');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setScreen('login');
    setSelectedBusiness(null);
    setSelectedSupplier(null);
    setLoginForm({ username: '', password: '', rememberMe: false });
    localStorage.removeItem('ege_takip_user');
  };

  const uploadInvoice = async (file) => {
    if (!file) return null;
    setUploadingInvoice(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedBusiness.id}/${fileName}`;
      
      const { data, error } = await supabase.storage.from('invoices').upload(filePath, file);
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(filePath);
      setUploadingInvoice(false);
      return urlData.publicUrl;
    } catch (e) {
      console.error('Invoice upload error:', e);
      setUploadingInvoice(false);
      return null;
    }
  };

  const getUserAllowedBusinesses = () => {
    if (!user) return [];
    return businesses.filter(b => user.allowed_businesses?.includes(b.id));
  };

  const getBusinessSuppliers = () => selectedBusiness ? suppliers.filter(s => s.business_id === selectedBusiness.id) : [];
  const getFilteredSuppliers = () => { 
    const bs = getBusinessSuppliers(); 
    return searchQuery ? bs.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())) : bs; 
  };
  
  const getSupplierBalance = (id) => {
    const tx = transactions.filter(t => t.supplier_id === id);
    return tx.filter(t => t.type === 'ALIM').reduce((s,t) => s + Number(t.amount), 0) - 
           tx.filter(t => t.type === 'ODEME').reduce((s,t) => s + Number(t.amount), 0);
  };
  
  const getTotalDebt = () => getBusinessSuppliers().reduce((s, sup) => s + getSupplierBalance(sup.id), 0);

  const handleAddSupplier = async () => {
    if (!supplierForm.name || !selectedBusiness) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ name: supplierForm.name, phone: supplierForm.phone, notes: supplierForm.notes, business_id: selectedBusiness.id })
        .select()
        .single();
      
      if (error) throw error;
      if (data) setSuppliers([...suppliers, data]);
    } catch (e) {
      console.error('Add supplier error:', e);
    }
    setSupplierForm({ name: '', phone: '', notes: '' });
    setShowAddSupplier(false);
    setLoading(false);
  };

  const handleEditSupplier = async () => {
    if (!showEditSupplier || !supplierForm.name) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ name: supplierForm.name, phone: supplierForm.phone, notes: supplierForm.notes })
        .eq('id', showEditSupplier.id);
      
      if (error) throw error;
      setSuppliers(suppliers.map(s => s.id === showEditSupplier.id ? { ...s, name: supplierForm.name, phone: supplierForm.phone, notes: supplierForm.notes } : s));
      if (selectedSupplier?.id === showEditSupplier.id) {
        setSelectedSupplier({ ...selectedSupplier, name: supplierForm.name, phone: supplierForm.phone, notes: supplierForm.notes });
      }
    } catch (e) {
      console.error('Edit supplier error:', e);
    }
    setSupplierForm({ name: '', phone: '', notes: '' });
    setShowEditSupplier(null);
    setLoading(false);
  };

  const openEditSupplier = (supplier) => {
    setSupplierForm({ name: supplier.name, phone: supplier.phone || '', notes: supplier.notes || '' });
    setShowEditSupplier(supplier);
  };

  const handleAddTransaction = async () => {
    if (!selectedSupplier || !showAddTransaction || !transactionForm.amount) return;
    setLoading(true);
    try {
      let invoiceUrl = null;
      if (transactionForm.invoice) {
        invoiceUrl = await uploadInvoice(transactionForm.invoice);
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          supplier_id: selectedSupplier.id,
          business_id: selectedBusiness.id,
          user_id: user.id,
          type: showAddTransaction,
          amount: parseFloat(transactionForm.amount),
          date: transactionForm.date,
          description: transactionForm.description,
          payment_method: transactionForm.payment_method,
          invoice_url: invoiceUrl
        })
        .select('*, users(full_name)')
        .single();
      
      if (error) throw error;
      if (data) setTransactions([{ ...data, fullName: data.users?.full_name }, ...transactions]);
    } catch (e) {
      console.error('Add transaction error:', e);
    }
    setTransactionForm({ amount: '', date: getTurkeyDate(), description: '', payment_method: 'nakit', invoice: null });
    setShowAddTransaction(null);
    setLoading(false);
  };

  const handleEditTransaction = async () => {
    if (!showEditTransaction) return;
    setLoading(true);
    try {
      let invoiceUrl = showEditTransaction.invoice_url;
      if (transactionForm.invoice) {
        invoiceUrl = await uploadInvoice(transactionForm.invoice);
      }
      
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(transactionForm.amount),
          payment_method: transactionForm.payment_method,
          description: transactionForm.description,
          invoice_url: invoiceUrl
        })
        .eq('id', showEditTransaction.id);
      
      if (error) throw error;
      setTransactions(transactions.map(t => 
        t.id === showEditTransaction.id 
          ? { ...t, amount: parseFloat(transactionForm.amount), payment_method: transactionForm.payment_method, description: transactionForm.description, invoice_url: invoiceUrl } 
          : t
      ));
    } catch (e) {
      console.error('Edit transaction error:', e);
    }
    setTransactionForm({ amount: '', date: getTurkeyDate(), description: '', payment_method: 'nakit', invoice: null });
    setShowEditTransaction(null);
    setLoading(false);
  };

  const openEditTransaction = (tx) => {
    setTransactionForm({ amount: tx.amount.toString(), date: tx.date, description: tx.description || '', payment_method: tx.payment_method, invoice: null });
    setShowEditTransaction(tx);
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    setExpensesList([...expensesList, { id: 'temp_'+Date.now(), description: newExpense.description, amount: parseFloat(newExpense.amount), employee_id: newExpense.employee_id || null, is_external: !!newExpense.is_external }]);
    setNewExpense({ description: '', amount: '', employee_id: '', is_external: false });
  };

  const handleRemoveExpense = (id) => setExpensesList(expensesList.filter(e => e.id !== id));
  // Gider satırını düzenlemek için değerleri forma geri yükle
  const startEditExpense = (exp) => {
    setNewExpense({ description: exp.description || '', amount: String(exp.amount), employee_id: exp.employee_id || '', is_external: !!exp.is_external });
    setExpensesList(expensesList.filter(e => e.id !== exp.id));
  };
  // Kasadan düşen (normal) giderler toplamı - dışarıdan gelenler HARİÇ
  const getTotalExpenses = () => expensesList.filter(e => !e.is_external).reduce((s, e) => s + e.amount, 0);
  // Dışarıdan gelen (havale) toplamı - kasaya katılmaz, ayrı takip
  const getTotalExternal = () => expensesList.filter(e => e.is_external).reduce((s, e) => s + e.amount, 0);

  // ---- GİDER -> MAAŞ ENTEGRASYONU ----
  // Aktif personeller (işten çıkmamış olanlar)
  const getActiveEmployees = () => employees.filter(e => !e.end_key || e.end_key >= currentMonthKey);
  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || '';


  // Kaydedilen giderlerden maaş ödemeleri oluştur (expense_id ile bağlı)
  // FIFO dağıtımı — payments listesi DIŞARIDAN verilir (taze DB verisi).
  // Böylece React state gecikmesine bağlı yanlış kalan hesabı önlenir.
  const allocateSalaryFIFOWith = (emp, amount, paymentsForEmp, extraPaid = {}) => {
    if (!emp || !(amount > 0)) return [];
    const remainingOf = (p) => {
      const due = getSalaryDue(emp, p);
      const paid = paymentsForEmp
        .filter(x => x.year === p.year && x.month === p.month)
        .reduce((s, x) => s + Number(x.amount), 0);
      const extra = extraPaid[`${emp.id}|${p.key}`] || 0;
      return Math.max(0, due - paid - extra);
    };
    let left = amount;
    const parts = [];
    // 1. TUR: vadesi gelmiş aylardaki borçlar (en eskiden)
    for (const p of SALARY_PERIOD) {
      if (left <= 0.001) break;
      if (!isPeriodDue(p, emp)) continue;
      const rem = remainingOf(p);
      if (rem > 0) {
        const take = Math.min(rem, left);
        parts.push({ year: p.year, month: p.month, amount: Math.round(take * 1000) / 1000 });
        extraPaid[`${emp.id}|${p.key}`] = (extraPaid[`${emp.id}|${p.key}`] || 0) + take;
        left -= take;
      }
    }
    // 2. TUR (AVANS): vadesi gelmemiş aylara sırayla
    if (left > 0.001) {
      for (const p of SALARY_PERIOD) {
        if (left <= 0.001) break;
        if (isPeriodDue(p, emp)) continue;
        const rem = remainingOf(p);
        if (rem > 0) {
          const take = Math.min(rem, left);
          parts.push({ year: p.year, month: p.month, amount: Math.round(take * 1000) / 1000 });
          extraPaid[`${emp.id}|${p.key}`] = (extraPaid[`${emp.id}|${p.key}`] || 0) + take;
          left -= take;
        }
      }
    }
    // 3. Tüm aylar doluysa kalanı bu aya "fazla" ekle
    if (left > 0.001) {
      const cur = SALARY_PERIOD.find(p => p.key === currentMonthKey) || SALARY_PERIOD[SALARY_PERIOD.length - 1];
      const ex = parts.find(x => x.year === cur.year && x.month === cur.month);
      if (ex) ex.amount = Math.round((ex.amount + left) * 1000) / 1000;
      else parts.push({ year: cur.year, month: cur.month, amount: Math.round(left * 1000) / 1000 });
    }
    return parts;
  };

  const createSalaryPaymentsForExpenses = async (exps) => {
    const withEmp = (exps || []).filter(e => e.employee_id);
    if (withEmp.length === 0) return;
    // İlgili personellerin GÜNCEL ödemelerini DB'den taze çek (state gecikmesini önle)
    const empIds = [...new Set(withEmp.map(e => e.employee_id))];
    const { data: freshPayments, error: fpErr } = await supabase
      .from('salary_payments').select('employee_id, year, month, amount').in('employee_id', empIds);
    if (fpErr) throw fpErr;
    const byEmp = {};
    (freshPayments || []).forEach(p => { (byEmp[p.employee_id] = byEmp[p.employee_id] || []).push(p); });

    const rows = [];
    const extraPaid = {}; // aynı batch içinde birikimli düşüş
    for (const exp of withEmp) {
      const emp = employees.find(e => e.id === exp.employee_id);
      if (!emp) continue;
      const parts = allocateSalaryFIFOWith(emp, Number(exp.amount), byEmp[exp.employee_id] || [], extraPaid);
      for (const part of parts) {
        rows.push({
          employee_id: exp.employee_id,
          year: part.year,
          month: part.month,
          amount: part.amount,
          note: `${exp.is_external ? 'Dışarıdan (havale)' : 'Gün sonu gideri'}${exp.description ? ' - ' + exp.description : ''}`,
          created_by: user.id,
          expense_id: exp.id,
        });
      }
    }
    if (rows.length > 0) {
      const { error } = await supabase.from('salary_payments').insert(rows);
      if (error) throw error;
      await loadSalaryPayments();
    }
  };

  // Rapora bağlı giderlerin maaş ödemelerini temizle (rapor düzenleme/silme öncesi)
  const deleteSalaryPaymentsForReport = async (reportId) => {
    const { data: exps } = await supabase.from('expenses').select('id').eq('daily_report_id', reportId);
    const ids = (exps || []).map(x => x.id);
    if (ids.length > 0) {
      await supabase.from('salary_payments').delete().in('expense_id', ids);
      await loadSalaryPayments();
    }
  };

  // ---- GİDER ARAMA ----
  // Seçili işletmenin tüm günlerindeki giderlerde açıklama veya personel adına göre ara
  const getExpenseSearchResults = () => {
    if (!selectedBusiness) return [];
    const q = expenseSearch.query.trim().toLocaleLowerCase('tr-TR');
    const { from, to } = expenseSearch;
    if (!q && !from && !to) return [];
    const results = [];
    dailyReports
      .filter(r => r.business_id === selectedBusiness.id)
      .forEach(r => {
        if (from && r.date < from) return;
        if (to && r.date > to) return;
        (r.expenses || []).forEach(e => {
          const desc = (e.description || '').toLocaleLowerCase('tr-TR');
          const empName = e.employee_id ? getEmployeeName(e.employee_id).toLocaleLowerCase('tr-TR') : '';
          if (!q || desc.includes(q) || empName.includes(q)) {
            results.push({ ...e, date: r.date });
          }
        });
      });
    results.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return results;
  };

  // ---- MAAŞ MODÜLÜ yardımcı fonksiyonlar ----
  // period = {year, month, key}
  // Bir personelin belirli dönem için tahakkuk eden maaşı
  const getSalaryDue = (emp, period) => {
    const pk = period.key;
    // başlangıç: emp.start_key varsa onu, yoksa eski start_month'u dönem içinde eşle
    const startKey = emp.start_key || (emp.start_month ? periodKey(salaryStartYear, emp.start_month) : SALARY_PERIOD[0].key);
    if (pk < startKey) return 0;
    if (emp.end_key && pk > emp.end_key) return 0;
    const item = salaryItems.find(si => si.employee_id === emp.id && si.year === period.year && si.month === period.month);
    if (item) return Number(item.amount);
    return Number(emp.base_salary) || 0;
  };

  const getSalaryPaid = (emp, period) =>
    salaryPayments
      .filter(p => p.employee_id === emp.id && p.year === period.year && p.month === period.month)
      .reduce((s, p) => s + Number(p.amount), 0);

  const getSalaryRemaining = (emp, period) =>
    Math.max(0, getSalaryDue(emp, period) - getSalaryPaid(emp, period));

  // Bugünün ayı (Türkiye), 'YYYY-MM' formatında
  const currentMonthKey = (() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();
  const currentDayOfMonth = (() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    return now.getDate();
  })();
  const getPaymentDay = (emp) => {
    const d = emp && emp.payment_day != null ? Number(emp.payment_day) : 27;
    return (d >= 1 && d <= 31) ? d : 27;
  };
  // Bir dönemin vadesi gelmiş mi?
  // Geçmiş aylar: her zaman gelmiş. Gelecek aylar: gelmemiş.
  // İçinde bulunduğumuz ay: ancak ödeme günü geldiyse gelmiş sayılır (öncesi avans dönemi).
  // emp verilmezse (genel görünüm) ay bazlı eski davranış korunur.
  const isPeriodDue = (period, emp) => {
    if (period.key < currentMonthKey) return true;
    if (period.key > currentMonthKey) return false;
    if (!emp) return true; // personel bağımsız çağrılarda ay bazlı
    return currentDayOfMonth >= getPaymentDay(emp);
  };

  const getSortedEmployees = () => {
    const p = SALARY_PERIOD.find(x => x.key === salarySortKey) || SALARY_PERIOD[0];
    // Çıkışı verilen personel, çıkış ayından SONRAKİ dönemlere bakılırken gizlenir.
    // Çıkış ayı ve öncesi dönemlerde görünmeye devam eder (kayıt korunur).
    const arr = employees.filter(e => !e.end_key || p.key <= e.end_key);
    arr.sort((a, b) => {
      switch (salarySortBy) {
        case 'rem-desc': return getSalaryRemaining(b, p) - getSalaryRemaining(a, p);
        case 'rem-asc': return getSalaryRemaining(a, p) - getSalaryRemaining(b, p);
        case 'salary-desc': return getSalaryDue(b, p) - getSalaryDue(a, p);
        case 'salary-asc': return getSalaryDue(a, p) - getSalaryDue(b, p);
        case 'name': return (a.name || '').localeCompare(b.name || '', 'tr');
        default: return (a.sort_order || 0) - (b.sort_order || 0);
      }
    });
    return arr;
  };

  const getEmpInitials = (name) => {
    const clean = (name || '').replace('.', ' ').trim().split(/\s+/);
    return clean.map(p => p[0]).slice(0, 2).join('').toUpperCase();
  };

  // Yeni personel ekle
  const handleAddEmployee = async () => {
    const name = employeeForm.name.trim();
    const salary = parseFloat(employeeForm.salary);
    const startKey = employeeForm.startKey;
    if (!name) { setError('Ad soyad gir.'); return; }
    if (isNaN(salary) || salary <= 0) { setError('Geçerli bir maaş gir.'); return; }
    setLoading(true);
    try {
      const maxOrder = employees.reduce((m, e) => Math.max(m, e.sort_order || 0), 0);
      const pd = Number(employeeForm.payment_day);
      const { error } = await supabase.from('employees').insert({
        name,
        base_salary: salary,
        start_key: startKey,
        end_key: null,
        payment_day: (pd >= 1 && pd <= 31) ? pd : 27,
        sort_order: maxOrder + 1,
        created_by: user.id,
      });
      if (error) throw error;
      await loadEmployees();
      setShowAddEmployee(false);
      setEmployeeForm({ name: '', salary: '', startKey: SALARY_PERIOD[0].key, payment_day: 27 });
      setError('');
    } catch (e) {
      setError('Personel eklenemedi: ' + e.message);
    }
    setLoading(false);
  };

  // Aylık maaş düzeltme (bu ay ve sonrası)
  const handleEditSalary = async () => {
    if (!editSalaryModal) return;
    const { employee, period } = editSalaryModal;
    const nv = parseFloat(editSalaryValue);
    if (isNaN(nv) || nv < 0) { setError('Geçerli bir tutar gir.'); return; }
    setLoading(true);
    try {
      // Bu dönem ve sonraki dönemler için salary_items upsert
      for (const p of SALARY_PERIOD) {
        if (p.key < period.key) continue;
        if (employee.end_key && p.key > employee.end_key) continue;
        const existing = salaryItems.find(si => si.employee_id === employee.id && si.year === p.year && si.month === p.month);
        if (existing) {
          const { error } = await supabase.from('salary_items')
            .update({ amount: nv }).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('salary_items').insert({
            employee_id: employee.id, year: p.year, month: p.month, amount: nv,
          });
          if (error) throw error;
        }
      }
      await loadSalaryItems();
      setEditSalaryModal(null);
      setEditSalaryValue('');
      setError('');
    } catch (e) {
      setError('Maaş güncellenemedi: ' + e.message);
    }
    setLoading(false);
  };

  // Parçalı ödeme ekle
  const handleAddSalaryPayment = async () => {
    if (!selectedEmployee) return;
    const amt = parseFloat(salaryPaymentForm.amount);
    if (isNaN(amt) || amt <= 0) { setError('Geçerli bir tutar gir.'); return; }
    setLoading(true);
    try {
      const dp = SALARY_PERIOD.find(x => x.key === salaryDetailKey) || SALARY_PERIOD[0];
      const { error } = await supabase.from('salary_payments').insert({
        employee_id: selectedEmployee.id,
        year: dp.year,
        month: dp.month,
        amount: amt,
        note: salaryPaymentForm.note.trim() || null,
        created_by: user.id,
      });
      if (error) throw error;
      await loadSalaryPayments();
      setSalaryPaymentForm({ amount: '', note: '' });
      setError('');
    } catch (e) {
      setError('Ödeme eklenemedi: ' + e.message);
    }
    setLoading(false);
  };

  const handleDeleteSalaryPayment = async (paymentId) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('salary_payments').delete().eq('id', paymentId);
      if (error) throw error;
      await loadSalaryPayments();
    } catch (e) {
      setError('Ödeme silinemedi: ' + e.message);
    }
    setLoading(false);
  };

  // Ödeme düzeltme (tutar ve/veya açıklama)
  const handleUpdateSalaryPayment = async () => {
    if (!editPaymentModal) return;
    const amt = parseFloat(editPaymentForm.amount);
    if (isNaN(amt) || amt <= 0) { setError('Geçerli bir tutar gir.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('salary_payments')
        .update({ amount: amt, note: editPaymentForm.note.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', editPaymentModal.id);
      if (error) throw error;
      await loadSalaryPayments();
      setEditPaymentModal(null);
      setEditPaymentForm({ amount: '', note: '' });
      setError('');
    } catch (e) {
      setError('Ödeme güncellenemedi: ' + e.message);
    }
    setLoading(false);
  };

  // İşten çıkarma (çıkış ayı) veya tamamen silme
  const handleTerminateEmployee = async (endKey) => {
    if (!terminateModal) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('employees')
        .update({ end_key: endKey }).eq('id', terminateModal.id);
      if (error) throw error;
      await loadEmployees();
      setTerminateModal(null);
      setError('');
    } catch (e) {
      setError('İşlem başarısız: ' + e.message);
    }
    setLoading(false);
  };

  // Personel adını güncelle
  const handleRenameEmployee = async () => {
    if (!editingName) return;
    const newName = (editingName.value || '').trim();
    if (!newName) { setEditingName(null); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('employees').update({ name: newName }).eq('id', editingName.id);
      if (error) throw error;
      await loadEmployees();
      if (selectedEmployee && selectedEmployee.id === editingName.id) setSelectedEmployee({ ...selectedEmployee, name: newName });
      setEditingName(null);
      setError('');
    } catch (e) {
      setError('İsim güncellenemedi: ' + e.message);
    }
    setLoading(false);
  };

  // Çıkışı geri al (durdur) - personeli tekrar aktif yap
  const handleReactivateEmployee = async () => {
    if (!terminateModal) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('employees')
        .update({ end_key: null }).eq('id', terminateModal.id);
      if (error) throw error;
      await loadEmployees();
      setTerminateModal(null);
      setError('');
    } catch (e) {
      setError('İşlem başarısız: ' + e.message);
    }
    setLoading(false);
  };

  const handleDeleteEmployee = async () => {
    if (!terminateModal) return;
    setLoading(true);
    try {
      await supabase.from('salary_payments').delete().eq('employee_id', terminateModal.id);
      await supabase.from('salary_items').delete().eq('employee_id', terminateModal.id);
      const { error } = await supabase.from('employees').delete().eq('id', terminateModal.id);
      if (error) throw error;
      await loadEmployees();
      await loadSalaryItems();
      await loadSalaryPayments();
      setTerminateModal(null);
      setSelectedEmployee(null);
      setError('');
    } catch (e) {
      setError('Personel silinemedi: ' + e.message);
    }
    setLoading(false);
  };

  // Kaydet butonuna basıldığında - önce onay sor
  const handleSaveReportClick = (type) => {
    // Formda yazılıp + ile eklenmemiş gider varsa otomatik listeye ekle (kaybolmasın)
    if (newExpense.description && newExpense.amount) {
      setExpensesList([...expensesList, { id: 'temp_'+Date.now(), description: newExpense.description, amount: parseFloat(newExpense.amount), employee_id: newExpense.employee_id || null, is_external: !!newExpense.is_external }]);
      setNewExpense({ description: '', amount: '', employee_id: '', is_external: false });
    }
    setShowExpenseConfirm(type);
  };

  // Bir işletme Adisyo'ya bağlı restoran mı? (adında restaurant/restoran geçiyorsa)
  const isRestaurantBusiness = (biz) => {
    const n = (biz?.name || '').toLocaleLowerCase('tr-TR');
    return n.includes('restaurant') || n.includes('restoran');
  };

  // Adisyo'dan seçili günün ödeme türü toplamlarını çek, forma doldur
  const fetchAdisyoDay = async (dateStr) => {
    setAdisyoError('');
    setAdisyoProgress('');
    setAdisyoLoading(true);
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    try {
      // Türe göre biriken toplamlar (tüm sayfalar boyunca)
      const totals = {}; // id -> {payment_type_id, payment_name, amount, is_meal_card, is_debit}
      let page = 1;
      let pageCount = 1;
      let safety = 0;

      while (page <= pageCount && safety < 100) {
        safety++;
        setAdisyoProgress(pageCount > 1 ? `${page} / ${pageCount} sayfa çekiliyor…` : 'Getiriliyor…');

        const res = await fetch(`/api/adisyo?date=${encodeURIComponent(dateStr)}&page=${page}`, { cache: 'no-store' });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Adisyo verisi alınamadı');

        // Bu sayfa limit yediyse: bekle ve AYNI sayfayı tekrar iste
        if (data.rateLimited) {
          setAdisyoProgress(`Adisyo limiti — bekleniyor… (${page}${pageCount > 1 ? ' / ' + pageCount : ''}. sayfa)`);
          await sleep(6000);
          continue; // page artmadan tekrar dene
        }

        pageCount = data.pageCount || 1;
        for (const p of (data.payments || [])) {
          const id = p.paymentTypeId ?? p.name ?? 'other';
          if (!totals[id]) {
            totals[id] = {
              payment_type_id: p.paymentTypeId || 0,
              payment_name: p.name || 'Diğer',
              amount: 0,
              is_meal_card: !!p.isMealCard,
              is_debit: !!p.isDebit,
            };
          }
          totals[id].amount += Number(p.amount) || 0;
        }

        page++;
        // Sonraki sayfadan önce kısa bekleme (limite takılmayı azaltır)
        if (page <= pageCount) await sleep(1500);
      }

      const rows = Object.values(totals)
        .map(r => ({ ...r, amount: Math.round(r.amount * 100) / 100 }))
        .filter(r => r.amount !== 0)
        .sort((a, b) => b.amount - a.amount);
      setAdisyoPayments(rows);

      // Mevcut 3 ana alanı da otomatik doldur (özet/kasa hesabı bozulmasın)
      let cash = 0, meal = 0, card = 0;
      for (const r of rows) {
        if (r.is_debit) continue; // veresiye kasaya girmez
        const nm = r.payment_name.toLocaleLowerCase('tr-TR');
        if (r.is_meal_card) meal += r.amount;
        else if (nm.includes('nakit')) cash += r.amount;
        else card += r.amount; // kredi kartı + tüm online/entegrasyon tahsilatları
      }
      const fmt = (n) => (Math.round(n * 100) / 100).toString();
      setReportForm(f => ({ ...f, date: dateStr, cash: fmt(cash), meal_cards: fmt(meal), credit_card: fmt(card) }));
      setAdisyoProgress('');
    } catch (e) {
      setAdisyoError(e.message || 'Adisyo bağlantı hatası');
      setAdisyoProgress('');
    }
    setAdisyoLoading(false);
  };

  // Rapora bağlı ayrı ödeme türlerini kaydet (varsa önce temizle)
  const saveAdisyoPayments = async (reportId) => {
    if (!reportId) return;
    await supabase.from('daily_report_payments').delete().eq('daily_report_id', reportId);
    if (adisyoPayments.length > 0) {
      const rows = adisyoPayments.map(p => ({
        daily_report_id: reportId,
        payment_type_id: p.payment_type_id || 0,
        payment_name: p.payment_name,
        amount: p.amount,
        is_meal_card: p.is_meal_card,
        is_debit: p.is_debit,
        source: 'adisyo',
      }));
      await supabase.from('daily_report_payments').insert(rows);
    }
  };

  // Onay sonrası gerçek kaydetme
  const handleAddReport = async () => {
    if (!selectedBusiness) return;
    setShowExpenseConfirm(null);
    setLoading(true);
    try {
      const { data: reportData, error: reportError } = await supabase
        .from('daily_reports')
        .insert({
          business_id: selectedBusiness.id,
          user_id: user.id,
          date: reportForm.date,
          credit_card: parseFloat(reportForm.credit_card) || 0,
          cash: parseFloat(reportForm.cash) || 0,
          meal_cards: parseFloat(reportForm.meal_cards) || 0,
          actual_cash: parseFloat(reportForm.actual_cash) || 0,
          notes: reportForm.notes
        })
        .select('*, users(full_name)')
        .single();

      if (reportError) throw reportError;

      // Adisyo'dan gelen ayrı ödeme türlerini kaydet
      if (reportData) await saveAdisyoPayments(reportData.id);

      let expenses = [];
      if (reportData && expensesList.length > 0) {
        const expensesData = expensesList.map(e => ({ daily_report_id: reportData.id, description: e.description, amount: e.amount, employee_id: e.employee_id || null, is_external: !!e.is_external }));
        const { data: expData, error: expError } = await supabase.from('expenses').insert(expensesData).select();
        if (expError) throw expError;
        if (expData) {
          expenses = expData;
          await createSalaryPaymentsForExpenses(expData);
        }
      }

      if (reportData) {
        setDailyReports([{ ...reportData, fullName: reportData.users?.full_name, expenses }, ...dailyReports]);
      }
    } catch (e) {
      console.error('Add report error:', e);
      alert('Rapor eklenirken hata: ' + e.message);
    }
    
    setReportForm({ date: getTurkeyDate(), credit_card: '', cash: '', meal_cards: '', actual_cash: '', notes: '' });
    setExpensesList([]);
    setAdisyoPayments([]);
    setAdisyoError('');
    setShowAddReport(false);
    setLoading(false);
  };

  const handleEditReport = async () => {
    if (!selectedBusiness) return;
    const currentReport = getReportByDate(selectedBusiness.id, selectedDate);
    if (!currentReport) return;
    
    setShowExpenseConfirm(null);
    setLoading(true);

    try {
      const { error: updError } = await supabase.from('daily_reports').update({
        credit_card: parseFloat(reportForm.credit_card) || 0,
        cash: parseFloat(reportForm.cash) || 0,
        meal_cards: parseFloat(reportForm.meal_cards) || 0,
        actual_cash: parseFloat(reportForm.actual_cash) || 0,
        notes: reportForm.notes
      }).eq('id', currentReport.id);
      if (updError) throw updError;

      // Adisyo ödeme türlerini güncelle (varsa)
      await saveAdisyoPayments(currentReport.id);

      // Eski giderlere bağlı maaş ödemelerini temizle, sonra giderleri sil
      await deleteSalaryPaymentsForReport(currentReport.id);
      await supabase.from('expenses').delete().eq('daily_report_id', currentReport.id);
      
      let newExpenses = [];
      if (expensesList.length > 0) {
        const expensesData = expensesList.map(e => ({ daily_report_id: currentReport.id, description: e.description, amount: e.amount, employee_id: e.employee_id || null, is_external: !!e.is_external }));
        const { data: expData, error: expError } = await supabase.from('expenses').insert(expensesData).select();
        if (expError) throw expError;
        if (expData) {
          newExpenses = expData;
          await createSalaryPaymentsForExpenses(expData);
        }
      }

      setDailyReports(dailyReports.map(r => r.id === currentReport.id ? {
        ...r, credit_card: parseFloat(reportForm.credit_card) || 0, cash: parseFloat(reportForm.cash) || 0,
        meal_cards: parseFloat(reportForm.meal_cards) || 0, actual_cash: parseFloat(reportForm.actual_cash) || 0,
        notes: reportForm.notes, expenses: newExpenses
      } : r));
    } catch (e) {
      console.error('Edit report error:', e);
      alert('Rapor güncellenirken hata: ' + e.message + '\n\nSupabase SQL güncellemesini çalıştırdığından emin ol.');
      await loadDailyReports();
    }

    setReportForm({ date: getTurkeyDate(), credit_card: '', cash: '', meal_cards: '', actual_cash: '', notes: '' });
    setExpensesList([]);
    setShowEditReport(false);
    setLoading(false);
  };

  const openEditReport = (report) => {
    setReportForm({ date: report.date, credit_card: report.credit_card?.toString() || '', cash: report.cash?.toString() || '', meal_cards: report.meal_cards?.toString() || '', actual_cash: report.actual_cash?.toString() || '', notes: report.notes || '' });
    setExpensesList(report.expenses?.map(e => ({ ...e })) || []);
    setAdisyoPayments((report.daily_report_payments || []).map(p => ({
      payment_type_id: p.payment_type_id || 0,
      payment_name: p.payment_name,
      amount: Number(p.amount) || 0,
      is_meal_card: !!p.is_meal_card,
      is_debit: !!p.is_debit,
    })));
    setAdisyoError('');
    setShowEditReport(true);
  };

  const handleAddCashMovement = async () => {
    if (!cashMovementForm.amount || !cashMovementForm.description) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .insert({ user_id: user.id, type: showAddCashMovement, amount: parseFloat(cashMovementForm.amount), description: cashMovementForm.description, date: cashMovementForm.date })
        .select('*, users(full_name)')
        .single();
      
      if (error) throw error;
      if (data) setCashMovements([{ ...data, fullName: data.users?.full_name }, ...cashMovements]);
    } catch (e) {
      console.error('Add cash movement error:', e);
    }
    setCashMovementForm({ amount: '', description: '', date: getTurkeyDate() });
    setShowAddCashMovement(null);
    setLoading(false);
  };

  const initiateDelete = (type, id, name) => setDeleteConfirm({ show: true, step: 1, type, id, name });
  const confirmDeleteStep1 = () => setDeleteConfirm({ ...deleteConfirm, step: 2 });
  
  const confirmDeleteStep2 = async () => {
    const { type, id } = deleteConfirm;
    setLoading(true);
    try {
      if (type === 'supplier') {
        await supabase.from('transactions').delete().eq('supplier_id', id);
        await supabase.from('suppliers').delete().eq('id', id);
        setSuppliers(suppliers.filter(s => s.id !== id));
        setTransactions(transactions.filter(t => t.supplier_id !== id));
        setSelectedSupplier(null);
      } else if (type === 'transaction') {
        await supabase.from('transactions').delete().eq('id', id);
        setTransactions(transactions.filter(t => t.id !== id));
      } else if (type === 'report') {
        await deleteSalaryPaymentsForReport(id);
        await supabase.from('expenses').delete().eq('daily_report_id', id);
        await supabase.from('daily_reports').delete().eq('id', id);
        setDailyReports(dailyReports.filter(r => r.id !== id));
      } else if (type === 'cashMovement') {
        await supabase.from('cash_movements').delete().eq('id', id);
        setCashMovements(cashMovements.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
    setDeleteConfirm({ show: false, step: 1, type: null, id: null, name: '' });
    setLoading(false);
  };
  
  const cancelDelete = () => setDeleteConfirm({ show: false, step: 1, type: null, id: null, name: '' });

  const getPaymentLabel = (m) => ({ nakit: 'Nakit', kredi_karti: 'Kredi Kartı', cek: 'Çek', senet: 'Senet' }[m] || m);
  const getBusinessReports = (bid) => dailyReports.filter(r => r.business_id === bid);
  const getReportByDate = (bid, date) => dailyReports.find(r => r.business_id === bid && r.date === date);
  const changeDate = (days) => { const d = new Date(selectedDate); d.setDate(d.getDate() + days); setSelectedDate(d.toISOString().split('T')[0]); };
  // Kasadan düşen giderler (dışarıdan gelenler HARİÇ) - kasa hesabında bunu kullan
  const getExpTotal = (exps) => (exps || []).filter(e => !e.is_external).reduce((s, e) => s + Number(e.amount), 0);
  // Dışarıdan gelen (havale) toplamı - kasaya katılmaz
  const getExtTotal = (exps) => (exps || []).filter(e => e.is_external).reduce((s, e) => s + Number(e.amount), 0);
  const calcCashDiff = (r) => Number(r.actual_cash) - (Number(r.cash) - getExpTotal(r.expenses));

  const getDailySummary = (date) => {
    const reports = dailyReports.filter(r => r.date === date);
    let totalCreditCard = 0, totalCash = 0, totalMealCards = 0, totalExpenses = 0, businessSummary = [];
    businesses.forEach(b => {
      const report = reports.find(r => r.business_id === b.id);
      if (report) {
        const expenses = getExpTotal(report.expenses);
        totalCreditCard += Number(report.credit_card); 
        totalCash += Number(report.cash); 
        totalMealCards += Number(report.meal_cards);
        totalExpenses += expenses;
        businessSummary.push({ 
          name: b.name, 
          credit_card: Number(report.credit_card), 
          cash: Number(report.cash), 
          meal_cards: Number(report.meal_cards), 
          expenses: expenses,
          total: Number(report.credit_card) + Number(report.cash) + Number(report.meal_cards),
          net: Number(report.credit_card) + Number(report.cash) + Number(report.meal_cards) - expenses
        });
      }
    });
    const total = totalCreditCard + totalCash + totalMealCards;
    return { totalCreditCard, totalCash, totalMealCards, totalExpenses, businessSummary, total, netTotal: total - totalExpenses };
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-700 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const LoadingOverlay = () => loading ? (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[200]">
      <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
        <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-700 font-medium">Yükleniyor...</span>
      </div>
    </div>
  ) : null;

  const DeleteConfirmModal = () => {
    if (!deleteConfirm.show) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
        <div className="rounded-2xl p-6 w-full max-w-md border border-white/60" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          {deleteConfirm.step === 1 ? (
            <><div className="text-center mb-6"><div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><Icon path={IconPaths.alert} size={28}/></div><h3 className="text-xl font-bold text-black mb-2">Silme Onayı (1/2)</h3><p className="text-gray-600">"{deleteConfirm.name}" silinecek.</p></div><div className="flex gap-2"><button onClick={cancelDelete} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={confirmDeleteStep1} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold">Devam</button></div></>
          ) : (
            <><div className="text-center mb-6"><div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Icon path={IconPaths.trash} size={26}/></div><h3 className="text-xl font-bold text-black mb-2">Son Onay (2/2)</h3><p className="text-gray-600">"{deleteConfirm.name}" kalıcı silinecek!</p></div><div className="flex gap-2"><button onClick={cancelDelete} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">Vazgeç</button><button onClick={confirmDeleteStep2} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold">Evet, Sil</button></div></>
          )}
        </div>
      </div>
    );
  };

  // Gider Onay Modal
  const ExpenseConfirmModal = () => {
    if (!showExpenseConfirm) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
        <div className="rounded-2xl p-6 w-full max-w-md border border-white/60" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center"><Icon path={IconPaths.note} size={26}/></div>
            <h3 className="text-xl font-bold text-black mb-2">Gider Onayı</h3>
            <p className="text-gray-600">Gider girdiğinize emin misiniz?</p>
            {expensesList.length === 0 ? (
              <p className="text-red-500 mt-2 font-semibold">Hiç gider girilmedi!</p>
            ) : (
              <p className="text-gray-900 mt-2 font-semibold">{expensesList.length} gider girildi - Toplam: {formatMoney(getTotalExpenses())}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowExpenseConfirm(null)} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">Geri Dön</button>
            <button onClick={() => showExpenseConfirm === 'add' ? handleAddReport() : handleEditReport()} className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Evet, Kaydet</button>
          </div>
        </div>
      </div>
    );
  };

  const InvoiceModal = () => {
    if (!viewInvoice) return null;
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]" onClick={() => setViewInvoice(null)}>
        <div className="bg-white rounded-xl p-4 max-w-4xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Fatura</h3>
            <button onClick={() => setViewInvoice(null)} className="text-gray-500 text-2xl">×</button>
          </div>
          <img src={viewInvoice} alt="Fatura" className="max-w-full rounded-lg" />
          <a href={viewInvoice} target="_blank" rel="noopener noreferrer" className="block mt-4 text-center bg-black text-white py-2 rounded-lg">Tam Boyut Aç</a>
        </div>
      </div>
    );
  };

  // LOGIN
  if (screen === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 50%, #dddde3 100%)' }}>
        <LoadingOverlay />
        {/* arka plan yumuşak ışık lekeleri - liquid glass derinliği */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(180,180,190,0.6) 0%, transparent 70%)' }} />
        </div>

        <div className="relative w-full max-w-md">
          {/* cam kart */}
          <div className="rounded-3xl p-8 border border-white/60 shadow-xl" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)' }}>
            <div className="flex flex-col items-center mb-8">
              <img src="/ege-logo.png" alt="Ege" className="w-44 h-auto mb-3 select-none" draggable="false" />
              <p className="text-gray-500 text-sm tracking-wide">Takip Sistemi</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Kullanıcı Adı</label>
                <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition" style={{ backdropFilter: 'blur(4px)' }} placeholder="Kullanıcı adınız" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Şifre</label>
                <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition" style={{ backdropFilter: 'blur(4px)' }} placeholder="Şifreniz" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input type="checkbox" checked={loginForm.rememberMe} onChange={(e) => setLoginForm({...loginForm, rememberMe: e.target.checked})} className="w-5 h-5 rounded border-gray-300 accent-black" />
                <span className="text-gray-600 text-sm font-medium">Beni Hatırla</span>
              </label>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm">{error}</div>}
              <button onClick={handleLogin} disabled={loading} className="w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition shadow-lg">Giriş Yap</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MENU
  if (screen === 'menu') {
    const menuItems = [
      { key: 'toptanci', icon: IconPaths.box, title: 'Toptancı Ödemeleri', desc: 'Mal alımı ve ödeme takibi', show: true },
      { key: 'gunsonu', icon: IconPaths.chart, title: 'Gün Sonu', desc: 'Günlük ciro ve kasa raporu', show: true },
      { key: 'kasa', icon: IconPaths.wallet, title: 'Kasa Hareketleri', desc: 'Ödeme ve gelen para takibi', show: user?.role === 'admin' },
      { key: 'ozet', icon: IconPaths.trending, title: 'Günlük Özet', desc: 'Tüm işletmelerin toplamı', show: user?.role === 'admin' },
      { key: 'maas', icon: IconPaths.receipt, title: 'Maaş Takibi', desc: 'Personel maaşları ve ödemeler', show: user?.role === 'admin' },
    ];
    return (
      <div className="min-h-screen p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 50%, #dddde3 100%)' }}>
        <LoadingOverlay />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(180,180,190,0.6) 0%, transparent 70%)' }} />
        </div>
        <div className="max-w-lg mx-auto pt-10 relative">
          <div className="text-center mb-8">
            <img src="/ege-logo.png" alt="Ege" className="w-32 h-auto mx-auto mb-2 select-none" draggable="false" />
            <p className="text-gray-600">Hoş geldin, {user?.full_name}</p>
            {user?.role === 'admin' && <span className="inline-flex items-center gap-1 mt-2 bg-black text-white px-3 py-1 rounded-full text-xs"><Icon path={IconPaths.crown} size={13} /> Admin</span>}
          </div>
          <div className="space-y-3">
            {menuItems.filter(m => m.show).map(m => (
              <button key={m.key} onClick={() => setScreen(m.key)} className="w-full p-5 rounded-2xl flex items-center gap-4 border border-white/60 transition hover:scale-[1.01] active:scale-[0.99]" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', boxShadow: '0 4px 20px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.7)' }}>
                <span className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center"><Icon path={m.icon} size={22} /></span>
                <div className="text-left"><p className="text-lg font-semibold text-gray-900">{m.title}</p><p className="text-sm text-gray-500">{m.desc}</p></div>
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="w-full mt-8 text-gray-500 hover:text-gray-900 py-2 transition flex items-center justify-center gap-2"><Icon path={IconPaths.logout} size={16} /> Çıkış Yap</button>
        </div>
      </div>
    );
  }

  // ÖZET
  if (screen === 'ozet' && user?.role === 'admin') {
    const summary = getDailySummary(selectedDate);
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 50%, #dddde3 100%)' }}>
        <LoadingOverlay />
        <header className="sticky top-0 z-30 border-b border-white/50" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)' }}><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-black p-1 -ml-1 rounded-lg hover:bg-black/5"><Icon path={IconPaths.back} size={22} /></button><h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Icon path={IconPaths.trending} size={20} /> Günlük Özet</h1></div><button onClick={handleLogout} className="inline-flex items-center gap-1.5 bg-black/5 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-black/10"><Icon path={IconPaths.logout} size={15} /> Çıkış</button></div></header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => changeDate(-1)} className="bg-gray-100 text-black px-4 py-2 rounded-lg font-semibold">← Önceki</button>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 border-2 border-gray-200 rounded-lg px-6 py-3 bg-gray-50">{formatDateTR(selectedDate)}</div>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-2 text-sm border rounded-lg px-3 py-1" />
              </div>
              <button onClick={() => changeDate(1)} className="bg-gray-100 text-black px-4 py-2 rounded-lg font-semibold">Sonraki →</button>
            </div>
            <div className="flex gap-2 mt-4 justify-center"><button onClick={() => setSelectedDate(getTurkeyDate())} className="bg-black text-white px-4 py-2 rounded-lg text-sm">Bugün</button></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black rounded-2xl p-6 text-white">
              <p className="text-white/80 text-sm">Toplam Ciro</p>
              <p className="text-3xl font-bold">{formatMoney(summary.total)}</p>
            </div>
            <div className="bg-black rounded-2xl p-6 text-white">
              <p className="text-white/80 text-sm">Net Ciro (Giderler Düşülmüş)</p>
              <p className="text-3xl font-bold">{formatMoney(summary.netTotal)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-300 text-center">
              <p className="text-emerald-600 font-semibold text-xs flex items-center gap-1"><Icon path={IconPaths.card} size={13}/> Kredi Kartı</p>
              <p className="text-lg font-bold">{formatMoney(summary.totalCreditCard)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-300 text-center">
              <p className="text-emerald-600 font-semibold text-xs flex items-center gap-1"><Icon path={IconPaths.cash} size={13}/> Nakit</p>
              <p className="text-lg font-bold">{formatMoney(summary.totalCash)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 text-center">
              <p className="text-emerald-600 font-semibold text-xs flex items-center gap-1"><Icon path={IconPaths.meal} size={13}/> Yemek Kartı</p>
              <p className="text-lg font-bold">{formatMoney(summary.totalMealCards)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 text-center">
              <p className="text-red-600 font-semibold text-xs flex items-center gap-1"><Icon path={IconPaths.arrowDown} size={13}/> Toplam Gider</p>
              <p className="text-lg font-bold">{formatMoney(summary.totalExpenses)}</p>
            </div>
          </div>
          
          <div className="rounded-2xl p-6 border border-white/50" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">İşletme Detayları</h3>
            {summary.businessSummary.length > 0 ? (<div className="space-y-3">{summary.businessSummary.map((b, i) => (<div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold">{b.name}</p>
                <div className="text-right">
                  <p className="font-bold text-black">{formatMoney(b.total)}</p>
                  <p className="text-sm text-gray-900">Net: {formatMoney(b.net)}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>{formatMoney(b.credit_card)}</div>
                <div>{formatMoney(b.cash)}</div>
                <div>{formatMoney(b.meal_cards)}</div>
                <div className="text-red-600">{formatMoney(b.expenses)}</div>
              </div>
            </div>))}</div>) : (<p className="text-center text-gray-500 py-8">Rapor yok</p>)}
          </div>
        </main>
      </div>
    );
  }

  // KASA
  if (screen === 'kasa' && user?.role === 'admin') {
    const todayMovements = cashMovements.filter(c => c.date === selectedDate);
    const totalIn = todayMovements.filter(c => c.type === 'IN').reduce((s, c) => s + Number(c.amount), 0);
    const totalOut = todayMovements.filter(c => c.type === 'OUT').reduce((s, c) => s + Number(c.amount), 0);
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 50%, #dddde3 100%)' }}>
        <LoadingOverlay />
        <header className="sticky top-0 z-30 border-b border-white/50" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)' }}><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-black p-1 -ml-1 rounded-lg hover:bg-black/5"><Icon path={IconPaths.back} size={22} /></button><h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Icon path={IconPaths.wallet} size={20} /> Kasa Hareketleri</h1></div><button onClick={handleLogout} className="inline-flex items-center gap-1.5 bg-black/5 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-black/10"><Icon path={IconPaths.logout} size={15} /> Çıkış</button></div></header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => changeDate(-1)} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-semibold">← Önceki</button>
              <div className="text-center"><div className="text-2xl font-bold text-gray-800 border-2 border-gray-200 rounded-lg px-6 py-3 bg-gray-50">{formatDateTR(selectedDate)}</div><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-2 text-sm border rounded-lg px-3 py-1" /></div>
              <button onClick={() => changeDate(1)} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-semibold">Sonraki →</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={() => { setCashMovementForm({...cashMovementForm, date: selectedDate}); setShowAddCashMovement('IN'); }} className="bg-black text-white p-4 rounded-xl font-semibold text-lg">+ Gelen Para</button>
            <button onClick={() => { setCashMovementForm({...cashMovementForm, date: selectedDate}); setShowAddCashMovement('OUT'); }} className="bg-red-500 text-white p-4 rounded-xl font-semibold flex items-center justify-center gap-2"><Icon path={IconPaths.arrowUp} size={18}/> Ödeme Yap</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-300 text-center"><p className="text-gray-900 font-semibold">Gelen</p><p className="text-2xl font-bold text-gray-900">{formatMoney(totalIn)}</p></div>
            <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 text-center"><p className="text-red-600 font-semibold">Çıkan</p><p className="text-2xl font-bold text-red-700">{formatMoney(totalOut)}</p></div>
          </div>
          <div className="rounded-2xl p-6 border border-white/50" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Hareketler</h3>
            <div className="space-y-2">
              {todayMovements.map(m => (
                <div key={m.id} className={`p-4 rounded-lg border-l-4 ${m.type === 'IN' ? 'bg-gray-50 border-l-green-500' : 'bg-red-50 border-l-red-500'}`}>
                  <div className="flex justify-between items-start">
                    <div><p className={`font-semibold flex items-center gap-1.5 ${m.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}><Icon path={m.type === 'IN' ? IconPaths.arrowDown : IconPaths.arrowUp} size={15}/>{m.type === 'IN' ? 'Gelen' : 'Ödeme'}</p><p className="text-sm text-gray-600">{m.description}</p><p className="text-xs text-gray-500">{formatTimeTR(m.created_at)} - {m.fullName}</p></div>
                    <div className="flex items-center gap-2"><p className={`text-xl font-bold ${m.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>{m.type === 'IN' ? '+' : '-'}{formatMoney(m.amount)}</p><button onClick={() => initiateDelete('cashMovement', m.id, m.description)} className="bg-red-50 text-red-500 hover:bg-red-100 p-1.5 rounded-lg"><Icon path={IconPaths.trash} size={15}/></button></div>
                  </div>
                </div>
              ))}
              {todayMovements.length === 0 && <p className="text-center text-gray-500 py-8">Hareket yok</p>}
            </div>
          </div>
        </main>
        {showAddCashMovement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="rounded-2xl p-6 w-full max-w-md border border-white/60" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${showAddCashMovement === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}><Icon path={showAddCashMovement === 'IN' ? IconPaths.arrowDown : IconPaths.arrowUp} size={20}/>{showAddCashMovement === 'IN' ? 'Gelen Para' : 'Ödeme Yap'}</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Tutar *</label><input type="number" value={cashMovementForm.amount} onChange={(e) => setCashMovementForm({...cashMovementForm, amount: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" placeholder="0" /></div>
                <div><label className="block text-sm font-medium mb-1">Açıklama *</label><input type="text" value={cashMovementForm.description} onChange={(e) => setCashMovementForm({...cashMovementForm, description: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div>
                <div><label className="block text-sm font-medium mb-1">Tarih</label><div className="text-lg font-bold border-2 rounded-lg px-4 py-2 bg-gray-50">{formatDateTR(cashMovementForm.date)}</div></div>
              </div>
              <div className="flex gap-2 mt-6"><button onClick={() => setShowAddCashMovement(null)} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={handleAddCashMovement} className={`flex-1 text-white py-3 rounded-lg font-semibold ${showAddCashMovement === 'IN' ? 'bg-black' : 'bg-red-500'}`}>Kaydet</button></div>
            </div>
          </div>
        )}
        <DeleteConfirmModal />
      </div>
    );
  }

  // GÜN SONU
  if (screen === 'gunsonu') {
    const allowedBusinesses = getUserAllowedBusinesses();
    if (!selectedBusiness) {
      return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 50%, #dddde3 100%)' }}>
          <LoadingOverlay />
          <header className="sticky top-0 z-30 border-b border-white/50" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)' }}><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-black p-1 -ml-1 rounded-lg hover:bg-black/5"><Icon path={IconPaths.back} size={22} /></button><h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Icon path={IconPaths.chart} size={20} /> Gün Sonu</h1></div><button onClick={handleLogout} className="inline-flex items-center gap-1.5 bg-black/5 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-black/10"><Icon path={IconPaths.logout} size={15} /> Çıkış</button></div></header>
          <main className="max-w-lg mx-auto px-4 py-8"><div className="space-y-4">{allowedBusinesses.map(b => (<button key={b.id} onClick={() => setSelectedBusiness(b)} className="w-full bg-white p-6 rounded-xl shadow text-left border-l-4 border-black"><p className="text-xl font-bold">{b.name}</p><p className="text-sm text-gray-500">{getBusinessReports(b.id).length} rapor</p></button>))}</div></main>
        </div>
      );
    }
    const currentReport = getReportByDate(selectedBusiness.id, selectedDate);
    const isToday = selectedDate === getTurkeyDate();
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 50%, #dddde3 100%)' }}>
        <LoadingOverlay />
        <ExpenseConfirmModal />
        <header className="sticky top-0 z-30 border-b border-white/50" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)' }}><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setSelectedBusiness(null)} className="text-black p-1 -ml-1 rounded-lg hover:bg-black/5"><Icon path={IconPaths.back} size={22} /></button><h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Icon path={IconPaths.chart} size={20} /> {selectedBusiness.name}</h1></div><button onClick={handleLogout} className="inline-flex items-center gap-1.5 bg-black/5 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-black/10"><Icon path={IconPaths.logout} size={15} /> Çıkış</button></div></header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => changeDate(-1)} className="bg-gray-100 text-black px-4 py-2 rounded-lg font-semibold">←</button>
              <div className="text-center"><div className="text-2xl font-bold border-2 rounded-lg px-6 py-3 bg-gray-50">{formatDateTR(selectedDate)}</div><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-2 text-sm border rounded-lg px-3 py-1" /></div>
              <button onClick={() => changeDate(1)} className="bg-gray-100 text-black px-4 py-2 rounded-lg font-semibold">→</button>
            </div>
            <div className="flex gap-2 mt-4 justify-center"><button onClick={() => setSelectedDate(getTurkeyDate())} className="bg-black text-white px-4 py-2 rounded-lg text-sm">Bugün</button><button onClick={() => setExpenseSearch({ ...expenseSearch, open: !expenseSearch.open })} className="bg-black text-white px-4 py-2 rounded-lg text-sm inline-flex items-center gap-1.5"><Icon path={IconPaths.search} size={15}/> Gider Ara</button></div>
          </div>

          {expenseSearch.open && (() => {
            const results = getExpenseSearchResults();
            const total = results.reduce((s, e) => s + Number(e.amount), 0);
            const hasFilter = expenseSearch.query.trim() || expenseSearch.from || expenseSearch.to;
            return (
              <div className="bg-white rounded-xl shadow p-4 mb-6 border-2 border-black">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-gray-900 flex items-center gap-2"><Icon path={IconPaths.search} size={16}/> Gider Ara</p>
                  <button onClick={() => setExpenseSearch({ open: false, query: '', from: '', to: '' })} className="text-gray-400 hover:text-gray-700 text-sm inline-flex items-center gap-1"><Icon path={IconPaths.close} size={14}/> Kapat</button>
                </div>
                <input type="text" value={expenseSearch.query} onChange={(e) => setExpenseSearch({ ...expenseSearch, query: e.target.value })} className="w-full px-4 py-2 border-2 rounded-lg mb-2" placeholder="Ara: Emre, Ambalajcı, personel adı, açıklama..." />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><label className="text-xs text-gray-500">Başlangıç (ops.)</label><input type="date" value={expenseSearch.from} onChange={(e) => setExpenseSearch({ ...expenseSearch, from: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div>
                  <div><label className="text-xs text-gray-500">Bitiş (ops.)</label><input type="date" value={expenseSearch.to} onChange={(e) => setExpenseSearch({ ...expenseSearch, to: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div>
                </div>
                {hasFilter ? (
                  <>
                    <div className="flex justify-between items-center bg-red-50 border-2 border-red-200 rounded-lg px-3 py-2 mb-2">
                      <span className="text-sm font-semibold text-red-700">{results.length} gider bulundu</span>
                      <span className="font-bold text-red-700">{formatMoney(total)}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {results.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Sonuç bulunamadı</p>
                      ) : results.map((e, i) => (
                        <div key={e.id || i} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-1">
                          <div>
                            <span className="text-sm">{e.description}</span>
                            {e.employee_id && (<span className="ml-2 inline-flex items-center gap-1 text-xs bg-black text-white px-1.5 py-0.5 rounded-full"><Icon path={IconPaths.user} size={10}/>{getEmployeeName(e.employee_id)}</span>)}
                            {e.is_external && (<span className="ml-2 text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded-full">Dışarıdan</span>)}
                            <span className="text-xs text-gray-400 block">{formatDateTR(e.date)}</span>
                          </div>
                          <span className="text-sm font-semibold text-red-600">{formatMoney(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">Arama yazın veya tarih aralığı seçin</p>
                )}
              </div>
            );
          })()}
          {(isToday || user?.role === 'admin') && !currentReport && (<button onClick={() => { setReportForm({...reportForm, date: selectedDate}); setExpensesList([]); setShowAddReport(true); }} className="w-full bg-black text-white py-4 rounded-xl font-semibold mb-6">+ Rapor Ekle</button>)}
          {currentReport ? (
            <div className="rounded-2xl p-6 border border-white/50" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div><p className="text-2xl font-bold">{formatDateTR(currentReport.date)}</p><p className="text-sm text-gray-500">Ciro: {formatMoney(Number(currentReport.credit_card) + Number(currentReport.cash) + Number(currentReport.meal_cards))}</p><p className="text-xs text-black mt-1">{currentReport.fullName} - {formatTimeTR(currentReport.created_at)}</p></div>
                <div className="flex items-center gap-2">
                  <div className={`px-4 py-2 rounded-lg text-sm font-bold ${calcCashDiff(currentReport) >= 0 ? 'bg-gray-100 text-gray-900' : 'bg-red-100 text-red-700'}`}>Fark: {formatMoney(calcCashDiff(currentReport))}</div>
                  {user?.role === 'admin' && (<div className="flex gap-1"><button onClick={() => openEditReport(currentReport)} className="bg-black/5 text-gray-700 hover:bg-black/10 p-2 rounded-lg"><Icon path={IconPaths.edit} size={15}/></button><button onClick={() => initiateDelete('report', currentReport.id, `${formatDateTR(currentReport.date)} raporu`)} className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg"><Icon path={IconPaths.trash} size={15}/></button></div>)}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200"><p className="text-emerald-600 font-semibold text-xs flex items-center gap-1"><Icon path={IconPaths.card} size={13}/> Kredi Kartı</p><p className="text-lg font-bold">{formatMoney(currentReport.credit_card)}</p></div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200"><p className="text-emerald-600 font-semibold text-xs flex items-center gap-1"><Icon path={IconPaths.cash} size={13}/> Nakit</p><p className="text-lg font-bold">{formatMoney(currentReport.cash)}</p></div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200"><p className="text-emerald-600 font-semibold text-xs flex items-center gap-1"><Icon path={IconPaths.meal} size={13}/> Yemek Kartı</p><p className="text-lg font-bold">{formatMoney(currentReport.meal_cards)}</p></div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200"><p className="text-gray-600 font-semibold text-xs flex items-center gap-1"><Icon path={IconPaths.wallet} size={13}/> Eldeki Nakit</p><p className="text-lg font-bold">{formatMoney(currentReport.actual_cash)}</p></div>
              </div>
              {(currentReport.daily_report_payments || []).length > 0 && (<div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4"><p className="text-gray-700 font-semibold text-sm mb-2">Adisyo Ödeme Türleri</p>{currentReport.daily_report_payments.slice().sort((a,b)=>b.amount-a.amount).map((p, i) => (<div key={i} className="flex justify-between text-sm bg-white p-2 rounded mb-1 border border-gray-100"><span className="text-gray-700">{p.payment_name}{p.is_meal_card && <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">yemek kartı</span>}{p.is_debit && <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">veresiye</span>}</span><span className="font-semibold text-gray-900">{formatMoney(p.amount)}</span></div>))}<div className="flex justify-between pt-1 text-sm"><span className="font-semibold text-gray-600">Toplam:</span><span className="font-bold text-gray-900">{formatMoney(currentReport.daily_report_payments.reduce((s,p)=>s+Number(p.amount),0))}</span></div></div>)}
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200 mb-4"><div className="flex justify-between mb-2"><p className="text-red-600 font-semibold flex items-center gap-1"><Icon path={IconPaths.arrowDown} size={15}/> Giderler (Kasadan)</p><p className="font-bold text-red-700">{formatMoney(getExpTotal(currentReport.expenses))}</p></div>{(currentReport.expenses || []).filter(e => !e.is_external).length > 0 ? (currentReport.expenses.filter(e => !e.is_external).map((e, i) => (<div key={i} className="flex justify-between text-sm bg-white p-2 rounded mb-1"><span>{e.description}{e.employee_id && (<span className="ml-2 inline-flex items-center gap-1 text-xs bg-black text-white px-1.5 py-0.5 rounded-full"><Icon path={IconPaths.user} size={10}/>{getEmployeeName(e.employee_id)}</span>)}</span><span className="text-red-600 font-semibold">{formatMoney(e.amount)}</span></div>))) : (<p className="text-sm text-gray-500 text-center py-2">Gider girilmedi</p>)}</div>
              {getExtTotal(currentReport.expenses) > 0 && (<div className="bg-gray-100 p-4 rounded-lg border border-gray-300 mb-4"><div className="flex justify-between mb-2"><p className="text-gray-700 font-semibold">Dışarıdan Gelen (Havale)</p><p className="font-bold text-gray-800">{formatMoney(getExtTotal(currentReport.expenses))}</p></div><p className="text-xs text-gray-500 mb-2">Bu tutarlar kasadan düşmez, dışarıdan gelen parayla ödenmiştir.</p>{currentReport.expenses.filter(e => e.is_external).map((e, i) => (<div key={i} className="flex justify-between text-sm bg-white p-2 rounded mb-1"><span>{e.description}{e.employee_id && (<span className="ml-2 inline-flex items-center gap-1 text-xs bg-black text-white px-1.5 py-0.5 rounded-full"><Icon path={IconPaths.user} size={10}/>{getEmployeeName(e.employee_id)}</span>)}</span><span className="text-gray-700 font-semibold">{formatMoney(e.amount)}</span></div>))}</div>)}
            </div>
          ) : (<div className="bg-white rounded-xl shadow p-12 text-center"><div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center"><Icon path={IconPaths.note} size={26}/></div><p className="text-xl text-gray-500">{formatDateTR(selectedDate)} - Kayıt yok</p></div>)}
          <div className="mt-6"><h3 className="text-lg font-bold mb-4">Son Raporlar</h3><div className="space-y-2">{getBusinessReports(selectedBusiness.id).slice(0, 5).map(r => (<button key={r.id} onClick={() => setSelectedDate(r.date)} className={`w-full text-left p-4 rounded-lg ${selectedDate === r.date ? 'bg-gray-100 border-2 border-black' : 'bg-white'}`}><div className="flex justify-between"><span className="font-semibold">{formatDateTR(r.date)}</span><span>{formatMoney(Number(r.credit_card) + Number(r.cash) + Number(r.meal_cards))}</span></div></button>))}</div></div>
        </main>
        
        {/* Add Report Modal */}
        {showAddReport && (<div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto"><div className="rounded-2xl p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto border border-white/60" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}><h3 className="text-xl font-bold mb-4 text-gray-900">Gün Sonu — {selectedBusiness.name}</h3><div className="space-y-4"><div><label className="text-sm font-medium">Tarih</label><div className="text-lg font-bold border-2 rounded-lg px-4 py-2 bg-gray-50">{formatDateTR(reportForm.date)}</div></div>{isRestaurantBusiness(selectedBusiness) && (<div className="border border-gray-300 rounded-xl p-3 bg-gray-50"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-gray-700">Adisyo</span><button onClick={() => fetchAdisyoDay(reportForm.date)} disabled={adisyoLoading} className="bg-black text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-1.5">{adisyoLoading ? 'Getiriliyor…' : (<><Icon path={IconPaths.arrowDown} size={15}/> Adisyo'dan Getir</>)}</button></div>{adisyoError && <p className="text-xs text-red-600 mt-2">{adisyoError}</p>}{adisyoLoading && adisyoProgress && <p className="text-xs text-gray-500 mt-2">{adisyoProgress}</p>}{adisyoPayments.length > 0 && (<div className="mt-3 space-y-1">{adisyoPayments.map((p, i) => (<div key={i} className="flex justify-between items-center text-sm bg-white rounded-lg px-3 py-1.5 border border-gray-200"><span className="text-gray-700">{p.payment_name}{p.is_meal_card && <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">yemek kartı</span>}{p.is_debit && <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">veresiye</span>}</span><span className="font-semibold text-gray-900">{formatMoney(p.amount)}</span></div>))}<div className="flex justify-between pt-1 text-sm"><span className="font-semibold text-gray-600">Adisyo Toplam:</span><span className="font-bold text-gray-900">{formatMoney(adisyoPayments.reduce((s,p)=>s+p.amount,0))}</span></div><p className="text-xs text-gray-400">Aşağıdaki alanlar otomatik dolduruldu. Kontrol edip kaydedebilirsin.</p></div>)}</div>)}<div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium text-gray-600">Kredi Kartı</label><input type="number" value={reportForm.credit_card} onChange={(e) => setReportForm({...reportForm, credit_card: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" placeholder="0" /></div><div><label className="text-sm font-medium text-gray-600">Nakit</label><input type="number" value={reportForm.cash} onChange={(e) => setReportForm({...reportForm, cash: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" placeholder="0" /></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium text-gray-600">Yemek Kartı</label><input type="number" value={reportForm.meal_cards} onChange={(e) => setReportForm({...reportForm, meal_cards: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" placeholder="0" /></div><div><label className="text-sm font-medium text-gray-600">Eldeki Nakit</label><input type="number" value={reportForm.actual_cash} onChange={(e) => setReportForm({...reportForm, actual_cash: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" placeholder="0" /></div></div><div className="border-2 border-red-200 rounded-lg p-4 bg-red-50"><label className="text-sm font-bold text-red-600 block mb-3">Giderler</label><div className="space-y-2 mb-3"><div className="flex gap-2"><input type="text" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition bg-white/70" placeholder="Açıklama" /><input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition bg-white/70" placeholder="Tutar" /><button onClick={handleAddExpense} className="bg-black text-white px-4 py-2 rounded-lg flex items-center justify-center"><Icon path={IconPaths.plus} size={18}/></button></div>{getActiveEmployees().length > 0 && (<select value={newExpense.employee_id} onChange={(e) => setNewExpense({...newExpense, employee_id: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white/70 text-gray-700 focus:border-black focus:outline-none transition"><option value="">Normal gider</option>{getActiveEmployees().map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}</select>)}<label className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer"><input type="checkbox" checked={newExpense.is_external} onChange={(e) => setNewExpense({...newExpense, is_external: e.target.checked})} className="w-4 h-4 accent-black" /><span className="text-sm text-gray-700 font-medium">Dışarıdan gelen (havale) — kasadan düşmez</span></label></div><div className="max-h-48 overflow-y-auto">{expensesList.map(e => (<div key={e.id} className="flex justify-between items-center bg-white p-2 rounded-lg mb-2"><span className="text-sm">{e.description}{e.employee_id && (<span className="ml-2 inline-flex items-center gap-1 text-xs bg-black text-white px-1.5 py-0.5 rounded-full"><Icon path={IconPaths.user} size={10}/>{getEmployeeName(e.employee_id)}</span>)}{e.is_external && (<span className="ml-2 text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded-full">Dışarıdan</span>)}</span><div className="flex items-center gap-2"><span className="text-sm font-semibold text-red-600">{formatMoney(e.amount)}</span><button onClick={() => startEditExpense(e)} className="text-gray-400 hover:text-black" title="Düzenle"><Icon path={IconPaths.edit} size={15}/></button><button onClick={() => handleRemoveExpense(e.id)} className="text-red-400 hover:text-red-600" title="Kaldır"><Icon path={IconPaths.close} size={15}/></button></div></div>))}</div><div className="flex justify-between pt-2 border-t border-red-200"><span className="font-semibold text-red-700">Kasa Gideri:</span><span className="font-bold text-red-700">{formatMoney(getTotalExpenses())}</span></div>{getTotalExternal() > 0 && (<div className="flex justify-between pt-1"><span className="font-semibold text-gray-600">Dışarıdan Gelen:</span><span className="font-bold text-gray-700">{formatMoney(getTotalExternal())}</span></div>)}</div><div><label className="text-sm font-medium text-gray-600">Notlar</label><textarea value={reportForm.notes} onChange={(e) => setReportForm({...reportForm, notes: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" rows={2} /></div></div><div className="flex gap-2 mt-6"><button onClick={() => { setShowAddReport(false); setExpensesList([]); setAdisyoPayments([]); setAdisyoError(''); setAdisyoProgress(''); }} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={() => handleSaveReportClick('add')} className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Kaydet</button></div></div></div>)}
        
        {/* Edit Report Modal */}
        {showEditReport && (<div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto"><div className="rounded-2xl p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto border border-white/60" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}><h3 className="text-xl font-bold mb-4 text-gray-900">Rapor Düzenle</h3><div className="space-y-4">{isRestaurantBusiness(selectedBusiness) && (<div className="border border-gray-300 rounded-xl p-3 bg-gray-50"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-gray-700">Adisyo</span><button onClick={() => fetchAdisyoDay(reportForm.date)} disabled={adisyoLoading} className="bg-black text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-1.5">{adisyoLoading ? 'Getiriliyor…' : (<><Icon path={IconPaths.arrowDown} size={15}/> Adisyo'dan Getir</>)}</button></div>{adisyoError && <p className="text-xs text-red-600 mt-2">{adisyoError}</p>}{adisyoLoading && adisyoProgress && <p className="text-xs text-gray-500 mt-2">{adisyoProgress}</p>}{adisyoPayments.length > 0 && (<div className="mt-3 space-y-1">{adisyoPayments.map((p, i) => (<div key={i} className="flex justify-between items-center text-sm bg-white rounded-lg px-3 py-1.5 border border-gray-200"><span className="text-gray-700">{p.payment_name}{p.is_meal_card && <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">yemek kartı</span>}{p.is_debit && <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">veresiye</span>}</span><span className="font-semibold text-gray-900">{formatMoney(p.amount)}</span></div>))}<div className="flex justify-between pt-1 text-sm"><span className="font-semibold text-gray-600">Adisyo Toplam:</span><span className="font-bold text-gray-900">{formatMoney(adisyoPayments.reduce((s,p)=>s+p.amount,0))}</span></div></div>)}</div>)}<div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium text-gray-600">Kredi Kartı</label><input type="number" value={reportForm.credit_card} onChange={(e) => setReportForm({...reportForm, credit_card: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div><div><label className="text-sm font-medium text-gray-600">Nakit</label><input type="number" value={reportForm.cash} onChange={(e) => setReportForm({...reportForm, cash: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium text-gray-600">Yemek Kartı</label><input type="number" value={reportForm.meal_cards} onChange={(e) => setReportForm({...reportForm, meal_cards: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div><div><label className="text-sm font-medium text-gray-600">Eldeki Nakit</label><input type="number" value={reportForm.actual_cash} onChange={(e) => setReportForm({...reportForm, actual_cash: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div></div><div className="border-2 border-red-200 rounded-lg p-4 bg-red-50"><label className="text-sm font-bold text-red-600 block mb-3">Giderler</label><div className="space-y-2 mb-3"><div className="flex gap-2"><input type="text" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition bg-white/70" placeholder="Açıklama" /><input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition bg-white/70" placeholder="Tutar" /><button onClick={handleAddExpense} className="bg-black text-white px-4 py-2 rounded-lg flex items-center justify-center"><Icon path={IconPaths.plus} size={18}/></button></div>{getActiveEmployees().length > 0 && (<select value={newExpense.employee_id} onChange={(e) => setNewExpense({...newExpense, employee_id: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white/70 text-gray-700 focus:border-black focus:outline-none transition"><option value="">Normal gider</option>{getActiveEmployees().map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}</select>)}<label className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer"><input type="checkbox" checked={newExpense.is_external} onChange={(e) => setNewExpense({...newExpense, is_external: e.target.checked})} className="w-4 h-4 accent-black" /><span className="text-sm text-gray-700 font-medium">Dışarıdan gelen (havale) — kasadan düşmez</span></label></div><div className="max-h-48 overflow-y-auto">{expensesList.map(e => (<div key={e.id} className="flex justify-between items-center bg-white p-2 rounded-lg mb-2"><span className="text-sm">{e.description}{e.employee_id && (<span className="ml-2 inline-flex items-center gap-1 text-xs bg-black text-white px-1.5 py-0.5 rounded-full"><Icon path={IconPaths.user} size={10}/>{getEmployeeName(e.employee_id)}</span>)}{e.is_external && (<span className="ml-2 text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded-full">Dışarıdan</span>)}</span><div className="flex items-center gap-2"><span className="text-sm font-semibold text-red-600">{formatMoney(e.amount)}</span><button onClick={() => startEditExpense(e)} className="text-gray-400 hover:text-black" title="Düzenle"><Icon path={IconPaths.edit} size={15}/></button><button onClick={() => handleRemoveExpense(e.id)} className="text-red-400 hover:text-red-600" title="Kaldır"><Icon path={IconPaths.close} size={15}/></button></div></div>))}</div><div className="flex justify-between pt-2 border-t border-red-200"><span className="font-semibold text-red-700">Kasa Gideri:</span><span className="font-bold text-red-700">{formatMoney(getTotalExpenses())}</span></div>{getTotalExternal() > 0 && (<div className="flex justify-between pt-1"><span className="font-semibold text-gray-600">Dışarıdan Gelen:</span><span className="font-bold text-gray-700">{formatMoney(getTotalExternal())}</span></div>)}</div></div><div className="flex gap-2 mt-6"><button onClick={() => { setShowEditReport(false); setExpensesList([]); setAdisyoPayments([]); setAdisyoError(''); setAdisyoProgress(''); }} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={() => handleSaveReportClick('edit')} className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Güncelle</button></div></div></div>)}
        
        <DeleteConfirmModal />
      </div>
    );
  }

  // TOPTANCI
  if (screen === 'toptanci') {
    const allowedBusinesses = getUserAllowedBusinesses();
    if (!selectedBusiness) {
      return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 50%, #dddde3 100%)' }}>
          <LoadingOverlay />
          <header className="sticky top-0 z-30 border-b border-white/50" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)' }}><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-black p-1 -ml-1 rounded-lg hover:bg-black/5"><Icon path={IconPaths.back} size={22} /></button><h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Icon path={IconPaths.box} size={20} /> Toptancı</h1></div><button onClick={handleLogout} className="inline-flex items-center gap-1.5 bg-black/5 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-black/10"><Icon path={IconPaths.logout} size={15} /> Çıkış</button></div></header>
          <main className="max-w-lg mx-auto px-4 py-8"><div className="space-y-4">{allowedBusinesses.map(b => (<button key={b.id} onClick={() => setSelectedBusiness(b)} className="w-full bg-white p-6 rounded-xl shadow text-left border-l-4 border-black"><p className="text-xl font-bold">{b.name}</p></button>))}</div></main>
        </div>
      );
    }
    const totalDebt = getTotalDebt();
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 50%, #dddde3 100%)' }}>
        <LoadingOverlay />
        <InvoiceModal />
        <header className="sticky top-0 z-30 border-b border-white/50" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)' }}><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => { setSelectedBusiness(null); setSelectedSupplier(null); setSearchQuery(''); }} className="text-black p-1 -ml-1 rounded-lg hover:bg-black/5"><Icon path={IconPaths.back} size={22} /></button><div><h1 className="text-xl font-bold">{selectedBusiness.name}</h1><p className="text-sm text-gray-500">{user?.full_name} {user?.role === 'admin' && <span className="bg-black text-white px-2 rounded text-xs ml-1">Admin</span>}</p></div></div><button onClick={handleLogout} className="inline-flex items-center gap-1.5 bg-black/5 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-black/10"><Icon path={IconPaths.logout} size={15} /> Çıkış</button></div></header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className={`rounded-2xl p-6 text-white mb-6 ${totalDebt > 0 ? 'bg-gradient-to-r from-red-500 to-red-700' : 'bg-black'}`}><p className="text-white/80 text-sm">Toplam {totalDebt > 0 ? 'Borç' : 'Durum'}</p><p className="text-4xl font-bold">{formatMoney(Math.abs(totalDebt))}</p><p className="text-white/80 text-sm mt-2">{getBusinessSuppliers().length} toptancı</p></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6 border border-white/50" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Toptancılar</h2><button onClick={() => setShowAddSupplier(true)} className="bg-black text-white px-3 py-2 rounded-lg text-sm inline-flex items-center gap-1.5"><Icon path={IconPaths.plus} size={15}/> Ekle</button></div>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ara..." className="w-full px-4 py-2 border-2 rounded-lg mb-4" />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredSuppliers().map(s => { const bal = getSupplierBalance(s.id); return (<div key={s.id} onClick={() => setSelectedSupplier(s)} className={`p-4 rounded-lg cursor-pointer ${selectedSupplier?.id === s.id ? 'bg-gray-100 border-2 border-black' : 'bg-gray-50'}`}><div className="flex justify-between"><div><p className="font-semibold">{s.name}</p>{s.phone && <p className="text-sm text-gray-500">{s.phone}</p>}</div><div className="text-right"><p className={`font-bold ${bal > 0 ? 'text-red-600' : bal < 0 ? 'text-gray-900' : 'text-gray-600'}`}>{formatMoney(Math.abs(bal))}</p><p className={`text-xs ${bal > 0 ? 'text-red-500' : bal < 0 ? 'text-gray-900' : 'text-gray-400'}`}>{bal > 0 ? 'Borç' : bal < 0 ? 'Alacak' : 'Eşit'}</p></div></div></div>); })}
                {getFilteredSuppliers().length === 0 && <p className="text-center text-gray-500 py-8">Toptancı yok</p>}
              </div>
            </div>
            <div className="rounded-2xl p-6 border border-white/50" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              {selectedSupplier ? (<>
                <div className="flex justify-between items-start mb-4">
                  <div><h2 className="text-xl font-bold">{selectedSupplier.name}</h2>{selectedSupplier.phone && <p className="text-gray-500">{selectedSupplier.phone}</p>}</div>
                  {user?.role === 'admin' && (
                    <div className="flex gap-1">
                      <button onClick={() => openEditSupplier(selectedSupplier)} className="bg-black/5 text-gray-700 hover:bg-black/10 p-2 rounded-lg"><Icon path={IconPaths.edit} size={15}/></button>
                      <button onClick={() => initiateDelete('supplier', selectedSupplier.id, selectedSupplier.name)} className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg"><Icon path={IconPaths.trash} size={15}/></button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mb-4"><button onClick={() => setShowAddTransaction('ALIM')} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"><Icon path={IconPaths.box} size={16}/> Mal Alımı</button><button onClick={() => setShowAddTransaction('ODEME')} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"><Icon path={IconPaths.wallet} size={16}/> Ödeme</button></div>
                <div className="border-t pt-4"><h3 className="font-semibold mb-3">İşlemler</h3><div className="space-y-2 max-h-80 overflow-y-auto">
                  {transactions.filter(t => t.supplier_id === selectedSupplier.id).map(tx => (
                    <div key={tx.id} className={`p-3 bg-gray-50 rounded-lg border-l-4 ${tx.type === 'ALIM' ? 'border-l-red-500' : 'border-l-green-500'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-semibold flex items-center gap-1.5 ${tx.type === 'ALIM' ? 'text-red-600' : 'text-emerald-600'}`}><Icon path={tx.type === 'ALIM' ? IconPaths.box : IconPaths.wallet} size={15}/>{tx.type === 'ALIM' ? 'Alım' : 'Ödeme'}</p>
                          <p className="text-xs text-gray-500">{formatDateTR(tx.date)} - {formatTimeTR(tx.created_at)}</p>
                          <p className="text-xs text-gray-400">{getPaymentLabel(tx.payment_method)}</p>
                          {tx.description && <p className="text-xs text-gray-400">{tx.description}</p>}
                          <p className="text-xs text-black">{tx.fullName}</p>
                          {tx.invoice_url && (<button onClick={() => setViewInvoice(tx.invoice_url)} className="text-xs text-black mt-1 hover:underline">Faturayı Gör</button>)}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold ${tx.type === 'ALIM' ? 'text-red-600' : 'text-emerald-600'}`}>{tx.type === 'ALIM' ? '+' : '-'}{formatMoney(tx.amount)}</p>
                          {user?.role === 'admin' && (<div className="flex flex-col gap-1"><button onClick={() => openEditTransaction(tx)} className="bg-black/5 text-gray-700 hover:bg-black/10 p-1.5 rounded-lg"><Icon path={IconPaths.edit} size={14}/></button><button onClick={() => initiateDelete('transaction', tx.id, `${formatDateTR(tx.date)} - ${formatMoney(tx.amount)}`)} className="bg-red-50 text-red-500 hover:bg-red-100 p-1.5 rounded-lg"><Icon path={IconPaths.trash} size={14}/></button></div>)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.filter(t => t.supplier_id === selectedSupplier.id).length === 0 && <p className="text-center text-gray-500 py-4">İşlem yok</p>}
                </div></div>
              </>) : (<div className="flex flex-col items-center justify-center h-full text-gray-500 py-20"><p className="text-5xl mb-4"></p><p>Toptancı seçin</p></div>)}
            </div>
          </div>
        </main>
        
        {showAddSupplier && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="rounded-2xl p-6 w-full max-w-md border border-white/60" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}><h3 className="text-xl font-bold mb-4 text-black">Yeni Toptancı</h3><div className="space-y-4"><div><label className="text-sm font-medium">Ad *</label><input type="text" value={supplierForm.name} onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div><div><label className="text-sm font-medium">Telefon</label><input type="text" value={supplierForm.phone} onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div><div><label className="text-sm font-medium">Not</label><textarea value={supplierForm.notes} onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" rows={2} /></div></div><div className="flex gap-2 mt-6"><button onClick={() => setShowAddSupplier(false)} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={handleAddSupplier} className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Ekle</button></div></div></div>)}
        
        {showEditSupplier && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="rounded-2xl p-6 w-full max-w-md border border-white/60" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}><h3 className="text-xl font-bold mb-4 text-gray-900">Toptancı Düzenle</h3><div className="space-y-4"><div><label className="text-sm font-medium">Ad *</label><input type="text" value={supplierForm.name} onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div><div><label className="text-sm font-medium">Telefon</label><input type="text" value={supplierForm.phone} onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div><div><label className="text-sm font-medium">Not</label><textarea value={supplierForm.notes} onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" rows={2} /></div></div><div className="flex gap-2 mt-6"><button onClick={() => { setShowEditSupplier(null); setSupplierForm({ name: '', phone: '', notes: '' }); }} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={handleEditSupplier} className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Güncelle</button></div></div></div>)}
        
        {showAddTransaction && selectedSupplier && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"><div className="rounded-2xl p-6 w-full max-w-md my-8 border border-white/60" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}><h3 className={`text-xl font-bold mb-4 ${showAddTransaction === 'ALIM' ? 'text-red-600' : 'text-gray-900'}`}>{showAddTransaction === 'ALIM' ? 'Mal Alımı' : 'Ödeme'}</h3><div className="space-y-4"><div><label className="text-sm font-medium">Tutar *</label><input type="number" value={transactionForm.amount} onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" placeholder="0" /></div><div><label className="text-sm font-medium">Tarih *</label><input type="date" value={transactionForm.date} onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /><p className="text-sm text-gray-600 mt-1">{formatDateTR(transactionForm.date)}</p></div><div><label className="text-sm font-medium">Ödeme Biçimi</label><select value={transactionForm.payment_method} onChange={(e) => setTransactionForm({...transactionForm, payment_method: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70"><option value="nakit">Nakit</option><option value="kredi_karti">Kredi Kartı</option><option value="cek">Çek</option><option value="senet">Senet</option></select></div><div><label className="text-sm font-medium">Açıklama</label><input type="text" value={transactionForm.description} onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div><div><label className="text-sm font-medium text-gray-600">Fatura Ekle</label><input type="file" accept="image/*,.pdf" onChange={(e) => setTransactionForm({...transactionForm, invoice: e.target.files[0]})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition bg-white/70" />{transactionForm.invoice && <p className="text-xs text-emerald-600 mt-1">{transactionForm.invoice.name}</p>}{uploadingInvoice && <p className="text-xs text-gray-500 mt-1">Yükleniyor...</p>}</div></div><div className="flex gap-2 mt-6"><button onClick={() => setShowAddTransaction(null)} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={handleAddTransaction} disabled={loading || uploadingInvoice} className={`flex-1 text-white py-3 rounded-lg font-semibold ${showAddTransaction === 'ALIM' ? 'bg-red-500' : 'bg-black'}`}>Kaydet</button></div></div></div>)}
        
        {showEditTransaction && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="rounded-2xl p-6 w-full max-w-md border border-white/60" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}><h3 className="text-xl font-bold mb-4 text-gray-900">İşlem Düzenle</h3><div className="space-y-4"><div><label className="text-sm font-medium">Tutar</label><input type="number" value={transactionForm.amount} onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div><div><label className="text-sm font-medium">Ödeme Biçimi</label><select value={transactionForm.payment_method} onChange={(e) => setTransactionForm({...transactionForm, payment_method: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70"><option value="nakit">Nakit</option><option value="kredi_karti">Kredi Kartı</option><option value="cek">Çek</option><option value="senet">Senet</option></select></div><div><label className="text-sm font-medium">Açıklama</label><input type="text" value={transactionForm.description} onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div><div><label className="text-sm font-medium text-gray-600">Yeni Fatura</label><input type="file" accept="image/*,.pdf" onChange={(e) => setTransactionForm({...transactionForm, invoice: e.target.files[0]})} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition bg-white/70" />{showEditTransaction.invoice_url && !transactionForm.invoice && <p className="text-xs text-gray-500 mt-1">Mevcut fatura var</p>}{transactionForm.invoice && <p className="text-xs text-emerald-600 mt-1">{transactionForm.invoice.name}</p>}</div></div><div className="flex gap-2 mt-6"><button onClick={() => setShowEditTransaction(null)} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={handleEditTransaction} disabled={loading || uploadingInvoice} className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Güncelle</button></div></div></div>)}
        
        <DeleteConfirmModal />
      </div>
    );
  }

  // ============ MAAŞ TAKİBİ (sadece admin) ============
  // ============ MAAŞ TAKİBİ (sadece admin) — 12 AY ============
  if (screen === 'maas' && user?.role === 'admin') {
    const sorted = getSortedEmployees();
    const totalDue = employees.reduce((acc, e) => acc + SALARY_PERIOD.reduce((s, p) => s + getSalaryDue(e, p), 0), 0);
    const totalPaid = employees.reduce((acc, e) => acc + SALARY_PERIOD.reduce((s, p) => s + getSalaryPaid(e, p), 0), 0);
    // Vadesi gelmiş (güncel ay ve öncesi) ödenmemiş tutar = şu an gerçek borç
    const totalDueNow = employees.reduce((acc, e) => acc + SALARY_PERIOD.filter(p => isPeriodDue(p, e)).reduce((s, p) => s + getSalaryRemaining(e, p), 0), 0);
    const emp = selectedEmployee ? employees.find(e => e.id === selectedEmployee.id) : null;
    const detailPeriod = SALARY_PERIOD.find(x => x.key === salaryDetailKey) || SALARY_PERIOD[0];

    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8ec 50%, #dddde3 100%)' }}>
        <LoadingOverlay />
        <header className="sticky top-0 z-30 border-b border-white/50" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px) saturate(150%)', WebkitBackdropFilter: 'blur(16px) saturate(150%)' }}><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => { setScreen('menu'); setSelectedEmployee(null); }} className="text-black p-1 -ml-1 rounded-lg hover:bg-black/5"><Icon path={IconPaths.back} size={22} /></button><h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Icon path={IconPaths.receipt} size={20} /> Maaş Takibi</h1><span className="bg-black text-white text-xs px-2 py-1 rounded-full">Sadece Admin</span></div><button onClick={handleLogout} className="inline-flex items-center gap-1.5 bg-black/5 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-black/10"><Icon path={IconPaths.logout} size={15} /> Çıkış</button></div></header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-2 text-sm text-gray-500">{SALARY_PERIOD[0].label} – {SALARY_PERIOD[11].label} (12 ay)</div>

          {/* Özet kartları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-2xl p-4 border border-white/50 shadow"><p className="text-sm text-gray-500">Personel</p><p className="text-2xl font-bold text-gray-900">{employees.length}</p></div>
            <div className="rounded-2xl p-4 border border-white/50 shadow"><p className="text-sm text-gray-500">Toplam Maaş Yükü (12 ay)</p><p className="text-2xl font-bold text-gray-900">{formatMoney(totalDue)}</p></div>
            <div className="rounded-2xl p-4 border border-white/50 shadow"><p className="text-sm text-gray-500">Ödenen</p><p className="text-2xl font-bold text-gray-900">{formatMoney(totalPaid)}</p></div>
            <div className="rounded-2xl p-4 border border-white/50 shadow" style={{ borderLeft: '4px solid #dc2626' }}><p className="text-sm text-gray-500">Vadesi Gelen Kalan</p><p className="text-2xl font-bold text-red-600">{formatMoney(totalDueNow)}</p></div>
          </div>

          {/* Kontroller */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <span className="text-sm text-gray-600">Sırala:</span>
            <select value={salarySortBy} onChange={(e) => setSalarySortBy(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white/70 focus:border-black focus:outline-none">
              <option value="rem-desc">Kalan: büyükten küçüğe</option>
              <option value="rem-asc">Kalan: küçükten büyüğe</option>
              <option value="salary-desc">Maaş: büyükten küçüğe</option>
              <option value="salary-asc">Maaş: küçükten büyüğe</option>
              <option value="name">İsme göre (A-Z)</option>
              <option value="manual">Ekleme sırası</option>
            </select>
            <span className="text-sm text-gray-600 ml-1">Dönem:</span>
            <select value={salarySortKey} onChange={(e) => setSalarySortKey(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white/70 focus:border-black focus:outline-none">
              {SALARY_PERIOD.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            {employees.some(e => e.end_key) && (() => {
              const refKey = (SALARY_PERIOD.find(x => x.key === salarySortKey) || SALARY_PERIOD[0]).key;
              const hidden = employees.filter(e => e.end_key && refKey > e.end_key).length;
              return hidden > 0 ? <span className="text-xs text-gray-400">({hidden} çıkışlı personel bu dönemde gizli)</span> : null;
            })()}
            <button onClick={() => { setShowAddEmployee(true); setError(''); }} className="ml-auto bg-black text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 inline-flex items-center gap-1.5"><Icon path={IconPaths.plus} size={15}/> Personel Ekle</button>
          </div>

          {/* Maaş tablosu — 12 ay, yatay kaydırılır */}
          <div className="rounded-2xl border border-white/50 overflow-x-auto" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <table className="text-sm" style={{ minWidth: '900px' }}>
              <thead>
                <tr className="border-b-2 border-black text-gray-900">
                  <th className="text-left p-3 font-semibold sticky left-0 bg-white z-10" style={{ minWidth: '150px' }}>Personel</th>
                  {SALARY_PERIOD.map(p => <th key={p.key} className="text-right p-3 font-semibold whitespace-nowrap">{p.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {sorted.map(e => (
                  <tr key={e.id} onClick={() => { setSelectedEmployee(e); }} className={`border-b cursor-pointer hover:bg-gray-50 ${emp && emp.id === e.id ? 'bg-gray-100' : ''}`}>
                    <td className="p-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">{getEmpInitials(e.name)}</span>
                        <span className="font-medium text-gray-800 whitespace-nowrap">{e.name}{e.end_key ? <span className="text-xs text-gray-400"> (çıkış)</span> : ''}</span>
                      </div>
                    </td>
                    {SALARY_PERIOD.map(p => {
                      const due = getSalaryDue(e, p);
                      const rem = getSalaryRemaining(e, p);
                      const dueNow = isPeriodDue(p, e);
                      return (
                        <td key={p.key} className={`p-3 text-right whitespace-nowrap ${dueNow ? '' : 'bg-gray-50/40'}`}>
                          {due === 0 ? <span className="text-gray-300">—</span> : rem === 0 ? (
                            <span className="text-emerald-600"><Icon path={IconPaths.check} size={16}/></span>
                          ) : (
                            <span className="inline-flex items-center gap-1 justify-end">
                              <span className={`font-semibold ${dueNow ? 'text-red-600' : 'text-gray-400'}`}>{formatMoney(rem)}</span>
                              <button onClick={(ev) => { ev.stopPropagation(); setEditSalaryModal({ employee: e, period: p }); setEditSalaryValue(String(due)); setError(''); }} className="text-gray-400 hover:text-black" title="Maaşı düzelt"><Icon path={IconPaths.edit} size={15}/></button>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {employees.length === 0 && <tr><td colSpan={13} className="text-center text-gray-400 py-10">Henüz personel eklenmedi.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2"> Tabloyu yana kaydırarak 12 ayın tümünü görebilirsiniz.</p>

          {/* Personel detay paneli */}
          {emp && (() => {
            const due = getSalaryDue(emp, detailPeriod);
            const pd = getSalaryPaid(emp, detailPeriod);
            const rem = getSalaryRemaining(emp, detailPeriod);
            const pct = due > 0 ? Math.min(100, Math.round((pd / due) * 100)) : 0;
            const empPayments = salaryPayments.filter(p => p.employee_id === emp.id && p.year === detailPeriod.year && p.month === detailPeriod.month);
            return (
              <div className="rounded-2xl border border-white/50 border-t-4 border-t-gray-300 p-5 mt-6" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-semibold">{getEmpInitials(emp.name)}</span>
                    <div>
                      {editingName && editingName.id === emp.id ? (
                        <div className="flex items-center gap-1.5">
                          <input autoFocus value={editingName.value} onChange={(e) => setEditingName({ ...editingName, value: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameEmployee(); if (e.key === 'Escape') setEditingName(null); }} className="font-bold text-gray-900 border border-gray-300 rounded-lg px-2 py-1 bg-white/80 focus:border-black focus:outline-none" />
                          <button onClick={handleRenameEmployee} className="text-emerald-600 hover:text-emerald-700" title="Kaydet"><Icon path={IconPaths.check} size={17}/></button>
                          <button onClick={() => setEditingName(null)} className="text-gray-400 hover:text-gray-600" title="İptal"><Icon path={IconPaths.close} size={17}/></button>
                        </div>
                      ) : (
                        <p className="font-bold text-gray-800 flex items-center gap-1.5">{emp.name}<button onClick={() => setEditingName({ id: emp.id, value: emp.name })} className="text-gray-400 hover:text-black" title="İsmi düzelt"><Icon path={IconPaths.edit} size={13}/></button></p>
                      )}
                      <p className="text-xs text-gray-500">Aylık baz maaş: {formatMoney(emp.base_salary)}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-gray-500">Maaş günü:</span>
                        <select value={getPaymentDay(emp)} onChange={async (ev) => { const d = Number(ev.target.value); await supabase.from('employees').update({ payment_day: d }).eq('id', emp.id); await loadEmployees(); setSelectedEmployee({ ...emp, payment_day: d }); }} className="text-xs border border-gray-200 rounded-lg px-1.5 py-0.5 bg-white/70 focus:border-black focus:outline-none">
                          {Array.from({length:31},(_,i)=>i+1).map(d => <option key={d} value={d}>Her ayın {d}'i</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setTerminateModal(emp); setError(''); }} className="border border-red-500 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 transition">İşten çıkar / Sil</button>
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
                  {SALARY_PERIOD.map(p => (
                    <button key={p.key} onClick={() => setSalaryDetailKey(p.key)} className={`px-3 py-1 rounded-lg text-xs border whitespace-nowrap ${p.key === salaryDetailKey ? 'border-black text-black bg-gray-100' : 'border-gray-200 text-gray-500'}`}>{p.label}</button>
                  ))}
                </div>

                {due === 0 ? (
                  <p className="text-sm text-gray-400">Bu ay bu personel için maaş tahakkuk etmiyor.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Maaş</p><p className="text-lg font-bold text-gray-900">{formatMoney(due)}</p></div>
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Ödenen</p><p className="text-lg font-bold text-gray-900">{formatMoney(pd)}</p></div>
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Kalan</p><p className={`text-lg font-bold ${rem > 0 && isPeriodDue(detailPeriod, selectedEmployee) ? 'text-red-600' : 'text-gray-900'}`}>{formatMoney(rem)}</p>{rem > 0 && !isPeriodDue(detailPeriod, selectedEmployee) && <span className="text-[10px] text-gray-400">vakti gelmedi</span>}</div>
                    </div>
                    <div className="h-2 rounded-full bg-red-100 overflow-hidden mb-4"><div className="h-full bg-black" style={{ width: pct + '%' }}></div></div>

                    <div className="flex gap-2 flex-wrap mb-3">
                      <input type="number" value={salaryPaymentForm.amount} onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, amount: e.target.value })} placeholder="Ödenen tutar (₺)" className="flex-1 min-w-[130px] px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white/70 focus:border-black focus:outline-none" />
                      <input type="text" value={salaryPaymentForm.note} onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, note: e.target.value })} placeholder="Açıklama (ops.)" className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white/70 focus:border-black focus:outline-none" />
                      <button onClick={handleAddSalaryPayment} disabled={loading} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Ödeme Ekle</button>
                    </div>
                    {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}

                    <p className="text-xs text-gray-600 font-semibold mb-1">Yapılan ödemeler</p>
                    {empPayments.length === 0 ? (
                      <p className="text-sm text-gray-400">Bu ay için henüz ödeme girilmedi.</p>
                    ) : empPayments.map(p => (
                      <div key={p.id} className="flex justify-between items-center py-2 border-b text-sm">
                        <span className="text-gray-600">{p.note || 'Ödeme'}<span className="text-gray-400 text-xs block">{formatDateTimeTR(p.created_at)}{p.fullName ? ` · ${p.fullName}` : ''}{p.updated_at ? ' · (düzeltildi)' : ''}</span></span>
                        <span className="flex items-center gap-2"><span className="font-semibold text-gray-900">{formatMoney(p.amount)}</span>{p.expense_id ? (<span className="text-[10px] text-gray-400" title="Bu ödeme gün sonu giderinden geldi. Değişiklik için ilgili gün sonu raporunu düzenleyin.">gün sonu</span>) : (<><button onClick={() => { setEditPaymentModal(p); setEditPaymentForm({ amount: String(p.amount), note: p.note || '' }); setError(''); }} className="text-gray-400 hover:text-black" title="Düzelt"><Icon path={IconPaths.edit} size={15}/></button><button onClick={() => handleDeleteSalaryPayment(p.id)} className="text-red-500 hover:text-red-700" title="Sil"><Icon path={IconPaths.close} size={15}/></button></>)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })()}
        </main>

        {/* Personel ekleme modalı */}
        {showAddEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="rounded-2xl p-6 w-full max-w-md border border-white/60" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Yeni Personel</h3>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Ad Soyad *</label><input type="text" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div>
                <div><label className="text-sm font-medium">Aylık Maaş (₺) *</label><input type="number" value={employeeForm.salary} onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" placeholder="0" /></div>
                <div><label className="text-sm font-medium">Başlangıç ayı</label><select value={employeeForm.startKey} onChange={(e) => setEmployeeForm({ ...employeeForm, startKey: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70">{SALARY_PERIOD.map(p => <option key={p.key} value={p.key}>{p.label}'den itibaren</option>)}</select></div>
                <div><label className="text-sm font-medium">Maaş günü (ayın kaçı)</label><select value={employeeForm.payment_day} onChange={(e) => setEmployeeForm({ ...employeeForm, payment_day: Number(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70">{Array.from({length:31},(_,i)=>i+1).map(d => <option key={d} value={d}>Her ayın {d}'i</option>)}</select><p className="text-xs text-gray-500 mt-1">Bu güne kadar o ay "vakti gelmedi" olur; öncesinde avans girebilirsin.</p></div>
              </div>
              {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm mt-3">{error}</div>}
              <div className="flex gap-2 mt-6"><button onClick={() => { setShowAddEmployee(false); setError(''); }} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={handleAddEmployee} disabled={loading} className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Ekle</button></div>
            </div>
          </div>
        )}

        {/* Maaş düzeltme modalı */}
        {editSalaryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="rounded-2xl p-6 w-full max-w-md border border-white/60" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <h3 className="text-xl font-bold mb-1 text-gray-900">Maaş Düzelt</h3>
              <p className="text-sm text-gray-500 mb-4">{editSalaryModal.employee.name} · {editSalaryModal.period.label} ve sonraki aylara uygulanır</p>
              <input type="number" value={editSalaryValue} onChange={(e) => setEditSalaryValue(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" />
              {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm mt-3">{error}</div>}
              <div className="flex gap-2 mt-6"><button onClick={() => { setEditSalaryModal(null); setError(''); }} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={handleEditSalary} disabled={loading} className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Güncelle</button></div>
            </div>
          </div>
        )}

        {/* Ödeme düzeltme modalı */}
        {editPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="rounded-2xl p-6 w-full max-w-md border border-white/60" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <h3 className="text-xl font-bold mb-1 text-gray-900">Ödemeyi Düzelt</h3>
              <p className="text-sm text-gray-500 mb-4">Girildiği tarih: {formatDateTimeTR(editPaymentModal.created_at)}</p>
              <div className="space-y-3">
                <div><label className="text-sm font-medium">Tutar (₺)</label><input type="number" value={editPaymentForm.amount} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" /></div>
                <div><label className="text-sm font-medium">Açıklama</label><input type="text" value={editPaymentForm.note} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, note: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition bg-white/70" placeholder="Açıklama (ops.)" /></div>
              </div>
              {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm mt-3">{error}</div>}
              <div className="flex gap-2 mt-6"><button onClick={() => { setEditPaymentModal(null); setError(''); }} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">İptal</button><button onClick={handleUpdateSalaryPayment} disabled={loading} className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Kaydet</button></div>
            </div>
          </div>
        )}

        {/* İşten çıkarma / silme modalı */}
        {terminateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto border border-white/60" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              <h3 className="text-xl font-bold mb-1 text-gray-900">İşten Çıkar / Sil</h3>
              <p className="text-sm text-gray-500 mb-4">{terminateModal.name}</p>
              {terminateModal.end_key ? (
                <div className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 mb-4">
                  <p className="text-sm text-gray-700">Bu personelin çıkışı <span className="font-semibold">{(SALARY_PERIOD.find(p => p.key === terminateModal.end_key) || {}).label || terminateModal.end_key}</span> olarak işaretli.</p>
                  <p className="text-xs text-gray-500 mt-1">Çıkışı durdurursan personel tekrar aktif olur ve listede görünmeye devam eder.</p>
                </div>
              ) : null}
              <p className="text-sm text-gray-700 mb-2">{terminateModal.end_key ? 'Çıkış ayını değiştir:' : 'Çıkış ayını seç (o aydan sonrası maaş tahakkuku durur):'}</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {SALARY_PERIOD.map(p => <button key={p.key} onClick={() => handleTerminateEmployee(p.key)} className={`px-3 py-1.5 rounded-lg text-sm border whitespace-nowrap ${terminateModal.end_key === p.key ? 'border-red-600 text-red-600 bg-red-50' : 'border-gray-200 hover:border-red-600 hover:text-red-600'}`}>{p.label}</button>)}
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-sm mb-3">{error}</div>}
              {terminateModal.end_key && (
                <button onClick={handleReactivateEmployee} disabled={loading} className="w-full mb-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2"><Icon path={IconPaths.check} size={16}/> Çıkışı Durdur (tekrar aktifleştir)</button>
              )}
              <div className="flex gap-2 mt-2"><button onClick={() => { setTerminateModal(null); setError(''); }} className="flex-1 bg-black/5 text-gray-700 py-3 rounded-xl font-semibold hover:bg-black/10 transition">Kapat</button><button onClick={handleDeleteEmployee} disabled={loading} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition">Tamamen Sil</button></div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}
