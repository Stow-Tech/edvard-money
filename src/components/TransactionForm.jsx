import React, { useState } from 'react';
import './TransactionForm.css';

const CATS_ING = ['Salario','Freelance','Negocio','Inversión','Regalo','Otro ingreso'];
const CATS_EG  = ['Comida','Transporte','Servicios','Salud','Entretenimiento','Ropa','Educación','Deuda','Otro gasto'];

export default function TransactionForm({ onAdd, defaultDate }) {
  const [type, setType]     = useState('egreso');
  const [amount, setAmount] = useState('');
  const [desc, setDesc]     = useState('');
  const [cat, setCat]       = useState('');
  const [date, setDate]     = useState(defaultDate || '');

  const cats = type === 'ingreso' ? CATS_ING : [...CATS_EG, 'Gasto Fijo'];

  const handleType = (t) => { setType(t); setCat(''); };

  const handleSave = () => {
    if (!amount || !desc || !date) return;
    onAdd({ type, amount: parseFloat(amount), description: desc, category: cat, date });
    setAmount(''); setDesc(''); setCat('');
  };

  return (
    <div className="tf-wrap">
      {/* TYPE TOGGLE */}
      <div className="tf-toggle">
        <button
          className={`tf-type-btn ${type === 'ingreso' ? 'active-ing' : ''}`}
          onClick={() => handleType('ingreso')}
        >
          ↑ Ingreso
        </button>
        <button
          className={`tf-type-btn ${type === 'egreso' ? 'active-eg' : ''}`}
          onClick={() => handleType('egreso')}
        >
          ↓ Egreso
        </button>
      </div>

      <div className="tf-field">
        <label className="tf-label">DESCRIPCIÓN</label>
        <input
          type="text"
          placeholder="Ej: Sueldo, Renta, Comida..."
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <div className="tf-field">
        <label className="tf-label">MONTO</label>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          min="0"
          step="0.01"
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      <div className="tf-field">
        <label className="tf-label">CATEGORÍA</label>
        <select value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">Selecciona categoría</option>
          {cats.map(c => <option key={c} value={c}>{c}{c === 'Gasto Fijo' ? ' (-)' : ''}</option>)}
        </select>
      </div>

      <div className="tf-field">
        <label className="tf-label">FECHA</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <button
        className="tf-save-btn"
        onClick={handleSave}
        disabled={!amount || !desc || !date}
      >
        Agregar Transacción
      </button>
    </div>
  );
}