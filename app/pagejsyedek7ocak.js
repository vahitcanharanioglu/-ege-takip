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
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
  const [cashMovementForm, setCashMovementForm] = useState({ amount: '', description: '', date: getTurkeyDate() });
  const [error, setError] = useState('');
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

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

  const formatMoney = (amt) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amt || 0);

  // Türkçe sayı girişi - hem nokta hem virgül ondalık ayracı olarak çalışır
  const parseTurkishNumber = (value) => {
    if (!value) return 0;
    // Virgülü noktaya çevir
    const normalized = value.toString().replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  // Aynı gün kontrolü
  const isSameDay = (dateStr) => dateStr === getTurkeyDate();

  // Düzenleme/Silme yetkisi: Admin her zaman, personel sadece aynı gün
  const canEdit = (dateStr) => {
    if (user?.role === 'admin') return true;
    return isSameDay(dateStr);
  };

  // Kasa hareketlerine erişim yetkisi (Herkes erişebilir)
  const canAccessKasa = () => {
    return !!user;
  };

  // Son düzenlemeleri getir (her sayfa için)
  const getRecentEdits = (type) => {
    let items = [];
    if (type === 'transactions') {
      items = transactions.filter(t => t.updated_by_name).map(t => ({
        date: t.updated_at,
        editor: t.updated_by_name,
        description: `${t.type === 'ALIM' ? 'Alım' : 'Ödeme'}: ${formatMoney(t.amount)}`,
        itemDate: t.date
      }));
    } else if (type === 'reports') {
      items = dailyReports.filter(r => r.updated_by_name).map(r => ({
        date: r.updated_at,
        editor: r.updated_by_name,
        description: `Gün sonu raporu`,
        itemDate: r.date
      }));
    } else if (type === 'cash') {
      items = cashMovements.filter(c => c.updated_by_name).map(c => ({
        date: c.updated_at,
        editor: c.updated_by_name,
        description: `${c.type === 'IN' ? 'Gelen' : 'Ödeme'}: ${formatMoney(c.amount)}`,
        itemDate: c.date
      }));
    }
    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  };

  // Son Düzenlemeler Componenti
  const RecentEditsBox = ({ type, title }) => {
    const edits = getRecentEdits(type);
    if (edits.length === 0) return null;
    return (
      <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mt-6">
        <h4 className="text-orange-700 font-bold mb-3">📝 {title}</h4>
        <div className="space-y-2">
          {edits.map((e, i) => (
            <div key={i} className="bg-white p-2 rounded-lg text-sm flex justify-between items-center">
              <div>
                <span className="font-semibold text-orange-600">{e.editor}</span>
                <span className="text-gray-500 ml-2">{e.description}</span>
              </div>
              <div className="text-xs text-gray-400">
                {formatDateTR(e.itemDate)} - {formatTimeTR(e.date)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          amount: parseTurkishNumber(transactionForm.amount),
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
          amount: parseTurkishNumber(transactionForm.amount),
          payment_method: transactionForm.payment_method,
          description: transactionForm.description,
          invoice_url: invoiceUrl,
          updated_by_name: user.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', showEditTransaction.id);
      
      if (error) throw error;
      setTransactions(transactions.map(t => 
        t.id === showEditTransaction.id 
          ? { ...t, amount: parseTurkishNumber(transactionForm.amount), payment_method: transactionForm.payment_method, description: transactionForm.description, invoice_url: invoiceUrl, updated_by_name: user.full_name } 
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
    setExpensesList([...expensesList, { id: 'temp_'+Date.now(), description: newExpense.description, amount: parseTurkishNumber(newExpense.amount) }]);
    setNewExpense({ description: '', amount: '' });
  };

  const handleRemoveExpense = (id) => setExpensesList(expensesList.filter(e => e.id !== id));
  const getTotalExpenses = () => expensesList.reduce((s, e) => s + e.amount, 0);

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
          credit_card: parseTurkishNumber(reportForm.credit_card) || 0,
          cash: parseTurkishNumber(reportForm.cash) || 0,
          meal_cards: parseTurkishNumber(reportForm.meal_cards) || 0,
          actual_cash: parseTurkishNumber(reportForm.actual_cash) || 0,
          notes: reportForm.notes
        })
        .select('*, users(full_name)')
        .single();

      if (reportError) throw reportError;

      let expenses = [];
      if (reportData && expensesList.length > 0) {
        const expensesData = expensesList.map(e => ({ daily_report_id: reportData.id, description: e.description, amount: e.amount }));
        const { data: expData } = await supabase.from('expenses').insert(expensesData).select();
        if (expData) expenses = expData;
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
        credit_card: parseTurkishNumber(reportForm.credit_card) || 0,
        cash: parseTurkishNumber(reportForm.cash) || 0,
        meal_cards: parseTurkishNumber(reportForm.meal_cards) || 0,
        actual_cash: parseTurkishNumber(reportForm.actual_cash) || 0,
        notes: reportForm.notes,
        updated_by_name: user.full_name,
        updated_at: new Date().toISOString()
      }).eq('id', currentReport.id);

      await supabase.from('expenses').delete().eq('daily_report_id', currentReport.id);
      
      let newExpenses = [];
      if (expensesList.length > 0) {
        const expensesData = expensesList.map(e => ({ daily_report_id: currentReport.id, description: e.description, amount: e.amount }));
        const { data: expData } = await supabase.from('expenses').insert(expensesData).select();
        if (expData) newExpenses = expData;
      }

      setDailyReports(dailyReports.map(r => r.id === currentReport.id ? {
        ...r, credit_card: parseTurkishNumber(reportForm.credit_card) || 0, cash: parseTurkishNumber(reportForm.cash) || 0,
        meal_cards: parseTurkishNumber(reportForm.meal_cards) || 0, actual_cash: parseTurkishNumber(reportForm.actual_cash) || 0,
        notes: reportForm.notes, expenses: newExpenses, updated_by_name: user.full_name
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
        .insert({ user_id: user.id, type: showAddCashMovement, amount: parseTurkishNumber(cashMovementForm.amount), description: cashMovementForm.description, date: cashMovementForm.date })
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-blue-700">
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
            <><div className="text-center mb-6"><p className="text-5xl mb-4">⚠️</p><h3 className="text-xl font-bold text-red-600 mb-2">Silme Onayı (1/2)</h3><p className="text-gray-600">"{deleteConfirm.name}" silinecek.</p></div><div className="flex gap-2"><button onClick={cancelDelete} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={confirmDeleteStep1} className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold">Devam</button></div></>
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
            <h3 className="text-xl font-bold text-orange-600 mb-2">Gider Onayı</h3>
            <p className="text-gray-600">Gider girdiğinize emin misiniz?</p>
            {expensesList.length === 0 ? (
              <p className="text-red-500 mt-2 font-semibold">⚠️ Hiç gider girilmedi!</p>
            ) : (
              <p className="text-green-600 mt-2 font-semibold">✅ {expensesList.length} gider girildi - Toplam: {formatMoney(getTotalExpenses())}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowExpenseConfirm(null)} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">Geri Dön</button>
            <button onClick={() => showExpenseConfirm === 'add' ? handleAddReport() : handleEditReport()} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold">Evet, Kaydet</button>
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
          <a href={viewInvoice} target="_blank" rel="noopener noreferrer" className="block mt-4 text-center bg-blue-500 text-white py-2 rounded-lg">Tam Boyut Aç</a>
        </div>
      </div>
    );
  };

  // LOGIN
  if (screen === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-blue-700 p-4">
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
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-blue-700 p-4">
        <LoadingOverlay />
        <div className="max-w-lg mx-auto pt-12">
          <div className="text-center text-white mb-8">
            <h1 className="text-3xl font-bold mb-2">🏪 Ege Takip Sistemi</h1>
            <p className="text-xl text-white/90">Hoş geldin, {user?.full_name}</p>
            {user?.role === 'admin' && <span className="inline-block mt-2 bg-white/20 px-3 py-1 rounded-full text-sm">👑 Admin</span>}
          </div>
          <div className="space-y-4">
            <button onClick={() => setScreen('toptanci')} className="w-full bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-red-500"><span className="text-4xl">📦</span><div className="text-left"><p className="text-xl font-bold text-gray-800">Toptancı Ödemeleri</p><p className="text-gray-500">Mal alımı ve ödeme takibi</p></div></button>
            <button onClick={() => setScreen('gunsonu')} className="w-full bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-blue-500"><span className="text-4xl">📊</span><div className="text-left"><p className="text-xl font-bold text-gray-800">Gün Sonu</p><p className="text-gray-500">Günlük ciro ve kasa raporu</p></div></button>
            {canAccessKasa() && (
              <button onClick={() => setScreen('kasa')} className="w-full bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-green-500"><span className="text-4xl">💰</span><div className="text-left"><p className="text-xl font-bold text-gray-800">Kasa Hareketleri</p><p className="text-gray-500">Ödeme ve gelen para takibi</p></div></button>
            )}
            {user?.role === 'admin' && (
              <button onClick={() => setScreen('ozet')} className="w-full bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border-l-4 border-purple-500"><span className="text-4xl">📈</span><div className="text-left"><p className="text-xl font-bold text-gray-800">Günlük Özet</p><p className="text-gray-500">Tüm işletmelerin toplamı</p></div></button>
            )}
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
        <header className="bg-white shadow border-b-4 border-purple-500"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-2xl text-blue-600">←</button><h1 className="text-xl font-bold text-gray-800">📈 Günlük Özet</h1></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => changeDate(-1)} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-semibold">← Önceki</button>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 border-2 border-gray-200 rounded-lg px-6 py-3 bg-gray-50">{formatDateTR(selectedDate)}</div>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-2 text-sm border rounded-lg px-3 py-1" />
              </div>
              <button onClick={() => changeDate(1)} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-semibold">Sonraki →</button>
            </div>
            <div className="flex gap-2 mt-4 justify-center"><button onClick={() => setSelectedDate(getTurkeyDate())} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm">Bugün</button></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-2xl p-6 text-white">
              <p className="text-white/80 text-sm">Toplam Ciro</p>
              <p className="text-3xl font-bold">{formatMoney(summary.total)}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-2xl p-6 text-white">
              <p className="text-white/80 text-sm">Net Ciro (Giderler Düşülmüş)</p>
              <p className="text-3xl font-bold">{formatMoney(summary.netTotal)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 text-center">
              <p className="text-blue-600 font-semibold text-xs">💳 Kredi Kartı</p>
              <p className="text-lg font-bold">{formatMoney(summary.totalCreditCard)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 text-center">
              <p className="text-green-600 font-semibold text-xs">💵 Nakit</p>
              <p className="text-lg font-bold">{formatMoney(summary.totalCash)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200 text-center">
              <p className="text-orange-600 font-semibold text-xs">🎫 Yemek Kartı</p>
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
                  <p className="font-bold text-purple-600">{formatMoney(b.total)}</p>
                  <p className="text-sm text-green-600">Net: {formatMoney(b.net)}</p>
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
  if (screen === 'kasa' && canAccessKasa()) {
    const todayMovements = cashMovements.filter(c => c.date === selectedDate);
    const totalIn = todayMovements.filter(c => c.type === 'IN').reduce((s, c) => s + Number(c.amount), 0);
    const totalOut = todayMovements.filter(c => c.type === 'OUT').reduce((s, c) => s + Number(c.amount), 0);
    return (
      <div className="min-h-screen bg-gray-100">
        <LoadingOverlay />
        <header className="bg-white shadow border-b-4 border-green-500"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-2xl text-blue-600">←</button><h1 className="text-xl font-bold text-gray-800">💰 Kasa Hareketleri</h1></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => changeDate(-1)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">← Önceki</button>
              <div className="text-center"><div className="text-2xl font-bold text-gray-800 border-2 border-gray-200 rounded-lg px-6 py-3 bg-gray-50">{formatDateTR(selectedDate)}</div><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-2 text-sm border rounded-lg px-3 py-1" /></div>
              <button onClick={() => changeDate(1)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">Sonraki →</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={() => { setCashMovementForm({...cashMovementForm, date: selectedDate}); setShowAddCashMovement('IN'); }} className="bg-green-500 text-white p-4 rounded-xl font-semibold text-lg">+ Gelen Para</button>
            <button onClick={() => { setCashMovementForm({...cashMovementForm, date: selectedDate}); setShowAddCashMovement('OUT'); }} className="bg-red-500 text-white p-4 rounded-xl font-semibold text-lg">+ Ödeme Yap</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 text-center"><p className="text-green-600 font-semibold">Gelen</p><p className="text-2xl font-bold text-green-700">{formatMoney(totalIn)}</p></div>
            <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 text-center"><p className="text-red-600 font-semibold">Çıkan</p><p className="text-2xl font-bold text-red-700">{formatMoney(totalOut)}</p></div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Hareketler</h3>
            <div className="space-y-2">
              {todayMovements.map(m => (
                <div key={m.id} className={`p-4 rounded-lg border-l-4 ${m.type === 'IN' ? 'bg-green-50 border-l-green-500' : 'bg-red-50 border-l-red-500'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-semibold ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>{m.type === 'IN' ? '📥 Gelen' : '📤 Ödeme'}</p>
                      <p className="text-sm text-gray-600">{m.description}</p>
                      <p className="text-xs text-gray-500">{formatTimeTR(m.created_at)} - 👤 {m.fullName}</p>
                      {m.updated_by_name && <p className="text-xs text-orange-500">✏️ Düzenleyen: {m.updated_by_name}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xl font-bold ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>{m.type === 'IN' ? '+' : '-'}{formatMoney(m.amount)}</p>
                      {canEdit(m.date) && <button onClick={() => initiateDelete('cashMovement', m.id, m.description)} className="bg-red-100 text-red-500 p-1 rounded">🗑️</button>}
                    </div>
                  </div>
                </div>
              ))}
              {todayMovements.length === 0 && <p className="text-center text-gray-500 py-8">Hareket yok</p>}
            </div>
          </div>
          <RecentEditsBox type="cash" title="Son Düzenlemeler - Kasa Hareketleri" />
        </main>
        {showAddCashMovement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className={`text-xl font-bold mb-4 ${showAddCashMovement === 'IN' ? 'text-green-600' : 'text-red-600'}`}>{showAddCashMovement === 'IN' ? '📥 Gelen Para' : '📤 Ödeme Yap'}</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Tutar *</label><input type="number" value={cashMovementForm.amount} onChange={(e) => setCashMovementForm({...cashMovementForm, amount: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div>
                <div><label className="block text-sm font-medium mb-1">Açıklama *</label><input type="text" value={cashMovementForm.description} onChange={(e) => setCashMovementForm({...cashMovementForm, description: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Tarih</label><div className="text-lg font-bold border-2 rounded-lg px-4 py-2 bg-gray-50">{formatDateTR(cashMovementForm.date)}</div></div>
              </div>
              <div className="flex gap-2 mt-6"><button onClick={() => setShowAddCashMovement(null)} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleAddCashMovement} className={`flex-1 text-white py-3 rounded-lg font-semibold ${showAddCashMovement === 'IN' ? 'bg-green-500' : 'bg-red-500'}`}>Kaydet</button></div>
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
          <header className="bg-white shadow border-b-4 border-blue-500"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-2xl text-blue-600">←</button><h1 className="text-xl font-bold text-gray-800">📊 Gün Sonu</h1></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
          <main className="max-w-lg mx-auto px-4 py-8"><div className="space-y-4">{allowedBusinesses.map(b => (<button key={b.id} onClick={() => setSelectedBusiness(b)} className="w-full bg-white p-6 rounded-xl shadow text-left border-l-4 border-blue-500"><p className="text-xl font-bold">{b.name}</p><p className="text-sm text-gray-500">{getBusinessReports(b.id).length} rapor</p></button>))}</div></main>
        </div>
      );
    }
    const currentReport = getReportByDate(selectedBusiness.id, selectedDate);
    const isToday = selectedDate === getTurkeyDate();
    return (
      <div className="min-h-screen bg-gray-100">
        <LoadingOverlay />
        <ExpenseConfirmModal />
        <header className="bg-white shadow border-b-4 border-blue-500"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setSelectedBusiness(null)} className="text-2xl text-blue-600">←</button><h1 className="text-xl font-bold text-gray-800">📊 {selectedBusiness.name}</h1></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => changeDate(-1)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">←</button>
              <div className="text-center"><div className="text-2xl font-bold border-2 rounded-lg px-6 py-3 bg-gray-50">{formatDateTR(selectedDate)}</div><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-2 text-sm border rounded-lg px-3 py-1" /></div>
              <button onClick={() => changeDate(1)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">→</button>
            </div>
            <div className="flex gap-2 mt-4 justify-center"><button onClick={() => setSelectedDate(getTurkeyDate())} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm">Bugün</button></div>
          </div>
          {(isToday || user?.role === 'admin') && !currentReport && (<button onClick={() => { setReportForm({...reportForm, date: selectedDate}); setExpensesList([]); setShowAddReport(true); }} className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-semibold mb-6">+ Rapor Ekle</button>)}
          {currentReport ? (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div>
                  <p className="text-2xl font-bold">{formatDateTR(currentReport.date)}</p>
                  <p className="text-sm text-gray-500">Ciro: {formatMoney(Number(currentReport.credit_card) + Number(currentReport.cash) + Number(currentReport.meal_cards))}</p>
                  <p className="text-xs text-blue-600 mt-1">👤 {currentReport.fullName} - {formatTimeTR(currentReport.created_at)}</p>
                  {currentReport.updated_by_name && <p className="text-xs text-orange-500">✏️ Düzenleyen: {currentReport.updated_by_name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-4 py-2 rounded-lg text-sm font-bold ${calcCashDiff(currentReport) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Fark: {formatMoney(calcCashDiff(currentReport))}</div>
                  {canEdit(currentReport.date) && (<div className="flex gap-1"><button onClick={() => openEditReport(currentReport)} className="bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm">✏️</button><button onClick={() => initiateDelete('report', currentReport.id, `${formatDateTR(currentReport.date)} raporu`)} className="bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm">🗑️</button></div>)}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200"><p className="text-blue-600 font-semibold text-xs">💳 Kredi Kartı</p><p className="text-lg font-bold">{formatMoney(currentReport.credit_card)}</p></div>
                <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200"><p className="text-green-600 font-semibold text-xs">💵 Nakit</p><p className="text-lg font-bold">{formatMoney(currentReport.cash)}</p></div>
                <div className="bg-orange-50 p-3 rounded-lg border-2 border-orange-200"><p className="text-orange-600 font-semibold text-xs">🎫 Yemek Kartı</p><p className="text-lg font-bold">{formatMoney(currentReport.meal_cards)}</p></div>
                <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200"><p className="text-purple-600 font-semibold text-xs">💰 Eldeki Nakit</p><p className="text-lg font-bold">{formatMoney(currentReport.actual_cash)}</p></div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200 mb-4"><div className="flex justify-between mb-2"><p className="text-red-600 font-semibold">📉 Giderler</p><p className="font-bold text-red-700">{formatMoney(getExpTotal(currentReport.expenses))}</p></div>{(currentReport.expenses || []).length > 0 ? (currentReport.expenses.map((e, i) => (<div key={i} className="flex justify-between text-sm bg-white p-2 rounded mb-1"><span>{e.description}</span><span className="text-red-600 font-semibold">{formatMoney(e.amount)}</span></div>))) : (<p className="text-sm text-gray-500 text-center py-2">Gider girilmedi</p>)}</div>
            </div>
          ) : (<div className="bg-white rounded-xl shadow p-12 text-center"><p className="text-5xl mb-4">📋</p><p className="text-xl text-gray-500">{formatDateTR(selectedDate)} - Kayıt yok</p></div>)}
          <div className="mt-6"><h3 className="text-lg font-bold mb-4">Son Raporlar</h3><div className="space-y-2">{getBusinessReports(selectedBusiness.id).slice(0, 5).map(r => (<button key={r.id} onClick={() => setSelectedDate(r.date)} className={`w-full text-left p-4 rounded-lg ${selectedDate === r.date ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white'}`}><div className="flex justify-between"><span className="font-semibold">{formatDateTR(r.date)}</span><span>{formatMoney(Number(r.credit_card) + Number(r.cash) + Number(r.meal_cards))}</span></div></button>))}</div></div>
          <RecentEditsBox type="reports" title="Son Düzenlemeler - Gün Sonu Raporları" />
        </main>
        
        {/* Add Report Modal */}
        {showAddReport && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"><div className="bg-white rounded-xl p-6 w-full max-w-lg my-8"><h3 className="text-xl font-bold mb-4 text-red-600">📊 Gün Sonu - {selectedBusiness.name}</h3><div className="space-y-4"><div><label className="text-sm font-medium">Tarih</label><div className="text-lg font-bold border-2 rounded-lg px-4 py-2 bg-gray-50">{formatDateTR(reportForm.date)}</div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">💳 Kredi Kartı</label><input type="number" value={reportForm.credit_card} onChange={(e) => setReportForm({...reportForm, credit_card: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div><div><label className="text-sm font-medium">💵 Nakit</label><input type="number" value={reportForm.cash} onChange={(e) => setReportForm({...reportForm, cash: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">🎫 Yemek Kartı</label><input type="number" value={reportForm.meal_cards} onChange={(e) => setReportForm({...reportForm, meal_cards: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div><div><label className="text-sm font-medium">💰 Eldeki Nakit</label><input type="number" value={reportForm.actual_cash} onChange={(e) => setReportForm({...reportForm, actual_cash: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div></div><div className="border-2 border-red-200 rounded-lg p-4 bg-red-50"><label className="text-sm font-bold text-red-600 block mb-3">📉 Giderler</label><div className="flex gap-2 mb-3"><input type="text" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="flex-1 px-3 py-2 border-2 rounded-lg text-sm" placeholder="Açıklama" /><input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-24 px-3 py-2 border-2 rounded-lg text-sm" placeholder="Tutar" /><button onClick={handleAddExpense} className="bg-red-500 text-white px-4 py-2 rounded-lg">+</button></div>{expensesList.map(e => (<div key={e.id} className="flex justify-between items-center bg-white p-2 rounded-lg mb-2"><span className="text-sm">{e.description}</span><div className="flex items-center gap-2"><span className="text-sm font-semibold text-red-600">{formatMoney(e.amount)}</span><button onClick={() => handleRemoveExpense(e.id)} className="text-red-400">✕</button></div></div>))}<div className="flex justify-between pt-2 border-t border-red-200"><span className="font-semibold text-red-700">Toplam:</span><span className="font-bold text-red-700">{formatMoney(getTotalExpenses())}</span></div></div><div><label className="text-sm font-medium">📝 Notlar</label><textarea value={reportForm.notes} onChange={(e) => setReportForm({...reportForm, notes: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" rows={2} /></div></div><div className="flex gap-2 mt-6"><button onClick={() => { setShowAddReport(false); setExpensesList([]); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={() => handleSaveReportClick('add')} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold">Kaydet</button></div></div></div>)}
        
        {/* Edit Report Modal */}
        {showEditReport && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"><div className="bg-white rounded-xl p-6 w-full max-w-lg my-8"><h3 className="text-xl font-bold mb-4 text-blue-600">✏️ Rapor Düzenle</h3><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">💳 Kredi Kartı</label><input type="number" value={reportForm.credit_card} onChange={(e) => setReportForm({...reportForm, credit_card: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">💵 Nakit</label><input type="number" value={reportForm.cash} onChange={(e) => setReportForm({...reportForm, cash: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">🎫 Yemek Kartı</label><input type="number" value={reportForm.meal_cards} onChange={(e) => setReportForm({...reportForm, meal_cards: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">💰 Eldeki Nakit</label><input type="number" value={reportForm.actual_cash} onChange={(e) => setReportForm({...reportForm, actual_cash: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div></div><div className="border-2 border-red-200 rounded-lg p-4 bg-red-50"><label className="text-sm font-bold text-red-600 block mb-3">📉 Giderler</label><div className="flex gap-2 mb-3"><input type="text" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="flex-1 px-3 py-2 border-2 rounded-lg text-sm" placeholder="Açıklama" /><input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-24 px-3 py-2 border-2 rounded-lg text-sm" placeholder="Tutar" /><button onClick={handleAddExpense} className="bg-red-500 text-white px-4 py-2 rounded-lg">+</button></div>{expensesList.map(e => (<div key={e.id} className="flex justify-between items-center bg-white p-2 rounded-lg mb-2"><span className="text-sm">{e.description}</span><div className="flex items-center gap-2"><span className="text-sm font-semibold text-red-600">{formatMoney(e.amount)}</span><button onClick={() => handleRemoveExpense(e.id)} className="text-red-400">✕</button></div></div>))}<div className="flex justify-between pt-2 border-t border-red-200"><span className="font-semibold text-red-700">Toplam:</span><span className="font-bold text-red-700">{formatMoney(getTotalExpenses())}</span></div></div></div><div className="flex gap-2 mt-6"><button onClick={() => { setShowEditReport(false); setExpensesList([]); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={() => handleSaveReportClick('edit')} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">Güncelle</button></div></div></div>)}
        
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
          <header className="bg-white shadow border-b-4 border-red-500"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setScreen('menu')} className="text-2xl text-blue-600">←</button><h1 className="text-xl font-bold text-gray-800">📦 Toptancı</h1></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
          <main className="max-w-lg mx-auto px-4 py-8"><div className="space-y-4">{allowedBusinesses.map(b => (<button key={b.id} onClick={() => setSelectedBusiness(b)} className="w-full bg-white p-6 rounded-xl shadow text-left border-l-4 border-red-500"><p className="text-xl font-bold">{b.name}</p></button>))}</div></main>
        </div>
      );
    }
    const totalDebt = getTotalDebt();
    return (
      <div className="min-h-screen bg-gray-100">
        <LoadingOverlay />
        <InvoiceModal />
        <header className="bg-white shadow border-b-4 border-red-500"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => { setSelectedBusiness(null); setSelectedSupplier(null); setSearchQuery(''); }} className="text-2xl text-blue-600">←</button><div><h1 className="text-xl font-bold">{selectedBusiness.name}</h1><p className="text-sm text-gray-500">{user?.full_name} {user?.role === 'admin' && <span className="bg-red-100 text-red-700 px-2 rounded text-xs ml-1">Admin</span>}</p></div></div><button onClick={handleLogout} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Çıkış</button></div></header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className={`rounded-2xl p-6 text-white mb-6 ${totalDebt > 0 ? 'bg-gradient-to-r from-red-500 to-red-700' : 'bg-gradient-to-r from-green-500 to-green-700'}`}><p className="text-white/80 text-sm">Toplam {totalDebt > 0 ? 'Borç' : 'Durum'}</p><p className="text-4xl font-bold">{formatMoney(Math.abs(totalDebt))}</p><p className="text-white/80 text-sm mt-2">{getBusinessSuppliers().length} toptancı</p></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Toptancılar</h2><button onClick={() => setShowAddSupplier(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">+ Ekle</button></div>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Ara..." className="w-full px-4 py-2 border-2 rounded-lg mb-4" />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredSuppliers().map(s => { const bal = getSupplierBalance(s.id); return (<div key={s.id} onClick={() => setSelectedSupplier(s)} className={`p-4 rounded-lg cursor-pointer ${selectedSupplier?.id === s.id ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'}`}><div className="flex justify-between"><div><p className="font-semibold">{s.name}</p>{s.phone && <p className="text-sm text-gray-500">{s.phone}</p>}</div><div className="text-right"><p className={`font-bold ${bal > 0 ? 'text-red-600' : bal < 0 ? 'text-green-600' : 'text-gray-600'}`}>{formatMoney(Math.abs(bal))}</p><p className={`text-xs ${bal > 0 ? 'text-red-500' : bal < 0 ? 'text-green-500' : 'text-gray-400'}`}>{bal > 0 ? 'Borç' : bal < 0 ? 'Alacak' : 'Eşit'}</p></div></div></div>); })}
                {getFilteredSuppliers().length === 0 && <p className="text-center text-gray-500 py-8">Toptancı yok</p>}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              {selectedSupplier ? (<>
                <div className="flex justify-between items-start mb-4">
                  <div><h2 className="text-xl font-bold">{selectedSupplier.name}</h2>{selectedSupplier.phone && <p className="text-gray-500">{selectedSupplier.phone}</p>}</div>
                  {user?.role === 'admin' && (
                    <div className="flex gap-1">
                      <button onClick={() => openEditSupplier(selectedSupplier)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm">✏️</button>
                      <button onClick={() => initiateDelete('supplier', selectedSupplier.id, selectedSupplier.name)} className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm">🗑️</button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mb-4"><button onClick={() => setShowAddTransaction('ALIM')} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold">+ Mal Alımı</button><button onClick={() => setShowAddTransaction('ODEME')} className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold">+ Ödeme</button></div>
                <div className="border-t pt-4"><h3 className="font-semibold mb-3">İşlemler</h3><div className="space-y-2 max-h-80 overflow-y-auto">
                  {transactions.filter(t => t.supplier_id === selectedSupplier.id).map(tx => (
                    <div key={tx.id} className={`p-3 bg-gray-50 rounded-lg border-l-4 ${tx.type === 'ALIM' ? 'border-l-red-500' : 'border-l-green-500'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-semibold ${tx.type === 'ALIM' ? 'text-red-600' : 'text-green-600'}`}>{tx.type === 'ALIM' ? '📦 Alım' : '💰 Ödeme'}</p>
                          <p className="text-xs text-gray-500">{formatDateTR(tx.date)} - {formatTimeTR(tx.created_at)}</p>
                          <p className="text-xs text-gray-400">{getPaymentLabel(tx.payment_method)}</p>
                          {tx.description && <p className="text-xs text-gray-400">{tx.description}</p>}
                          <p className="text-xs text-blue-500">👤 {tx.fullName}</p>
                          {tx.updated_by_name && <p className="text-xs text-orange-500">✏️ Düzenleyen: {tx.updated_by_name}</p>}
                          {tx.invoice_url && (<button onClick={() => setViewInvoice(tx.invoice_url)} className="text-xs text-purple-600 mt-1 hover:underline">📄 Faturayı Gör</button>)}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold ${tx.type === 'ALIM' ? 'text-red-600' : 'text-green-600'}`}>{tx.type === 'ALIM' ? '+' : '-'}{formatMoney(tx.amount)}</p>
                          {canEdit(tx.date) && (<div className="flex flex-col gap-1"><button onClick={() => openEditTransaction(tx)} className="bg-blue-100 text-blue-500 p-1 rounded text-xs">✏️</button><button onClick={() => initiateDelete('transaction', tx.id, `${formatDateTR(tx.date)} - ${formatMoney(tx.amount)}`)} className="bg-red-100 text-red-500 p-1 rounded text-xs">🗑️</button></div>)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.filter(t => t.supplier_id === selectedSupplier.id).length === 0 && <p className="text-center text-gray-500 py-4">İşlem yok</p>}
                </div></div>
              </>) : (<div className="flex flex-col items-center justify-center h-full text-gray-500 py-20"><p className="text-5xl mb-4">👈</p><p>Toptancı seçin</p></div>)}
            </div>
          </div>
          <RecentEditsBox type="transactions" title="Son Düzenlemeler - Toptancı İşlemleri" />
        </main>
        
        {showAddSupplier && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="text-xl font-bold mb-4 text-blue-600">Yeni Toptancı</h3><div className="space-y-4"><div><label className="text-sm font-medium">Ad *</label><input type="text" value={supplierForm.name} onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">Telefon</label><input type="text" value={supplierForm.phone} onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">Not</label><textarea value={supplierForm.notes} onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" rows={2} /></div></div><div className="flex gap-2 mt-6"><button onClick={() => setShowAddSupplier(false)} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleAddSupplier} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">Ekle</button></div></div></div>)}
        
        {showEditSupplier && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="text-xl font-bold mb-4 text-blue-600">✏️ Toptancı Düzenle</h3><div className="space-y-4"><div><label className="text-sm font-medium">Ad *</label><input type="text" value={supplierForm.name} onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">Telefon</label><input type="text" value={supplierForm.phone} onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">Not</label><textarea value={supplierForm.notes} onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" rows={2} /></div></div><div className="flex gap-2 mt-6"><button onClick={() => { setShowEditSupplier(null); setSupplierForm({ name: '', phone: '', notes: '' }); }} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleEditSupplier} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">Güncelle</button></div></div></div>)}
        
        {showAddTransaction && selectedSupplier && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"><div className="bg-white rounded-xl p-6 w-full max-w-md my-8"><h3 className={`text-xl font-bold mb-4 ${showAddTransaction === 'ALIM' ? 'text-red-600' : 'text-green-600'}`}>{showAddTransaction === 'ALIM' ? '📦 Mal Alımı' : '💰 Ödeme'}</h3><div className="space-y-4"><div><label className="text-sm font-medium">Tutar *</label><input type="number" value={transactionForm.amount} onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" placeholder="0" /></div><div><label className="text-sm font-medium">Tarih *</label><input type="date" value={transactionForm.date} onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /><p className="text-sm text-gray-600 mt-1">{formatDateTR(transactionForm.date)}</p></div><div><label className="text-sm font-medium">Ödeme Biçimi</label><select value={transactionForm.payment_method} onChange={(e) => setTransactionForm({...transactionForm, payment_method: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg"><option value="nakit">💵 Nakit</option><option value="kredi_karti">💳 Kredi Kartı</option><option value="cek">📄 Çek</option><option value="senet">📃 Senet</option></select></div><div><label className="text-sm font-medium">Açıklama</label><input type="text" value={transactionForm.description} onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">📄 Fatura Ekle</label><input type="file" accept="image/*,.pdf" onChange={(e) => setTransactionForm({...transactionForm, invoice: e.target.files[0]})} className="w-full px-4 py-2 border-2 rounded-lg text-sm" />{transactionForm.invoice && <p className="text-xs text-green-600 mt-1">✅ {transactionForm.invoice.name}</p>}{uploadingInvoice && <p className="text-xs text-blue-600 mt-1">⏳ Yükleniyor...</p>}</div></div><div className="flex gap-2 mt-6"><button onClick={() => setShowAddTransaction(null)} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleAddTransaction} disabled={loading || uploadingInvoice} className={`flex-1 text-white py-3 rounded-lg font-semibold ${showAddTransaction === 'ALIM' ? 'bg-red-500' : 'bg-green-500'}`}>Kaydet</button></div></div></div>)}
        
        {showEditTransaction && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="text-xl font-bold mb-4 text-blue-600">✏️ İşlem Düzenle</h3><div className="space-y-4"><div><label className="text-sm font-medium">Tutar</label><input type="number" value={transactionForm.amount} onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">Ödeme Biçimi</label><select value={transactionForm.payment_method} onChange={(e) => setTransactionForm({...transactionForm, payment_method: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg"><option value="nakit">💵 Nakit</option><option value="kredi_karti">💳 Kredi Kartı</option><option value="cek">📄 Çek</option><option value="senet">📃 Senet</option></select></div><div><label className="text-sm font-medium">Açıklama</label><input type="text" value={transactionForm.description} onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" /></div><div><label className="text-sm font-medium">📄 Yeni Fatura</label><input type="file" accept="image/*,.pdf" onChange={(e) => setTransactionForm({...transactionForm, invoice: e.target.files[0]})} className="w-full px-4 py-2 border-2 rounded-lg text-sm" />{showEditTransaction.invoice_url && !transactionForm.invoice && <p className="text-xs text-blue-600 mt-1">📄 Mevcut fatura var</p>}{transactionForm.invoice && <p className="text-xs text-green-600 mt-1">✅ {transactionForm.invoice.name}</p>}</div></div><div className="flex gap-2 mt-6"><button onClick={() => setShowEditTransaction(null)} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">İptal</button><button onClick={handleEditTransaction} disabled={loading || uploadingInvoice} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">Güncelle</button></div></div></div>)}
        
        <DeleteConfirmModal />
      </div>
    );
  }

  return null;
}
