import { matchStatusLabel } from "../utils";

export default function MatchStatusBadge({ match }) {
  const label = matchStatusLabel(match);
  const className =
    match?.status === "completed"
      ? "completed"
      : match?.status === "awaiting_mvp"
        ? "awaiting-mvp"
        : "scheduled";

  return (
    <span className={`status-badge ${className}`}>
      {label}
    </span>
  );
}
