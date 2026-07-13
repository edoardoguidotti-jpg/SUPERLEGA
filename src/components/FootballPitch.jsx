import { roleOrder } from "../constants";
import { roleLabel } from "../utils";

export default function FootballPitch({
  lightTeam,
  darkTeam,
}) {
  return (
    <div className="pitch-wrapper">
      <div className="team-title light-title">
        CHIARI · ROMBO 1-1-2-1
      </div>

      <div className="pitch">
        <div className="halfway-line" />
        <div className="center-circle" />
        <div className="top-area" />
        <div className="bottom-area" />

        {lightTeam.map((slot) => (
          <PitchPlayer
            key={`light-${slot.player.id}-${slot.role}`}
            player={slot.player}
            className={`light-player position-light-${
              roleOrder[slot.role] + 1
            }`}
            role={roleLabel(slot.role)}
          />
        ))}

        {darkTeam.map((slot) => (
          <PitchPlayer
            key={`dark-${slot.player.id}-${slot.role}`}
            player={slot.player}
            className={`dark-player position-dark-${
              roleOrder[slot.role] + 1
            }`}
            role={roleLabel(slot.role)}
          />
        ))}
      </div>

      <div className="team-title dark-title">
        SCURI · ROMBO 1-1-2-1
      </div>
    </div>
  );
}

function PitchPlayer({ player, className, role }) {
  return (
    <div className={`pitch-player ${className}`}>
      {player.photo_url ? (
        <img src={player.photo_url} alt={player.name} />
      ) : (
        <span>{player.name.charAt(0).toUpperCase()}</span>
      )}
      <strong>{player.name}</strong>
      <small>{role}</small>
    </div>
  );
}
