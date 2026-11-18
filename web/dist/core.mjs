export function filterTracks(tracks, query = "") {
  const q = String(query).trim().toLocaleLowerCase();
  return tracks.filter((t) =>
    `${t.title} ${t.artist} ${t.genre || ""}`.toLocaleLowerCase().includes(q),
  );
}
export function sanitizeState(input, validIds) {
  const s = input && typeof input === "object" ? input : {};
  const valid = new Set(validIds);
  const ids = (a) =>
    Array.isArray(a)
      ? [...new Set(a.filter((id) => typeof id === "string" && valid.has(id)))]
      : [];
  const used = new Set();
  const playlists = (Array.isArray(s.playlists) ? s.playlists : [])
    .filter(
      (p) =>
        p &&
        typeof p.id === "string" &&
        p.id.length < 100 &&
        typeof p.name === "string" &&
        p.name.trim() &&
        !used.has(p.id) &&
        used.add(p.id),
    )
    .map((p) => ({
      id: p.id,
      name: p.name.trim().slice(0, 60),
      tracks: ids(p.tracks),
    }));
  return {
    liked: ids(s.liked),
    playlists,
    volume:
      typeof s.volume === "number" && Number.isFinite(s.volume)
        ? Math.max(0, Math.min(1, s.volume))
        : 0.7,
    recent: ids(s.recent).slice(0, 12),
  };
}
export function nextIndex(index, length, repeat = "off", automatic = false) {
  if (!length) return null;
  if (automatic && repeat === "one") return index;
  if (index + 1 < length) return index + 1;
  return automatic && repeat !== "all" ? null : 0;
}
export function formatTime(seconds) {
  const n = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}
export function addTrackToPlaylist(state, playlistId, trackId) {
  const p = state.playlists.find((p) => p.id === playlistId);
  if (!p) return false;
  if (!p.tracks.includes(trackId)) p.tracks.push(trackId);
  return true;
}
