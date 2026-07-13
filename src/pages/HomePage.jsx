import MatchStatusBadge from "../components/MatchStatusBadge";
import { formatDate } from "../utils";

export default function HomePage({
  latestMatch,
  activeMatch,
  activeTeams,
  upcomingMatches,
  players,
  appearances,
  onNavigate,
  onOpenMatch,
  adminMode,
}) {
  return (
    <section className="page">
      <div className="hero-card">
        <p className="card-label">
          {activeMatch ? "PROSSIMA PARTITA" : "SUPERLEGA"}
        </p>

        <h2>
          {activeMatch
            ? formatDate(activeMatch.match_date)
            : "Lunedì alle 19:00"}
        </h2>

        <p>
          {activeMatch
            ? "Le formazioni sono pubblicate e visibili a tutti."
            : adminMode
              ? "Crea e pubblica la prossima partita."
              : "Le prossime formazioni saranno pubblicate qui."}
        </p>

        <button
          type="button"
          onClick={() =>
            activeMatch
              ? onOpenMatch(activeMatch.id)
              : onNavigate("match")
          }
        >
          {activeMatch
            ? "Vedi le formazioni"
            : "Apri la partita"}
        </button>
      </div>

      {activeMatch && (
        <div className="panel formation-preview">
          <div className="status-row">
            <div>
              <p className="card-label">
                FORMAZIONI PUBBLICATE
              </p>
              <h3>Chiari contro Scuri</h3>
            </div>
            <MatchStatusBadge match={activeMatch} />
          </div>

          <div className="mini-teams">
            <div>
              <strong>Chiari</strong>
              <span>
                {activeTeams.lightTeam
                  .map((slot) => slot.player.name)
                  .join(" · ")}
              </span>
            </div>

            <div>
              <strong>Scuri</strong>
              <span>
                {activeTeams.darkTeam
                  .map((slot) => slot.player.name)
                  .join(" · ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {upcomingMatches.length > 0 && (
        <div className="panel">
          <div className="status-row">
            <div>
              <p className="card-label">PARTITE APERTE</p>
              <h3>Calendario pubblicato</h3>
            </div>

            <button
              type="button"
              className="secondary-action"
              onClick={() => onNavigate("history")}
            >
              Vedi archivio
            </button>
          </div>

          <div className="open-match-list">
            {upcomingMatches.map((match) => {
              const presentCount = appearances.filter(
                (appearance) =>
                  appearance.match_id === match.id,
              ).length;

              return (
                <button
                  type="button"
                  className="open-match-row"
                  key={match.id}
                  onClick={() => onOpenMatch(match.id)}
                >
                  <span>{formatDate(match.match_date)}</span>
                  <strong>Chiari vs Scuri</strong>
                  <small>
                    Da giocare · {presentCount} convocati
                  </small>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="quick-grid">
        <button
          type="button"
          onClick={() => onNavigate("ranking")}
        >
          <strong>🏆 Classifica</strong>
          <span>Vittorie, MVP e presenze</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("history")}
        >
          <strong>📜 Storico</strong>
          <span>Aperte, MVP e concluse</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("players")}
        >
          <strong>⚽ Giocatori</strong>
          <span>{players.length} registrati</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("match")}
        >
          <strong>🟢 Partita</strong>
          <span>Formazioni e risultato</span>
        </button>
      </div>

      {latestMatch && (
        <div className="panel">
          <p className="card-label">ULTIMA PARTITA</p>

          <div className="score-line">
            <strong>Chiari</strong>
            <span>
              {latestMatch.light_score} -{" "}
              {latestMatch.dark_score}
            </span>
            <strong>Scuri</strong>
          </div>

          <p>
            {formatDate(latestMatch.match_date)} ·{" "}
            {
              appearances.filter(
                (appearance) =>
                  appearance.match_id === latestMatch.id,
              ).length
            }{" "}
            presenti
          </p>
        </div>
      )}
    </section>
  );
}
