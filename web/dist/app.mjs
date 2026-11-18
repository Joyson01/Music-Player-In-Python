import {
  filterTracks,
  sanitizeState,
  nextIndex,
  formatTime,
  addTrackToPlaylist,
} from "./core.mjs";
const paths = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  library: "M4 4v16M9 4v16M14 5l5-1 3 15-5 1Z",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  plus: "M12 5v14M5 12h14",
  music:
    "M9 18V5l12-2v13M9 8l12-2M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  file: "M14 2H5v20h14V7ZM14 2v6h5M8 13h8M8 17h5",
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
  info: "M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  play: "m8 4 13 8-13 8Z",
  pause: "M7 4h3v16H7ZM15 4h3v16h-3Z",
  next: "m4 4 12 8-12 8ZM19 4v16",
  previous: "m20 4-12 8 12 8ZM5 4v16",
  shuffle:
    "M3 7h3c4 0 8 10 12 10h3m-4-4 4 4-4 4M3 17h3c1 0 3-2 4-4m4-2c1-2 3-4 4-4h3m-4-4 4 4-4 4",
  repeat:
    "m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3",
  volume: "M11 5 6 9H2v6h4l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  muted: "M11 5 6 9H2v6h4l5 4ZM16 9l6 6m0-6-6 6",
  queue: "M3 5h18M3 10h18M3 15h10m4-1 5 4-5 4Z",
  close: "m6 6 12 12M6 18 18 6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
  check: "m5 12 4 4L20 5",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  leaf: "M20 3C9 1 2 8 5 15c5 8 17 1 15-12ZM4 21 16 8",
};
const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="${["play", "pause", "next", "previous"].includes(name) ? "currentColor" : "none"}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.music}"/></svg>`;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const $ = (s) => document.querySelector(s);
const audio = $("#audio");
const main = $("#main");
const modal = $("#modal");
let catalog = { tracks: [], mixes: [] },
  state,
  locals = [],
  queue = [],
  queuePos = -1,
  currentId = null,
  repeat = "off",
  shuffle = false,
  mood = "All",
  toastTimer,
  playToken = 0,
  storageWarned = false;
const allTracks = () => [...catalog.tracks, ...locals];
const track = (id) => allTracks().find((t) => t.id === id);
const onlineIds = () => catalog.tracks.map((t) => t.id);
const idsToTracks = (ids) => ids.map(track).filter(Boolean);
const route = () => {
  try {
    return decodeURIComponent(location.hash.slice(1) || "home");
  } catch {
    return "home";
  }
};
const activeList = () =>
  route().startsWith("playlist/")
    ? state.playlists.find((p) => p.id === route().slice(9))
    : null;
function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 3500);
}
function save() {
  try {
    localStorage.setItem(
      "meowtify:v1",
      JSON.stringify(sanitizeState(state, onlineIds())),
    );
  } catch {
    if (!storageWarned) {
      toast(
        "Browser storage is unavailable. Your library will last for this session.",
      );
      storageWarned = true;
    }
  }
}
function paintIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    el.outerHTML = icon(el.dataset.icon);
  });
}
function navigate(path) {
  if (route() === path) render();
  else location.hash = path;
}
function foot() {
  return `<footer class="site-footer"><span>A little sound. A little soul.</span><a href="#about">Meowtify by Joyson · Credits & privacy ${icon("arrow")}</a></footer>`;
}
function empty(
  title,
  description,
  action = "discover",
  label = "Explore the collection",
  symbol = "music",
) {
  return `<div class="empty-state">${icon(symbol)}<h2>${esc(title)}</h2><p>${esc(description)}</p><button class="primary-button" data-action="${action}">${esc(label)} ${icon("arrow")}</button></div>`;
}
function card(m) {
  return `<article class="mix-card"><div class="mix-art-wrap"><a href="#mix/${m.id}" class="mix-art" aria-label="Open ${esc(m.title)}"><img src="${m.art}" alt="${esc(m.title)} illustrated cover" loading="lazy" width="480" height="480"></a><button class="card-play" data-action="play-mix" data-id="${m.id}" aria-label="Play ${esc(m.title)}">${icon("play")}</button></div><h3><a href="#mix/${m.id}">${esc(m.title)}</a></h3><p>${esc(m.description)}</p></article>`;
}
function rows(tracks, { compact = false, source = "" } = {}) {
  return `<div class="track-list ${compact ? "compact" : ""}"><div class="track-header"><span>#</span><span>TITLE</span><span class="track-genre">COLLECTION</span><span class="track-time">${icon("clock")}</span><span></span><span></span></div>${tracks.map((t, i) => `<div class="track-row ${currentId === t.id ? "current" : ""}" data-track="${esc(t.id)}"><button class="row-play" data-action="play-track" data-id="${esc(t.id)}" data-source="${esc(source)}" aria-label="Play ${esc(t.title)}">${currentId === t.id && !audio.paused ? '<span class="playing-bars"><i></i><i></i><i></i></span>' : i + 1}</button><div class="row-info"><img src="${t.art}" alt="" loading="lazy"><div><button class="track-title" data-action="play-track" data-id="${esc(t.id)}" data-source="${esc(source)}">${esc(t.title)}</button><span class="track-artist">${esc(t.artist)}</span></div></div><span class="track-genre">${t.local ? "Local files" : "SoundHelix"}</span><span class="track-time">${t.duration ? formatTime(t.duration) : "—"}</span><button class="icon-button ${state.liked.includes(t.id) ? "active" : ""}" data-action="like" data-id="${esc(t.id)}" aria-label="${state.liked.includes(t.id) ? "Unlike" : "Like"} ${esc(t.title)}" aria-pressed="${state.liked.includes(t.id)}">${icon("heart")}</button><button class="icon-button" data-action="track-menu" data-id="${esc(t.id)}" aria-label="More options for ${esc(t.title)}">${icon("more")}</button></div>`).join("")}</div>`;
}
function renderNav() {
  const r = route();
  $("#primary-nav").innerHTML = [
    ["home", "Home", "home"],
    ["search", "Search", "search"],
    ["library", "Your library", "library"],
  ]
    .map(
      ([id, label, sym]) =>
        `<a href="#${id}" aria-label="${label}" class="${r === id ? "active" : ""}" ${r === id ? 'aria-current="page"' : ""}>${icon(sym)}<span>${label}</span></a>`,
    )
    .join("");
  $("#library-nav").innerHTML =
    `<a href="#liked" aria-label="Liked songs" class="${r === "liked" ? "active" : ""}"><span class="library-icon heart">${icon("heart")}</span><span>Liked songs</span></a><a href="#local" aria-label="Local files" class="${r === "local" ? "active" : ""}"><span class="library-icon file">${icon("file")}</span><span>Local files</span></a>` +
    state.playlists
      .map(
        (p) =>
          `<a href="#playlist/${encodeURIComponent(p.id)}" aria-label="${esc(p.name)}" class="${r === `playlist/${p.id}` ? "active" : ""}"><span class="library-icon">${icon("music")}</span><span>${esc(p.name)}</span></a>`,
      )
      .join("");
}
function renderHome() {
  const mixes = catalog.mixes.filter(
    (m) => m.id !== "afternoon" && (mood === "All" || m.mood === mood),
  );
  main.innerHTML = `<div class="welcome"><div><h1>Welcome to your happy place.</h1><p>Good sounds. No rush. Just you.</p></div><span class="tiny-tag">${icon("leaf")} A little escape for your ears</span></div><div class="filters" aria-label="Filter mixes">${["All", "Chill", "Electronic"].map((m) => `<button class="chip ${mood === m ? "active" : ""}" data-action="filter" data-mood="${m}" aria-pressed="${mood === m}">${m === "All" ? "All sounds" : m}</button>`).join("")}</div><section class="hero"><div class="hero-copy"><div class="eyebrow">${icon("spark")} THE MEOWTIFY MIX</div><h2>Find your<br>purrfect rhythm.</h2><p>A cozy corner of the internet.<br>A soundtrack that feels like you.</p><button class="primary-button" data-action="play-mix" data-id="afternoon">${icon("play")} Play the afternoon mix</button><span class="hero-meta">4 tracks · All good vibes</span></div><img src="assets/cat.svg" alt="A contented cat wearing headphones, sitting on a stack of records"></section><section><div class="section-heading"><div><h2>A mood for every moment</h2><p>Handpicked combinations. Find your kind of sound.</p></div><button class="text-button" data-action="discover">View all ${icon("arrow")}</button></div><div class="mix-grid home-mixes">${mixes.slice(0, 5).map(card).join("")}</div></section><div class="home-bottom"><section><div class="section-heading"><div><h2>${state.recent.length ? "Back in your rotation" : "A few good sounds"}</h2><p>${state.recent.length ? "The tracks you’ve been spending time with." : "Press play. See where it takes you."}</p></div><button class="text-button" data-action="all-tracks">See all ${icon("arrow")}</button></div>${rows(state.recent.length ? idsToTracks(state.recent).slice(0, 4) : catalog.tracks.slice(0, 4), { compact: true, source: "catalog" })}</section><aside class="mini-feature"><div><div class="eyebrow">YOUR COLLECTION, YOUR RULES</div><h3>Make room for<br>your favorites.</h3><p>That one song. That whole mood. Put them together in a playlist.</p></div><button class="text-button" data-action="create-playlist">Make a playlist ${icon("plus")}</button></aside></div>${foot()}`;
}
function renderSearch() {
  const q = $("#search").value.trim();
  const songs = filterTracks(allTracks(), q);
  const mixes = catalog.mixes.filter((m) =>
    `${m.title} ${m.description} ${m.mood}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  main.innerHTML = `<h1 class="view-title">${q ? `Sounds like “${esc(q)}”` : "Find your next favorite."}</h1><p class="view-description">${q ? `${songs.length} tracks · ${mixes.length} mixes` : "Explore the collection, or search by song, artist, or mood."}</p>${mixes.length ? `<section class="search-section"><div class="section-heading"><h2>${q ? "Matching mixes" : "Browse the mixes"}</h2></div><div class="mix-grid">${mixes.map(card).join("")}</div></section>` : ""}${songs.length ? `<section class="search-section"><div class="section-heading"><h2>${q ? "Songs" : "The full collection"}</h2><span class="result-count">${songs.length} tracks</span></div>${rows(songs, { source: "search" })}</section>` : ""}${!songs.length && !mixes.length ? empty("Nothing here just yet.", "Try a song title, SoundHelix, T. Schürger, or a mood like Chill.", "clear-search", "Browse all sounds", "search") : ""}${foot()}`;
}
function renderLibrary() {
  main.innerHTML = `<div class="section-heading"><div><h1 class="view-title" style="margin-bottom:8px">Your little collection.</h1><p>All your favorites, with room for more.</p></div><button class="primary-button" data-action="create-playlist">${icon("plus")} New playlist</button></div><div class="library-grid"><a href="#liked" aria-label="Liked songs" class="library-card like">${icon("heart")}<div><h3>Liked songs</h3><p>${state.liked.length} tracks you love</p></div></a><a href="#local" aria-label="Local files" class="library-card">${icon("file")}<div><h3>Local files</h3><p>${locals.length} tracks on this device</p></div></a>${state.playlists.map((p) => `<a href="#playlist/${encodeURIComponent(p.id)}" class="library-card">${icon("music")}<div><h3>${esc(p.name)}</h3><p>${p.tracks.length} tracks · Your playlist</p></div></a>`).join("")}</div><div class="section-heading"><h2>Meowtify selects</h2></div><div class="mix-grid">${catalog.mixes.slice(1).map(card).join("")}</div><p class="note" style="margin-top:25px">Your likes and playlists are saved in this browser. Imported audio stays on your device and needs to be selected again after you reload.</p>${foot()}`;
}
function renderCollection(kind, id) {
  let title, description, art, ids, type;
  const mix = catalog.mixes.find((m) => m.id === id),
    p = state.playlists.find((p) => p.id === id);
  if (kind === "mix" && mix) {
    ({ title, description, art } = mix);
    ids = mix.tracks;
    type = "MEOWTIFY SELECTS";
  } else if (kind === "playlist" && p) {
    title = p.name;
    description = "Your songs. Your order. Your own little world.";
    ids = p.tracks;
    type = "YOUR PLAYLIST";
  } else if (kind === "liked") {
    title = "Liked songs";
    description = "Every track that made you stay a little longer.";
    ids = state.liked;
    type = "MADE BY YOU";
  } else if (kind === "local") {
    title = "Local files";
    description = "Your own music, right where it belongs.";
    ids = locals.map((t) => t.id);
    type = "FROM YOUR DEVICE";
  } else {
    main.innerHTML = empty(
      "This playlist wandered off.",
      "It may have been removed. Head back to your library.",
      "library",
      "Open your library",
    );
    return;
  }
  const songs = idsToTracks(ids);
  main.innerHTML = `<section class="collection-hero">${art ? `<img class="collection-art" src="${art}" alt="${esc(title)} cover">` : `<div class="collection-art">${icon(kind === "liked" ? "heart" : kind === "local" ? "file" : "music")}</div>`}<div><div class="eyebrow">${type}</div><h1>${esc(title)}</h1><p>${esc(description)}</p><small>${songs.length} tracks · ${kind === "local" ? "This session only" : "Your daily dose of good sounds"}</small></div></section><div class="collection-actions"><button class="primary-button" data-action="play-collection" ${!songs.length ? "disabled" : ""}>${icon("play")} Play</button>${kind === "mix" ? `<button class="outline-button" data-action="save-mix" data-id="${id}">${icon("plus")} Save as playlist</button>` : ""}${kind === "local" ? `<button class="outline-button" data-action="import">${icon("upload")} Import music</button>` : ""}${kind === "playlist" ? `<button class="outline-button" data-action="all-tracks">${icon("plus")} Add songs</button><button class="icon-button" data-action="delete-playlist" data-id="${esc(id)}" aria-label="Delete playlist">${icon("trash")}</button>` : ""}<button class="icon-button" data-action="queue-toggle" aria-label="Show queue">${icon("queue")}</button><div class="mobile-tools"><button class="icon-button ${shuffle ? "active" : ""}" data-action="shuffle" aria-label="Shuffle" aria-pressed="${shuffle}">${icon("shuffle")}</button><button class="icon-button ${repeat !== "off" ? "active" : ""}" data-action="repeat" aria-label="Repeat ${repeat}" aria-pressed="${repeat !== "off"}">${icon("repeat")}</button></div></div>${kind === "local" ? '<p class="note">MP3, WAV, OGG, M4A and FLAC, depending on your browser. Files stay on this device and are never uploaded. Select them again after reloading; local tracks are not kept in saved playlists.</p>' : ""}${songs.length ? rows(songs, { source: route() }) : empty(kind === "liked" ? "A home for the songs you love." : kind === "local" ? "Bring your own good sounds." : "Every great playlist starts with one song.", kind === "liked" ? "Tap the heart beside any track to keep it here." : kind === "local" ? "Choose audio files from your device. No upload, no account, just music." : "Find a song, open its options, and add it to this playlist.", kind === "local" ? "import" : "all-tracks", kind === "local" ? "Choose music files" : "Find some music", kind === "liked" ? "heart" : "music")}${foot()}`;
}
function renderAbout() {
  main.innerHTML = `<div class="about-content"><div class="about-badge"><img src="assets/favicon.svg" alt="Meowtify cat logo"><div><h1>meowtify.</h1><p>A little sound. A little soul.</p></div></div><p>A cozy, independent music player by Joyson. A browser-first reimagining of the <a href="https://github.com/Joyson01/Music-Player-In-Python" target="_blank" rel="noopener noreferrer">original Python music player</a>, with a Spotify-inspired listening experience and a personality of its own.</p><h2>Real music, properly credited.</h2><p>Our starter collection contains eight algorithmically composed tracks by <strong>T. Schürger</strong>, provided by <a href="https://www.soundhelix.com/audio-examples" target="_blank" rel="noopener noreferrer">SoundHelix</a>. SoundHelix permits use of these examples with credit to SoundHelix and the artist. Track titles are preserved; the mix names and artwork are Meowtify’s own editorial creations. Audio streams directly from SoundHelix, so availability depends on their servers.</p><p>Meowtify is independent of Spotify and does not provide Spotify’s catalogue, account access, or recommendations.</p><h2>Your music stays yours.</h2><p>Imported audio files are played directly on your device and are never uploaded. They are available for this session only. After a reload, select your files again. Local tracks are excluded from saved likes and playlist entries.</p><p>Online-track likes, playlists and recently played songs are stored in this browser, under <code>meowtify:v1</code>. They don’t sync across devices. No visitor analytics are included. Hosting, Google Fonts, and SoundHelix receive ordinary network requests when used.</p><h2>Little shortcuts.</h2><p><strong>Space</strong> to play or pause. <strong>/</strong> to search. Use the player to skip, seek, shuffle, repeat, adjust volume, or open the queue. Keyboard shortcuts stay out of your way while you’re typing.</p><h2>A fresh start.</h2><p>Clear saved likes, playlists and recent listening from this browser.</p><button class="outline-button" data-action="confirm-reset">Reset saved library</button></div>${foot()}`;
}
function render() {
  if (!state) return;
  const r = route();
  renderNav();
  $("#page-label").textContent =
    r === "home"
      ? "Discover"
      : r === "search"
        ? "Search"
        : r === "about"
          ? "About Meowtify"
          : "Your library";
  if (r !== "search") $("#search").value = "";
  if (r === "home") renderHome();
  else if (r === "search") renderSearch();
  else if (r === "library") renderLibrary();
  else if (r === "about") renderAbout();
  else if (r === "liked" || r === "local") renderCollection(r);
  else if (r.startsWith("mix/")) renderCollection("mix", r.slice(4));
  else if (r.startsWith("playlist/")) renderCollection("playlist", r.slice(9));
  else
    main.innerHTML = empty(
      "This page wandered off.",
      "Let’s get you back to the music.",
      "home",
      "Back home",
    );
  updatePlayer();
  renderQueue();
}
function refreshKeepingFocus() {
  const focused = document.activeElement;
  const action = focused?.dataset.action,
    id = focused?.dataset.id;
  const y = window.scrollY;
  render();
  if (action) {
    const el = [...document.querySelectorAll("[data-action]")].find(
      (e) => e.dataset.action === action && e.dataset.id === id,
    );
    el?.focus({ preventScroll: true });
  }
  window.scrollTo(0, y);
}
function getSourceIds(source) {
  if (source === "catalog") return onlineIds();
  if (source === "search")
    return filterTracks(allTracks(), $("#search").value).map((t) => t.id);
  if (source === "liked") return state.liked;
  if (source === "local") return locals.map((t) => t.id);
  if (source?.startsWith("mix/"))
    return catalog.mixes.find((m) => m.id === source.slice(4))?.tracks || [];
  if (source?.startsWith("playlist/"))
    return state.playlists.find((p) => p.id === source.slice(9))?.tracks || [];
  return onlineIds();
}
function shuffled(ids) {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function startQueue(ids, id = ids[0]) {
  const clean = ids.filter((id) => track(id));
  if (!clean.length) return;
  queue = shuffle
    ? [id, ...shuffled(clean.filter((x) => x !== id))]
    : [...clean];
  queuePos = queue.indexOf(id);
  if (queuePos < 0) queuePos = 0;
  playAt(queuePos);
}
async function playAt(index) {
  const t = track(queue[index]);
  if (!t) return;
  const token = ++playToken;
  queuePos = index;
  currentId = t.id;
  $("#playback-error").hidden = true;
  audio.src = t.src;
  audio.load();
  updatePlayer();
  markRows();
  renderQueue();
  try {
    await audio.play();
    if (token !== playToken) return;
  } catch (e) {
    if (token !== playToken || e.name === "AbortError") return;
    showPlaybackError(
      e.name === "NotAllowedError"
        ? "Your browser needs another tap on Play to start audio."
        : `Couldn’t play “${t.title}”. Retry, or choose another track.`,
    );
    updatePlayer();
  }
}
function showPlaybackError(message) {
  $("#playback-error span").textContent = message;
  $("#playback-error").hidden = false;
}
async function toggle() {
  if (!currentId) {
    startQueue(onlineIds());
    return;
  }
  if (!audio.paused) {
    audio.pause();
    return;
  }
  try {
    await audio.play();
  } catch (e) {
    if (e.name !== "AbortError")
      showPlaybackError(
        "Playback couldn’t start. Try again or choose another track.",
      );
  }
}
function next(automatic = false) {
  const index = nextIndex(queuePos, queue.length, repeat, automatic);
  if (index === null) {
    audio.pause();
    updatePlayer();
    return;
  }
  playAt(index);
}
function previous() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  if (queue.length) playAt((queuePos - 1 + queue.length) % queue.length);
}
function updatePlayer() {
  const t = track(currentId);
  if (t) {
    $("#now-art").src = t.art;
    $("#now-title").textContent = t.title;
    $("#now-artist").textContent = t.artist;
    $("#now-like").disabled = false;
    $("#now-like").classList.toggle("active", state.liked.includes(t.id));
    $("#now-like").setAttribute(
      "aria-label",
      `${state.liked.includes(t.id) ? "Unlike" : "Like"} current song`,
    );
    $("#now-like").setAttribute("aria-pressed", state.liked.includes(t.id));
  }
  $("#play-toggle").innerHTML = icon(audio.paused ? "play" : "pause");
  $("#play-toggle").setAttribute("aria-label", audio.paused ? "Play" : "Pause");
  $("#shuffle").classList.toggle("active", shuffle);
  $("#shuffle").setAttribute("aria-pressed", shuffle);
  $("#repeat").classList.toggle("active", repeat !== "off");
  $("#repeat").setAttribute("aria-pressed", repeat !== "off");
  $("#repeat").setAttribute("aria-label", `Repeat ${repeat}`);
  $("#repeat").title = `Repeat ${repeat}`;
  $("#repeat").innerHTML =
    repeat === "one"
      ? '<span style="font-size:11px;font-weight:700">1</span>' + icon("repeat")
      : icon("repeat");
  document
    .querySelectorAll(".mobile-tools [data-action=shuffle]")
    .forEach((b) => {
      b.classList.toggle("active", shuffle);
      b.setAttribute("aria-pressed", shuffle);
    });
  document
    .querySelectorAll(".mobile-tools [data-action=repeat]")
    .forEach((b) => {
      b.classList.toggle("active", repeat !== "off");
      b.setAttribute("aria-pressed", repeat !== "off");
      b.setAttribute("aria-label", `Repeat ${repeat}`);
      b.innerHTML =
        repeat === "one"
          ? '<span style="font-size:11px;font-weight:700">1</span>' +
            icon("repeat")
          : icon("repeat");
    });
  $("#volume").value = audio.volume;
  $("#volume").style.setProperty("--progress", `${audio.volume * 100}%`);
  $("#mute").innerHTML = icon(
    audio.muted || audio.volume === 0 ? "muted" : "volume",
  );
  $("#mute").setAttribute("aria-label", audio.muted ? "Unmute" : "Mute");
  updateProgress();
}
function updateProgress() {
  const d = Number.isFinite(audio.duration) ? audio.duration : 0;
  $("#elapsed").textContent = formatTime(audio.currentTime);
  $("#duration").textContent = formatTime(d);
  $("#seek").disabled = !d;
  $("#seek").max = d || 100;
  $("#seek").value = audio.currentTime || 0;
  $("#seek").style.setProperty(
    "--progress",
    `${d ? (audio.currentTime / d) * 100 : 0}%`,
  );
  $("#seek").setAttribute(
    "aria-valuetext",
    `${formatTime(audio.currentTime)} of ${formatTime(d)}`,
  );
}
function markRows() {
  document.querySelectorAll(".track-row").forEach((row, i) => {
    const active = row.dataset.track === currentId;
    row.classList.toggle("current", active);
    row.querySelector(".row-play").innerHTML =
      active && !audio.paused
        ? '<span class="playing-bars"><i></i><i></i><i></i></span>'
        : icon("play");
  });
}
function renderQueue() {
  const el = $("#queue-drawer");
  if (el.hidden) return;
  el.innerHTML = `<div class="drawer-head"><h2>Your queue</h2><button class="icon-button" data-action="queue-toggle" aria-label="Close queue">${icon("close")}</button></div><p class="note">${queue.length ? `${Math.max(0, queue.length - queuePos - 1)} tracks up next` : "Pick a track to start your queue."}</p>${queue
    .slice(Math.max(queuePos, 0))
    .map((id, i) => {
      const t = track(id);
      if (!t) return "";
      return `<div class="queue-item ${i === 0 ? "current" : ""}"><button data-action="queue-play" data-index="${Math.max(queuePos, 0) + i}" aria-label="Play ${esc(t.title)}"><img src="${t.art}" alt=""><div><strong>${esc(t.title)}</strong><small>${i === 0 ? "Now selected" : esc(t.artist)}</small></div></button>${i ? `<button class="icon-button" data-action="queue-remove" data-index="${queuePos + i}" aria-label="Remove ${esc(t.title)} from queue">${icon("close")}</button>` : ""}</div>`;
    })
    .join(
      "",
    )}<p class="note" style="margin-top:20px">Repeat: ${repeat} · Shuffle: ${shuffle ? "on" : "off"}</p>`;
}
function openModal(title, body) {
  $("#modal-content").innerHTML =
    `<div class="modal-head"><h2>${esc(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button></div>${body}`;
  if (!modal.open) modal.showModal();
}
function createPlaylist(trackId) {
  openModal(
    "A playlist of your own.",
    `<form id="playlist-form"><label for="playlist-name">Give it a name</label><input id="playlist-name" name="name" type="text" maxlength="60" required placeholder="A very good mood" autocomplete="off"><p>Saved in this browser. Add tracks from any song’s options.</p><div class="modal-actions"><button type="button" class="outline-button" data-action="close-modal">Cancel</button><button class="primary-button" type="submit">Create playlist ${icon("plus")}</button></div></form>`,
  );
  $("#playlist-name").focus();
  $("#playlist-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#playlist-name").value.trim();
    if (!name) {
      $("#playlist-name").setCustomValidity("Give your playlist a name.");
      $("#playlist-name").reportValidity();
      return;
    }
    const p = {
      id: crypto.randomUUID(),
      name,
      tracks: trackId ? [trackId] : [],
    };
    state.playlists.push(p);
    save();
    modal.close();
    navigate(`playlist/${p.id}`);
    toast("Your new playlist is ready.");
  });
  $("#playlist-name").addEventListener("input", (e) =>
    e.target.setCustomValidity(""),
  );
}
function trackMenu(id) {
  const t = track(id);
  if (!t) return;
  const p = activeList();
  openModal(
    t.title,
    `<p>${esc(t.artist)}${t.local ? " · Available this session only" : ""}</p><button class="menu-action" data-action="play-next" data-id="${esc(id)}">${icon("next")} Play next</button><button class="menu-action" data-action="add-queue" data-id="${esc(id)}">${icon("queue")} Add to queue</button><button class="menu-action" data-action="choose-playlist" data-id="${esc(id)}">${icon("plus")} Add to playlist</button>${p ? `<button class="menu-action" data-action="remove-from-playlist" data-id="${esc(id)}">${icon("close")} Remove from this playlist</button>` : ""}${t.source ? `<a class="menu-action" href="${t.source}" target="_blank" rel="noopener noreferrer">${icon("info")} Artist credit & source</a>` : ""}`,
  );
}
function choosePlaylist(id) {
  if (!state.playlists.length) {
    createPlaylist(id);
    return;
  }
  openModal(
    "Add to a playlist",
    `${track(id)?.local ? "<p>Local tracks stay in playlists only for this session.</p>" : ""}${state.playlists.map((p) => `<button class="menu-action" data-action="add-to-playlist" data-id="${esc(id)}" data-playlist="${esc(p.id)}">${icon("music")} ${esc(p.name)}</button>`).join("")}<button class="menu-action" data-action="new-playlist-with-track" data-id="${esc(id)}">${icon("plus")} Create a new playlist</button>`,
  );
}
function like(id) {
  if (!track(id)) return;
  if (state.liked.includes(id))
    state.liked = state.liked.filter((x) => x !== id);
  else state.liked.push(id);
  save();
  if (track(id).local)
    toast("Local-track likes are kept for this session only.");
  refreshKeepingFocus();
}
function toggleQueue() {
  const el = $("#queue-drawer");
  el.hidden = !el.hidden;
  $("#queue-toggle").setAttribute("aria-expanded", !el.hidden);
  $("#queue-toggle").classList.toggle("active", !el.hidden);
  if (!el.hidden) {
    renderQueue();
    el.querySelector("button")?.focus();
  } else $("#queue-toggle").focus();
}
const actions = {
  "focus-main": () => main.focus(),
  home: () => navigate("home"),
  library: () => navigate("library"),
  about: () => navigate("about"),
  discover: () => {
    $("#search").value = "";
    navigate("search");
  },
  "all-tracks": () => {
    $("#search").value = "";
    navigate("search");
  },
  "clear-search": () => {
    $("#search").value = "";
    renderSearch();
    $("#search").focus();
  },
  filter: (b) => {
    mood = b.dataset.mood;
    refreshKeepingFocus();
  },
  import: () => $("#file-input").click(),
  "play-mix": (b) => {
    const m = catalog.mixes.find((m) => m.id === b.dataset.id);
    if (m) startQueue(m.tracks);
  },
  "play-track": (b) => {
    const ids = getSourceIds(b.dataset.source);
    if (b.dataset.id === currentId) toggle();
    else
      startQueue(
        ids.includes(b.dataset.id) ? ids : [b.dataset.id],
        b.dataset.id,
      );
  },
  "play-collection": () => startQueue(getSourceIds(route())),
  toggle,
  next: () => next(false),
  previous,
  shuffle: () => {
    shuffle = !shuffle;
    if (shuffle && queue.length) {
      queue = [
        ...queue.slice(0, queuePos + 1),
        ...shuffled(queue.slice(queuePos + 1)),
      ];
    }
    updatePlayer();
    renderQueue();
    toast(`Shuffle ${shuffle ? "on" : "off"}`);
  },
  repeat: () => {
    repeat = { off: "all", all: "one", one: "off" }[repeat];
    updatePlayer();
    renderQueue();
    toast(`Repeat ${repeat}`);
  },
  mute: () => {
    audio.muted = !audio.muted;
    updatePlayer();
  },
  "queue-toggle": toggleQueue,
  "queue-play": (b) => playAt(Number(b.dataset.index)),
  "queue-remove": (b) => {
    const i = Number(b.dataset.index);
    if (i > queuePos) {
      queue.splice(i, 1);
      renderQueue();
    }
  },
  like: (b) => like(b.dataset.id),
  "like-current": () => like(currentId),
  "create-playlist": () => createPlaylist(),
  "new-playlist-with-track": (b) => createPlaylist(b.dataset.id),
  "track-menu": (b) => trackMenu(b.dataset.id),
  "choose-playlist": (b) => choosePlaylist(b.dataset.id),
  "add-to-playlist": (b) => {
    addTrackToPlaylist(state, b.dataset.playlist, b.dataset.id);
    save();
    modal.close();
    refreshKeepingFocus();
    toast("Added to your playlist.");
  },
  "remove-from-playlist": (b) => {
    const p = activeList();
    if (p) {
      p.tracks = p.tracks.filter((id) => id !== b.dataset.id);
      save();
      modal.close();
      render();
    }
  },
  "add-queue": (b) => {
    if (!queue.length) startQueue([b.dataset.id]);
    else {
      queue.push(b.dataset.id);
      renderQueue();
    }
    modal.close();
    toast("Added to queue.");
  },
  "play-next": (b) => {
    if (!queue.length) startQueue([b.dataset.id]);
    else {
      queue.splice(queuePos + 1, 0, b.dataset.id);
      renderQueue();
    }
    modal.close();
    toast("Playing next.");
  },
  "save-mix": (b) => {
    const m = catalog.mixes.find((m) => m.id === b.dataset.id);
    if (!m) return;
    state.playlists.push({
      id: crypto.randomUUID(),
      name: m.title,
      tracks: [...m.tracks],
    });
    save();
    renderNav();
    toast("Mix saved to your library.");
  },
  "delete-playlist": (b) => {
    const p = state.playlists.find((p) => p.id === b.dataset.id);
    if (p)
      openModal(
        "Delete this playlist?",
        `<p>“${esc(p.name)}” will be removed from your saved library.</p><div class="modal-actions"><button class="outline-button" data-action="close-modal">Keep it</button><button class="primary-button" data-action="confirm-delete" data-id="${esc(p.id)}">Delete playlist</button></div>`,
      );
  },
  "confirm-delete": (b) => {
    state.playlists = state.playlists.filter((p) => p.id !== b.dataset.id);
    save();
    modal.close();
    navigate("library");
    toast("Playlist deleted.");
  },
  "close-modal": () => modal.close(),
  retry: () => {
    if (queuePos >= 0) playAt(queuePos);
  },
  "dismiss-error": () => ($("#playback-error").hidden = true),
  "confirm-reset": () =>
    openModal(
      "Reset your saved library?",
      `<p>This removes your likes, playlists, and recently played tracks from this browser.</p><div class="modal-actions"><button class="outline-button" data-action="close-modal">Keep my library</button><button class="primary-button" data-action="reset">Reset library</button></div>`,
    ),
  reset: () => {
    state = sanitizeState(null, onlineIds());
    save();
    audio.volume = state.volume;
    modal.close();
    render();
    toast("Your saved library has been reset.");
  },
};
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (b && !b.disabled && state) {
    if (b.matches("a")) e.preventDefault();
    actions[b.dataset.action]?.(b);
  }
});
window.addEventListener("hashchange", () => {
  render();
  window.scrollTo({ top: 0 });
  $("#queue-drawer").hidden = true;
  $("#queue-toggle").setAttribute("aria-expanded", "false");
  $("#queue-toggle").classList.remove("active");
});
$("#search").addEventListener("input", () => {
  if (route() !== "search") {
    history.pushState(null, "", "#search");
    renderNav();
    $("#page-label").textContent = "Search";
  }
  renderSearch();
});
$("#seek").addEventListener("input", (e) => {
  if (Number.isFinite(audio.duration)) {
    audio.currentTime = Number(e.target.value);
    updateProgress();
  }
});
$("#volume").addEventListener("input", (e) => {
  audio.volume = Number(e.target.value);
  audio.muted = false;
  state.volume = audio.volume;
  save();
  updatePlayer();
});
audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("loadedmetadata", () => {
  const t = track(currentId);
  if (t && Number.isFinite(audio.duration)) t.duration = audio.duration;
  updateProgress();
  if (t) {
    document.querySelectorAll(".track-row").forEach((r) => {
      if (r.dataset.track === t.id)
        r.querySelector(".track-time").textContent = formatTime(t.duration);
    });
  }
});
audio.addEventListener("play", () => {
  updatePlayer();
  markRows();
  $("#playback-error").hidden = true;
  if (currentId && !currentId.startsWith("local:")) {
    state.recent = [
      currentId,
      ...state.recent.filter((id) => id !== currentId),
    ].slice(0, 12);
    save();
  }
  if ("mediaSession" in navigator) {
    const t = track(currentId);
    if (t && "MediaMetadata" in window)
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title,
        artist: t.artist,
        album: "Meowtify",
        artwork: [],
      });
    navigator.mediaSession.playbackState = "playing";
  }
});
audio.addEventListener("pause", () => {
  updatePlayer();
  markRows();
  if ("mediaSession" in navigator)
    navigator.mediaSession.playbackState = "paused";
});
audio.addEventListener("ended", () => next(true));
audio.addEventListener("error", () => {
  if (currentId) {
    showPlaybackError(
      "This track is unavailable or its audio format isn’t supported. Retry or choose another.",
    );
    updatePlayer();
  }
});
$("#file-input").addEventListener("change", (e) => {
  const files = [...e.target.files];
  let count = 0;
  for (const f of files) {
    if (
      !f.type.startsWith("audio/") &&
      !/\.(mp3|wav|ogg|m4a|flac)$/i.test(f.name)
    )
      continue;
    const key = `${f.name}:${f.size}:${f.lastModified}`;
    if (locals.some((t) => t.key === key)) continue;
    locals.push({
      id: `local:${crypto.randomUUID()}`,
      key,
      title: f.name.replace(/\.[^.]+$/, ""),
      artist: "Your local music",
      genre: "Local",
      src: URL.createObjectURL(f),
      art: "assets/mix-6.svg",
      local: true,
      duration: 0,
    });
    count++;
  }
  e.target.value = "";
  navigate("local");
  toast(
    count
      ? `${count} track${count === 1 ? "" : "s"} added. Available for this session.`
      : "No new supported audio files were selected.",
  );
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#queue-drawer").hidden) {
    toggleQueue();
    return;
  }
  if (
    modal.open ||
    e.target.matches("input,textarea,select,button,[contenteditable=true]")
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    toggle();
  }
  if (e.key === "/") {
    e.preventDefault();
    $("#search").focus();
  }
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    const r = modal.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      modal.close();
  }
});
if ("mediaSession" in navigator) {
  for (const [name, fn] of Object.entries({
    play: toggle,
    pause: () => audio.pause(),
    previoustrack: previous,
    nexttrack: () => next(false),
    seekto: (d) => {
      if (Number.isFinite(d.seekTime) && Number.isFinite(audio.duration))
        audio.currentTime = Math.min(d.seekTime, audio.duration);
    },
  })) {
    try {
      navigator.mediaSession.setActionHandler(name, fn);
    } catch {}
  }
}
paintIcons();
async function init() {
  try {
    const res = await fetch("catalog.json");
    if (!res.ok) throw new Error("catalog");
    catalog = await res.json();
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem("meowtify:v1") || "null");
    } catch {}
    state = sanitizeState(stored, onlineIds());
    audio.volume = state.volume;
    render();
  } catch {
    main.innerHTML = `<div class="empty-state"><h1>The collection couldn’t load.</h1><p>Check your connection, then reload Meowtify.</p><button class="primary-button" id="reload">Try again</button></div>`;
    $("#reload").onclick = () => location.reload();
  }
}
init();
