import { useEffect, useId, useState } from "react";
import PlayerAvatar from "../components/PlayerAvatar";

export default function PlayersPage({
  players,
  stats,
  adminMode,
  onAddPlayer,
  onTogglePlayerActive,
  onUpdatePlayer,
  saving,
}) {
  const [form, setForm] = useState({
    name: "",
    nickname: "",
    photoFile: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  function submit(event) {
    event.preventDefault();
    onAddPlayer(form).then((success) => {
      if (success) {
        setForm({
          name: "",
          nickname: "",
          photoFile: null,
        });
        event.currentTarget.reset();
      }
    });
  }

  function startEdit(player) {
    setEditingId(player.id);
    setSelectedPlayerId(player.id);
    setEditForm({
      name: player.name || "",
      nickname: player.nickname || "",
      photo_url: player.photo_url || "",
      photoFile: null,
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
            <PhotoInput
              label="Foto facoltativa"
              file={form.photoFile}
              onChange={(file) =>
                setForm((current) => ({
                  ...current,
                  photoFile: file,
                }))
              }
              helper="Da iPhone puoi scegliere una foto dalla libreria. La ridimensioniamo automaticamente in formato quadrato."
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
        {players.map((player) => {
          const playerStats = stats.find(
            (item) => item.id === player.id,
          );
          const isSelected = selectedPlayerId === player.id;

          return (
            <div
              className={`player-card ${
                !player.active ? "inactive" : ""
              } ${isSelected ? "selected" : ""}`}
              key={player.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                setSelectedPlayerId((current) =>
                  current === player.id ? null : player.id,
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSelectedPlayerId((current) =>
                    current === player.id ? null : player.id,
                  );
                }
              }}
            >
            {editingId === player.id && adminMode ? (
              <div
                className="player-edit-grid"
                onClick={(event) => event.stopPropagation()}
              >
                <PlayerAvatar player={player} size="large" />

                <div className="player-edit-fields">
                  <label>
                    Nome
                    <input
                      value={editForm.name}
                      placeholder="Nome"
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    Nickname
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
                  </label>
                </div>

                <div className="full-field player-photo-upload">
                  <PhotoInput
                    label="Nuova foto"
                    file={editForm.photoFile}
                    onChange={(file) =>
                      setEditForm((current) => ({
                        ...current,
                        photoFile: file,
                      }))
                    }
                    helper="Se non scegli una nuova foto, resta quella attuale. La nuova immagine viene ridimensionata automaticamente."
                  />
                </div>

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
                  <div
                    className="player-actions"
                    onClick={(event) => event.stopPropagation()}
                  >
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

                {isSelected && playerStats && (
                  <PlayerInlineStats
                    player={playerStats}
                    onClose={() => setSelectedPlayerId(null)}
                  />
                )}
              </>
            )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlayerInlineStats({ player, onClose }) {
  return (
    <div
      className="player-inline-detail"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="player-inline-heading">
        <div>
          <p className="card-label">SCHEDA GIOCATORE</p>
          <h3>{player.name}</h3>
        </div>

        <button
          type="button"
          className="small-button"
          onClick={onClose}
        >
          Chiudi
        </button>
      </div>

      <div className="player-stat-grid">
        <Stat label="Presenze" value={player.appearances} />
        <Stat label="Vittorie" value={player.wins} />
        <Stat label="Pareggi" value={player.draws} />
        <Stat label="Sconfitte" value={player.losses} />
        <Stat label="MVP" value={player.mvpCount} />
        <Stat label="Punti" value={player.points} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="player-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PhotoInput({ label, file, onChange, helper }) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceFileName, setSourceFileName] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!sourceUrl) return undefined;

    return () => URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  async function handleFileSelection(selectedFile) {
    if (!selectedFile) return;

    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }

    setSourceUrl(URL.createObjectURL(selectedFile));
    setSourceFileName(selectedFile.name);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);

    const croppedFile = await createCroppedPhoto(selectedFile, {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });

    onChange(croppedFile);
  }

  async function applyCrop(nextValues = {}) {
    if (!sourceUrl) return;

    const nextCrop = {
      zoom,
      offsetX,
      offsetY,
      ...nextValues,
    };

    const response = await fetch(sourceUrl);
    const blob = await response.blob();
    const croppedFile = await createCroppedPhoto(blob, nextCrop);
    onChange(croppedFile);
  }

  function updateZoom(value) {
    const nextZoom = Number(value);
    setZoom(nextZoom);
    applyCrop({ zoom: nextZoom });
  }

  function updateOffsetX(value) {
    const nextOffsetX = Number(value);
    setOffsetX(nextOffsetX);
    applyCrop({ offsetX: nextOffsetX });
  }

  function updateOffsetY(value) {
    const nextOffsetY = Number(value);
    setOffsetY(nextOffsetY);
    applyCrop({ offsetY: nextOffsetY });
  }

  return (
    <div className="photo-input">
      <label htmlFor={inputId}>{label}</label>

      <div className="photo-input-row">
        {previewUrl ? (
          <img
            className="photo-input-preview"
            src={previewUrl}
            alt="Anteprima foto"
          />
        ) : (
          <div className="photo-input-placeholder">+</div>
        )}

        <div className="photo-input-copy">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={(event) =>
              handleFileSelection(event.target.files?.[0] || null)
            }
          />

          <label className="photo-input-button" htmlFor={inputId}>
            Scegli foto
          </label>

          <span>
            {sourceFileName || file?.name || "Nessuna foto selezionata"}
          </span>
        </div>
      </div>

      {sourceUrl && (
        <div className="photo-crop-editor">
          <div
            className="photo-crop-stage"
            style={{
              backgroundImage: `url(${sourceUrl})`,
              backgroundSize: `${zoom * 100}%`,
              backgroundPosition: `${50 + offsetX}% ${50 + offsetY}%`,
            }}
            aria-label="Anteprima ritaglio foto"
          />

          <div className="photo-crop-controls">
            <label>
              Zoom
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(event) => updateZoom(event.target.value)}
              />
            </label>

            <label>
              Orizzontale
              <input
                type="range"
                min="-40"
                max="40"
                step="1"
                value={offsetX}
                onChange={(event) =>
                  updateOffsetX(event.target.value)
                }
              />
            </label>

            <label>
              Verticale
              <input
                type="range"
                min="-40"
                max="40"
                step="1"
                value={offsetY}
                onChange={(event) =>
                  updateOffsetY(event.target.value)
                }
              />
            </label>
          </div>
        </div>
      )}

      <p className="helper-text">{helper}</p>
    </div>
  );
}

async function createCroppedPhoto(fileOrBlob, crop) {
  const image = await loadImage(fileOrBlob);
  const outputSize = 900;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const zoom = Math.max(1, crop.zoom || 1);
  const baseSize = Math.min(image.width, image.height) / zoom;
  const maxX = image.width - baseSize;
  const maxY = image.height - baseSize;
  const centerX = maxX / 2;
  const centerY = maxY / 2;
  const sourceX = clamp(
    centerX + (maxX / 2) * ((crop.offsetX || 0) / 40),
    0,
    maxX,
  );
  const sourceY = clamp(
    centerY + (maxY / 2) * ((crop.offsetY || 0) / 40),
    0,
    maxY,
  );

  canvas.width = outputSize;
  canvas.height = outputSize;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    baseSize,
    baseSize,
    0,
    0,
    outputSize,
    outputSize,
  );

  if (image.close) {
    image.close();
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Ritaglio non riuscito"));
        }
      },
      "image/jpeg",
      0.86,
    );
  });

  return new File([blob], "player-photo.jpg", {
    type: "image/jpeg",
  });
}

async function loadImage(fileOrBlob) {
  if ("createImageBitmap" in window) {
    return createImageBitmap(fileOrBlob);
  }

  const objectUrl = URL.createObjectURL(fileOrBlob);

  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
