import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      errorMessage: ""
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Errore sconosciuto"
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Errore SUPERLEGA:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#07111f",
            color: "#ffffff",
            fontFamily: "Arial, sans-serif"
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "28px",
              borderRadius: "20px",
              background: "#101d2e",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.35)"
            }}
          >
            <h1 style={{ marginTop: 0 }}>SUPERLEGA</h1>

            <p>
              Si è verificato un problema durante il caricamento
              dell’applicazione.
            </p>

            <p
              style={{
                padding: "12px",
                borderRadius: "10px",
                background: "#07111f",
                fontSize: "14px",
                overflowWrap: "anywhere"
              }}
            >
              {this.state.errorMessage}
            </p>

            <button
              type="button"
              onClick={this.handleReload}
              style={{
                border: 0,
                borderRadius: "10px",
                padding: "12px 20px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Ricarica l’app
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}