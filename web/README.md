# Meowtify

A Spotify-inspired web music player with a cat identity, original illustrated covers, real streaming audio, and private local-file playback. A browser-first companion to Joyson's [Music-Player-In-Python](https://github.com/Joyson01/Music-Player-In-Python). The original Tkinter/Pygame application is preserved at the repository root.

## Run

The app is buildless and has no runtime package dependencies. From this directory:

```sh
python3 -m http.server 4188 --bind 127.0.0.1 --directory dist
```

Visit http://127.0.0.1:4188. Serve over HTTP(S); opening index.html as a file will not load the ES modules or catalogue.

## Features

- Responsive home, seven editorial mixes, search by track/artist and mix/mood, liked songs, custom playlists and library.
- Native audio playback, progress and seeking, previous/next, shuffle, repeat off/all/one, desktop volume and mute, queue, play-next and queue removal.
- Eight tracks by T. Schürger / SoundHelix. Track names are preserved. Source credit and use-permission links appear in About and track options.
- Local MP3, WAV, OGG, M4A and FLAC selection (decoding depends on browser support). Files use in-memory object URLs and are never uploaded. Re-select after reload. Local song IDs are excluded from persisted lists.
- Likes, playlists, recent listening and volume use localStorage under `meowtify:v1`. Invalid data is sanitized; unavailable storage falls back to session state with feedback. Data is specific to browser and origin.
- Keyboard focus states and native dialogs; Space toggles playback outside interactive controls, `/` focuses search. Media Session transport support where available.
- Audio errors offer retry and next-track actions. Audio requires a user gesture to start. External streams require an internet connection.

This is an independent player, not a Spotify account integration or a licensed Spotify catalogue. The starter tracks are algorithmically composed electronic music. Mix titles and covers are Meowtify editorial artwork, not original album metadata. Mobile volume uses device controls. Track durations populate when the browser loads audio metadata.

## Verify

Requires Node 18 or newer:

```sh
node --check dist/app.mjs
node --check dist/core.mjs
node --test tests/*.test.mjs
```

The tests exercise search, corrupt saved data, filtering unavailable/local references, queue boundaries, repeat semantics, invalid media duration, playlist deduplication, and keeping more than 100 saved playlists.

Browser QA on 2026-11-18 covered real online playback and progress, pause, seek, next track, queue display/removal, playlist creation and track addition, liked-song persistence after reload, search and empty search, local WAV import/playback and end-of-queue stop, keyboard skip navigation, tablet accessible labels, mobile shuffle/repeat feedback, and desktop/390px visual checks. No browser console errors were captured. All eight online streams responded with HTTP 206/audio-mpeg to range requests. Safari and physical-phone playback have not been tested.

## Content and privacy

Audio is streamed directly from [SoundHelix](https://www.soundhelix.com/audio-examples), whose audio-examples page permits use with credit to SoundHelix and the artist. Credit: **T. Schürger / SoundHelix**. External source uptime is outside this app's control. The source page returned its credit and permission text along with a server error during preparation; the audio endpoints responded normally.

All SVG covers, cat illustration and logo were created for this app. Google Fonts supplies Manrope and DM Sans. No analytics, user accounts, uploads or backend database are included. Hosting, font and audio providers receive standard network requests.

## Hosting

Deploy the `dist/` directory to any static HTTPS host. No build command or server-side runtime is required. Serve the files without rewriting asset requests to HTML.

The current [hosted preview](https://meowtify-joyson.splendidcloak.chatgpt.site) is private and may require owner access. The hosting account configuration is managed separately from this public source repository.
