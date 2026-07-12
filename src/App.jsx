import { useEffect, useMemo, useState } from 'react'
import { supabase } from './services/supabase'
import './App.css'

const tabs = [
  ['home', 'Home'],
  ['players', 'Giocatori'],
  ['match', 'Partita'],
  ['ranking', 'Classifica'],
  ['appearances', 'Presenze'],
  ['history', 'Storico'],
]

function App() {
  const [tab, setTab] = useState('home')
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [appearances, setAppearances] = useState([])
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [newPlayer, setNewPlayer] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [lightTeam, setLightTeam] = useState([])
  const [darkTeam, setDarkTeam] = useState([])
  const [matchDate, setMatchDate] = useState(getNextMonday())
  const [lightScore, setLightScore] = useState('')
  const [darkScore, setDarkScore] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession),
    )

    loadData()

    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')

    const [
      { data: playerData, error: playerError },
      { data: matchData, error: matchError },
      { data: appearanceData, error: appearanceError },
    ] = await Promise.all([
      supabase.from('players').select('*').order('name'),
      supabase.from('matches').select('*').order('match_date', { ascending: false }),
      supabase.from('appearances').select('*'),
    ])

    const firstError = playerError || matchError || appearanceError

    if (firstError) {
      setError(firstError.message)
    } else {
      setPlayers(playerData || [])
      setMatches(matchData || [])
      setAppearances(appearanceData || [])
    }

    setLoading(false)
  }

  async function login(event) {
    event.preventDefault()
    setError('')

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
    } else {
      setEmail('')
      setPassword('')
    }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function addPlayer(event) {
    event.preventDefault()
    const cleanName = newPlayer.trim()
    if (!cleanName) return

    const { error: insertError } = await supabase
      .from('players')
      .insert({ name: cleanName })

    if (insertError) {
      setError(insertError.message)
      return
    }

    setNewPlayer('')
    await loadData()
  }

  async function togglePlayerActive(player) {
    const { error: updateError } = await supabase
      .from('players')
      .update({ active: !player.active })
      .eq('id', player.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await loadData()
  }

  function toggleSelectedPlayer(playerId) {
    setSelectedPlayers((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId)
      }

      if (current.length >= 10) return current
      return [...current, playerId]
    })
  }

  function createTeams() {
    if (selectedPlayers.length !== 10) {
      setError('Devi selezionare esattamente 10 giocatori.')
      return
    }

    setError('')
    setNotice('')

    const selected = selectedPlayers
      .map((id) => players.find((player) => player.id === id))
      .filter(Boolean)

    setLightTeam(selected.filter((_, index) => index % 2 === 0))
    setDarkTeam(selected.filter((_, index) => index % 2 !== 0))
  }

  function swapPlayer(playerId, destination) {
    const sourceTeam = destination === 'light' ? darkTeam : lightTeam
    const destinationTeam = destination === 'light' ? lightTeam : darkTeam
    const movingPlayer = sourceTeam.find((player) => player.id === playerId)
    const swapPlayerTarget = destinationTeam[destinationTeam.length - 1]

    if (!movingPlayer || !swapPlayerTarget) return

    if (destination === 'light') {
      setLightTeam((team) => [
        ...team.slice(0, -1),
        movingPlayer,
      ])
      setDarkTeam((team) => [
        ...team.filter((player) => player.id !== playerId),
        swapPlayerTarget,
      ])
    } else {
      setDarkTeam((team) => [
        ...team.slice(0, -1),
        movingPlayer,
      ])
      setLightTeam((team) => [
        ...team.filter((player) => player.id !== playerId),
        swapPlayerTarget,
      ])
    }
  }

  async function saveFormation() {
    if (lightTeam.length !== 5 || darkTeam.length !== 5) {
      setError('Ogni squadra deve avere esattamente 5 giocatori.')
      return
    }

    const duplicateDate = matches.some(
      (match) =>
        match.status !== 'completed' &&
        toDateInputValue(match.match_date) === matchDate,
    )

    if (duplicateDate) {
      setError('Esiste già una formazione programmata per questa data.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    const matchDateTime = new Date(`${matchDate}T19:00:00`)

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        match_date: matchDateTime.toISOString(),
        light_score: 0,
        dark_score: 0,
        status: 'scheduled',
      })
      .select()
      .single()

    if (matchError) {
      setError(matchError.message)
      setSaving(false)
      return
    }

    const rows = [
      ...lightTeam.map((player) => ({
        match_id: match.id,
        player_id: player.id,
        team: 'light',
      })),
      ...darkTeam.map((player) => ({
        match_id: match.id,
        player_id: player.id,
        team: 'dark',
      })),
    ]

    const { error: appearanceError } = await supabase
      .from('appearances')
      .insert(rows)

    if (appearanceError) {
      await supabase.from('matches').delete().eq('id', match.id)
      setError(appearanceError.message)
      setSaving(false)
      return
    }

    resetFormationEditor()
    await loadData()
    setNotice('Formazioni pubblicate. Ora sono visibili a tutti.')
    setSaving(false)
    setTab('match')
  }

  async function saveResult(matchId) {
    if (lightScore === '' || darkScore === '') {
      setError('Inserisci il risultato completo.')
      return
    }

    const parsedLightScore = Number(lightScore)
    const parsedDarkScore = Number(darkScore)

    if (
      !Number.isInteger(parsedLightScore) ||
      !Number.isInteger(parsedDarkScore) ||
      parsedLightScore < 0 ||
      parsedDarkScore < 0
    ) {
      setError('Il risultato deve contenere numeri interi positivi.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    const { error: updateError } = await supabase
      .from('matches')
      .update({
        light_score: parsedLightScore,
        dark_score: parsedDarkScore,
        status: 'completed',
      })
      .eq('id', matchId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setLightScore('')
    setDarkScore('')
    await loadData()
    setNotice('Risultato salvato. Classifica e presenze aggiornate.')
    setSaving(false)
    setTab('home')
  }

  function resetFormationEditor() {
    setSelectedPlayers([])
    setLightTeam([])
    setDarkTeam([])
    setMatchDate(getNextMonday())
  }

  const completedMatchIds = useMemo(
    () => new Set(matches.filter((match) => match.status === 'completed').map((match) => match.id)),
    [matches],
  )

  const playerStats = useMemo(() => {
    return players
      .map((player) => {
        const playerAppearances = appearances.filter(
          (appearance) =>
            appearance.player_id === player.id &&
            completedMatchIds.has(appearance.match_id),
        )

        let points = 0
        let wins = 0
        let draws = 0
        let losses = 0

        playerAppearances.forEach((appearance) => {
          const match = matches.find(
            (item) => item.id === appearance.match_id && item.status === 'completed',
          )

          if (!match) return

          if (match.light_score === match.dark_score) {
            points += 1
            draws += 1
            return
          }

          const lightWon = match.light_score > match.dark_score
          const playerWon =
            (appearance.team === 'light' && lightWon) ||
            (appearance.team === 'dark' && !lightWon)

          if (playerWon) {
            points += 3
            wins += 1
          } else {
            losses += 1
          }
        })

        return {
          ...player,
          appearances: playerAppearances.length,
          points,
          wins,
          draws,
          losses,
        }
      })
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.wins - a.wins ||
          a.name.localeCompare(b.name),
      )
  }, [players, matches, appearances, completedMatchIds])

  const appearanceRanking = useMemo(
    () =>
      [...playerStats].sort(
        (a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name),
      ),
    [playerStats],
  )

  const latestMatch = matches.find((match) => match.status === 'completed')
  const scheduledMatch = [...matches]
    .filter((match) => match.status !== 'completed')
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))[0]

  const scheduledTeams = getTeamsForMatch(
    scheduledMatch,
    appearances,
    players,
  )

  if (loading) {
    return <div className="loading">Caricamento SUPERLEGA…</div>
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">IL CALCETTO DEL LUNEDÌ</p>
          <h1>SUPERLEGA</h1>
          <p className="subtitle">Ogni lunedì alle 19:00</p>
        </div>

        <div className="admin-status">
          {session ? (
            <>
              <span>Admin attivo</span>
              <button className="small-button" onClick={logout}>Esci</button>
            </>
          ) : (
            <span>Sola lettura</span>
          )}
        </div>
      </header>

      <nav className="navigation">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? 'active' : ''}
            onClick={() => {
              setTab(id)
              setError('')
              setNotice('')
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <main>
        {tab === 'home' && (
          <Home
            latestMatch={latestMatch}
            scheduledMatch={scheduledMatch}
            scheduledTeams={scheduledTeams}
            players={players}
            appearances={appearances}
            onNavigate={setTab}
            isAdmin={Boolean(session)}
            login={login}
            email={email}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
          />
        )}

        {tab === 'players' && (
          <Players
            players={players}
            isAdmin={Boolean(session)}
            newPlayer={newPlayer}
            setNewPlayer={setNewPlayer}
            addPlayer={addPlayer}
            togglePlayerActive={togglePlayerActive}
          />
        )}

        {tab === 'match' && (
          <MatchPage
            players={players.filter((player) => player.active)}
            isAdmin={Boolean(session)}
            scheduledMatch={scheduledMatch}
            scheduledTeams={scheduledTeams}
            selectedPlayers={selectedPlayers}
            toggleSelectedPlayer={toggleSelectedPlayer}
            createTeams={createTeams}
            lightTeam={lightTeam}
            darkTeam={darkTeam}
            swapPlayer={swapPlayer}
            matchDate={matchDate}
            setMatchDate={setMatchDate}
            lightScore={lightScore}
            setLightScore={setLightScore}
            darkScore={darkScore}
            setDarkScore={setDarkScore}
            saveFormation={saveFormation}
            saveResult={saveResult}
            saving={saving}
          />
        )}

        {tab === 'ranking' && (
          <Ranking title="Classifica punti" stats={playerStats} type="points" />
        )}

        {tab === 'appearances' && (
          <Ranking title="Classifica presenze" stats={appearanceRanking} type="appearances" />
        )}

        {tab === 'history' && (
          <History matches={matches} appearances={appearances} players={players} />
        )}
      </main>
    </div>
  )
}

function Home({
  latestMatch,
  scheduledMatch,
  scheduledTeams,
  players,
  appearances,
  onNavigate,
  isAdmin,
  login,
  email,
  password,
  setEmail,
  setPassword,
}) {
  return (
    <section className="page">
      <div className="hero-card">
        <p className="card-label">PROSSIMA PARTITA</p>
        <h2>
          {scheduledMatch ? formatDate(scheduledMatch.match_date) : 'Lunedì alle 19:00'}
        </h2>
        <p>
          {scheduledMatch
            ? 'Le formazioni sono pubblicate e visibili a tutti.'
            : isAdmin
              ? 'Seleziona i presenti e pubblica le formazioni.'
              : 'Le formazioni non sono ancora state pubblicate.'}
        </p>
        <button onClick={() => onNavigate('match')}>
          {scheduledMatch ? 'Vedi le formazioni' : 'Apri la partita'}
        </button>
      </div>

      {scheduledMatch && (
        <div className="panel formation-preview">
          <div className="status-row">
            <div>
              <p className="card-label">FORMAZIONI PUBBLICATE</p>
              <h3>Chiari contro Scuri</h3>
            </div>
            <span className="status-badge scheduled">Da giocare</span>
          </div>

          <div className="mini-teams">
            <div>
              <strong>Chiari</strong>
              <span>{scheduledTeams.lightTeam.map((player) => player.name).join(' · ')}</span>
            </div>
            <div>
              <strong>Scuri</strong>
              <span>{scheduledTeams.darkTeam.map((player) => player.name).join(' · ')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="quick-grid">
        <button onClick={() => onNavigate('ranking')}>
          <strong>🏆 Classifica</strong>
          <span>Punti e vittorie</span>
        </button>
        <button onClick={() => onNavigate('appearances')}>
          <strong>👥 Presenze</strong>
          <span>Solo partite giocate</span>
        </button>
        <button onClick={() => onNavigate('history')}>
          <strong>📜 Storico</strong>
          <span>Tutte le partite concluse</span>
        </button>
        <button onClick={() => onNavigate('players')}>
          <strong>⚽ Giocatori</strong>
          <span>{players.length} registrati</span>
        </button>
      </div>

      {latestMatch && (
        <div className="panel">
          <p className="card-label">ULTIMA PARTITA</p>
          <div className="score-line">
            <strong>Chiari</strong>
            <span>{latestMatch.light_score} - {latestMatch.dark_score}</span>
            <strong>Scuri</strong>
          </div>
          <p>
            {formatDate(latestMatch.match_date)} ·{' '}
            {appearances.filter((appearance) => appearance.match_id === latestMatch.id).length}{' '}
            presenti
          </p>
        </div>
      )}

      {!isAdmin && (
        <form className="login-panel" onSubmit={login}>
          <p className="card-label">ACCESSO ADMIN</p>
          <h3>Gestisci la SUPERLEGA</h3>
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
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="submit">Accedi</button>
        </form>
      )}
    </section>
  )
}

function Players({
  players,
  isAdmin,
  newPlayer,
  setNewPlayer,
  addPlayer,
  togglePlayerActive,
}) {
  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p className="card-label">ROSA</p>
          <h2>Giocatori</h2>
        </div>
      </div>

      {isAdmin && (
        <form className="add-player" onSubmit={addPlayer}>
          <input
            value={newPlayer}
            onChange={(event) => setNewPlayer(event.target.value)}
            placeholder="Nome o soprannome"
          />
          <button type="submit">Aggiungi</button>
        </form>
      )}

      <div className="player-list">
        {players.map((player) => (
          <div className={`player-row ${!player.active ? 'inactive' : ''}`} key={player.id}>
            <div className="avatar">{player.name.charAt(0).toUpperCase()}</div>
            <div className="player-name">
              <strong>{player.name}</strong>
              <span>{player.active ? 'Disponibile' : 'Disattivato'}</span>
            </div>
            {isAdmin && (
              <button className="small-button" onClick={() => togglePlayerActive(player)}>
                {player.active ? 'Disattiva' : 'Riattiva'}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function MatchPage({
  players,
  isAdmin,
  scheduledMatch,
  scheduledTeams,
  selectedPlayers,
  toggleSelectedPlayer,
  createTeams,
  lightTeam,
  darkTeam,
  swapPlayer,
  matchDate,
  setMatchDate,
  lightScore,
  setLightScore,
  darkScore,
  setDarkScore,
  saveFormation,
  saveResult,
  saving,
}) {
  if (scheduledMatch) {
    return (
      <section className="page">
        <div className="page-title">
          <div>
            <p className="card-label">FORMAZIONI PUBBLICATE</p>
            <h2>{formatDate(scheduledMatch.match_date)}</h2>
          </div>
          <span className="status-badge scheduled">Da giocare</span>
        </div>

        <FootballPitch
          lightTeam={scheduledTeams.lightTeam}
          darkTeam={scheduledTeams.darkTeam}
          editable={false}
        />

        {isAdmin ? (
          <div className="result-panel">
            <div className="result-heading">
              <p className="card-label">DOPO LA PARTITA</p>
              <h3>Inserisci il risultato</h3>
              <p>Classifica e presenze si aggiorneranno solo al salvataggio.</p>
            </div>

            <div className="score-input">
              <label>Chiari</label>
              <input
                type="number"
                min="0"
                step="1"
                value={lightScore}
                onChange={(event) => setLightScore(event.target.value)}
              />
            </div>

            <span className="score-divider">-</span>

            <div className="score-input">
              <label>Scuri</label>
              <input
                type="number"
                min="0"
                step="1"
                value={darkScore}
                onChange={(event) => setDarkScore(event.target.value)}
              />
            </div>

            <button
              className="save-match"
              onClick={() => saveResult(scheduledMatch.id)}
              disabled={saving}
            >
              {saving ? 'Salvataggio…' : 'Salva risultato e aggiorna classifica'}
            </button>
          </div>
        ) : (
          <div className="panel waiting-result">
            <p className="card-label">PARTITA DA GIOCARE</p>
            <h3>Il risultato sarà inserito dopo la partita</h3>
            <p>Fino ad allora classifica e presenze restano invariate.</p>
          </div>
        )}
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="panel empty-state">
          <h2>Formazioni non ancora pubblicate</h2>
          <p>L’admin le creerà lunedì mattina. Saranno subito visibili qui.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p className="card-label">LUNEDÌ ORE 19:00</p>
          <h2>Crea le formazioni</h2>
        </div>
        <input
          className="date-input"
          type="date"
          value={matchDate}
          onChange={(event) => setMatchDate(event.target.value)}
        />
      </div>

      <div className="panel">
        <div className="selection-header">
          <div>
            <h3>Seleziona i 10 presenti</h3>
            <p>{selectedPlayers.length}/10 selezionati</p>
          </div>
          <button onClick={createTeams}>Crea squadre</button>
        </div>

        <div className="selection-grid">
          {players.map((player) => {
            const selected = selectedPlayers.includes(player.id)
            return (
              <button
                key={player.id}
                className={selected ? 'selected-player' : ''}
                onClick={() => toggleSelectedPlayer(player.id)}
              >
                {selected ? '✓ ' : ''}{player.name}
              </button>
            )
          })}
        </div>
      </div>

      {lightTeam.length === 5 && darkTeam.length === 5 && (
        <>
          <FootballPitch
            lightTeam={lightTeam}
            darkTeam={darkTeam}
            editable
            movePlayer={swapPlayer}
          />

          <div className="publish-panel">
            <div>
              <p className="card-label">PRIMO PASSAGGIO</p>
              <h3>Pubblica solo le formazioni</h3>
              <p>Il risultato verrà inserito separatamente dopo la partita.</p>
            </div>
            <button className="save-match" onClick={saveFormation} disabled={saving}>
              {saving ? 'Pubblicazione…' : 'Pubblica formazioni'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

function FootballPitch({ lightTeam, darkTeam, editable = false, movePlayer }) {
  return (
    <div className="pitch-wrapper">
      <div className="team-title light-title">CHIARI · ROMBO 1-1-2-1</div>

      <div className="pitch">
        <div className="halfway-line" />
        <div className="center-circle" />
        <div className="top-area" />
        <div className="bottom-area" />

        {lightTeam.map((player, index) => (
          <PitchPlayer
            key={player.id}
            player={player}
            className={`light-player position-light-${index + 1}`}
            onClick={editable ? () => movePlayer(player.id, 'dark') : undefined}
          />
        ))}

        {darkTeam.map((player, index) => (
          <PitchPlayer
            key={player.id}
            player={player}
            className={`dark-player position-dark-${index + 1}`}
            onClick={editable ? () => movePlayer(player.id, 'light') : undefined}
          />
        ))}
      </div>

      <div className="team-title dark-title">SCURI · ROMBO 1-1-2-1</div>

      {editable && (
        <p className="pitch-help">
          Tocca un giocatore per scambiarlo con l’ultimo dell’altra squadra.
        </p>
      )}
    </div>
  )
}

function PitchPlayer({ player, className, onClick }) {
  return (
    <button
      type="button"
      className={`pitch-player ${className} ${onClick ? 'editable' : ''}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <span>{player.name.charAt(0).toUpperCase()}</span>
      <strong>{player.name}</strong>
    </button>
  )
}

function Ranking({ title, stats, type }) {
  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p className="card-label">SUPERLEGA</p>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="ranking-list">
        {stats.map((player, index) => (
          <div className="ranking-row" key={player.id}>
            <div className="position">{index + 1}</div>
            <div className="avatar">{player.name.charAt(0).toUpperCase()}</div>
            <div className="ranking-name">
              <strong>{player.name}</strong>
              <span>{player.wins}V · {player.draws}N · {player.losses}P</span>
            </div>
            <div className="ranking-value">
              <strong>{type === 'points' ? player.points : player.appearances}</strong>
              <span>{type === 'points' ? 'punti' : 'presenze'}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function History({ matches, appearances, players }) {
  const completedMatches = matches.filter((match) => match.status === 'completed')

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p className="card-label">ARCHIVIO</p>
          <h2>Storico partite</h2>
        </div>
      </div>

      {completedMatches.length === 0 ? (
        <div className="panel empty-state">
          <h3>Nessuna partita conclusa</h3>
          <p>Lo storico si riempirà dopo il primo risultato salvato.</p>
        </div>
      ) : (
        <div className="history-list">
          {completedMatches.map((match) => {
            const teams = getTeamsForMatch(match, appearances, players)

            return (
              <details className="history-card" key={match.id}>
                <summary>
                  <div>
                    <strong>{formatDate(match.match_date)}</strong>
                    <span>Chiari contro Scuri</span>
                  </div>
                  <div className="history-score">
                    {match.light_score} - {match.dark_score}
                  </div>
                </summary>

                <div className="history-teams">
                  <div>
                    <h4>Chiari</h4>
                    {teams.lightTeam.map((player) => <span key={player.id}>{player.name}</span>)}
                  </div>
                  <div>
                    <h4>Scuri</h4>
                    {teams.darkTeam.map((player) => <span key={player.id}>{player.name}</span>)}
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </section>
  )
}

function getTeamsForMatch(match, appearances, players) {
  if (!match) return { lightTeam: [], darkTeam: [] }

  const matchAppearances = appearances.filter(
    (appearance) => appearance.match_id === match.id,
  )

  const mapTeam = (team) =>
    matchAppearances
      .filter((appearance) => appearance.team === team)
      .map((appearance) => players.find((player) => player.id === appearance.player_id))
      .filter(Boolean)

  return {
    lightTeam: mapTeam('light'),
    darkTeam: mapTeam('dark'),
  }
}

function getNextMonday() {
  const today = new Date()
  const day = today.getDay()
  const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() + daysUntilMonday)

  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const date = String(monday.getDate()).padStart(2, '0')

  return `${year}-${month}-${date}`
}

function toDateInputValue(date) {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(date) {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export default App
