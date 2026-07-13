export const tabs = [
  ["home", "Home"],
  ["players", "Giocatori"],
  ["match", "Partita"],
  ["ranking", "Classifica"],
  ["history", "Storico"],
];

export const formationRoles = [
  ["goalkeeper", "Portiere"],
  ["defender", "Difensore"],
  ["left", "Laterale sinistro"],
  ["right", "Laterale destro"],
  ["striker", "Attaccante"],
];

export const roleOrder = Object.fromEntries(
  formationRoles.map(([role], index) => [role, index]),
);
