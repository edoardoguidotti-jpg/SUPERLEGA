import { useEffect, useMemo, useState } from "react";
import { supabase } from "./services/supabase";
import { tabs } from "./constants";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import HomePage from "./pages/HomePage";
import PlayersPage from "./pages/PlayersPage";
import MatchPage from "./pages/MatchPage";
import RankingPage from "./pages/RankingPage";
import HistoryPage from "./pages/HistoryPage";
import MvpVotePage from "./pages/MvpVotePage";
import {
  createEmptyFormation,
  formationRows,
  generateMvpToken,
  generateVotePin,
  getNextMonday,
  getTeamsForMatch,
  isPlayedMatch,
  isValidFormation,
  publicAppUrl,
  toDateInputValue,
} from "./utils";
import "./App.css";

function App() {
  const mvpToken = getMvpTokenFromPath();

  if (mvpToken) {
    return <MvpVotePage token={mvpToken} />;
  }

  return <MainApp />;
}

function MainApp() {
  const [tab, setTab] = useState("home");
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [appearances, setAppearances] = useState([]);
  const [matchMvps, setMatchMvps] = useState([]);
  const [mvpVotes, setMvpVotes] = useState([]);
  const [session, setSession] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [lightTeam, setLightTeam] = useState([]);
  const [darkTeam, setDarkTeam] = useState([]);
  const [matchDate, setMatchDate] = useState(getNextMonday());
  const [lightScore, setLightScore] = useState("");
  const [darkScore, setDarkScore] = useState("");
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [creatingNewMatch, setCreatingNewMatch] =
    useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAdminMode(Boolean(data.session));
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);

        if (!newSession) {
          setAdminMode(false);
        }
      });

    loadData();

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [
      playerResponse,
      matchResponse,
      appearanceResponse,
      mvpResponse,
    ] = await Promise.all([
      withTimeout(
        supabase.from("players").select("*").order("name"),
        "Caricamento giocatori troppo lento.",
      ),
      withTimeout(
        supabase
          .from("matches")
          .select("*")
          .order("match_date", { ascending: false }),
        "Caricamento partite troppo lento.",
      ),
      withTimeout(
        supabase.from("appearances").select("*"),
        "Caricamento formazioni troppo lento.",
      ),
      withTimeout(
        supabase.from("match_mvps").select("*"),
        "Caricamento MVP troppo lento.",
      ),
    ]);

    const firstError =
      playerResponse.error ||
      matchResponse.error ||
      appearanceResponse.error ||
      mvpResponse.error;

    if (firstError) {
      setError(firstError.message);
    } else {
      setPlayers(playerResponse.data || []);
      setMatches(matchResponse.data || []);
      setAppearances(appearanceResponse.data || []);
      setMatchMvps(mvpResponse.data || []);
    }

    setLoading(false);
  }

  async function login(event) {
    event.preventDefault();
    setError("");

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    setEmail("");
    setPassword("");
    setShowLogin(false);
    setAdminMode(true);
    setNotice("Modalità admin attivata.");
  }

  async function logout() {
    await supabase.auth.signOut();
    setAdminMode(false);
    setShowLogin(false);
    setNotice("Sei tornato in modalità pubblica.");
  }

  async function addPlayer(form) {
    const cleanName = form.name.trim();

    if (!cleanName) return false;

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase
      .from("players")
      .insert({
        name: cleanName,
        nickname: form.nickname.trim() || null,
        photo_url: form.photo_url.trim() || null,
        vote_pin: generateVotePin(),
      });

    if (insertError) {
      finishWithError(insertError.message);
      return false;
    }

    await loadData();
    setSaving(false);
    setNotice("Giocatore aggiunto con PIN automatico.");
    return true;
  }

  async function updatePlayer(playerId, values) {
    const cleanName = values.name.trim();
    const pin = values.vote_pin.trim();

    if (!cleanName) {
      setError("Il nome è obbligatorio.");
      return false;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError("Il PIN deve contenere esattamente 4 cifre.");
      return false;
    }

    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("players")
      .update({
        name: cleanName,
        nickname: values.nickname.trim() || null,
        photo_url: values.photo_url.trim() || null,
        vote_pin: pin,
      })
      .eq("id", playerId);

    if (updateError) {
      finishWithError(updateError.message);
      return false;
    }

    await loadData();
    setSaving(false);
    setNotice("Giocatore aggiornato.");
    return true;
  }

  async function togglePlayerActive(player) {
    const { error: updateError } = await supabase
      .from("players")
      .update({ active: !player.active })
      .eq("id", player.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadData();
  }

  function toggleSelectedPlayer(playerId) {
    setSelectedPlayers((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }

      if (current.length >= 10) return current;

      return [...current, playerId];
    });
  }

  function createTeams() {
    if (selectedPlayers.length !== 10) {
      setError("Devi selezionare esattamente 10 giocatori.");
      return;
    }

    setError("");
    setNotice(
      "Tocca il + su ogni posizione e assegna i 10 convocati.",
    );
    setLightTeam(createEmptyFormation());
    setDarkTeam(createEmptyFormation());
  }

  function updateFormationSlot(teamName, slotIndex, playerId) {
    const nextPlayer = playerId
      ? players.find(
          (item) => String(item.id) === String(playerId),
        )
      : null;

    if (playerId && !nextPlayer) return;

    const lightCopy = lightTeam.map((slot) => ({ ...slot }));
    const darkCopy = darkTeam.map((slot) => ({ ...slot }));
    const targetTeam =
      teamName === "light" ? lightCopy : darkCopy;
    const targetSlot = targetTeam[slotIndex];
    const previousPlayer = targetSlot.player;

    let sourceTeam = null;
    let sourceIndex = -1;

    if (nextPlayer) {
      sourceIndex = lightCopy.findIndex(
        (slot) =>
          String(slot.player?.id) === String(nextPlayer.id),
      );

      if (sourceIndex >= 0) sourceTeam = lightCopy;

      if (!sourceTeam) {
        sourceIndex = darkCopy.findIndex(
          (slot) =>
            String(slot.player?.id) === String(nextPlayer.id),
        );

        if (sourceIndex >= 0) sourceTeam = darkCopy;
      }
    }

    if (
      sourceTeam &&
      sourceTeam === targetTeam &&
      sourceIndex === slotIndex
    ) {
      return;
    }

    targetSlot.player = nextPlayer;

    if (sourceTeam) {
      sourceTeam[sourceIndex].player = previousPlayer || null;
    }

    setError("");
    setLightTeam(lightCopy);
    setDarkTeam(darkCopy);
  }

  function beginEditFormation(match) {
    const teams = getTeamsForMatch(
      match,
      appearances,
      players,
    );

    setEditingMatchId(match.id);
    setMatchDate(toDateInputValue(match.match_date));
    setSelectedPlayers(
      [...teams.lightTeam, ...teams.darkTeam].map(
        (slot) => slot.player.id,
      ),
    );
    setLightTeam(teams.lightTeam);
    setDarkTeam(teams.darkTeam);
    setError("");
    setNotice(
      "Modifica giocatori e ruoli, poi salva la formazione.",
    );
    setSelectedMatchId(match.id);
    setCreatingNewMatch(false);
    setTab("match");
  }

  function beginNewMatch() {
    setSelectedPlayers([]);
    setLightTeam([]);
    setDarkTeam([]);
    setEditingMatchId(null);
    setMatchDate(getSuggestedMatchDate());
    setLightScore("");
    setDarkScore("");
    setError("");
    setNotice("Crea una nuova partita senza toccare quelle già attive.");
    setSelectedMatchId(null);
    setCreatingNewMatch(true);
    setTab("match");
  }

  function openMatch(matchId) {
    resetFormationEditor();
    setSelectedMatchId(matchId);
    setError("");
    setNotice("");
    setTab("match");
  }

  function cancelEditFormation() {
    resetFormationEditor();
    setNotice("Modifica annullata.");
  }

  async function saveFormation() {
    if (!isValidFormation(lightTeam, darkTeam)) {
      setError(
        "Servono 10 giocatori diversi: 5 Chiari e 5 Scuri.",
      );
      return;
    }

    const duplicateDate = matches.some(
      (match) =>
        match.id !== editingMatchId &&
        !isPlayedMatch(match) &&
        toDateInputValue(match.match_date) === matchDate,
    );

    if (duplicateDate) {
      setError(
        "Esiste già una formazione programmata per questa data.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const matchDateTime = new Date(`${matchDate}T19:00:00`);
    let matchId = editingMatchId;

    if (editingMatchId) {
      const { error: matchError } = await supabase
        .from("matches")
        .update({
          match_date: matchDateTime.toISOString(),
          status: "scheduled",
        })
        .eq("id", editingMatchId);

      if (matchError) {
        finishWithError(matchError.message);
        return;
      }

      const { error: deleteError } = await supabase
        .from("appearances")
        .delete()
        .eq("match_id", editingMatchId);

      if (deleteError) {
        finishWithError(deleteError.message);
        return;
      }
    } else {
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .insert({
          match_date: matchDateTime.toISOString(),
          light_score: 0,
          dark_score: 0,
          status: "scheduled",
          mvp_status: "not_open",
          mvp_token: generateMvpToken(),
        })
        .select()
        .single();

      if (matchError) {
        finishWithError(matchError.message);
        return;
      }

      matchId = match.id;
    }

    const rows = formationRows(matchId, lightTeam, darkTeam);
    const { error: appearanceError } = await supabase
      .from("appearances")
      .insert(rows);

    if (appearanceError) {
      if (!editingMatchId) {
        await supabase
          .from("matches")
          .delete()
          .eq("id", matchId);
      }

      finishWithError(appearanceError.message);
      return;
    }

    const wasEditing = Boolean(editingMatchId);
    resetFormationEditor();
    await loadData();
    setSelectedMatchId(matchId);
    setNotice(
      wasEditing
        ? "Formazione aggiornata e subito visibile a tutti."
        : "Formazioni pubblicate e subito visibili a tutti.",
    );
    setSaving(false);
    setTab("match");
  }

  async function saveResult(matchId) {
    if (lightScore === "" || darkScore === "") {
      setError("Inserisci il risultato completo.");
      return;
    }

    const parsedLightScore = Number(lightScore);
    const parsedDarkScore = Number(darkScore);

    if (
      !Number.isInteger(parsedLightScore) ||
      !Number.isInteger(parsedDarkScore) ||
      parsedLightScore < 0 ||
      parsedDarkScore < 0
    ) {
      setError(
        "Il risultato deve contenere numeri interi positivi.",
      );
      return;
    }

    if (
      !window.confirm(
        `Confermi il risultato Chiari ${parsedLightScore} - ${parsedDarkScore} Scuri?`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        light_score: parsedLightScore,
        dark_score: parsedDarkScore,
      })
      .eq("id", matchId);

    if (updateError) {
      finishWithError(updateError.message);
      return;
    }

    const { data: openData, error: openError } =
      await supabase.rpc("open_mvp_voting", {
        p_match_id: matchId,
      });

    if (openError) {
      finishWithError(openError.message);
      return;
    }

    setLightScore("");
    setDarkScore("");
    await loadData();
    setSaving(false);
    setNotice(
      "Partita chiusa. Votazione MVP aperta e link pronto.",
    );

    const updatedMatch = {
      id: matchId,
      mvp_token: openData?.mvp_token,
      light_score: parsedLightScore,
      dark_score: parsedDarkScore,
    };

    await copyMvpLink(updatedMatch);
    setTab("match");
  }

  async function closeMvp(matchId) {
    if (
      !window.confirm(
        "Vuoi chiudere la votazione MVP e calcolare il vincitore?",
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    const { data, error: closeError } = await supabase.rpc(
      "close_mvp_voting",
      {
        p_match_id: matchId,
      },
    );

    if (closeError) {
      finishWithError(closeError.message);
      return;
    }

    await loadData();
    setSaving(false);
    setNotice(
      data?.winner_count
        ? "Votazione chiusa e MVP calcolato."
        : "Votazione chiusa senza voti.",
    );
  }

  async function copyMvpLink(match) {
    const currentMatch =
      matches.find((item) => item.id === match.id) || match;
    const token = currentMatch.mvp_token;

    if (!token) {
      setError("Token MVP non disponibile.");
      return;
    }

    const link = `${publicAppUrl()}/mvp/${token}`;
    const text = `🏆 SUPERLEGA\n\nChiari ${currentMatch.light_score}–${currentMatch.dark_score} Scuri\n\nVota il migliore in campo 👇\n${link}`;

    try {
      await navigator.clipboard.writeText(text);
      setNotice(
        isLocalApp()
          ? "Link MVP locale copiato: funziona solo su questo Mac. Per WhatsApp usa il link dopo il deploy."
          : "Messaggio MVP copiato. Incollalo nel gruppo WhatsApp.",
      );
    } catch {
      window.prompt("Copia il messaggio MVP:", text);
    }
  }

  function openMvpLink(match) {
    const currentMatch =
      matches.find((item) => item.id === match.id) || match;
    const token = currentMatch.mvp_token;

    if (!token) {
      setError("Token MVP non disponibile.");
      return;
    }

    window.open(`${publicAppUrl()}/mvp/${token}`, "_blank");
  }

  async function loadMvpVotes(matchId) {
    if (!matchId) {
      setMvpVotes([]);
      return;
    }

    const { data, error: voteError } = await supabase
      .from("mvp_votes")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (voteError) {
      setError(voteError.message);
      return;
    }

    setMvpVotes(data || []);
  }

  async function deleteMvpVote(vote) {
    const voter = players.find(
      (player) => player.id === vote.voter_player_id,
    );

    if (
      !window.confirm(
        `Vuoi eliminare il voto registrato come ${voter?.name || "questo giocatore"}?`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");

    const { error: deleteError } = await supabase.rpc(
      "delete_mvp_vote",
      {
        p_vote_id: vote.id,
      },
    );

    if (deleteError) {
      finishWithError(deleteError.message);
      return;
    }

    await loadMvpVotes(vote.match_id);
    setSaving(false);
    setNotice("Voto MVP eliminato.");
  }

  async function deleteMatch(match) {
    const label = isPlayedMatch(match)
      ? "questa partita e i relativi dati"
      : "questa formazione programmata";

    if (
      !window.confirm(
        `Vuoi davvero eliminare ${label}? L’operazione non può essere annullata.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const { error: matchError } = await supabase
      .from("matches")
      .delete()
      .eq("id", match.id);

    if (matchError) {
      finishWithError(matchError.message);
      return;
    }

    if (editingMatchId === match.id) {
      resetFormationEditor();
    }

    await loadData();
    setNotice(
      "Partita eliminata. Tutte le statistiche sono state ricalcolate.",
    );
    setSaving(false);
  }

  function resetFormationEditor() {
    setSelectedPlayers([]);
    setLightTeam([]);
    setDarkTeam([]);
    setEditingMatchId(null);
    setMatchDate(getNextMonday());
    setCreatingNewMatch(false);
  }

  function getSuggestedMatchDate() {
    if (matches.length === 0) return getNextMonday();

    const lastMatchDate = [...matches]
      .map((match) => new Date(match.match_date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b - a)[0];

    if (!lastMatchDate) return getNextMonday();

    const nextDate = new Date(lastMatchDate);
    nextDate.setDate(lastMatchDate.getDate() + 7);

    return toDateInputValue(nextDate);
  }

  function finishWithError(message) {
    setError(message);
    setSaving(false);
  }

  const playedMatches = useMemo(
    () => matches.filter(isPlayedMatch),
    [matches],
  );

  const playedMatchIds = useMemo(
    () => new Set(playedMatches.map((match) => match.id)),
    [playedMatches],
  );

  const playerStats = useMemo(() => {
    return players
      .map((player) => {
        const playerAppearances = appearances.filter(
          (appearance) =>
            appearance.player_id === player.id &&
            playedMatchIds.has(appearance.match_id),
        );

        let wins = 0;
        let draws = 0;
        let losses = 0;

        playerAppearances.forEach((appearance) => {
          const match = matches.find(
            (item) =>
              item.id === appearance.match_id &&
              isPlayedMatch(item),
          );

          if (!match) return;

          if (match.light_score === match.dark_score) {
            draws += 1;
            return;
          }

          const lightWon =
            match.light_score > match.dark_score;
          const playerWon =
            (appearance.team === "light" && lightWon) ||
            (appearance.team === "dark" && !lightWon);

          if (playerWon) {
            wins += 1;
          } else {
            losses += 1;
          }
        });

        const mvpCount = matchMvps.filter(
          (item) => item.player_id === player.id,
        ).length;

        return {
          ...player,
          appearances: playerAppearances.length,
          wins,
          draws,
          losses,
          mvpCount,
        };
      })
      .sort(
        (a, b) =>
          b.wins - a.wins ||
          b.mvpCount - a.mvpCount ||
          winPercentage(b) - winPercentage(a) ||
          b.appearances - a.appearances ||
          a.name.localeCompare(b.name),
      );
  }, [
    players,
    matches,
    appearances,
    matchMvps,
    playedMatchIds,
  ]);

  const latestMatch = playedMatches[0];

  const activeMatch = [...matches]
    .filter((match) => !isPlayedMatch(match))
    .sort(
      (a, b) =>
        new Date(a.match_date) - new Date(b.match_date),
    )[0];
  const upcomingMatches = [...matches]
    .filter((match) => !isPlayedMatch(match))
    .sort(
      (a, b) =>
        new Date(a.match_date) - new Date(b.match_date),
    );

  const awaitingMvpMatch = [...matches]
    .filter((match) => match.status === "awaiting_mvp")
    .sort(
      (a, b) =>
        new Date(b.match_date) - new Date(a.match_date),
    )[0];

  const selectedMatch = selectedMatchId
    ? matches.find((match) => match.id === selectedMatchId)
    : null;
  const matchPageActive =
    selectedMatch || awaitingMvpMatch || activeMatch;
  const activeTeams = getTeamsForMatch(
    matchPageActive,
    appearances,
    players,
  );

  useEffect(() => {
    if (
      adminMode &&
      matchPageActive?.status === "awaiting_mvp"
    ) {
      loadMvpVotes(matchPageActive.id);
    } else {
      setMvpVotes([]);
    }
  }, [adminMode, matchPageActive?.id, matchPageActive?.status]);

  if (loading) {
    return (
      <div className="loading">
        Caricamento SUPERLEGA…
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        session={session}
        adminMode={adminMode}
        onToggleAdminMode={() =>
          setAdminMode((current) => !current)
        }
        onLogout={logout}
        onOpenLogin={() => setShowLogin(true)}
      />

      <Navigation
        tabs={tabs}
        tab={tab}
        onChange={(nextTab) => {
          setTab(nextTab);
          setError("");
          setNotice("");
        }}
      />

      {showLogin && !session && (
        <form className="login-panel" onSubmit={login}>
          <div className="login-heading">
            <div>
              <p className="card-label">ACCESSO ADMIN</p>
              <h3>Gestisci la SUPERLEGA</h3>
            </div>

            <button
              type="button"
              className="small-button"
              onClick={() => setShowLogin(false)}
            >
              Chiudi
            </button>
          </div>

          <input
            type="email"
            placeholder="Email admin"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <button type="submit">Accedi</button>
        </form>
      )}

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <main>
        {tab === "home" && (
          <HomePage
            latestMatch={latestMatch}
            activeMatch={activeMatch}
            activeTeams={getTeamsForMatch(
              activeMatch,
              appearances,
              players,
            )}
            upcomingMatches={upcomingMatches}
            players={players}
            appearances={appearances}
            onNavigate={setTab}
            onOpenMatch={openMatch}
            adminMode={adminMode}
          />
        )}

        {tab === "players" && (
          <PlayersPage
            players={players}
            adminMode={adminMode}
            onAddPlayer={addPlayer}
            onTogglePlayerActive={togglePlayerActive}
            onUpdatePlayer={updatePlayer}
            saving={saving}
          />
        )}

        {tab === "match" && (
          <MatchPage
            players={players}
            adminMode={adminMode}
            activeMatch={matchPageActive}
            activeTeams={activeTeams}
            creatingNewMatch={creatingNewMatch}
            onBeginNewMatch={beginNewMatch}
            selectedPlayers={selectedPlayers}
            toggleSelectedPlayer={toggleSelectedPlayer}
            createTeams={createTeams}
            lightTeam={lightTeam}
            darkTeam={darkTeam}
            updateFormationSlot={updateFormationSlot}
            matchDate={matchDate}
            setMatchDate={setMatchDate}
            lightScore={lightScore}
            setLightScore={setLightScore}
            darkScore={darkScore}
            setDarkScore={setDarkScore}
            saveFormation={saveFormation}
            saveResult={saveResult}
            beginEditFormation={beginEditFormation}
            cancelEditFormation={cancelEditFormation}
            deleteMatch={deleteMatch}
            editingMatchId={editingMatchId}
            saving={saving}
            mvpVotes={mvpVotes}
            onCopyMvpLink={copyMvpLink}
            onOpenMvpLink={openMvpLink}
            onDeleteMvpVote={deleteMvpVote}
            onCloseMvp={closeMvp}
          />
        )}

        {tab === "ranking" && (
          <RankingPage stats={playerStats} />
        )}

        {tab === "history" && (
          <HistoryPage
            matches={matches}
            appearances={appearances}
            players={players}
            matchMvps={matchMvps}
            adminMode={adminMode}
            onDeleteMatch={deleteMatch}
            onCloseMvp={closeMvp}
            onCopyMvpLink={copyMvpLink}
            onOpenMvpLink={openMvpLink}
            onOpenMatch={openMatch}
            saving={saving}
          />
        )}
      </main>
    </div>
  );
}

function getMvpTokenFromPath() {
  const match = window.location.pathname.match(
    /^\/mvp\/([^/]+)\/?$/,
  );

  return match ? decodeURIComponent(match[1]) : null;
}

function winPercentage(player) {
  if (!player.appearances) return 0;
  return player.wins / player.appearances;
}

function withTimeout(request, message) {
  return Promise.race([
    request,
    new Promise((resolve) => {
      window.setTimeout(() => {
        resolve({
          data: null,
          error: {
            message,
          },
        });
      }, 8000);
    }),
  ]);
}

function isLocalApp() {
  return (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
  );
}

export default App;
