import React, { useState, useEffect, useRef } from 'react';
import './GoogleAuthModal.css';
import { loadGoogleIdentity, bindGoogleIdentity, profileFromCredential } from '../utils/googleIdentity';

export default function GoogleAuthModal({
  isOpen,
  onClose,
  user,
  onSignIn,
  onSignOut,
  userStats = { examsCompleted: 0, bestScore: 0 }
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const googleBtnContainerRef = useRef(null);
  const callbacks = useRef({ onSignIn, onClose });
  callbacks.current = { onSignIn, onClose };
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  useEffect(() => {
    if (!isOpen || user) return;
    setErrorMsg('');
    if (!/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId) || clientId.includes('mockclientid')) {
      setStatus('configuration');
      setErrorMsg('El acceso con Google aún no está configurado. Puedes seguir estudiando sin iniciar sesión.');
      return;
    }
    let active = true;
    let unbind;
    const container = googleBtnContainerRef.current;
    container.replaceChildren();
    setStatus('loading');
    loadGoogleIdentity().then((api) => {
      if (!active) return;
      unbind = bindGoogleIdentity(api, clientId, (response) => {
        if (!active) return;
        try {
          const profile = profileFromCredential(response.credential, clientId);
          callbacks.current.onSignIn(profile);
          callbacks.current.onClose();
        } catch (error) { setErrorMsg(error.message); }
      });
      api.renderButton(container, {
        theme: 'filled_blue', size: 'large', shape: 'pill',
        text: 'continue_with', locale: 'es', width: 280,
      });
      setStatus('ready');
    }).catch((error) => {
      if (!active) return;
      setStatus('error');
      setErrorMsg(error.message || 'No se pudo iniciar Google. Vuelve a intentarlo.');
    });
    return () => {
      active = false;
      unbind?.();
      container.replaceChildren();
    };
  }, [isOpen, user, clientId, attempt]);

  if (!isOpen) return null;

  return (
    <div className="google-modal-overlay" onClick={onClose}>
      <div
        className="google-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="google-modal-close" onClick={onClose} title="Cerrar">
          ✕
        </button>

        {user ? (
          /* ====================================================
             VISTA 1: USUARIO CONECTADO (PERFIL DE GOOGLE)
             ==================================================== */
          <div className="google-profile-view">
            <div className="profile-header-banner">
              <div className="profile-avatar-wrapper">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="profile-avatar-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=4f46e5&color=fff`;
                  }}
                />
                <span className="google-badge-indicator" title="Perfil de Google">
                  <svg className="google-svg-icon" viewBox="0 0 24 24" width="16" height="16">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div className="profile-identity">
              <h3 className="profile-name">{user.name}</h3>
              <p className="profile-email">{user.email || 'Cuenta de Google activa'}</p>
              <span className="profile-status-pill">✓ Cuenta Conectada</span>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat-box">
                <span className="stat-number">{userStats.examsCompleted || 0}</span>
                <span className="stat-label">Exámenes Listos</span>
              </div>
              <div className="profile-stat-box">
                <span className="stat-number">{userStats.bestScore || 0}%</span>
                <span className="stat-label">Mejor Puntaje</span>
              </div>
            </div>

            <p className="profile-sync-note">
              Tus puntuaciones en el Leaderboard se registrarán con este perfil.
            </p>

            <div className="profile-actions-row">
              <button
                className="google-signout-btn"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
              >
                🚪 Cerrar Sesión
              </button>
              <button className="google-close-btn" onClick={onClose}>
                Aceptar
              </button>
            </div>
          </div>
        ) : (
          /* ====================================================
             VISTA 2: CREAR CUENTA / ACCEDER CON GOOGLE
             ==================================================== */
          <div className="google-login-view">
            <div className="google-icon-header">
              <div className="g-logo-circle">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h2>Iniciar sesión con Google</h2>
              <p>
                Usa tu perfil de Google en el Leaderboard. Tu progreso y tus resultados se guardan
                en este navegador.
              </p>
            </div>

            {/* Contenedor del Botón Oficial GIS */}
            <div className="gis-button-section">
              <div ref={googleBtnContainerRef} className="gis-render-slot" />
            </div>

            {status === 'loading' && <p role="status">Cargando Google…</p>}
            {errorMsg && <p className="google-error-text" role="alert">{errorMsg}</p>}
            {status === 'error' && (
              <button className="google-action-submit-btn" onClick={() => setAttempt((value) => value + 1)}>
                Reintentar
              </button>
            )}
            <button className="google-close-btn" onClick={onClose}>Continuar sin cuenta</button>
          </div>
        )}
      </div>
    </div>
  );
}
