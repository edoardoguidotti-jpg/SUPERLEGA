import { useEffect, useMemo, useState } from "react";
import MatchStatusBadge from "../components/MatchStatusBadge";
import { formatDate, hasPublishedFormation } from "../utils";

export default function HomePage({
  latestMatch,
  activeMatch,
  activeTeams,
  upcomingMatches,
  players,
  appearances,
  matchSignups,
  onNavigate,
  onOpenMatch,
  adminMode,
}) {
  const activeHasFormation = hasPublishedFormation(
    activeMatch,
    appearances,
  );
  const activeSignupCount = activeMatch
    ? matchSignups.filter(
        (signup) =>
          signup.match_id === activeMatch.id &&
          signup.status === "confirmed",
      ).length
    : 0;

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
            ? activeHasFormation
              ? "Le formazioni sono pubblicate e visibili a tutti."
              : `Pre-formazione aperta: ${activeSignupCount}/10 convocati.`
            : adminMode
              ? "Crea e pubblica la prossima partita."
              : "Le prossime formazioni saranno pubblicate qui."}
        </p>

        <div className="hero-actions">
          {activeMatch && (
            <Countdown targetDate={activeMatch.match_date} />
          )}

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
      </div>

      {activeMatch && (
        <div className="panel formation-preview">
          <div className="status-row">
            <div>
              <p className="card-label">
                {activeHasFormation
                  ? "FORMAZIONI PUBBLICATE"
                  : "PRE-FORMAZIONE"}
              </p>
              <h3>
                {activeHasFormation
                  ? "Chiari contro Scuri"
                  : "Convocati in raccolta"}
              </h3>
            </div>
            <MatchStatusBadge match={activeMatch} />
          </div>

          {activeHasFormation ? (
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
          ) : (
            <div className="mini-teams">
              <div>
                <strong>Convocati</strong>
                <span>{activeSignupCount}/10 confermati</span>
              </div>

              <div>
                <strong>Lista d’attesa</strong>
                <span>
                  {
                    matchSignups.filter(
                      (signup) =>
                        signup.match_id === activeMatch.id &&
                        signup.status === "waiting",
                    ).length
                  }{" "}
                  riserve
                </span>
              </div>
            </div>
          )}
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
                    Da giocare ·{" "}
                    {presentCount ||
                      matchSignups.filter(
                        (signup) =>
                          signup.match_id === match.id &&
                          signup.status === "confirmed",
                      ).length}{" "}
                    convocati
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

function Countdown({ targetDate }) {
  const [now, setNow] = useState(() => new Date());
  const target = useMemo(() => new Date(targetDate), [targetDate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="countdown-card">
      <span>Mancano</span>
      <strong>
        {days}g {hours}h {minutes}m
      </strong>
    </div>
  );
}
