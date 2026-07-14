import { useState } from "react";
import FootballPitch from "../components/FootballPitch";
import FormationComposer from "../components/FormationComposer";
import MatchStatusBadge from "../components/MatchStatusBadge";
import {
  formatDate,
  hasPublishedFormation,
  isValidFormation,
} from "../utils";

export default function MatchPage({
  players,
  adminMode,
  activeMatch,
  activeTeams,
  appearances,
  matchSignups,
  creatingNewMatch,
  onBeginNewMatch,
  onCreateSignupMatch,
  onCopySignupLink,
  onOpenSignupLink,
  onReplaceSignup,
  onManualReplaceSignup,
  onRemoveSignup,
  onUseConfirmedSignups,
  onRefreshSignups,
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
  editingPublishedFormation,
  saving,
  mvpVotes,
  onCopyMvpLink,
  onOpenMvpLink,
  onDeleteMvpVote,
  onCloseMvp,
}) {
  const [replacementTargets, setReplacementTargets] = useState({});
  const [manualReplacement, setManualReplacement] = useState({
    outSignupId: "",
    inPlayerId: "",
  });
  const hasFormation = hasPublishedFormation(
    activeMatch,
    appearances,
  );
  const confirmedSignups = matchSignups.filter(
    (signup) => signup.status === "confirmed",
  );
  const waitingSignups = matchSignups.filter(
    (signup) => signup.status === "waiting",
  );
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

        {adminMode && (
          <SignupAdminPanel
            match={activeMatch}
            confirmedSignups={confirmedSignups}
            waitingSignups={waitingSignups}
            replacementTargets={replacementTargets}
            setReplacementTargets={setReplacementTargets}
            onCopySignupLink={onCopySignupLink}
            onOpenSignupLink={onOpenSignupLink}
            onReplaceSignup={onReplaceSignup}
            onManualReplaceSignup={onManualReplaceSignup}
            onRemoveSignup={onRemoveSignup}
            onUseConfirmedSignups={onUseConfirmedSignups}
            onRefreshSignups={onRefreshSignups}
            saving={saving}
            hasFormation={hasFormation}
            players={players}
            manualReplacement={manualReplacement}
            setManualReplacement={setManualReplacement}
          />
        )}

        {hasFormation ? (
          <FootballPitch
            lightTeam={activeTeams.lightTeam}
            darkTeam={activeTeams.darkTeam}
          />
        ) : (
          <div className="panel empty-state">
            <p className="card-label">PRE-FORMAZIONE</p>
            <h3>Formazioni non ancora pubblicate</h3>
            <p>
              L’admin può raccogliere i 10 convocati dal link
              WhatsApp, gestire eventuali riserve e poi comporre
              Chiari e Scuri.
            </p>
          </div>
        )}

        {adminMode && (
          <div className="match-admin-actions">
            {hasFormation && activeMatch.status !== "awaiting_mvp" && (
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

        {activeMatch.status === "awaiting_mvp" && hasFormation ? (
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
        ) : adminMode && hasFormation ? (
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
        <div className="panel signup-create-panel">
          <div>
            <p className="card-label">PRIMA DELLE FORMAZIONI</p>
            <h3>Raccogli convocati e riserve</h3>
            <p>
              Crea un link WhatsApp: i primi 10 entrano tra i
              convocati, gli altri vanno in lista d’attesa.
            </p>
          </div>

          <button
            type="button"
            className="secondary-action"
            onClick={onCreateSignupMatch}
            disabled={saving}
          >
            Crea link iscrizione
          </button>
        </div>
      )}

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
            useAllActivePlayers={editingPublishedFormation}
          />

          <div className="publish-panel">
            <div>
              <p className="card-label">
                {isEditing
                  ? editingPublishedFormation
                    ? "MODIFICA IN CORSO"
                    : "COMPOSIZIONE DA CONVOCATI"
                  : "COMPOSIZIONE FORMAZIONI"}
              </p>

              <h3>
                {isEditing
                  ? editingPublishedFormation
                    ? "Salva la nuova formazione"
                    : "Pubblica le formazioni"
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

function SignupAdminPanel({
  match,
  confirmedSignups,
  waitingSignups,
  replacementTargets,
  setReplacementTargets,
  manualReplacement,
  setManualReplacement,
  onCopySignupLink,
  onOpenSignupLink,
  onReplaceSignup,
  onManualReplaceSignup,
  onRemoveSignup,
  onUseConfirmedSignups,
  onRefreshSignups,
  saving,
  hasFormation,
  players,
}) {
  const confirmedPlayerIds = new Set(
    confirmedSignups.map((signup) => String(signup.player_id)),
  );
  const manualReplacementPlayers = players
    .filter(
      (player) =>
        player.active && !confirmedPlayerIds.has(String(player.id)),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "it"));

  return (
    <div className="panel signup-admin-panel">
      <div className="status-row">
        <div>
          <p className="card-label">PRE-FORMAZIONE</p>
          <h3>
            Convocati {confirmedSignups.length}/10 · Riserve{" "}
            {waitingSignups.length}
          </h3>
        </div>

        <div className="page-title-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={() => onCopySignupLink(match)}
          >
            Copia link iscrizione
          </button>

          <button
            type="button"
            className="secondary-action"
            onClick={() => onOpenSignupLink(match)}
          >
            Apri link
          </button>

          <button
            type="button"
            className="secondary-action"
            onClick={onRefreshSignups}
            disabled={saving}
          >
            Aggiorna iscrizioni
          </button>
        </div>
      </div>

      <div className="signup-columns">
        <SignupList
          title="Convocati"
          emptyText="Nessun convocato ancora."
          signups={confirmedSignups}
        />

        <div className="signup-list">
          <h4>Lista d’attesa</h4>

          {waitingSignups.length === 0 ? (
            <p className="helper-text">Nessuna riserva.</p>
          ) : (
            waitingSignups.map((signup) => (
              <div className="signup-waiting-row" key={signup.id}>
                <div className="signup-waiting-heading">
                  <strong>{signup.name}</strong>

                  <button
                    type="button"
                    className="small-button danger-small"
                    disabled={saving}
                    onClick={() => onRemoveSignup(signup)}
                  >
                    Rimuovi
                  </button>
                </div>

                <div className="signup-replace-controls">
                  <select
                    value={replacementTargets[signup.id] || ""}
                    onChange={(event) =>
                      setReplacementTargets((current) => ({
                        ...current,
                        [signup.id]: Number(event.target.value),
                      }))
                    }
                  >
                    <option value="">Sostituisce…</option>
                    {confirmedSignups.map((confirmed) => (
                      <option
                        key={confirmed.id}
                        value={confirmed.id}
                      >
                        {confirmed.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="small-button"
                    disabled={
                      saving || !replacementTargets[signup.id]
                    }
                    onClick={() =>
                      onReplaceSignup(
                        signup.id,
                        replacementTargets[signup.id],
                      )
                    }
                  >
                    Sostituisci
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="signup-manual-replace">
        <div>
          <p className="card-label">SOSTITUZIONE MANUALE</p>
          <h4>Cambia un convocato senza link WhatsApp</h4>
          <p className="helper-text">
            Usa questa opzione se uno rinuncia e vuoi inserire
            direttamente un altro giocatore dalla rosa.
          </p>
        </div>

        <div className="signup-manual-controls">
          <select
            value={manualReplacement.outSignupId}
            onChange={(event) =>
              setManualReplacement((current) => ({
                ...current,
                outSignupId: event.target.value,
              }))
            }
          >
            <option value="">Giocatore che esce…</option>
            {confirmedSignups.map((signup) => (
              <option key={signup.id} value={signup.id}>
                {signup.name}
              </option>
            ))}
          </select>

          <select
            value={manualReplacement.inPlayerId}
            onChange={(event) =>
              setManualReplacement((current) => ({
                ...current,
                inPlayerId: event.target.value,
              }))
            }
          >
            <option value="">Giocatore che entra…</option>
            {manualReplacementPlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
                {player.nickname ? ` (${player.nickname})` : ""}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="secondary-action"
            disabled={
              saving ||
              !manualReplacement.outSignupId ||
              !manualReplacement.inPlayerId
            }
            onClick={async () => {
              const success = await onManualReplaceSignup(
                match.id,
                Number(manualReplacement.outSignupId),
                Number(manualReplacement.inPlayerId),
              );

              if (success) {
                setManualReplacement({
                  outSignupId: "",
                  inPlayerId: "",
                });
              }
            }}
          >
            Sostituisci manualmente
          </button>
        </div>

        {hasFormation && (
          <p className="helper-text">
            Se le formazioni sono già pubblicate, dopo la sostituzione
            premi anche Modifica formazione per aggiornare Chiari e
            Scuri.
          </p>
        )}
      </div>

      {!hasFormation && (
        <button
          type="button"
          className="save-match"
          disabled={saving || confirmedSignups.length !== 10}
          onClick={() => onUseConfirmedSignups(match)}
        >
          Usa i 10 convocati per comporre le formazioni
        </button>
      )}
    </div>
  );
}

function SignupList({ title, signups, emptyText }) {
  return (
    <div className="signup-list">
      <h4>{title}</h4>

      {signups.length === 0 ? (
        <p className="helper-text">{emptyText}</p>
      ) : (
        signups.map((signup, index) => (
          <div className="signup-row" key={signup.id}>
            <span>{index + 1}</span>
            <strong>{signup.name}</strong>
          </div>
        ))
      )}
    </div>
  );
}
