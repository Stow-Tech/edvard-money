import React, { useState } from 'react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import './Auth.css';

export default function Auth() {
  const [mode, setMode]       = useState('login');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      const msgs = {
        'auth/user-not-found':       'No existe una cuenta con ese correo.',
        'auth/wrong-password':       'Contraseña incorrecta.',
        'auth/email-already-in-use': 'Ese correo ya está registrado.',
        'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres.',
        'auth/invalid-email':        'El correo no es válido.',
        'auth/invalid-credential':   'Correo o contraseña incorrectos.',
      };
      setError(msgs[e.code] || 'Ocurrió un error. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-app-name">Edvard Money</h1>
          <p className="auth-sub">Controla tu libertad financiera</p>
        </div>

        <div className="auth-toggle">
          <button
            className={`auth-toggle-btn ${mode === 'login' ? 'auth-toggle-active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Iniciar sesión
          </button>
          <button
            className={`auth-toggle-btn ${mode === 'register' ? 'auth-toggle-active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Crear cuenta
          </button>
        </div>

        <div className="auth-field">
          <label className="auth-label">CORREO</label>
          <input
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">CONTRASEÑA</label>
          <input
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button
          className="auth-submit"
          onClick={handleSubmit}
          disabled={loading || !email || !password}
        >
          {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </div>
    </div>
  );
}