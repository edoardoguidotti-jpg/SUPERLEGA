import FootballPitch from "../components/FootballPitch";
import FormationComposer from "../components/FormationComposer";
import MatchStatusBadge from "../components/MatchStatusBadge";
import { formatDate, isValidFormation } from "../utils";

export default function MatchPage({
  players,
  adminMode,
  activeMatch,
  activeTeams,
  creatingNewMatch,
  onBeginNewMatch,
  selectedPlayers,
  toggleSelectedPlayer,
  createTeams,
  lightTeam,
  darkTeam,
  updateFormationSlot,
  matchDate,
  setMatchDate,
  lightScore,
  setLightScore,
  darkScore,
  setDarkScore,
  saveFormation,
  saveResult,
  beginEditFormation,
  cancelEditFormation,
  deleteMatch,
  editingMatchId,
  saving,
  mvpVotes,
  onCopyMvpLink,
  onOpenMvpLink,
  onDeleteMvpVote,
  onCloseMvp,
}) {
  const matchPlayers = [
    ...activeTeams.lightTeam,
    ...activeTeams.darkTeam,
  ].map((slot) => slot.player);
  const votedPlayerIds = new Set(
    mvpVotes.map((vote) => String(vote.voter_player_id)),
  );
  const missingVoters = matchPlayers.filter(
    (player) => !votedPlayerIds.has(String(player.id)),
  );
  const playerName = (playerId) =>
    matchPlayers.find(
      (player) => String(player.id) === String(playerId),
    )?.name || "Giocatore";

  if (activeMatch && !editingMatchId && !creatingNewMatch) {
    return (
      <section className="page">
        <div className="page-title">
          <div>
            <p className="card-label">
              FORMAZIONI PUBBLICATE
            </p>
            <h2>{formatDate(activeMatch.match_date)}</h2>
          </div>

          <div className="page-title-actions">
            <MatchStatusBadge match={activeMatch} />

            {adminMode && (
              <button
                type="button"
                className="save-match"
                onClick={onBeginNewMatch}
              >
                Nuova partita
              </button>
            )}
          </div>
        </div>

        <FootballPitch
          lightTeam={activeTeams.lightTeam}
          darkTeam={activeTeams.darkTeam}
        />

        {adminMode && (
          <div className="match-admin-actions">
            {activeMatch.status !== "awaiting_mvp" && (
              <button
                type="button"
                className="secondary-action"
                onClick={() =>
                  beginEditFormation(activeMatch)
                }
              >
                Modifica formazione
              </button>
            )}

            {activeMatch.status === "awaiting_mvp" && (
              <>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => onCopyMvpLink(activeMatch)}
                >
                  Copia link MVP
                </button>

                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => onOpenMvpLink(activeMatch)}
                >
                  Apri voto MVP
                </button>

                <button
                  type="button"
                  className="save-match"
                  onClick={() => onCloseMvp(activeMatch.id)}
                  disabled={saving}
                >
                  Chiudi votazione MVP
                </button>
              </>
            )}

            <button
              type="button"
              className="danger-button"
              onClick={() => deleteMatch(activeMatch)}
              disabled={saving}
            >
              Elimina partita
            </button>
          </div>
        )}

        {activeMatch.status === "awaiting_mvp" ? (
          <>
            <div className="panel mvp-open-panel">
              <p className="card-label">VOTAZIONE APERTA</p>
              <h3>La partita è in attesa dell’MVP</h3>
              <p>
                L’admin può copiare il link, condividerlo nel
                gruppo WhatsApp e chiudere la votazione quando
                vuole.
              </p>
            </div>

            {adminMode && (
              <div className="panel mvp-admin-panel">
                <div className="status-row">
                  <div>
                    <p className="card-label">CONTROLLO VOTI</p>
                    <h3>
                      Voti ricevuti {mvpVotes.length}/
                      {matchPlayers.length}
                    </h3>
                  </div>
                </div>

                {mvpVotes.length > 0 ? (
                  <div className="vote-audit-list">
                    {mvpVotes.map((vote) => (
                      <div className="vote-audit-row" key={vote.id}>
                        <div>
                          <strong>
                            {playerName(vote.voter_player_id)}
                          </strong>
                          <span>
                            ha votato{" "}
                            {playerName(vote.voted_player_id)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => onDeleteMvpVote(vote)}
                          disabled={saving}
                        >
                          Elimina voto
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="helper-text">
                    Nessun voto registrato per ora.
                  </p>
                )}

                {missingVoters.length > 0 && (
                  <div className="missing-voters">
                    <p className="card-label">MANCANO</p>
                    <p>
                      {missingVoters
                        .map((player) => player.name)
                        .join(" · ")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : adminMode ? (
          <div className="result-panel">
            <div className="result-heading">
              <p className="card-label">DOPO LA PARTITA</p>
              <h3>Inserisci il risultato</h3>
              <p>
                Al salvataggio si aprirà automaticamente la
                votazione MVP.
              </p>
            </div>

            <div className="score-input">
              <label>Chiari</label>
              <input
                type="number"
                min="0"
                step="1"
                value={lightScore}
                onChange={(event) =>
                  setLightScore(event.target.value)
                }
              />
            </div>

            <span className="score-divider">-</span>

            <div className="score-input">
              <label>Scuri</label>
              <input
                type="number"
                min="0"
                step="1"
                value={darkScore}
                onChange={(event) =>
                  setDarkScore(event.target.value)
                }
              />
            </div>

            <button
              type="button"
              className="save-match"
              onClick={() => saveResult(activeMatch.id)}
              disabled={saving}
            >
              {saving
                ? "Salvataggio…"
                : "Chiudi partita e apri MVP"}
            </button>
          </div>
        ) : (
          <div className="panel waiting-result">
            <p className="card-label">PARTITA DA GIOCARE</p>
            <h3>
              Il risultato sarà inserito dopo la partita
            </h3>
            <p>
              Fino ad allora classifica e presenze restano
              invariate.
            </p>
          </div>
        )}
      </section>
    );
  }

  if (!adminMode) {
    return (
      <section className="page">
        <div className="panel empty-state">
          <h2>Formazioni non ancora pubblicate</h2>
          <p>
            L’admin le creerà lunedì mattina. Saranno subito
            visibili qui.
          </p>
        </div>
      </section>
    );
  }

  const isEditing = Boolean(editingMatchId);

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p className="card-label">LUNEDÌ ORE 19:00</p>
          <h2>
            {isEditing
              ? "Modifica formazione"
              : "Crea le formazioni"}
          </h2>
        </div>

        <input
          className="date-input"
          type="date"
          value={matchDate}
          onChange={(event) =>
            setMatchDate(event.target.value)
          }
        />
      </div>

      {!isEditing && lightTeam.length === 0 && (
        <div className="panel">
          <div className="selection-header">
            <div>
              <h3>Seleziona i 10 presenti</h3>
              <p>{selectedPlayers.length}/10 selezionati</p>
            </div>

            <button
              type="button"
              onClick={createTeams}
              disabled={selectedPlayers.length !== 10}
            >
              Componi
            </button>
          </div>

          <div className="selection-grid">
            {players
              .filter((player) => player.active)
              .map((player) => {
                const selected = selectedPlayers.includes(
                  player.id,
                );

                return (
                  <button
                    type="button"
                    key={player.id}
                    className={
                      selected ? "selected-player" : ""
                    }
                    onClick={() =>
                      toggleSelectedPlayer(player.id)
                    }
                  >
                    {selected ? "✓ " : ""}
                    {player.name}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {lightTeam.length === 5 && darkTeam.length === 5 && (
        <>
          <FormationComposer
            players={players}
            selectedPlayers={selectedPlayers}
            lightTeam={lightTeam}
            darkTeam={darkTeam}
            updateFormationSlot={updateFormationSlot}
          />

          <div className="publish-panel">
            <div>
              <p className="card-label">
                {isEditing
                  ? "MODIFICA IN CORSO"
                  : "COMPOSIZIONE FORMAZIONI"}
              </p>

              <h3>
                {isEditing
                  ? "Salva la nuova formazione"
                  : "Pubblica le formazioni"}
              </h3>

              <p>
                Se scegli un giocatore già schierato, i due si
                scambiano automaticamente.
              </p>
            </div>

            <div className="publish-actions">
              {isEditing && (
                <button
                  type="button"
                  className="secondary-action"
                  onClick={cancelEditFormation}
                >
                  Annulla
                </button>
              )}

              {creatingNewMatch && !isEditing && (
                <button
                  type="button"
                  className="secondary-action"
                  onClick={cancelEditFormation}
                >
                  Annulla nuova partita
                </button>
              )}

              <button
                type="button"
                className="save-match"
                onClick={saveFormation}
                disabled={
                  saving ||
                  !isValidFormation(lightTeam, darkTeam)
                }
              >
                {saving
                  ? "Salvataggio…"
                  : isEditing
                    ? "Salva modifiche"
                    : "Pubblica formazioni"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
