export default function Header({
  session,
  adminMode,
  onToggleAdminMode,
  onLogout,
  onOpenLogin,
}) {
  return (
    <>
      <header className="header">
        <div className="brand-block">
          <img
            className="brand-logo"
            src="/superlega-logo.jpg"
            alt="Logo SUPERLEGA"
          />
          <div>
            <p className="eyebrow">IL CALCETTO DEL LUNEDÌ</p>
            <h1>SUPERLEGA</h1>
            <p className="subtitle">Ogni lunedì alle 19:00</p>
          </div>
        </div>

        <div className="mode-controls">
          {session ? (
            <>
              <button
                type="button"
                className={`mode-switch ${
                  adminMode ? "admin-active" : ""
                }`}
                onClick={onToggleAdminMode}
              >
                {adminMode ? "🛠 Admin" : "👤 Pubblica"}
              </button>
              <button
                type="button"
                className="small-button"
                onClick={onLogout}
              >
                Esci
              </button>
            </>
          ) : (
            <button
              type="button"
              className="mode-switch"
              onClick={onOpenLogin}
            >
              🔒 Accedi
            </button>
          )}
        </div>
      </header>

      {session && adminMode && (
        <div className="admin-banner">
          🛠 MODALITÀ ADMIN ATTIVA
        </div>
      )}
    </>
  );
}
