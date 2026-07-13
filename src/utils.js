import { formationRoles, roleOrder } from "./constants";

export function createEmptyFormation() {
  return formationRoles.map(([role]) => ({ player: null, role }));
}

export function formationRows(matchId, lightTeam, darkTeam) {
  return [
    ...lightTeam.map((slot) => ({
      match_id: matchId,
      player_id: slot.player.id,
      team: "light",
      role: slot.role,
    })),
    ...darkTeam.map((slot) => ({
      match_id: matchId,
      player_id: slot.player.id,
      team: "dark",
      role: slot.role,
    })),
  ];
}

export function isValidFormation(lightTeam, darkTeam) {
  if (lightTeam.length !== 5 || darkTeam.length !== 5) return false;
  if ([...lightTeam, ...darkTeam].some((slot) => !slot.player)) return false;

  const ids = [...lightTeam, ...darkTeam].map((slot) =>
    String(slot.player.id),
  );

  return new Set(ids).size === 10;
}

export function getTeamsForMatch(match, appearances, players) {
  if (!match) return { lightTeam: [], darkTeam: [] };

  const matchAppearances = appearances.filter(
    (appearance) => appearance.match_id === match.id,
  );

  const mapTeam = (team) =>
    matchAppearances
      .filter((appearance) => appearance.team === team)
      .map((appearance, index) => ({
        player: players.find(
          (player) => player.id === appearance.player_id,
        ),
        role:
          appearance.role ||
          formationRoles[index]?.[0] ||
          "striker",
      }))
      .filter((slot) => Boolean(slot.player))
      .sort(
        (a, b) =>
          (roleOrder[a.role] ?? 99) -
          (roleOrder[b.role] ?? 99),
      );

  return {
    lightTeam: mapTeam("light"),
    darkTeam: mapTeam("dark"),
  };
}

export function roleLabel(role) {
  return (
    formationRoles.find(([value]) => value === role)?.[1] ||
    "Ruolo"
  );
}

export function getNextMonday() {
  const today = new Date();
  const day = today.getDay();
  const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7;
  const monday = new Date(today);

  monday.setDate(today.getDate() + daysUntilMonday);

  return `${monday.getFullYear()}-${String(
    monday.getMonth() + 1,
  ).padStart(2, "0")}-${String(monday.getDate()).padStart(
    2,
    "0",
  )}`;
}

export function toDateInputValue(date) {
  const value = new Date(date);

  return `${value.getFullYear()}-${String(
    value.getMonth() + 1,
  ).padStart(2, "0")}-${String(value.getDate()).padStart(
    2,
    "0",
  )}`;
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function isPlayedMatch(match) {
  return (
    match.status === "completed" ||
    match.status === "awaiting_mvp"
  );
}

export function matchStatusLabel(match) {
  if (!match) return "Nessuna partita";

  if (match.status === "awaiting_mvp") {
    return "In attesa MVP";
  }

  if (match.status === "completed") {
    return "Conclusa";
  }

  return "Da giocare";
}

export function generateVotePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function generateMvpToken() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID().replaceAll("-", "");
  }

  return `${Date.now()}${Math.random()}`
    .replace(/\D/g, "")
    .slice(0, 32);
}

export function publicAppUrl() {
  return window.location.origin;
}
