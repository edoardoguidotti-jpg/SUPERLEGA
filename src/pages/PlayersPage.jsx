import { useState } from "react";
import PlayerAvatar from "../components/PlayerAvatar";

export default function PlayersPage({
  players,
  adminMode,
  onAddPlayer,
  onTogglePlayerActive,
  onUpdatePlayer,
  saving,
}) {
  const [form, setForm] = useState({
    name: "",
    nickname: "",
    photo_url: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  function submit(event) {
    event.preventDefault();
    onAddPlayer(form).then((success) => {
      if (success) {
        setForm({
          name: "",
          nickname: "",
          photo_url: "",
        });
      }
    });
  }

  function startEdit(player) {
    setEditingId(player.id);
    setEditForm({
      name: player.name || "",
      nickname: player.nickname || "",
      photo_url: player.photo_url || "",
      vote_pin: player.vote_pin || "",
    });
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <p className="card-label">ROSA</p>
          <h2>Giocatori</h2>
        </div>
      </div>

      {adminMode && (
        <form className="player-form panel" onSubmit={submit}>
          <div>
            <label>Nome</label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />
          </div>

          <div>
            <label>Nickname facoltativo</label>
            <input
              value={form.nickname}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nickname: event.target.value,
                }))
              }
            />
          </div>

          <div className="full-field">
            <label>URL foto facoltativo</label>
            <input
              type="url"
              value={form.photo_url}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  photo_url: event.target.value,
                }))
              }
              placeholder="https://..."
            />
          </div>

          <button
            className="save-match full-field"
            type="submit"
            disabled={saving}
          >
            {saving ? "Salvataggio…" : "Aggiungi giocatore"}
          </button>
        </form>
      )}

      <div className="player-list">
        {players.map((player) => (
          <div
            className={`player-card ${
              !player.active ? "inactive" : ""
            }`}
            key={player.id}
          >
            {editingId === player.id && adminMode ? (
              <div className="player-edit-grid">
                <PlayerAvatar player={player} size="large" />

                <input
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />

                <input
                  value={editForm.nickname}
                  placeholder="Nickname"
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      nickname: event.target.value,
                    }))
                  }
                />

                <input
                  value={editForm.photo_url}
                  placeholder="URL foto"
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      photo_url: event.target.value,
                    }))
                  }
                />

                <input
                  value={editForm.vote_pin}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="PIN"
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      vote_pin: event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    }))
                  }
                />

                <div className="player-edit-actions">
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => {
                      setEditingId(null);
                      setEditForm(null);
                    }}
                  >
                    Annulla
                  </button>

                  <button
                    type="button"
                    className="save-match"
                    disabled={saving}
                    onClick={async () => {
                      const success = await onUpdatePlayer(
                        player.id,
                        editForm,
                      );

                      if (success) {
                        setEditingId(null);
                        setEditForm(null);
                      }
                    }}
                  >
                    Salva
                  </button>
                </div>
              </div>
            ) : (
              <>
                <PlayerAvatar player={player} size="large" />

                <div className="player-name">
                  <strong>{player.name}</strong>
                  <span>
                    {player.nickname
                      ? `“${player.nickname}” · `
                      : ""}
                    {player.active
                      ? "Disponibile"
                      : "Disattivato"}
                  </span>
                </div>

                {adminMode && (
                  <div className="player-actions">
                    <button
                      type="button"
                      className="small-button"
                      onClick={() => startEdit(player)}
                    >
                      Modifica
                    </button>

                    <button
                      type="button"
                      className="small-button"
                      onClick={() =>
                        onTogglePlayerActive(player)
                      }
                    >
                      {player.active
                        ? "Disattiva"
                        : "Riattiva"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
