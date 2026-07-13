import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import PlayerAvatar from "../components/PlayerAvatar";
import { formatDate } from "../utils";

const rememberedPlayerKey = "superlega:mvp-player-id";

export default function MvpVotePage({ token }) {
  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [voterId, setVoterId] = useState("");
  const [verified, setVerified] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [rememberedPlayer, setRememberedPlayer] = useState(null);

  useEffect(() => {
    loadMatch();
  }, [token]);

  useEffect(() => {
    const storedPlayerId = window.localStorage.getItem(
      rememberedPlayerKey,
    );

    if (!storedPlayerId || players.length === 0) return;

    const player = players.find(
      (item) => String(item.id) === String(storedPlayerId),
    );

    if (!player) {
      window.localStorage.removeItem(rememberedPlayerKey);
      setRememberedPlayer(null);
      return;
    }

    setRememberedPlayer(player);
    setVoterId(String(player.id));
  }, [players]);

  async function loadMatch() {
    setLoading(true);
    setError("");

    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select(
        "id, match_date, light_score, dark_score, status, mvp_status, mvp_token",
      )
      .eq("mvp_token", token)
      .maybeSingle();

    if (matchError || !matchData) {
      setError(matchError?.message || "Partita non trovata.");
      setLoading(false);
      return;
    }

    const { data: appearances, error: appearanceError } =
      await supabase
        .from("appearances")
        .select("player_id")
        .eq("match_id", matchData.id);

    if (appearanceError) {
      setError(appearanceError.message);
      setLoading(false);
      return;
    }

    const playerIds = appearances.map((item) => item.player_id);

    const { data: playerData, error: playerError } =
      await supabase
        .from("players")
        .select("id, name, nickname, photo_url, active")
        .in("id", playerIds)
        .order("name");

    if (playerError) {
      setError(playerError.message);
    } else {
      setMatch(matchData);
      setPlayers(playerData || []);
    }

    setLoading(false);
  }

  const candidates = useMemo(
    () =>
      players.filter(
        (player) => String(player.id) !== String(voterId),
      ),
    [players, voterId],
  );

  async function verifyIdentity(event) {
    event.preventDefault();
    setError("");

    if (!voterId) {
      setError("Seleziona il tuo nome per continuare.");
      return;
    }

    window.localStorage.setItem(
      rememberedPlayerKey,
      String(voterId),
    );
    setRememberedPlayer(
      players.find(
        (player) => String(player.id) === String(voterId),
      ) || null,
    );
    setVerified(true);
  }

  function forgetRememberedPlayer() {
    window.localStorage.removeItem(rememberedPlayerKey);
    setRememberedPlayer(null);
    setVoterId("");
    setError("");
  }

  async function castVote() {
    if (!selectedPlayerId) return;

    const selected = players.find(
      (player) => player.id === selectedPlayerId,
    );

    if (
      !window.confirm(
        `Confermi il voto per ${selected?.name || "questo giocatore"}?`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    const { error: voteError } = await supabase.rpc(
      "cast_mvp_vote",
      {
        p_match_token: token,
        p_voter_player_id: Number(voterId),
        p_voted_player_id: Number(selectedPlayerId),
        p_pin: "",
      },
    );

    if (voteError) {
      setError(voteError.message);
      setSaving(false);
      return;
    }

    setDone(true);
    setSaving(false);
  }

  if (loading) {
    return <div className="loading">Caricamento votazione…</div>;
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

  if (match.mvp_status !== "open") {
    return (
      <div className="standalone-page">
        <div className="panel empty-state">
          <p className="card-label">SUPERLEGA MVP</p>
          <h2>Votazione non disponibile</h2>
          <p>
            La votazione non è ancora aperta oppure è già stata
            chiusa.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    const votedPlayer = players.find(
      (player) => player.id === selectedPlayerId,
    );

    return (
      <div className="standalone-page">
        <div className="panel vote-success">
          <div className="success-icon">✓</div>
          <p className="card-label">VOTO REGISTRATO</p>
          <h2>Hai votato {votedPlayer?.name}</h2>
          <p>Il tuo voto MVP è stato salvato.</p>
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
          <p className="eyebrow">VOTAZIONE MVP</p>
          <h1>SUPERLEGA</h1>
          <p className="subtitle">
            {formatDate(match.match_date)}
          </p>
        </div>
      </header>

      <div className="panel">
        <div className="score-line">
          <strong>Chiari</strong>
          <span>
            {match.light_score} - {match.dark_score}
          </span>
          <strong>Scuri</strong>
        </div>
      </div>

      {!verified ? (
        <form className="login-panel" onSubmit={verifyIdentity}>
          <p className="card-label">IDENTIFICAZIONE</p>
          <h3>Chi sei?</h3>

          {rememberedPlayer && (
            <div className="remembered-player">
              <span>
                Profilo ricordato:{" "}
                <strong>{rememberedPlayer.name}</strong>
              </span>
              <button
                type="button"
                className="small-button"
                onClick={forgetRememberedPlayer}
              >
                Cambia
              </button>
            </div>
          )}

          <select
            value={voterId}
            onChange={(event) => setVoterId(event.target.value)}
            required
          >
            <option value="">Seleziona il tuo nome</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>

          <p className="helper-text">
            Il telefono ricorda solo il tuo nome. Può votare
            solo chi era tra i 10 convocati.
          </p>

          {error && <div className="error">{error}</div>}

          <button type="submit">Continua</button>
        </form>
      ) : (
        <section className="page">
          <div className="page-title">
            <div>
              <p className="card-label">SCEGLI L’MVP</p>
              <h2>Il migliore in campo</h2>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="candidate-grid">
            {candidates.map((player) => (
              <button
                type="button"
                key={player.id}
                className={`candidate-card ${
                  selectedPlayerId === player.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedPlayerId(player.id)
                }
              >
                <PlayerAvatar player={player} size="xl" />
                <strong>{player.name}</strong>
                {player.nickname && (
                  <span>“{player.nickname}”</span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="save-match"
            disabled={!selectedPlayerId || saving}
            onClick={castVote}
          >
            {saving ? "Registrazione…" : "Conferma voto"}
          </button>
        </section>
      )}
    </div>
  );
}
