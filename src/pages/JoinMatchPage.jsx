import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { formatDate } from "../utils";

export default function JoinMatchPage({ token }) {
  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMatch();
  }, [token]);

  async function loadMatch() {
    setLoading(true);
    setError("");

    const [
      { data, error: matchError },
      { data: playersData, error: playersError },
    ] = await Promise.all([
      supabase
        .from("matches")
        .select("id, match_date, status, signup_token")
        .eq("signup_token", token)
        .maybeSingle(),
      supabase
        .from("players")
        .select("id, name, nickname, active")
        .eq("active", true)
        .order("name", { ascending: true }),
    ]);

    if (matchError || !data) {
      setError(matchError?.message || "Link iscrizione non valido.");
      setLoading(false);
      return;
    }

    if (playersError) {
      setError(playersError.message);
      setLoading(false);
      return;
    }

    setMatch(data);
    setPlayers(playersData || []);
    setLoading(false);
  }

  async function submitSignup(event) {
    event.preventDefault();

    const selectedPlayer = players.find(
      (player) => String(player.id) === selectedPlayerId,
    );
    const cleanName = isNewPlayer
      ? name.trim()
      : selectedPlayer?.name || "";

    if (!cleanName) {
      setError(
        isNewPlayer
          ? "Inserisci il tuo nome."
          : "Seleziona il tuo nome dalla lista.",
      );
      return;
    }

    setSaving(true);
    setError("");

    const { data, error: signupError } = await supabase.rpc(
      "register_match_signup",
      {
        p_signup_token: token,
        p_name: cleanName,
      },
    );

    if (signupError) {
      setError(signupError.message);
      setSaving(false);
      return;
    }

    setResult(data);
    setSaving(false);
  }

  if (loading) {
    return <div className="loading">Caricamento iscrizione…</div>;
  }

  if (error && !match) {
    return (
      <div className="standalone-page">
        <div className="panel error-panel">
          <h1>SUPERLEGA</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="standalone-page">
      <header className="mvp-header">
        <img
          src="/superlega-logo.jpg"
          alt="SUPERLEGA"
          className="brand-logo"
        />
        <div>
          <p className="eyebrow">ISCRIZIONE PARTITA</p>
          <h1>SUPERLEGA</h1>
          <p className="subtitle">{formatDate(match.match_date)}</p>
        </div>
      </header>

      {result ? (
        <div className="panel vote-success">
          <div className="success-icon">✓</div>
          <p className="card-label">
            {result.status === "confirmed"
              ? "CONVOCATO"
              : "LISTA D’ATTESA"}
          </p>
          <h2>
            {result.status === "confirmed"
              ? "Sei dentro"
              : "Sei in lista d’attesa"}
          </h2>
          <p>
            {result.status === "confirmed"
              ? "Sei tra i 10 convocati per la prossima partita."
              : "Se qualcuno rinuncia, l’admin potrà promuoverti tra i convocati."}
          </p>

          <button
            type="button"
            className="secondary-action"
            onClick={() => {
              setResult(null);
              setName("");
              setSelectedPlayerId("");
              setIsNewPlayer(false);
              setError("");
            }}
          >
            Iscrivi un altro
          </button>
        </div>
      ) : (
        <form className="login-panel" onSubmit={submitSignup}>
          <p className="card-label">CONFERMA PRESENZA</p>
          <h3>Vuoi giocare lunedì?</h3>
          <p className="helper-text">
            I primi 10 entrano tra i convocati. Gli altri finiscono
            automaticamente in lista d’attesa.
          </p>

          {isNewPlayer ? (
            <>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome e cognome"
                autoComplete="name"
                required
              />

              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setIsNewPlayer(false);
                  setName("");
                  setError("");
                }}
              >
                Sono già nella lista
              </button>
            </>
          ) : (
            <>
              <select
                value={selectedPlayerId}
                onChange={(event) => {
                  setSelectedPlayerId(event.target.value);
                  setError("");
                }}
                required
              >
                <option value="">Scegli il tuo nome</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                    {player.nickname ? ` (${player.nickname})` : ""}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setIsNewPlayer(true);
                  setSelectedPlayerId("");
                  setError("");
                }}
              >
                Non sei nella lista? Aggiungi il tuo nome
              </button>
            </>
          )}

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={saving}>
            {saving ? "Iscrizione…" : "Mi iscrivo"}
          </button>
        </form>
      )}
    </div>
  );
}
