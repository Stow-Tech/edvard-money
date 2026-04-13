import React, { useState } from 'react';
import './FixedExpenses.css';

const CATEGORIES = [
  'Renta','Servicios','Internet','Teléfono','Transporte',
  'Salud','Educación','Suscripciones','Deuda','Ahorro','Otro gasto fijo'
];

const CATEGORY_EMOJI = {
  'Renta':'🏠','Servicios':'⚡','Internet':'📶','Teléfono':'📱',
  'Transporte':'🚗','Salud':'❤️','Educación':'📚','Suscripciones':'📺',
  'Deuda':'📋','Ahorro':'🐷','Otro gasto fijo':'📌'
};

function fmt(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0
  }).format(Math.abs(n));
}

const emptyForm = { description: '', amount: '', category: 'Renta', day: '1' };

export default function FixedExpenses({ fixedExpenses, onSave, onDelete, onApply, currentMonthKey }) {
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [editing, setEditing]     = useState(null); // id being edited
  const [applied, setApplied]     = useState(false);

  const total = fixedExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const handleSubmit = () => {
    if (!form.description.trim() || !form.amount || isNaN(Number(form.amount))) return;
    if (editing !== null) {
      onSave(fixedExpenses.map(e => e.id === editing ? { ...e, ...form, amount: Number(form.amount) } : e));
      setEditing(null);
    } else {
      onSave([...fixedExpenses, { ...form, amount: Number(form.amount), id: Date.now() }]);
    }
    setForm(emptyForm);
    setShowForm(false);
  };

  const startEdit = (exp) => {
    setForm({ description: exp.description, amount: String(exp.amount), category: exp.category, day: String(exp.day) });
    setEditing(exp.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  };

  const handleApply = () => {
    onApply(fixedExpenses, currentMonthKey);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="fe-container">
      {/* Header */}
      <div className="fe-header">
        <div className="fe-header-left">
          <span className="fe-icon-wrap">🗓</span>
          <div>
            <h2 className="fe-title">Gastos Fijos</h2>
            <p className="fe-sub">{fixedExpenses.length} concepto{fixedExpenses.length !== 1 ? 's' : ''} · {fmt(total)}/mes</p>
          </div>
        </div>
        <div className="fe-header-actions">
          {fixedExpenses.length > 0 && (
            <button className={`fe-apply-btn ${applied ? 'fe-apply-done' : ''}`} onClick={handleApply}>
              {applied ? '✓ Aplicado' : '⚡ Aplicar al mes'}
            </button>
          )}
          <button className="fe-add-btn" onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(!showForm); }}>
            {showForm && editing === null ? '✕' : '＋ Agregar'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="fe-form">
          <div className="fe-form-grid">
            <div className="fe-field fe-field-wide">
              <label className="fe-label">Descripción</label>
              <input
                className="fe-input"
                placeholder="Ej. Netflix, Renta, Gym..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="fe-field">
              <label className="fe-label">Monto (MXN)</label>
              <input
                className="fe-input"
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="fe-field">
              <label className="fe-label">Día del mes</label>
              <input
                className="fe-input"
                type="number"
                min="1" max="31"
                placeholder="1"
                value={form.day}
                onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
              />
            </div>
            <div className="fe-field fe-field-wide">
              <label className="fe-label">Categoría</label>
              <select
                className="fe-input"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="fe-form-actions">
            <button className="fe-cancel-btn" onClick={cancelForm}>Cancelar</button>
            <button className="fe-save-btn" onClick={handleSubmit}>
              {editing !== null ? '💾 Guardar cambios' : '➕ Agregar'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {fixedExpenses.length === 0 && !showForm ? (
        <div className="fe-empty">
          <p>Sin gastos fijos aún.</p>
          <p className="fe-empty-sub">Agrega renta, servicios, suscripciones y más.</p>
        </div>
      ) : (
        <div className="fe-list">
          {fixedExpenses.map(exp => (
            <div key={exp.id} className="fe-item">
              <div className="fe-item-icon">{CATEGORY_EMOJI[exp.category] || '📌'}</div>
              <div className="fe-item-info">
                <span className="fe-item-desc">{exp.description}</span>
                <span className="fe-item-meta">{exp.category} · Día {exp.day}</span>
              </div>
              <span className="fe-item-amount">-{fmt(exp.amount)}</span>
              <div className="fe-item-actions">
                <button className="fe-edit-btn" onClick={() => startEdit(exp)}>✏️</button>
                <button className="fe-del-btn" onClick={() => onDelete(exp.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
