import { useState } from "react";
import PlayerAvatar from "../components/PlayerAvatar";

export default function RankingPage({ stats }) {
  const [activeRanking, setActiveRanking] = useState("points");
  const presenceRanking = [...stats].sort(
    (a, b) =>
      b.appearances - a.appearances ||
      b.wins - a.wins ||
      a.name.localeCompare(b.name),
  );
  const mvpRanking = [...stats].sort(
    (a, b) =>
      b.mvpCount - a.mvpCount ||
      b.appearances - a.appearances ||
      a.name.localeCompare(b.name),
  );
  const pointsRanking = [...stats].sort(
    (a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      b.mvpCount - a.mvpCount ||
      a.name.localeCompare(b.name),
  );
  const rankings = {
    presences: {
      tone: "green",
      title: "Presenze",
      subtitle: "Chi c’è sempre",
      metricLabel: "PG",
      metric: (player) => player.appearances,
      players: presenceRanking,
    },
    mvp: {
      tone: "yellow",
      title: "MVP",
      subtitle: "Migliori in campo",
      metricLabel: "MVP",
      metric: (player) => player.mvpCount,
      players: mvpRanking,
    },
    points: {
      tone: "red",
      title: "Punti",
      subtitle: "3 vittoria · 1 pareggio · 0 sconfitta",
      metricLabel: "PT",
      metric: (player) => player.points,
      players: pointsRanking,
    },
  };
  const currentRanking = rankings[activeRanking];

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p className="card-label">HALL OF FAME</p>
          <h2>Classifiche</h2>
        </div>
      </div>

      <div className="ranking-tabs">
        <button
          type="button"
          className={activeRanking === "points" ? "active" : ""}
          onClick={() => setActiveRanking("points")}
        >
          Punti
        </button>

        <button
          type="button"
          className={
            activeRanking === "presences" ? "active" : ""
          }
          onClick={() => setActiveRanking("presences")}
        >
          Presenze
        </button>

        <button
          type="button"
          className={activeRanking === "mvp" ? "active" : ""}
          onClick={() => setActiveRanking("mvp")}
        >
          MVP
        </button>
      </div>

      <RankingSection
        tone={currentRanking.tone}
        title={currentRanking.title}
        subtitle={currentRanking.subtitle}
        metricLabel={currentRanking.metricLabel}
        metric={currentRanking.metric}
        players={currentRanking.players}
      />
    </section>
  );
}

function RankingSection({
  tone,
  title,
  subtitle,
  metricLabel,
  metric,
  players,
}) {
  return (
    <section className={`ranking-section ranking-${tone}`}>
      <div className="ranking-section-heading">
        <div>
          <p className="card-label">{metricLabel}</p>
          <h3>{title}</h3>
          <span>{subtitle}</span>
        </div>
      </div>

      <div className="ranking-list">
        {players.map((player, index) => (
          <div className="ranking-row-v3" key={player.id}>
            <div className="position">{index + 1}</div>

            <div className="ranking-player">
              <PlayerAvatar player={player} />
              <div>
                <strong>{player.name}</strong>
                <span>
                  {player.wins}V · {player.draws}N ·{" "}
                  {player.losses}P · 👑 {player.mvpCount}
                </span>
              </div>
            </div>

            <strong className="ranking-main-value">
              {metric(player)}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
