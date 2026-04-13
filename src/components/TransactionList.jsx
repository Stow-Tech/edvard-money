import React, { useState } from 'react';
import './TransactionList.css';

function fmt(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(n);
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

const CATEGORY_EMOJI = {
  'Salario': '💼', 'Freelance': '💻', 'Negocio': '🏪', 'Inversión': '📈',
  'Regalo': '🎁', 'Otro ingreso': '💰', 'Comida': '🍽️', 'Transporte': '🚗',
  'Renta': '🏠', 'Servicios': '⚡', 'Salud': '❤️', 'Entretenimiento': '🎬',
  'Ropa': '👕', 'Educación': '📚', 'Ahorro': '🐷', 'Deuda': '📋',
  'Otro gasto': '💸'
};

export default function TransactionList({ transactions, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <p className="empty-title">Sin movimientos este mes</p>
        <p className="empty-sub">Toca "＋ Agregar" para registrar tu primer ingreso o egreso</p>
      </div>
    );
  }

  // Group by date
  const grouped = transactions.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="tx-list">
      {sortedDates.map(date => {
        const dayTxs = grouped[date];
        const dayTotal = dayTxs.reduce((sum, t) =>
          t.type === 'ingreso' ? sum + Number(t.amount) : sum - Number(t.amount), 0);

        return (
          <div key={date} className="day-group">
            <div className="day-header">
              <span className="day-label">{formatDate(date)}</span>
              <span className={`day-total ${dayTotal >= 0 ? 'pos' : 'neg'}`}>
                {dayTotal >= 0 ? '+' : ''}{fmt(dayTotal)}
              </span>
            </div>
            <div className="day-txs">
              {dayTxs.map(tx => (
                <div
                  key={tx.id}
                  className={`tx-item ${tx.type === 'ingreso' ? 'tx-ingreso' : 'tx-egreso'}`}
                >
                  <div className="tx-emoji">
                    {CATEGORY_EMOJI[tx.category] || (tx.type === 'ingreso' ? '💰' : '💸')}
                  </div>
                  <div className="tx-info">
                    <span className="tx-desc">{tx.description}</span>
                    {tx.category && (
                      <span className="tx-cat">{tx.category}</span>
                    )}
                  </div>
                  <div className="tx-right">
                    <span className={`tx-amount ${tx.type === 'ingreso' ? 'amount-ingreso' : 'amount-egreso'}`}>
                      {tx.type === 'ingreso' ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                    <button
                      className={`tx-delete ${confirmDelete === tx.id ? 'confirm' : ''}`}
                      onClick={() => handleDelete(tx.id)}
                      title="Eliminar"
                    >
                      {confirmDelete === tx.id ? '¿Seguro?' : '✕'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
