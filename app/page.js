'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  const [expensesList, setExpensesList] = useState([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', employee_id: '' });
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
  const [employeeForm, setEmployeeForm] = useState({ name: '', salary: '', startKey: SALARY_PERIOD[0].key });
  const [salaryPaymentForm, setSalaryPaymentForm] = useState({ amount: '', note: '' });
  const [editPaymentModal, setEditPaymentModal] = useState(null); // düzeltilecek ödeme
  const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', note: '' });
  const [editSalaryModal, setEditSalaryModal] = useState(null); // { employee, period }
  const [editSalaryValue, setEditSalaryValue] = useState('');
  const [terminateModal, setTerminateModal] = useState(null);

  function getTurkeyDate() {
    const now = new Date();
    const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    return turkeyTime.toISOString().split('T')[0];
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
        .select('*, users(full_name), expenses(*)')
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
    setExpensesList([...expensesList, { id: 'temp_'+Date.now(), description: newExpense.description, amount: parseFloat(newExpense.amount), employee_id: newExpense.employee_id || null }]);
    setNewExpense({ description: '', amount: '', employee_id: '' });
  };

  const handleRemoveExpense = (id) => setExpensesList(expensesList.filter(e => e.id !== id));
  const getTotalExpenses = () => expensesList.reduce((s, e) => s + e.amount, 0);

  // ---- GİDER -> MAAŞ ENTEGRASYONU ----
  // Aktif personeller (işten çıkmamış olanlar)
  const getActiveEmployees = () => employees.filter(e => !e.end_key || e.end_key >= currentMonthKey);
  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || '';

  // FIFO: ödeme en eski tamamlanmamış aydan düşer.
  // Vadesi gelmiş (geçmiş + bu ay) aylar sırayla doldurulur; hepsi tamamsa kalan bu aya "fazla" olarak yazılır.
  const allocateSalaryFIFO = (empId, amount, extraPaid = {}) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp || !(amount > 0)) return [];
    let left = amount;
    const parts = [];
    for (const p of SALARY_PERIOD) {
      if (!isPeriodDue(p)) break;
      if (left <= 0.001) break;
      const extra = extraPaid[`${empId}|${p.key}`] || 0;
      const rem = Math.max(0, getSalaryRemaining(emp, p) - extra);
      if (rem > 0) {
        const take = Math.min(rem, left);
        parts.push({ year: p.year, month: p.month, amount: Math.round(take * 1000) / 1000 });
        left -= take;
      }
    }
    if (left > 0.001) {
      const cur = SALARY_PERIOD.find(p => p.key === currentMonthKey) || SALARY_PERIOD[SALARY_PERIOD.length - 1];
      const ex = parts.find(x => x.year === cur.year && x.month === cur.month);
      if (ex) ex.amount = Math.round((ex.amount + left) * 1000) / 1000;
      else parts.push({ year: cur.year, month: cur.month, amount: Math.round(left * 1000) / 1000 });
    }
    return parts;
  };

  // Kaydedilen giderlerden maaş ödemeleri oluştur (expense_id ile bağlı)
  const createSalaryPaymentsForExpenses = async (exps) => {
    const rows = [];
    const extraPaid = {}; // aynı kayıtta aynı personele birden çok gider girilirse birikimli düş
    for (const exp of (exps || [])) {
      if (!exp.employee_id) continue;
      const parts = allocateSalaryFIFO(exp.employee_id, Number(exp.amount), extraPaid);
      for (const part of parts) {
        const k = `${exp.employee_id}|${periodKey(part.year, part.month)}`;
        extraPaid[k] = (extraPaid[k] || 0) + part.amount;
        rows.push({
          employee_id: exp.employee_id,
          year: part.year,
          month: part.month,
          amount: part.amount,
          note: `🍽️ Gün sonu gideri${exp.description ? ' - ' + exp.description : ''}`,
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
  // Bir dönemin vadesi gelmiş mi? (güncel ay ve öncesi = gelmiş)
  const isPeriodDue = (period) => period.key <= currentMonthKey;

  const getSortedEmployees = () => {
    const arr = [...employees];
    const p = SALARY_PERIOD.find(x => x.key === salarySortKey) || SALARY_PERIOD[0];
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
      const { error } = await supabase.from('employees').insert({
        name,
        base_salary: salary,
        start_key: startKey,
        end_key: null,
        sort_order: maxOrder + 1,
        created_by: user.id,
      });
      if (error) throw error;
      await loadEmployees();
      setShowAddEmployee(false);
      setEmployeeForm({ name: '', salary: '', startKey: SALARY_PERIOD[0].key });
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
    setShowExpenseConfirm(type);
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

      let expenses = [];
      if (reportData && expensesList.length > 0) {
        const expensesData = expensesList.map(e => ({ daily_report_id: reportData.id, description: e.description, amount: e.amount, employee_id: e.employee_id || null }));
        const { data: expData } = await supabase.from('expenses').insert(expensesData).select();
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
      await supabase.from('daily_reports').update({
        credit_card: parseFloat(reportForm.credit_card) || 0,
        cash: parseFloat(reportForm.cash) || 0,
        meal_cards: parseFloat(reportForm.meal_cards) || 0,
        actual_cash: parseFloat(reportForm.actual_cash) || 0,
        notes: reportForm.notes
      }).eq('id', currentReport.id);

      // Eski giderlere bağlı maaş ödemelerini temizle, sonra giderleri sil
      await deleteSalaryPaymentsForReport(currentReport.id);
      await supabase.from('expenses').delete().eq('daily_report_id', currentReport.id);
      
      let newExpenses = [];
      if (expensesList.length > 0) {
        const expensesData = expensesList.map(e => ({ daily_report_id: currentReport.id, description: e.description, amount: e.amount, employee_id: e.employee_id || null }));
        const { data: expData } = await supabase.from('expenses').insert(expensesData).select();
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
    }

    setReportForm({ date: getTurkeyDate(), credit_card: '', cash: '', meal_cards: '', actual_cash: '', notes: '' });
    setExpensesList([]);
    setShowEditReport(false);
    setLoading(false);
  };

  const openEditReport = (report) => {
    setReportForm({ date: report.date, credit_card: report.credit_card?.toString() || '', cash: report.cash?.toString() || '', meal_cards: report.meal_cards?.toString() || '', actual_cash: report.actual_cash?.toString() || '', notes: report.notes || '' });
    setExpensesList(report.expenses?.map(e => ({ ...e })) || []);
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

  const getPaymentLabel = (m) => ({ nakit: '💵 Nakit', kredi_karti: '💳 Kredi Kartı', cek: '📄 Çek', senet: '📃 Senet' }[m] || m);
  const getBusinessReports = (bid) => dailyReports.filter(r => r.business_id === bid);
  const getReportByDate = (bid, date) => dailyReports.find(r => r.business_id === bid && r.date === date);
  const changeDate = (days) => { const d = new Date(selectedDate); d.setDate(d.getDate() + days); setSelectedDate(d.toISOString().split('T')[0]); };
  const getExpTotal = (exps) => (exps || []).reduce((s, e) => s + Number(e.amount), 0);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-red-700">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-700 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const LoadingOverlay = () => loading ? (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[200]">
      <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
        <div className="w-6 h-6 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-700 font-medium">Yükleniyor...</span>
      </div>
    </div>
  ) : null;

  const DeleteConfirmModal = () => {
    if (!deleteConfirm.show) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          {deleteConfirm.step === 1 ? (
            <><div className="text-center mb-6"><p className="text-5xl mb-4">⚠️</p><h3 className="text-xl font-bold text-red-600 mb-2">Silme Onayı (1/2)</h3><p className="text-gray-600">"{deleteConfirm.name}" silinecek.</p></div><div className="flex gap-2"><button onClick={cancelDelete} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={confirmDeleteStep1} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold">Devam</button></div></>
          ) : (
            <><div className="text-center mb-6"><p className="text-5xl mb-4">🚨</p><h3 className="text-xl font-bold text-red-600 mb-2">Son Onay (2/2)</h3><p className="text-gray-600">"{deleteConfirm.name}" kalıcı silinecek!</p></div><div className="flex gap-2"><button onClick={cancelDelete} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">Vazgeç</button><button onClick={confirmDeleteStep2} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold">Evet, Sil</button></div></>
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
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <p className="text-5xl mb-4">📝</p>
            <h3 className="text-xl font-bold text-red-600 mb-2">Gider Onayı</h3>
            <p className="text-gray-600">Gider girdiğinize emin misiniz?</p>
            {expensesList.length === 0 ? (
              <p className="text-red-500 mt-2 font-semibold">⚠️ Hiç gider girilmedi!</p>
            ) : (
              <p className="text-gray-900 mt-2 font-semibold">✅ {expensesList.length} gider girildi - Toplam: {formatMoney(getTotalExpenses())}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowExpenseConfirm(null)} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">Geri Dön</button>
            <button onClick={() => showExpenseConfirm === 'add' ? handleAddReport() : handleEditReport()} className="flex-1 bg-black text-white py-3 rounded-lg font-semibold">Evet, Kaydet</button>
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
            <h3 className="text-lg font-bold">📄 Fatura</h3>
            <button onClick={() => setViewInvoice(null)} className="text-gray-500 text-2xl">×</button>
          </div>
          <img src={viewInvoice} alt="Fatura" className="max-w-full rounded-lg" />
          <a href={viewInvoice} target="_blank" rel="noopener noreferrer" className="block mt-4 text-center bg-red-600 text-white py-2 rounded-lg">Tam Boyut Aç</a>
        </div>
      </div>
    );
  };

  // LOGIN
  if (screen === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-red-700 p-4">
        <LoadingOverlay />
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-red-600 mb-2">🏪 Ege Takip Sistemi</h1>
          <p className="text-center text-gray-500 mb-6">Giriş Yapın</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
              <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="Kullanıcı adınız" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none" placeholder="Şifreniz" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer py-2">
              <input type="checkbox" checked={loginForm.rememberMe} onChange={(e) => setLoginForm({...loginForm, rememberMe: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500" />
              <span className="text-gray-700 font-medium">Beni Hatırla</span>
            </label>
            {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
            <button onClick={handleLogin} disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition">Giriş Yap</button>
          </div>
        </div>
      </div>
    );
  }

  // MENU
  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-red-700 p-4">
        <LoadingOverlay />
        <div className="max-w-lg mx-auto pt-12">
          <div className="text-center text-white mb-8">
            <h1 className="text-3xl font-bold mb-2">🏪 Ege Takip Sistemi</h1>
            <p className="text-xl text-white/90">Hoş geldin, {user?.full_name}</p>
            {user?.role === 'admin' && <span className="inline-block mt-2 bg-white/20 px-3 py-1 rounded-full text-sm">👑 Admin</span>}
          </div>
          <div className="space-y-4">
            <button onClick={() => setScreen('toptanci')} className="w-full bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-red-500"><span className="text-4xl">📦</span><div className="text-left"><p className="text-xl font-bold text-gray-800">Toptancı Ödemeleri</p><p className="text-gray-500">Mal alımı ve ödeme takibi</p></div></button>
            <button onClick={() => setScreen('gunsonu')} className="w-full bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-black"><span className="text-4xl">📊</span><div className="text-left"><p className="text-xl font-bold text-gray-800">Gün Sonu</p><p className="text-gray-500">Günlük ciro ve kasa raporu</p></div></button>
            {user?.role === 'admin' && (<>
              <button onClick={() => setScreen('kasa')} className="w-full bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-black"><span className="text-4xl">💰</span><div className="text-left"><p className="text-xl font-bold text-gray-800">Kasa Hareketleri</p><p className="text-gray-500">Ödeme ve gelen para takibi</p></div></button>
              <button onClick={() => setScreen('ozet')} className="w-full bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-black"><span className="text-4xl">📈</span><div className="text-left"><p className="text-xl font-bold text-gray-800">Günlük Özet</p><p className="text-gray-500">Tüm işletmelerin toplamı</p></div></button>
              <button onClick={() => setScreen('maas')} className="w-full bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-red-600"><span className="text-4xl">🧾</span><div className="text-left"><p className="text-xl font-bold text-gray-800">Maaş Takibi</p><p className="text-gray-500">Personel maaşları ve ödemeler</p></div></button>
            </>)}
          </div>
          <button onClick={handleLogout} className="w-full mt-8 text-white/80 hover:text-white py-2 transition">Çıkış Yap</button>
        </div>
      </div>
    );
  }

  // ÖZET
  if (screen === 'ozet' && user?.role === 'admin') {
    const summary = getDailySummary(selectedDate);
    return (
      <div className="min-h-screen bg-gray-100">
        <LoadingOverlay />
        <header className="bg-white shadow border-b-4 border-black"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-2xl text-black">←</button><h1 className="text-xl font-bold text-gray-800">📈 Günlük Özet</h1></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
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
            <div className="bg-gradient-to-r from-black to-red-700 rounded-2xl p-6 text-white">
              <p className="text-white/80 text-sm">Toplam Ciro</p>
              <p className="text-3xl font-bold">{formatMoney(summary.total)}</p>
            </div>
            <div className="bg-gradient-to-r from-black to-red-700 rounded-2xl p-6 text-white">
              <p className="text-white/80 text-sm">Net Ciro (Giderler Düşülmüş)</p>
              <p className="text-3xl font-bold">{formatMoney(summary.netTotal)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-300 text-center">
              <p className="text-black font-semibold text-xs">💳 Kredi Kartı</p>
              <p className="text-lg font-bold">{formatMoney(summary.totalCreditCard)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-300 text-center">
              <p className="text-gray-900 font-semibold text-xs">💵 Nakit</p>
              <p className="text-lg font-bold">{formatMoney(summary.totalCash)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 text-center">
              <p className="text-red-600 font-semibold text-xs">🎫 Yemek Kartı</p>
              <p className="text-lg font-bold">{formatMoney(summary.totalMealCards)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 text-center">
              <p className="text-red-600 font-semibold text-xs">📉 Toplam Gider</p>
              <p className="text-lg font-bold">{formatMoney(summary.totalExpenses)}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6">
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
                <div>💳 {formatMoney(b.credit_card)}</div>
                <div>💵 {formatMoney(b.cash)}</div>
                <div>🎫 {formatMoney(b.meal_cards)}</div>
                <div className="text-red-600">📉 {formatMoney(b.expenses)}</div>
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
      <div className="min-h-screen bg-gray-100">
        <LoadingOverlay />
        <header className="bg-white shadow border-b-4 border-black"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-2xl text-black">←</button><h1 className="text-xl font-bold text-gray-800">💰 Kasa Hareketleri</h1></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
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
            <button onClick={() => { setCashMovementForm({...cashMovementForm, date: selectedDate}); setShowAddCashMovement('OUT'); }} className="bg-red-500 text-white p-4 rounded-xl font-semibold text-lg">+ Ödeme Yap</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-300 text-center"><p className="text-gray-900 font-semibold">Gelen</p><p className="text-2xl font-bold text-gray-900">{formatMoney(totalIn)}</p></div>
            <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 text-center"><p className="text-red-600 font-semibold">Çıkan</p><p className="text-2xl font-bold text-red-700">{formatMoney(totalOut)}</p></div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Hareketler</h3>
            <div className="space-y-2">
              {todayMovements.map(m => (
                <div key={m.id} className={`p-4 rounded-lg border-l-4 ${m.type === 'IN' ? 'bg-gray-50 border-l-green-500' : 'bg-red-50 border-l-red-500'}`}>
                  <div className="flex justify-between items-start">
                    <div><p className={`font-semibold ${m.type === 'IN' ? 'text-gray-900' : 'text-red-600'}`}>{m.type === 'IN' ? '📥 Gelen' : '📤 Ödeme'}</p><p className="text-sm text-gray-600">{m.description}</p><p className="text-xs text-gray-500">{formatTimeTR(m.created_at)} - {m.fullName}</p></div>
                    <div className="flex items-center gap-2"><p className={`text-xl font-bold ${m.type === 'IN' ? 'text-gray-900' : 'text-red-600'}`}>{m.type === 'IN' ? '+' : '-'}{formatMoney(m.amount)}</p><button onClick={() => initiateDelete('cashMovement', m.id, m.description)} className="bg-red-100 text-red-500 p-1 rounded">🗑️</button></div>
                  </div>
                </div>
              ))}
              {todayMovements.length === 0 && <p className="text-center text-gray-500 py-8">Hareket yok</p>}
            </div>
          </div>
        </main>
        {showAddCashMovement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className={`text-xl font-bold mb-4 ${showAddCashMovement === 'IN' ? 'text-gray-900' : 'text-red-600'}`}>{showAddCashMovement === 'IN' ? '📥 Gelen Para' : '📤 Ödeme Yap'}</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Tutar *</label><input type="number" value={cashMovementForm.amount} onChange={(e) => setCashMovementForm({...cashMovementForm, amount: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div>
                <div><label className="block text-sm font-medium mb-1">Açıklama *</label><input type="text" value={cashMovementForm.description} onChange={(e) => setCashMovementForm({...cashMovementForm, description: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Tarih</label><div className="text-lg font-bold border-2 rounded-lg px-4 py-2 bg-gray-50">{formatDateTR(cashMovementForm.date)}</div></div>
              </div>
              <div className="flex gap-2 mt-6"><button onClick={() => setShowAddCashMovement(null)} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleAddCashMovement} className={`flex-1 text-white py-3 rounded-lg font-semibold ${showAddCashMovement === 'IN' ? 'bg-black' : 'bg-red-500'}`}>Kaydet</button></div>
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
        <div className="min-h-screen bg-gray-100">
          <LoadingOverlay />
          <header className="bg-white shadow border-b-4 border-black"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-2xl text-black">←</button><h1 className="text-xl font-bold text-gray-800">📊 Gün Sonu</h1></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
          <main className="max-w-lg mx-auto px-4 py-8"><div className="space-y-4">{allowedBusinesses.map(b => (<button key={b.id} onClick={() => setSelectedBusiness(b)} className="w-full bg-white p-6 rounded-xl shadow text-left border-l-4 border-black"><p className="text-xl font-bold">{b.name}</p><p className="text-sm text-gray-500">{getBusinessReports(b.id).length} rapor</p></button>))}</div></main>
        </div>
      );
    }
    const currentReport = getReportByDate(selectedBusiness.id, selectedDate);
    const isToday = selectedDate === getTurkeyDate();
    return (
      <div className="min-h-screen bg-gray-100">
        <LoadingOverlay />
        <ExpenseConfirmModal />
        <header className="bg-white shadow border-b-4 border-black"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setSelectedBusiness(null)} className="text-2xl text-black">←</button><h1 className="text-xl font-bold text-gray-800">📊 {selectedBusiness.name}</h1></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => changeDate(-1)} className="bg-gray-100 text-black px-4 py-2 rounded-lg font-semibold">←</button>
              <div className="text-center"><div className="text-2xl font-bold border-2 rounded-lg px-6 py-3 bg-gray-50">{formatDateTR(selectedDate)}</div><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-2 text-sm border rounded-lg px-3 py-1" /></div>
              <button onClick={() => changeDate(1)} className="bg-gray-100 text-black px-4 py-2 rounded-lg font-semibold">→</button>
            </div>
            <div className="flex gap-2 mt-4 justify-center"><button onClick={() => setSelectedDate(getTurkeyDate())} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm">Bugün</button><button onClick={() => setExpenseSearch({ ...expenseSearch, open: !expenseSearch.open })} className="bg-black text-white px-4 py-2 rounded-lg text-sm">🔍 Gider Ara</button></div>
          </div>

          {expenseSearch.open && (() => {
            const results = getExpenseSearchResults();
            const total = results.reduce((s, e) => s + Number(e.amount), 0);
            const hasFilter = expenseSearch.query.trim() || expenseSearch.from || expenseSearch.to;
            return (
              <div className="bg-white rounded-xl shadow p-4 mb-6 border-2 border-black">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-gray-800">🔍 Gider Ara</p>
                  <button onClick={() => setExpenseSearch({ open: false, query: '', from: '', to: '' })} className="text-gray-400 text-sm">✕ Kapat</button>
                </div>
                <input type="text" value={expenseSearch.query} onChange={(e) => setExpenseSearch({ ...expenseSearch, query: e.target.value })} className="w-full px-4 py-2 border-2 rounded-lg mb-2" placeholder="Ara: Emre, Ambalajcı, personel adı, açıklama..." />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><label className="text-xs text-gray-500">Başlangıç (ops.)</label><input type="date" value={expenseSearch.from} onChange={(e) => setExpenseSearch({ ...expenseSearch, from: e.target.value })} className="w-full px-3 py-2 border-2 rounded-lg text-sm" /></div>
                  <div><label className="text-xs text-gray-500">Bitiş (ops.)</label><input type="date" value={expenseSearch.to} onChange={(e) => setExpenseSearch({ ...expenseSearch, to: e.target.value })} className="w-full px-3 py-2 border-2 rounded-lg text-sm" /></div>
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
                            {e.employee_id && (<span className="ml-2 text-xs bg-black text-white px-1.5 py-0.5 rounded-full">👤 {getEmployeeName(e.employee_id)}</span>)}
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
          {(isToday || user?.role === 'admin') && !currentReport && (<button onClick={() => { setReportForm({...reportForm, date: selectedDate}); setExpensesList([]); setShowAddReport(true); }} className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-semibold mb-6">+ Rapor Ekle</button>)}
          {currentReport ? (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div><p className="text-2xl font-bold">{formatDateTR(currentReport.date)}</p><p className="text-sm text-gray-500">Ciro: {formatMoney(Number(currentReport.credit_card) + Number(currentReport.cash) + Number(currentReport.meal_cards))}</p><p className="text-xs text-black mt-1">👤 {currentReport.fullName} - {formatTimeTR(currentReport.created_at)}</p></div>
                <div className="flex items-center gap-2">
                  <div className={`px-4 py-2 rounded-lg text-sm font-bold ${calcCashDiff(currentReport) >= 0 ? 'bg-gray-100 text-gray-900' : 'bg-red-100 text-red-700'}`}>Fark: {formatMoney(calcCashDiff(currentReport))}</div>
                  {user?.role === 'admin' && (<div className="flex gap-1"><button onClick={() => openEditReport(currentReport)} className="bg-gray-100 text-black px-3 py-2 rounded-lg text-sm">✏️</button><button onClick={() => initiateDelete('report', currentReport.id, `${formatDateTR(currentReport.date)} raporu`)} className="bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm">🗑️</button></div>)}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-300"><p className="text-black font-semibold text-xs">💳 Kredi Kartı</p><p className="text-lg font-bold">{formatMoney(currentReport.credit_card)}</p></div>
                <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-300"><p className="text-gray-900 font-semibold text-xs">💵 Nakit</p><p className="text-lg font-bold">{formatMoney(currentReport.cash)}</p></div>
                <div className="bg-red-50 p-3 rounded-lg border-2 border-red-200"><p className="text-red-600 font-semibold text-xs">🎫 Yemek Kartı</p><p className="text-lg font-bold">{formatMoney(currentReport.meal_cards)}</p></div>
                <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-300"><p className="text-black font-semibold text-xs">💰 Eldeki Nakit</p><p className="text-lg font-bold">{formatMoney(currentReport.actual_cash)}</p></div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200 mb-4"><div className="flex justify-between mb-2"><p className="text-red-600 font-semibold">📉 Giderler</p><p className="font-bold text-red-700">{formatMoney(getExpTotal(currentReport.expenses))}</p></div>{(currentReport.expenses || []).length > 0 ? (currentReport.expenses.map((e, i) => (<div key={i} className="flex justify-between text-sm bg-white p-2 rounded mb-1"><span>{e.description}{e.employee_id && (<span className="ml-2 text-xs bg-black text-white px-1.5 py-0.5 rounded-full">👤 {getEmployeeName(e.employee_id)}</span>)}</span><span className="text-red-600 font-semibold">{formatMoney(e.amount)}</span></div>))) : (<p className="text-sm text-gray-500 text-center py-2">Gider girilmedi</p>)}</div>
            </div>
          ) : (<div className="bg-white rounded-xl shadow p-12 text-center"><p className="text-5xl mb-4">📋</p><p className="text-xl text-gray-500">{formatDateTR(selectedDate)} - Kayıt yok</p></div>)}
          <div className="mt-6"><h3 className="text-lg font-bold mb-4">Son Raporlar</h3><div className="space-y-2">{getBusinessReports(selectedBusiness.id).slice(0, 5).map(r => (<button key={r.id} onClick={() => setSelectedDate(r.date)} className={`w-full text-left p-4 rounded-lg ${selectedDate === r.date ? 'bg-gray-100 border-2 border-black' : 'bg-white'}`}><div className="flex justify-between"><span className="font-semibold">{formatDateTR(r.date)}</span><span>{formatMoney(Number(r.credit_card) + Number(r.cash) + Number(r.meal_cards))}</span></div></button>))}</div></div>
        </main>
        
        {/* Add Report Modal */}
        {showAddReport && (<div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto"><div className="bg-white rounded-xl p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto"><h3 className="text-xl font-bold mb-4 text-red-600">📊 Gün Sonu - {selectedBusiness.name}</h3><div className="space-y-4"><div><label className="text-sm font-medium">Tarih</label><div className="text-lg font-bold border-2 rounded-lg px-4 py-2 bg-gray-50">{formatDateTR(reportForm.date)}</div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">💳 Kredi Kartı</label><input type="number" value={reportForm.credit_card} onChange={(e) => setReportForm({...reportForm, credit_card: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div><div><label className="text-sm font-medium">💵 Nakit</label><input type="number" value={reportForm.cash} onChange={(e) => setReportForm({...reportForm, cash: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">🎫 Yemek Kartı</label><input type="number" value={reportForm.meal_cards} onChange={(e) => setReportForm({...reportForm, meal_cards: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div><div><label className="text-sm font-medium">💰 Eldeki Nakit</label><input type="number" value={reportForm.actual_cash} onChange={(e) => setReportForm({...reportForm, actual_cash: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div></div><div className="border-2 border-red-200 rounded-lg p-4 bg-red-50"><label className="text-sm font-bold text-red-600 block mb-3">📉 Giderler</label><div className="space-y-2 mb-3"><div className="flex gap-2"><input type="text" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="flex-1 px-3 py-2 border-2 rounded-lg text-sm" placeholder="Açıklama" /><input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-24 px-3 py-2 border-2 rounded-lg text-sm" placeholder="Tutar" /><button onClick={handleAddExpense} className="bg-red-500 text-white px-4 py-2 rounded-lg">+</button></div>{getActiveEmployees().length > 0 && (<select value={newExpense.employee_id} onChange={(e) => setNewExpense({...newExpense, employee_id: e.target.value})} className="w-full px-3 py-2 border-2 rounded-lg text-sm bg-white text-gray-700"><option value="">Normal gider (personel maaşı değil)</option>{getActiveEmployees().map(emp => (<option key={emp.id} value={emp.id}>👤 {emp.name} — maaşından düşülsün</option>))}</select>)}</div><div className="max-h-48 overflow-y-auto">{expensesList.map(e => (<div key={e.id} className="flex justify-between items-center bg-white p-2 rounded-lg mb-2"><span className="text-sm">{e.description}{e.employee_id && (<span className="ml-2 text-xs bg-black text-white px-1.5 py-0.5 rounded-full">👤 {getEmployeeName(e.employee_id)}</span>)}</span><div className="flex items-center gap-2"><span className="text-sm font-semibold text-red-600">{formatMoney(e.amount)}</span><button onClick={() => handleRemoveExpense(e.id)} className="text-red-400">✕</button></div></div>))}</div><div className="flex justify-between pt-2 border-t border-red-200"><span className="font-semibold text-red-700">Toplam:</span><span className="font-bold text-red-700">{formatMoney(getTotalExpenses())}</span></div></div><div><label className="text-sm font-medium">📝 Notlar</label><textarea value={reportForm.notes} onChange={(e) => setReportForm({...reportForm, notes: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" rows={2} /></div></div><div className="flex gap-2 mt-6"><button onClick={() => { setShowAddReport(false); setExpensesList([]); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={() => handleSaveReportClick('add')} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold">Kaydet</button></div></div></div>)}
        
        {/* Edit Report Modal */}
        {showEditReport && (<div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto"><div className="bg-white rounded-xl p-6 w-full max-w-lg my-8 max-h-[90vh] overflow-y-auto"><h3 className="text-xl font-bold mb-4 text-black">✏️ Rapor Düzenle</h3><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">💳 Kredi Kartı</label><input type="number" value={reportForm.credit_card} onChange={(e) => setReportForm({...reportForm, credit_card: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">💵 Nakit</label><input type="number" value={reportForm.cash} onChange={(e) => setReportForm({...reportForm, cash: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">🎫 Yemek Kartı</label><input type="number" value={reportForm.meal_cards} onChange={(e) => setReportForm({...reportForm, meal_cards: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">💰 Eldeki Nakit</label><input type="number" value={reportForm.actual_cash} onChange={(e) => setReportForm({...reportForm, actual_cash: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div></div><div className="border-2 border-red-200 rounded-lg p-4 bg-red-50"><label className="text-sm font-bold text-red-600 block mb-3">📉 Giderler</label><div className="space-y-2 mb-3"><div className="flex gap-2"><input type="text" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="flex-1 px-3 py-2 border-2 rounded-lg text-sm" placeholder="Açıklama" /><input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-24 px-3 py-2 border-2 rounded-lg text-sm" placeholder="Tutar" /><button onClick={handleAddExpense} className="bg-red-500 text-white px-4 py-2 rounded-lg">+</button></div>{getActiveEmployees().length > 0 && (<select value={newExpense.employee_id} onChange={(e) => setNewExpense({...newExpense, employee_id: e.target.value})} className="w-full px-3 py-2 border-2 rounded-lg text-sm bg-white text-gray-700"><option value="">Normal gider (personel maaşı değil)</option>{getActiveEmployees().map(emp => (<option key={emp.id} value={emp.id}>👤 {emp.name} — maaşından düşülsün</option>))}</select>)}</div><div className="max-h-48 overflow-y-auto">{expensesList.map(e => (<div key={e.id} className="flex justify-between items-center bg-white p-2 rounded-lg mb-2"><span className="text-sm">{e.description}{e.employee_id && (<span className="ml-2 text-xs bg-black text-white px-1.5 py-0.5 rounded-full">👤 {getEmployeeName(e.employee_id)}</span>)}</span><div className="flex items-center gap-2"><span className="text-sm font-semibold text-red-600">{formatMoney(e.amount)}</span><button onClick={() => handleRemoveExpense(e.id)} className="text-red-400">✕</button></div></div>))}</div><div className="flex justify-between pt-2 border-t border-red-200"><span className="font-semibold text-red-700">Toplam:</span><span className="font-bold text-red-700">{formatMoney(getTotalExpenses())}</span></div></div></div><div className="flex gap-2 mt-6"><button onClick={() => { setShowEditReport(false); setExpensesList([]); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={() => handleSaveReportClick('edit')} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold">Güncelle</button></div></div></div>)}
        
        <DeleteConfirmModal />
      </div>
    );
  }

  // TOPTANCI
  if (screen === 'toptanci') {
    const allowedBusinesses = getUserAllowedBusinesses();
    if (!selectedBusiness) {
      return (
        <div className="min-h-screen bg-gray-100">
          <LoadingOverlay />
          <header className="bg-white shadow border-b-4 border-red-500"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-2xl text-black">←</button><h1 className="text-xl font-bold text-gray-800">📦 Toptancı</h1></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
          <main className="max-w-lg mx-auto px-4 py-8"><div className="space-y-4">{allowedBusinesses.map(b => (<button key={b.id} onClick={() => setSelectedBusiness(b)} className="w-full bg-white p-6 rounded-xl shadow text-left border-l-4 border-red-500"><p className="text-xl font-bold">{b.name}</p></button>))}</div></main>
        </div>
      );
    }
    const totalDebt = getTotalDebt();
    return (
      <div className="min-h-screen bg-gray-100">
        <LoadingOverlay />
        <InvoiceModal />
        <header className="bg-white shadow border-b-4 border-red-500"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => { setSelectedBusiness(null); setSelectedSupplier(null); setSearchQuery(''); }} className="text-2xl text-black">←</button><div><h1 className="text-xl font-bold">{selectedBusiness.name}</h1><p className="text-sm text-gray-500">{user?.full_name} {user?.role === 'admin' && <span className="bg-red-100 text-red-700 px-2 rounded text-xs ml-1">Admin</span>}</p></div></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className={`rounded-2xl p-6 text-white mb-6 ${totalDebt > 0 ? 'bg-gradient-to-r from-red-500 to-red-700' : 'bg-gradient-to-r from-black to-red-700'}`}><p className="text-white/80 text-sm">Toplam {totalDebt > 0 ? 'Borç' : 'Durum'}</p><p className="text-4xl font-bold">{formatMoney(Math.abs(totalDebt))}</p><p className="text-white/80 text-sm mt-2">{getBusinessSuppliers().length} toptancı</p></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Toptancılar</h2><button onClick={() => setShowAddSupplier(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">+ Ekle</button></div>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Ara..." className="w-full px-4 py-2 border-2 rounded-lg mb-4" />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredSuppliers().map(s => { const bal = getSupplierBalance(s.id); return (<div key={s.id} onClick={() => setSelectedSupplier(s)} className={`p-4 rounded-lg cursor-pointer ${selectedSupplier?.id === s.id ? 'bg-gray-100 border-2 border-black' : 'bg-gray-50'}`}><div className="flex justify-between"><div><p className="font-semibold">{s.name}</p>{s.phone && <p className="text-sm text-gray-500">{s.phone}</p>}</div><div className="text-right"><p className={`font-bold ${bal > 0 ? 'text-red-600' : bal < 0 ? 'text-gray-900' : 'text-gray-600'}`}>{formatMoney(Math.abs(bal))}</p><p className={`text-xs ${bal > 0 ? 'text-red-500' : bal < 0 ? 'text-gray-900' : 'text-gray-400'}`}>{bal > 0 ? 'Borç' : bal < 0 ? 'Alacak' : 'Eşit'}</p></div></div></div>); })}
                {getFilteredSuppliers().length === 0 && <p className="text-center text-gray-500 py-8">Toptancı yok</p>}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              {selectedSupplier ? (<>
                <div className="flex justify-between items-start mb-4">
                  <div><h2 className="text-xl font-bold">{selectedSupplier.name}</h2>{selectedSupplier.phone && <p className="text-gray-500">{selectedSupplier.phone}</p>}</div>
                  {user?.role === 'admin' && (
                    <div className="flex gap-1">
                      <button onClick={() => openEditSupplier(selectedSupplier)} className="bg-gray-100 text-black px-3 py-1 rounded-lg text-sm">✏️</button>
                      <button onClick={() => initiateDelete('supplier', selectedSupplier.id, selectedSupplier.name)} className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm">🗑️</button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mb-4"><button onClick={() => setShowAddTransaction('ALIM')} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold">+ Mal Alımı</button><button onClick={() => setShowAddTransaction('ODEME')} className="flex-1 bg-black text-white py-3 rounded-lg font-semibold">+ Ödeme</button></div>
                <div className="border-t pt-4"><h3 className="font-semibold mb-3">İşlemler</h3><div className="space-y-2 max-h-80 overflow-y-auto">
                  {transactions.filter(t => t.supplier_id === selectedSupplier.id).map(tx => (
                    <div key={tx.id} className={`p-3 bg-gray-50 rounded-lg border-l-4 ${tx.type === 'ALIM' ? 'border-l-red-500' : 'border-l-green-500'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-semibold ${tx.type === 'ALIM' ? 'text-red-600' : 'text-gray-900'}`}>{tx.type === 'ALIM' ? '📦 Alım' : '💰 Ödeme'}</p>
                          <p className="text-xs text-gray-500">{formatDateTR(tx.date)} - {formatTimeTR(tx.created_at)}</p>
                          <p className="text-xs text-gray-400">{getPaymentLabel(tx.payment_method)}</p>
                          {tx.description && <p className="text-xs text-gray-400">{tx.description}</p>}
                          <p className="text-xs text-black">👤 {tx.fullName}</p>
                          {tx.invoice_url && (<button onClick={() => setViewInvoice(tx.invoice_url)} className="text-xs text-black mt-1 hover:underline">📄 Faturayı Gör</button>)}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold ${tx.type === 'ALIM' ? 'text-red-600' : 'text-gray-900'}`}>{tx.type === 'ALIM' ? '+' : '-'}{formatMoney(tx.amount)}</p>
                          {user?.role === 'admin' && (<div className="flex flex-col gap-1"><button onClick={() => openEditTransaction(tx)} className="bg-gray-100 text-black p-1 rounded text-xs">✏️</button><button onClick={() => initiateDelete('transaction', tx.id, `${formatDateTR(tx.date)} - ${formatMoney(tx.amount)}`)} className="bg-red-100 text-red-500 p-1 rounded text-xs">🗑️</button></div>)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.filter(t => t.supplier_id === selectedSupplier.id).length === 0 && <p className="text-center text-gray-500 py-4">İşlem yok</p>}
                </div></div>
              </>) : (<div className="flex flex-col items-center justify-center h-full text-gray-500 py-20"><p className="text-5xl mb-4">👈</p><p>Toptancı seçin</p></div>)}
            </div>
          </div>
        </main>
        
        {showAddSupplier && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="text-xl font-bold mb-4 text-black">Yeni Toptancı</h3><div className="space-y-4"><div><label className="text-sm font-medium">Ad *</label><input type="text" value={supplierForm.name} onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">Telefon</label><input type="text" value={supplierForm.phone} onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">Not</label><textarea value={supplierForm.notes} onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" rows={2} /></div></div><div className="flex gap-2 mt-6"><button onClick={() => setShowAddSupplier(false)} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleAddSupplier} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold">Ekle</button></div></div></div>)}
        
        {showEditSupplier && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="text-xl font-bold mb-4 text-black">✏️ Toptancı Düzenle</h3><div className="space-y-4"><div><label className="text-sm font-medium">Ad *</label><input type="text" value={supplierForm.name} onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">Telefon</label><input type="text" value={supplierForm.phone} onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">Not</label><textarea value={supplierForm.notes} onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" rows={2} /></div></div><div className="flex gap-2 mt-6"><button onClick={() => { setShowEditSupplier(null); setSupplierForm({ name: '', phone: '', notes: '' }); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleEditSupplier} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold">Güncelle</button></div></div></div>)}
        
        {showAddTransaction && selectedSupplier && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"><div className="bg-white rounded-xl p-6 w-full max-w-md my-8"><h3 className={`text-xl font-bold mb-4 ${showAddTransaction === 'ALIM' ? 'text-red-600' : 'text-gray-900'}`}>{showAddTransaction === 'ALIM' ? '📦 Mal Alımı' : '💰 Ödeme'}</h3><div className="space-y-4"><div><label className="text-sm font-medium">Tutar *</label><input type="number" value={transactionForm.amount} onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div><div><label className="text-sm font-medium">Tarih *</label><input type="date" value={transactionForm.date} onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /><p className="text-sm text-gray-600 mt-1">{formatDateTR(transactionForm.date)}</p></div><div><label className="text-sm font-medium">Ödeme Biçimi</label><select value={transactionForm.payment_method} onChange={(e) => setTransactionForm({...transactionForm, payment_method: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg"><option value="nakit">💵 Nakit</option><option value="kredi_karti">💳 Kredi Kartı</option><option value="cek">📄 Çek</option><option value="senet">📃 Senet</option></select></div><div><label className="text-sm font-medium">Açıklama</label><input type="text" value={transactionForm.description} onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">📄 Fatura Ekle</label><input type="file" accept="image/*,.pdf" onChange={(e) => setTransactionForm({...transactionForm, invoice: e.target.files[0]})} className="w-full px-4 py-2 border-2 rounded-lg text-sm" />{transactionForm.invoice && <p className="text-xs text-gray-900 mt-1">✅ {transactionForm.invoice.name}</p>}{uploadingInvoice && <p className="text-xs text-black mt-1">⏳ Yükleniyor...</p>}</div></div><div className="flex gap-2 mt-6"><button onClick={() => setShowAddTransaction(null)} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleAddTransaction} disabled={loading || uploadingInvoice} className={`flex-1 text-white py-3 rounded-lg font-semibold ${showAddTransaction === 'ALIM' ? 'bg-red-500' : 'bg-black'}`}>Kaydet</button></div></div></div>)}
        
        {showEditTransaction && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="text-xl font-bold mb-4 text-black">✏️ İşlem Düzenle</h3><div className="space-y-4"><div><label className="text-sm font-medium">Tutar</label><input type="number" value={transactionForm.amount} onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">Ödeme Biçimi</label><select value={transactionForm.payment_method} onChange={(e) => setTransactionForm({...transactionForm, payment_method: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg"><option value="nakit">💵 Nakit</option><option value="kredi_karti">💳 Kredi Kartı</option><option value="cek">📄 Çek</option><option value="senet">📃 Senet</option></select></div><div><label className="text-sm font-medium">Açıklama</label><input type="text" value={transactionForm.description} onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">📄 Yeni Fatura</label><input type="file" accept="image/*,.pdf" onChange={(e) => setTransactionForm({...transactionForm, invoice: e.target.files[0]})} className="w-full px-4 py-2 border-2 rounded-lg text-sm" />{showEditTransaction.invoice_url && !transactionForm.invoice && <p className="text-xs text-black mt-1">📄 Mevcut fatura var</p>}{transactionForm.invoice && <p className="text-xs text-gray-900 mt-1">✅ {transactionForm.invoice.name}</p>}</div></div><div className="flex gap-2 mt-6"><button onClick={() => setShowEditTransaction(null)} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleEditTransaction} disabled={loading || uploadingInvoice} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold">Güncelle</button></div></div></div>)}
        
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
    const totalDueNow = employees.reduce((acc, e) => acc + SALARY_PERIOD.filter(isPeriodDue).reduce((s, p) => s + getSalaryRemaining(e, p), 0), 0);
    const emp = selectedEmployee ? employees.find(e => e.id === selectedEmployee.id) : null;
    const detailPeriod = SALARY_PERIOD.find(x => x.key === salaryDetailKey) || SALARY_PERIOD[0];

    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingOverlay />
        <header className="bg-white shadow border-b-4 border-red-600"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => { setScreen('menu'); setSelectedEmployee(null); }} className="text-2xl text-black">←</button><h1 className="text-xl font-bold text-gray-800">🧾 Maaş Takibi</h1><span className="bg-black text-white text-xs px-2 py-1 rounded-full">Sadece Admin</span></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-2 text-sm text-gray-500">{SALARY_PERIOD[0].label} – {SALARY_PERIOD[11].label} (12 ay)</div>

          {/* Özet kartları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 shadow"><p className="text-sm text-gray-500">Personel</p><p className="text-2xl font-bold text-gray-900">{employees.length}</p></div>
            <div className="bg-white rounded-xl p-4 shadow"><p className="text-sm text-gray-500">Toplam Maaş Yükü (12 ay)</p><p className="text-2xl font-bold text-gray-900">{formatMoney(totalDue)}</p></div>
            <div className="bg-white rounded-xl p-4 shadow"><p className="text-sm text-gray-500">Ödenen</p><p className="text-2xl font-bold text-gray-900">{formatMoney(totalPaid)}</p></div>
            <div className="bg-white rounded-xl p-4 shadow border-l-4 border-red-600"><p className="text-sm text-gray-500">Vadesi Gelen Kalan</p><p className="text-2xl font-bold text-red-600">{formatMoney(totalDueNow)}</p></div>
          </div>

          {/* Kontroller */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <span className="text-sm text-gray-600">Sırala:</span>
            <select value={salarySortBy} onChange={(e) => setSalarySortBy(e.target.value)} className="px-3 py-2 border-2 rounded-lg text-sm">
              <option value="rem-desc">Kalan: büyükten küçüğe</option>
              <option value="rem-asc">Kalan: küçükten büyüğe</option>
              <option value="salary-desc">Maaş: büyükten küçüğe</option>
              <option value="salary-asc">Maaş: küçükten büyüğe</option>
              <option value="name">İsme göre (A-Z)</option>
              <option value="manual">Ekleme sırası</option>
            </select>
            <select value={salarySortKey} onChange={(e) => setSalarySortKey(e.target.value)} className="px-3 py-2 border-2 rounded-lg text-sm">
              {SALARY_PERIOD.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <button onClick={() => { setShowAddEmployee(true); setError(''); }} className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">+ Personel Ekle</button>
          </div>

          {/* Maaş tablosu — 12 ay, yatay kaydırılır */}
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="text-sm" style={{ minWidth: '900px' }}>
              <thead>
                <tr className="border-b-2 border-red-600 text-gray-600">
                  <th className="text-left p-3 font-semibold sticky left-0 bg-white z-10" style={{ minWidth: '150px' }}>Personel</th>
                  {SALARY_PERIOD.map(p => <th key={p.key} className="text-right p-3 font-semibold whitespace-nowrap">{p.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {sorted.map(e => (
                  <tr key={e.id} onClick={() => { setSelectedEmployee(e); }} className={`border-b cursor-pointer hover:bg-gray-50 ${emp && emp.id === e.id ? 'bg-gray-100' : ''}`}>
                    <td className="p-3 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">{getEmpInitials(e.name)}</span>
                        <span className="font-medium text-gray-800 whitespace-nowrap">{e.name}{e.end_key ? <span className="text-xs text-gray-400"> (çıkış)</span> : ''}</span>
                      </div>
                    </td>
                    {SALARY_PERIOD.map(p => {
                      const due = getSalaryDue(e, p);
                      const rem = getSalaryRemaining(e, p);
                      const dueNow = isPeriodDue(p);
                      return (
                        <td key={p.key} className={`p-3 text-right whitespace-nowrap ${dueNow ? '' : 'bg-gray-50/40'}`}>
                          {due === 0 ? <span className="text-gray-300">—</span> : rem === 0 ? (
                            <span className="text-gray-900 font-semibold">✓</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 justify-end">
                              <span className={`font-semibold ${dueNow ? 'text-red-600' : 'text-gray-400'}`}>{formatMoney(rem)}</span>
                              <button onClick={(ev) => { ev.stopPropagation(); setEditSalaryModal({ employee: e, period: p }); setEditSalaryValue(String(due)); setError(''); }} className="text-gray-400 hover:text-black" title="Maaşı düzelt">✏️</button>
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
          <p className="text-xs text-gray-400 mt-2">↔ Tabloyu yana kaydırarak 12 ayın tümünü görebilirsiniz.</p>

          {/* Personel detay paneli */}
          {emp && (() => {
            const due = getSalaryDue(emp, detailPeriod);
            const pd = getSalaryPaid(emp, detailPeriod);
            const rem = getSalaryRemaining(emp, detailPeriod);
            const pct = due > 0 ? Math.min(100, Math.round((pd / due) * 100)) : 0;
            const empPayments = salaryPayments.filter(p => p.employee_id === emp.id && p.year === detailPeriod.year && p.month === detailPeriod.month);
            return (
              <div className="bg-white rounded-xl shadow border-t-4 border-red-600 p-5 mt-6">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-semibold">{getEmpInitials(emp.name)}</span>
                    <div>
                      <p className="font-bold text-gray-800">{emp.name}</p>
                      <p className="text-xs text-gray-500">Aylık baz maaş: {formatMoney(emp.base_salary)}</p>
                    </div>
                  </div>
                  <button onClick={() => { setTerminateModal(emp); setError(''); }} className="border-2 border-red-600 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold">İşten çıkar / Sil</button>
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
                  {SALARY_PERIOD.map(p => (
                    <button key={p.key} onClick={() => setSalaryDetailKey(p.key)} className={`px-3 py-1 rounded-lg text-xs border-2 whitespace-nowrap ${p.key === salaryDetailKey ? 'border-red-600 text-red-600 bg-red-50' : 'border-gray-200 text-gray-500'}`}>{p.label}</button>
                  ))}
                </div>

                {due === 0 ? (
                  <p className="text-sm text-gray-400">Bu ay bu personel için maaş tahakkuk etmiyor.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Maaş</p><p className="text-lg font-bold text-gray-900">{formatMoney(due)}</p></div>
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Ödenen</p><p className="text-lg font-bold text-gray-900">{formatMoney(pd)}</p></div>
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Kalan</p><p className={`text-lg font-bold ${rem > 0 && isPeriodDue(detailPeriod) ? 'text-red-600' : 'text-gray-900'}`}>{formatMoney(rem)}</p>{rem > 0 && !isPeriodDue(detailPeriod) && <span className="text-[10px] text-gray-400">vakti gelmedi</span>}</div>
                    </div>
                    <div className="h-2 rounded-full bg-red-100 overflow-hidden mb-4"><div className="h-full bg-black" style={{ width: pct + '%' }}></div></div>

                    <div className="flex gap-2 flex-wrap mb-3">
                      <input type="number" value={salaryPaymentForm.amount} onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, amount: e.target.value })} placeholder="Ödenen tutar (₺)" className="flex-1 min-w-[130px] px-3 py-2 border-2 rounded-lg text-sm" />
                      <input type="text" value={salaryPaymentForm.note} onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, note: e.target.value })} placeholder="Açıklama (ops.)" className="flex-1 min-w-[120px] px-3 py-2 border-2 rounded-lg text-sm" />
                      <button onClick={handleAddSalaryPayment} disabled={loading} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Ödeme Ekle</button>
                    </div>
                    {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}

                    <p className="text-xs text-gray-600 font-semibold mb-1">Yapılan ödemeler</p>
                    {empPayments.length === 0 ? (
                      <p className="text-sm text-gray-400">Bu ay için henüz ödeme girilmedi.</p>
                    ) : empPayments.map(p => (
                      <div key={p.id} className="flex justify-between items-center py-2 border-b text-sm">
                        <span className="text-gray-600">{p.note || 'Ödeme'}<span className="text-gray-400 text-xs block">{formatDateTimeTR(p.created_at)}{p.fullName ? ` · ${p.fullName}` : ''}{p.updated_at ? ' · (düzeltildi)' : ''}</span></span>
                        <span className="flex items-center gap-2"><span className="font-semibold text-gray-900">{formatMoney(p.amount)}</span>{p.expense_id ? (<span className="text-[10px] text-gray-400" title="Bu ödeme gün sonu giderinden geldi. Değişiklik için ilgili gün sonu raporunu düzenleyin.">🍽️ gün sonu</span>) : (<><button onClick={() => { setEditPaymentModal(p); setEditPaymentForm({ amount: String(p.amount), note: p.note || '' }); setError(''); }} className="text-gray-400 hover:text-black" title="Düzelt">✏️</button><button onClick={() => handleDeleteSalaryPayment(p.id)} className="text-red-600" title="Sil">✕</button></>)}</span>
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
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-red-600">🧾 Yeni Personel</h3>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Ad Soyad *</label><input type="text" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} className="w-full px-4 py-2 border-2 rounded-lg" /></div>
                <div><label className="text-sm font-medium">Aylık Maaş (₺) *</label><input type="number" value={employeeForm.salary} onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div>
                <div><label className="text-sm font-medium">Başlangıç ayı</label><select value={employeeForm.startKey} onChange={(e) => setEmployeeForm({ ...employeeForm, startKey: e.target.value })} className="w-full px-4 py-2 border-2 rounded-lg">{SALARY_PERIOD.map(p => <option key={p.key} value={p.key}>{p.label}'den itibaren</option>)}</select></div>
              </div>
              {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm mt-3">{error}</div>}
              <div className="flex gap-2 mt-6"><button onClick={() => { setShowAddEmployee(false); setError(''); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleAddEmployee} disabled={loading} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold">Ekle</button></div>
            </div>
          </div>
        )}

        {/* Maaş düzeltme modalı */}
        {editSalaryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-1 text-black">✏️ Maaş Düzelt</h3>
              <p className="text-sm text-gray-500 mb-4">{editSalaryModal.employee.name} · {editSalaryModal.period.label} ve sonraki aylara uygulanır</p>
              <input type="number" value={editSalaryValue} onChange={(e) => setEditSalaryValue(e.target.value)} className="w-full px-4 py-2 border-2 rounded-lg" />
              {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm mt-3">{error}</div>}
              <div className="flex gap-2 mt-6"><button onClick={() => { setEditSalaryModal(null); setError(''); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleEditSalary} disabled={loading} className="flex-1 bg-black text-white py-3 rounded-lg font-semibold">Güncelle</button></div>
            </div>
          </div>
        )}

        {/* Ödeme düzeltme modalı */}
        {editPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-1 text-black">✏️ Ödemeyi Düzelt</h3>
              <p className="text-sm text-gray-500 mb-4">Girildiği tarih: {formatDateTimeTR(editPaymentModal.created_at)}</p>
              <div className="space-y-3">
                <div><label className="text-sm font-medium">Tutar (₺)</label><input type="number" value={editPaymentForm.amount} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })} className="w-full px-4 py-2 border-2 rounded-lg" /></div>
                <div><label className="text-sm font-medium">Açıklama</label><input type="text" value={editPaymentForm.note} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, note: e.target.value })} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="Açıklama (ops.)" /></div>
              </div>
              {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm mt-3">{error}</div>}
              <div className="flex gap-2 mt-6"><button onClick={() => { setEditPaymentModal(null); setError(''); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleUpdateSalaryPayment} disabled={loading} className="flex-1 bg-black text-white py-3 rounded-lg font-semibold">Kaydet</button></div>
            </div>
          </div>
        )}

        {/* İşten çıkarma / silme modalı */}
        {terminateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-1 text-red-600">İşten Çıkar / Sil</h3>
              <p className="text-sm text-gray-500 mb-4">{terminateModal.name}</p>
              <p className="text-sm text-gray-700 mb-2">Çıkış ayını seç (o aydan sonrası maaş tahakkuku durur):</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {SALARY_PERIOD.map(p => <button key={p.key} onClick={() => handleTerminateEmployee(p.key)} className="px-3 py-1.5 rounded-lg text-sm border-2 border-gray-200 hover:border-red-600 hover:text-red-600 whitespace-nowrap">{p.label}</button>)}
              </div>
              {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
              <div className="flex gap-2 mt-2"><button onClick={() => { setTerminateModal(null); setError(''); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleDeleteEmployee} disabled={loading} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold">Tamamen Sil</button></div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}
