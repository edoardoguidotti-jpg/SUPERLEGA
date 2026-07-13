import { roleLabel } from "../utils";

export default function FormationComposer({
  players,
  selectedPlayers,
  lightTeam,
  darkTeam,
  updateFormationSlot,
}) {
  const availablePlayers = selectedPlayers
    .map((id) =>
      players.find(
        (player) => String(player.id) === String(id),
      ),
    )
    .filter(Boolean);

  const filledSlots = [...lightTeam, ...darkTeam].filter(
    (slot) => slot.player,
  ).length;
  const assignedPlayerIds = new Set(
    [...lightTeam, ...darkTeam]
      .map((slot) => slot.player?.id)
      .filter(Boolean)
      .map(String),
  );

  return (
    <div className="composer-panel">
      <div className="composer-heading">
        <div>
          <p className="card-label">CAMPO FORMAZIONE</p>
          <h3>Assegna i 10 convocati</h3>
          <p>{filledSlots}/10 posizioni completate</p>
        </div>

        <span
          className={`composer-counter ${
            filledSlots === 10 ? "complete" : ""
          }`}
        >
          {filledSlots}/10
        </span>
      </div>

      <div className="pitch-wrapper">
        <div className="team-title light-title">
          CHIARI · ROMBO 1-1-2-1
        </div>

        <div className="pitch composer-pitch">
          <div className="halfway-line" />
          <div className="center-circle" />
          <div className="top-area" />
          <div className="bottom-area" />

          {lightTeam.map((slot, index) => (
            <FormationSlot
              key={`light-slot-${slot.role}`}
              slot={slot}
              className={`light-player position-light-${
                index + 1
              }`}
              players={availablePlayers}
              assignedPlayerIds={assignedPlayerIds}
              teamName="light"
              slotIndex={index}
              onChange={(playerId) =>
                updateFormationSlot("light", index, playerId)
              }
            />
          ))}

          {darkTeam.map((slot, index) => (
            <FormationSlot
              key={`dark-slot-${slot.role}`}
              slot={slot}
              className={`dark-player position-dark-${
                index + 1
              }`}
              players={availablePlayers}
              assignedPlayerIds={assignedPlayerIds}
              teamName="dark"
              slotIndex={index}
              onChange={(playerId) =>
                updateFormationSlot("dark", index, playerId)
              }
            />
          ))}
        </div>

        <div className="team-title dark-title">
          SCURI · ROMBO 1-1-2-1
        </div>
      </div>

      <p className="pitch-help">
        Tocca lo slot per scegliere un convocato. I giocatori già
        assegnati spariscono dagli altri menu, così vedi subito chi
        resta da inserire.
      </p>
    </div>
  );
}

function FormationSlot({
  slot,
  className,
  players,
  assignedPlayerIds,
  teamName,
  slotIndex,
  onChange,
}) {
  const currentPlayerId = slot.player?.id
    ? String(slot.player.id)
    : "";
  const selectablePlayers = players.filter((player) => {
    const playerId = String(player.id);

    return (
      playerId === currentPlayerId ||
      !assignedPlayerIds.has(playerId)
    );
  });

  return (
    <label
      className={`pitch-player formation-slot-on-pitch ${className} ${
        slot.player ? "filled" : "empty"
      }`}
      data-team={teamName}
      data-slot={slotIndex}
    >
      {slot.player?.photo_url ? (
        <img src={slot.player.photo_url} alt={slot.player.name} />
      ) : (
        <span>
          {slot.player
            ? slot.player.name.charAt(0).toUpperCase()
            : "+"}
        </span>
      )}

      <strong>
        {slot.player ? slot.player.name : roleLabel(slot.role)}
      </strong>
      <small>{roleLabel(slot.role)}</small>

      <select
        aria-label={`${roleLabel(slot.role)}: scegli giocatore`}
        value={slot.player?.id ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Slot libero</option>
        {selectablePlayers.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
    </label>
  );
}
