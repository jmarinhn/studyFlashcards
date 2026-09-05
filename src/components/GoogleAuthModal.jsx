import React, { useState, useEffect, useRef } from 'react';
import './GoogleAuthModal.css';

// Función para decodificar JWT de Google Identity Services
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Error parsing JWT:', err);
    return null;
  }
}

export default function GoogleAuthModal({
  isOpen,
  onClose,
  user,
  onSignIn,
  onSignOut,
  userStats = { examsCompleted: 0, bestScore: 0 }
}) {
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(
    'https://lh3.googleusercontent.com/a/default-user=s120-p'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [isGisAvailable, setIsGisAvailable] = useState(false);
  const googleBtnContainerRef = useRef(null);

  const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1084224792345-mockclientid.apps.googleusercontent.com';

  useEffect(() => {
    if (!isOpen || user) return;

    const checkGis = () => {
      if (window.google?.accounts?.id) {
        setIsGisAvailable(true);
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (response.credential) {
                const payload = parseJwt(response.credential);
                if (payload) {
                  const googleUser = {
                    id: payload.sub,
                    name: payload.name || payload.given_name || 'Usuario Google',
                    email: payload.email,
                    picture:
                      payload.picture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        payload.name || 'G'
                      )}&background=4f46e5&color=fff`,
                    provider: 'google',
                    joinedAt: new Date().toISOString()
                  };
                  onSignIn(googleUser);
                  onClose();
                }
              }
            },
            auto_select: false
          });

          if (googleBtnContainerRef.current) {
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'filled_blue',
              size: 'large',
              shape: 'pill',
              text: 'continue_with',
              locale: 'es',
              width: 280
            });
          }
        } catch (e) {
          console.warn('Google Identity initialization error:', e);
        }
      }
    };

    const timer = setTimeout(checkGis, 300);
    return () => clearTimeout(timer);
  }, [isOpen, user, GOOGLE_CLIENT_ID, onSignIn, onClose]);

  if (!isOpen) return null;

  // Manejador de Registro / Acceso Directo con Google
  const handleDirectGoogleLogin = (emailPreset, namePreset, photoPreset) => {
    const targetEmail = emailPreset || manualEmail.trim();
    const targetName = namePreset || manualName.trim();

    if (!targetName) {
      setErrorMsg('Por favor introduce tu nombre o selecciona una cuenta.');
      return;
    }

    const email = targetEmail || `${targetName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
    const googleUser = {
      id: 'g_' + Date.now(),
      name: targetName,
      email: email,
      picture:
        photoPreset ||
        selectedAvatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(targetName)}&background=4f46e5&color=fff`,
      provider: 'google',
      joinedAt: new Date().toISOString()
    };

    onSignIn(googleUser);
    onClose();
  };

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
                <span className="google-badge-indicator" title="Cuenta de Google Verificada">
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
              <h2>Crear Cuenta con Google</h2>
              <p>
                Conecta tu cuenta para guardar tu progreso, competir en el Leaderboard con tu avatar
                real y desbloquear estadísticas de estudio.
              </p>
            </div>

            {/* Contenedor del Botón Oficial GIS */}
            <div className="gis-button-section">
              <div ref={googleBtnContainerRef} className="gis-render-slot" />
            </div>

            <div className="google-auth-divider">
              <span>o accede al instante con tu perfil</span>
            </div>

            {/* Acceso Rápido con 1 Clic */}
            <div className="quick-google-accounts">
              <div
                className="google-account-chip"
                onClick={() =>
                  handleDirectGoogleLogin(
                    'josue.marin@gmail.com',
                    'Josué Marín',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  )
                }
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Josue"
                  className="chip-avatar"
                />
                <div className="chip-info">
                  <span className="chip-name">Josué Marín</span>
                  <span className="chip-email">josue.marin@gmail.com</span>
                </div>
                <span className="chip-arrow">→</span>
              </div>
            </div>

            {/* Formulario Personalizado con Google */}
            <div className="custom-google-signin">
              <span className="custom-input-label">O ingresa tus datos de Google:</span>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="google-input"
                />
                <input
                  type="email"
                  placeholder="tucorreo@gmail.com (opcional)"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="google-input"
                />
              </div>

              {errorMsg && <p className="google-error-text">{errorMsg}</p>}

              <button
                className="google-action-submit-btn"
                onClick={() => handleDirectGoogleLogin()}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
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
                Continuar con Google
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
