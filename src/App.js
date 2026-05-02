import React, { useState, useEffect } from 'react';
import './App.css';
import TransactionForm from './components/TransactionForm';
import Auth from './components/Auth';
import FixedExpenses from './components/FixedExpenses';
import { supabase } from './supabase';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const INCOME_CATEGORIES = ['Ahorro'];

function fmt(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(Math.abs(n));
}

function todayLabel() {
  const d = new Date();
  return `${DAYS_ES[d.getDay()]}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()].toUpperCase()} de ${d.getFullYear()}`;
}

export default function App() {
  const today = new Date();
  const [user, setUser]                   = useState(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [year, setYear]                   = useState(today.getFullYear());
  const [month, setMonth]                 = useState(today.getMonth());
  const [allTx, setAllTx]                 = useState({});
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [baseBalance, setBaseBalance]     = useState(null);
  const [editingSavings, setEditingSavings] = useState(false);
  const [savingsInput, setSavingsInput]   = useState('');
  const [showForm, setShowForm]           = useState(false);
  const [filter, setFilter]               = useState('todo');
  const [view, setView]                   = useState('mes');
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
    setAuthLoading(false);
  });
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}, []);

  useEffect(() => {
  if (!user) { setAllTx({}); setFixedExpenses([]); setBaseBalance(0); return; }
  const load = async () => {
    const { data } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setAllTx(data.transactions || {});
      setFixedExpenses(data.fixed_expenses || []);
      setBaseBalance(data.base_balance ?? 0);
    } else {
      setBaseBalance(0);
    }
  };
  load();
}, [user]);

  useEffect(() => {
  if (!user || authLoading || baseBalance === null) return;
  const save = async () => {
    setSaving(true);
    try {
      await supabase.from('user_data').upsert({
        user_id: user.id,
        transactions: allTx,
        fixed_expenses: fixedExpenses,
        base_balance: baseBalance,
      });
    } catch(e) { console.error(e); }
    setSaving(false);
  };
  const timeout = setTimeout(save, 800);
  return () => clearTimeout(timeout);
}, [allTx, fixedExpenses, baseBalance, user, authLoading]);

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const txs = allTx[monthKey] || [];

  const ingresos    = txs.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0);
  const egresos     = txs.filter(t => t.type === 'egreso').reduce((s, t) => s + t.amount, 0);
  const gastosFijos = txs.filter(t => t.category === 'Gasto Fijo').reduce((s, t) => s + t.amount, 0);
  const balance     = ingresos - egresos;

  // Balance total = base manual + todo lo que hay en transacciones
  const txTotal = Object.values(allTx).flat().reduce((s, t) =>
    t.type === 'ingreso' ? s + t.amount : s - t.amount, 0
  );
  const computedSavings = (baseBalance ?? 0) + txTotal;

  const filtered = txs.filter(t => {
    if (filter === 'todo') return true;
    if (filter === 'ingresos') return t.type === 'ingreso';
    if (filter === 'egresos') return t.type === 'egreso' && t.category !== 'Gasto Fijo';
    if (filter === 'fijos') return t.category === 'Gasto Fijo';
    return true;
  });

  const addTx = (tx) => {
  const pwd = window.prompt('Ingresa la contraseña para agregar:');
  if (pwd !== adminPassword) {
    if (pwd !== null) alert('Contraseña incorrecta.');
    return;
  }
  setAllTx(prev => ({
    ...prev,
    [monthKey]: [{ ...tx, id: Date.now() }, ...(prev[monthKey] || [])]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }));
  setShowForm(false);
};

  const [adminPassword] = useState('steinrich');

const deleteTx = (id) => {
  const pwd = window.prompt('Ingresa la contraseña para eliminar:');
  if (pwd !== adminPassword) {
    if (pwd !== null) alert('Contraseña incorrecta.');
    return;
  }
  setAllTx(prev => ({
    ...prev,
    [monthKey]: (prev[monthKey] || []).filter(t => t.id !== id)
  }));
};

const clearAll = () => {
  const pwd = window.prompt('Ingresa la contraseña para limpiar todo:');
  if (pwd !== adminPassword) {
    if (pwd !== null) alert('Contraseña incorrecta.');
    return;
  }
  if (window.confirm('¿Borrar todos los movimientos de este mes?')) {
    setAllTx(prev => ({ ...prev, [monthKey]: [] }));
  }
};

  const saveFixedExpenses  = (list) => setFixedExpenses(list);
  const deleteFixedExpense = (id)  => setFixedExpenses(prev => prev.filter(e => e.id !== id));

  const applyFixedToMonth = (list, key) => {
    const [y, m] = key.split('-');
    const newTxs = list.map(e => {
      const isIncome = INCOME_CATEGORIES.includes(e.category);
      return {
        id: Date.now() + Math.random(),
        type: isIncome ? 'ingreso' : 'egreso',
        category: isIncome ? 'Ingreso Fijo' : 'Gasto Fijo',
        description: e.description,
        amount: Number(e.amount),
        date: `${y}-${m}-${String(e.day).padStart(2, '0')}`,
      };
    });
    setAllTx(prev => ({
      ...prev,
      [key]: [...newTxs, ...(prev[key] || [])]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    }));
  };

  // Edición manual del balance navy
  const startEditSavings = () => {
    setSavingsInput(String(computedSavings));
    setEditingSavings(true);
  };

  const confirmSavings = () => {
    const val = parseFloat(String(savingsInput).replace(/,/g, ''));
    if (!isNaN(val)) {
      // Ajusta baseBalance para que computedSavings quede igual a lo que escribió el usuario
      setBaseBalance(val - txTotal);
    }
    setEditingSavings(false);
  };

  const handleSavingsKey = (e) => {
    if (e.key === 'Enter') confirmSavings();
    if (e.key === 'Escape') setEditingSavings(false);
  };

  const prevMonth = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1);

  const defaultDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const historicalMonths = Object.keys(allTx)
    .filter(k => (allTx[k] || []).length > 0)
    .sort((a, b) => b.localeCompare(a))
    .map(k => {
      const list = allTx[k] || [];
      const ing = list.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0);
      const eg  = list.filter(t => t.type === 'egreso').reduce((s, t) => s + t.amount, 0);
      const [y, m] = k.split('-');
      return { key: k, year: parseInt(y), month: parseInt(m) - 1, ing, eg, bal: ing - eg, count: list.length };
    });

  const allTimeIng = historicalMonths.reduce((s, m) => s + m.ing, 0);
  const allTimeEg  = historicalMonths.reduce((s, m) => s + m.eg, 0);
  const allTimeBal = allTimeIng - allTimeEg;

  const goToMonth = (y, m) => { setYear(y); setMonth(m); setView('mes'); setFilter('todo'); };
const exportToExcel = () => {
  const XLSX = require('xlsx');
  
  const wb = XLSX.utils.book_new();

  // Hoja 1: Todas las transacciones
  const txRows = [];
  txRows.push(['Mes', 'Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto']);
  Object.keys(allTx).sort().forEach(key => {
    const [y, m] = key.split('-');
    const mesLabel = `${MONTHS_ES[parseInt(m) - 1]} ${y}`;
    (allTx[key] || []).forEach(tx => {
      txRows.push([
        mesLabel,
        tx.date,
        tx.description,
        tx.category || '',
        tx.type === 'ingreso' ? 'Ingreso' : 'Egreso',
        tx.type === 'ingreso' ? tx.amount : -tx.amount,
      ]);
    });
  });
  const wsTx = XLSX.utils.aoa_to_sheet(txRows);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transacciones');

  // Hoja 2: Resumen por mes
  const resRows = [];
  resRows.push(['Mes', 'Ingresos', 'Egresos', 'Balance']);
  historicalMonths.forEach(m => {
    resRows.push([
      `${MONTHS_ES[m.month]} ${m.year}`,
      m.ing,
      m.eg,
      m.bal,
    ]);
  });
  const wsRes = XLSX.utils.aoa_to_sheet(resRows);
  XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen por mes');

  // Hoja 3: Gastos fijos
  const fijosRows = [];
  fijosRows.push(['Descripción', 'Categoría', 'Día del mes', 'Monto']);
  fixedExpenses.forEach(e => {
    fijosRows.push([e.description, e.category, e.day, e.amount]);
  });
  const wsFijos = XLSX.utils.aoa_to_sheet(fijosRows);
  XLSX.utils.book_append_sheet(wb, wsFijos, 'Gastos Fijos');

  XLSX.writeFile(wb, `EdvardMoney_${new Date().toISOString().slice(0,10)}.xlsx`);
};
  if (authLoading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-page)'}}>
      <p style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>Cargando...</p>
    </div>
  );

  if (!user) return <Auth />;

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1 className="app-name">Edvard Money</h1>
          <p className="app-sub">Controla tu libertad financiera</p>
        </div>
        <div className="header-right">
          <p className="header-date">{todayLabel()}</p>

          {/* BALANCE TOTAL — editable manualmente, siempre correcto con transacciones */}
          {editingSavings ? (
            <div className="savings-edit-row">
              <input
                className="savings-input"
                type="number"
                autoFocus
                value={savingsInput}
                onChange={e => setSavingsInput(e.target.value)}
                onBlur={confirmSavings}
                onKeyDown={handleSavingsKey}
                placeholder="0"
              />
            </div>
          ) : (
            <div className="savings-row" onClick={startEditSavings} title="Clic para editar">
              <span className="savings-value">{fmt(computedSavings)}</span>
              <span className="savings-edit-icon">✏️</span>
            </div>
          )}

          {/* BALANCE DEL MES */}
          <p className={`header-balance-month ${balance >= 0 ? 'pos' : 'neg'}`}>
            {balance < 0 ? '-' : '+'}{fmt(balance)} <span className="balance-month-label">este mes</span>
          </p>

          <div className="user-row">
            <span className="user-email">{user.email}</span>
            {saving && <span className="saving-badge">guardando...</span>}
            <button className="logout-btn" onClick={exportToExcel}>📥 Exportar a Excel</button>
<button className="logout-btn" onClick={() => supabase.auth.signOut()}>Salir</button>
          </div>
        </div>
      </div>

      <div className="view-toggle">
        <button className={`view-btn ${view === 'mes' ? 'view-active' : ''}`} onClick={() => setView('mes')}>📅 Mes actual</button>
        <button className={`view-btn ${view === 'fijos' ? 'view-active' : ''}`} onClick={() => setView('fijos')}>🗓 Gastos Fijos</button>
        <button className={`view-btn ${view === 'historial' ? 'view-active' : ''}`} onClick={() => setView('historial')}>📊 Historial</button>
      </div>

      {view === 'mes' && (
        <>
          <div className="month-nav">
            <button className="mnav-btn" onClick={prevMonth}>‹</button>
            <span className="mnav-label">{MONTHS_ES[month]} {year}</span>
            <button className="mnav-btn" onClick={nextMonth}>›</button>
          </div>

          <div className="cards">
            <div className="card card-green">
              <div className="card-icon-wrap green-wrap"><span className="card-icon">↑</span></div>
              <div><p className="card-label">Total Ingresos</p><p className="card-value green">{fmt(ingresos)}</p></div>
            </div>
            <div className="card card-red">
              <div className="card-icon-wrap red-wrap"><span className="card-icon">↓</span></div>
              <div><p className="card-label">Total Egresos</p><p className="card-value red">{fmt(egresos)}</p></div>
            </div>
            <div className="card card-purple">
              <div className="card-icon-wrap purple-wrap"><span style={{fontSize:'1.1rem'}}>🗓</span></div>
              <div><p className="card-label">Gastos Fijos</p><p className="card-value purple">{fmt(gastosFijos)}</p></div>
            </div>
          </div>

          <div className="form-card">
            <div className="form-card-header" onClick={() => setShowForm(!showForm)}>
              <div className="form-card-title">
                <span className="plus-icon">＋</span>
                <span>Nuevo Registro</span>
              </div>
              <span className="form-chevron">{showForm ? '▲' : '▼'}</span>
            </div>
            {showForm && (
              <div className="form-card-body">
                <TransactionForm onAdd={addTx} defaultDate={defaultDate} />
              </div>
            )}
          </div>

          <div className="filter-pills">
            {['todo','fijos','ingresos','egresos'].map(f => (
              <button key={f} className={`pill ${filter === f ? 'pill-active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'todo' ? 'Todo' : f === 'fijos' ? 'Gastos Fijos' : f === 'ingresos' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>

          <div className="history-card">
            <div className="history-header">
              <h2 className="history-title">Historial Reciente</h2>
              {txs.length > 0 && <button className="clear-btn" onClick={clearAll}>LIMPIAR TODO</button>}
            </div>
            <div className="history-divider" />
            {filtered.length === 0 ? (
              <p className="empty-msg">Sin movimientos{filter !== 'todo' ? ' en esta categoría' : ' este mes'}.</p>
            ) : (
              filtered.map(tx => (
                <div key={tx.id} className="tx-row">
                  <div className={`tx-icon-wrap ${tx.type === 'ingreso' ? 'tx-icon-green' : tx.category === 'Gasto Fijo' ? 'tx-icon-purple' : 'tx-icon-red'}`}>
                    <span style={{fontSize:'1rem'}}>{tx.type === 'ingreso' ? '↑' : tx.category === 'Gasto Fijo' ? '🗓' : '↓'}</span>
                  </div>
                  <div className="tx-info">
                    <p className="tx-desc">{tx.description}</p>
                    <p className="tx-date">{new Date(tx.date + 'T12:00:00').toLocaleDateString('es-MX')}</p>
                  </div>
                  <span className={`tx-amount ${tx.type === 'ingreso' ? 'green' : 'red'}`}>
                    {tx.type === 'ingreso' ? '+' : '- '}{fmt(tx.amount)}
                  </span>
                  <button className="tx-del" onClick={() => deleteTx(tx.id)}>🗑</button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {view === 'fijos' && (
        <FixedExpenses
          fixedExpenses={fixedExpenses}
          onSave={saveFixedExpenses}
          onDelete={deleteFixedExpense}
          onApply={applyFixedToMonth}
          currentMonthKey={monthKey}
        />
      )}

      {view === 'historial' && (
        <>
          {historicalMonths.length > 0 && (
            <div className="ht-totals">
              <div className="ht-total-card"><p className="ht-total-lbl">Ingresos totales</p><p className="ht-total-val green">{fmt(allTimeIng)}</p></div>
              <div className="ht-total-card"><p className="ht-total-lbl">Egresos totales</p><p className="ht-total-val red">{fmt(allTimeEg)}</p></div>
              <div className="ht-total-card"><p className="ht-total-lbl">Balance general</p><p className={`ht-total-val ${allTimeBal >= 0 ? 'green' : 'red'}`}>{allTimeBal < 0 ? '-' : ''}{fmt(allTimeBal)}</p></div>
            </div>
          )}
          {historicalMonths.length === 0 ? (
            <div className="history-card"><p className="empty-msg">Aún no hay meses registrados.</p></div>
          ) : (
            <div className="ht-list">
              {historicalMonths.map(m => (
                <div key={m.key} className="ht-month-card" onClick={() => goToMonth(m.year, m.month)}>
                  <div className="ht-month-left">
                    <div className="ht-month-badge">
                      <span className="ht-month-name">{MONTHS_ES[m.month]}</span>
                      <span className="ht-month-year">{m.year}</span>
                    </div>
                    <span className="ht-count">{m.count} mov.</span>
                  </div>
                  <div className="ht-month-stats">
                    <div className="ht-stat"><span className="ht-stat-lbl">Ingresos</span><span className="ht-stat-val green">+{fmt(m.ing)}</span></div>
                    <div className="ht-stat"><span className="ht-stat-lbl">Egresos</span><span className="ht-stat-val red">-{fmt(m.eg)}</span></div>
                    <div className="ht-stat"><span className="ht-stat-lbl">Balance</span><span className={`ht-stat-val ${m.bal >= 0 ? 'green' : 'red'}`}>{m.bal < 0 ? '-' : '+'}{fmt(m.bal)}</span></div>
                  </div>
                  <div className="ht-bars">
                    {m.ing > 0 && <div className="ht-bar-row"><span className="ht-bar-lbl">Ing</span><div className="ht-bar-track"><div className="ht-bar green-bar" style={{width:`${Math.min(100,(m.ing/Math.max(m.ing,m.eg))*100)}%`}}/></div></div>}
                    {m.eg > 0 && <div className="ht-bar-row"><span className="ht-bar-lbl">Eg</span><div className="ht-bar-track"><div className="ht-bar red-bar" style={{width:`${Math.min(100,(m.eg/Math.max(m.ing,m.eg))*100)}%`}}/></div></div>}
                  </div>
                  <span className="ht-arrow">›</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}