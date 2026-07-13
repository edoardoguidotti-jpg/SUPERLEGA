export default function PlayerAvatar({
  player,
  size = "normal",
}) {
  const initial = player?.name?.charAt(0)?.toUpperCase() || "?";

  if (player?.photo_url) {
    return (
      <img
        className={`avatar avatar-${size}`}
        src={player.photo_url}
        alt={player.name}
      />
    );
  }

  return (
    <div className={`avatar avatar-${size}`} aria-hidden="true">
      {initial}
    </div>
  );
}
