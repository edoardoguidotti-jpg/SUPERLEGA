import PlayerAvatar from "../components/PlayerAvatar";

export default function RankingPage({ stats }) {
  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p className="card-label">HALL OF FAME</p>
          <h2>Classifica</h2>
        </div>
      </div>

      <div className="ranking-head">
        <span>#</span>
        <span>Giocatore</span>
        <span>PG</span>
        <span>V</span>
        <span>N</span>
        <span>P</span>
        <span>MVP</span>
      </div>

      <div className="ranking-list">
        {stats.map((player, index) => (
          <div className="ranking-row-v2" key={player.id}>
            <div className="position">{index + 1}</div>

            <div className="ranking-player">
              <PlayerAvatar player={player} />
              <div>
                <strong>{player.name}</strong>
                {player.nickname && (
                  <span>“{player.nickname}”</span>
                )}
              </div>
            </div>

            <strong>{player.appearances}</strong>
            <strong>{player.wins}</strong>
            <strong>{player.draws}</strong>
            <strong>{player.losses}</strong>
            <strong className="mvp-value">
              👑 {player.mvpCount}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
