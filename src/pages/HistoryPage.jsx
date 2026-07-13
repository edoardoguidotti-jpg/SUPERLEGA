import MatchStatusBadge from "../components/MatchStatusBadge";
import {
  formatDate,
  getTeamsForMatch,
  isPlayedMatch,
  roleLabel,
} from "../utils";

export default function HistoryPage({
  matches,
  appearances,
  players,
  matchMvps,
  adminMode,
  onDeleteMatch,
  onCloseMvp,
  onCopyMvpLink,
  onOpenMvpLink,
  onOpenMatch,
  saving,
}) {
  const archiveMatches = [...matches].sort(
    (a, b) => new Date(b.match_date) - new Date(a.match_date),
  );

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p className="card-label">ARCHIVIO</p>
          <h2>Storico partite</h2>
        </div>
      </div>

      {archiveMatches.length === 0 ? (
        <div className="panel empty-state">
          <h3>Nessuna partita in archivio</h3>
          <p>
            Qui compariranno partite aperte, in attesa MVP e
            concluse.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {archiveMatches.map((match) => {
            const teams = getTeamsForMatch(
              match,
              appearances,
              players,
            );
            const winners = matchMvps
              .filter((item) => item.match_id === match.id)
              .map((item) =>
                players.find(
                  (player) => player.id === item.player_id,
                ),
              )
              .filter(Boolean);

            return (
              <details className="history-card" key={match.id}>
                <summary>
                  <div>
                    <strong>{formatDate(match.match_date)}</strong>
                    <span>
                      Chiari contro Scuri
                      {winners.length > 0
                        ? ` · 👑 ${winners
                            .map((player) => player.name)
                            .join(" e ")}`
                        : ""}
                    </span>
                  </div>

                  <div className="history-summary-right">
                    <MatchStatusBadge match={match} />
                    <div className="history-score">
                      {isPlayedMatch(match)
                        ? `${match.light_score} - ${match.dark_score}`
                        : "Da giocare"}
                    </div>
                  </div>
                </summary>

                <div className="history-teams">
                  <div>
                    <h4>Chiari</h4>
                    {teams.lightTeam.map((slot) => (
                      <span key={slot.player.id}>
                        {slot.player.name} ·{" "}
                        {roleLabel(slot.role)}
                      </span>
                    ))}
                  </div>

                  <div>
                    <h4>Scuri</h4>
                    {teams.darkTeam.map((slot) => (
                      <span key={slot.player.id}>
                        {slot.player.name} ·{" "}
                        {roleLabel(slot.role)}
                      </span>
                    ))}
                  </div>
                </div>

                {adminMode && (
                  <div className="history-admin">
                    {!isPlayedMatch(match) && (
                      <button
                        type="button"
                        className="save-match"
                        onClick={(event) => {
                          event.preventDefault();
                          onOpenMatch(match.id);
                        }}
                      >
                        Apri partita
                      </button>
                    )}

                    {match.status === "awaiting_mvp" && (
                      <>
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={(event) => {
                            event.preventDefault();
                            onCopyMvpLink(match);
                          }}
                        >
                          Copia link MVP
                        </button>

                        <button
                          type="button"
                          className="secondary-action"
                          onClick={(event) => {
                            event.preventDefault();
                            onOpenMvpLink(match);
                          }}
                        >
                          Apri voto MVP
                        </button>

                        <button
                          type="button"
                          className="save-match"
                          onClick={(event) => {
                            event.preventDefault();
                            onCloseMvp(match.id);
                          }}
                          disabled={saving}
                        >
                          Chiudi votazione
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="danger-button"
                      onClick={(event) => {
                        event.preventDefault();
                        onDeleteMatch(match);
                      }}
                      disabled={saving}
                    >
                      Elimina definitivamente
                    </button>
                  </div>
                )}
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
