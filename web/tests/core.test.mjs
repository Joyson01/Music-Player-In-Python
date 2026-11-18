import test from "node:test";
import assert from "node:assert/strict";
import {
  filterTracks,
  sanitizeState,
  nextIndex,
  formatTime,
  addTrackToPlaylist,
} from "../dist/core.mjs";

test("search matches title, artist and genre without case or whitespace sensitivity", () => {
  const songs = [
    { id: "a", title: "Soft Landing", artist: "Ada", genre: "Ambient" },
    { id: "b", title: "City", artist: "Nova", genre: "Electronic" },
  ];
  assert.deepEqual(
    filterTracks(songs, "  ADA ").map((t) => t.id),
    ["a"],
  );
  assert.deepEqual(
    filterTracks(songs, "ambient").map((t) => t.id),
    ["a"],
  );
  assert.deepEqual(filterTracks(songs, "xyz"), []);
  assert.equal(filterTracks(songs, "").length, 2);
});
test("untrusted saved state falls back safely and removes unknown and local IDs", () => {
  assert.deepEqual(sanitizeState(null, ["a"]).liked, []);
  assert.deepEqual(
    sanitizeState(
      {
        liked: ["a", "a", "local:1", 7],
        playlists: [
          null,
          { id: "p", name: "  Mix  ", tracks: ["local:1", "a", "a"] },
        ],
        volume: 5,
      },
      ["a"],
    ),
    {
      liked: ["a"],
      playlists: [{ id: "p", name: "Mix", tracks: ["a"] }],
      volume: 1,
      recent: [],
    },
  );
  assert.deepEqual(
    sanitizeState({ liked: {}, playlists: "oops", volume: "x" }, ["a"])
      .playlists,
    [],
  );
});
test("queue ends stop automatically except repeat all; repeat one is automatic only", () => {
  assert.equal(nextIndex(2, 3, "off", true), null);
  assert.equal(nextIndex(2, 3, "all", true), 0);
  assert.equal(nextIndex(1, 3, "one", true), 1);
  assert.equal(nextIndex(1, 3, "one", false), 2);
  assert.equal(nextIndex(2, 3, "off", false), 0);
  assert.equal(nextIndex(0, 0, "all", false), null);
});
test("time formatting handles absent and invalid media duration", () => {
  assert.equal(formatTime(NaN), "0:00");
  assert.equal(formatTime(Infinity), "0:00");
  assert.equal(formatTime(-2), "0:00");
  assert.equal(formatTime(125.9), "2:05");
});
test("playlist addition does not duplicate songs or mutate unrelated playlists", () => {
  const s = {
    playlists: [
      { id: "p", tracks: ["a"] },
      { id: "q", tracks: [] },
    ],
  };
  addTrackToPlaylist(s, "p", "b");
  addTrackToPlaylist(s, "p", "b");
  assert.deepEqual(s.playlists, [
    { id: "p", tracks: ["a", "b"] },
    { id: "q", tracks: [] },
  ]);
  assert.equal(addTrackToPlaylist(s, "missing", "c"), false);
});
test("all created playlists survive a save and reload beyond one hundred entries", () => {
  const playlists = Array.from({ length: 101 }, (_, i) => ({
    id: `p${i}`,
    name: `Playlist ${i}`,
    tracks: ["a"],
  }));
  const restored = sanitizeState(JSON.parse(JSON.stringify({ playlists })), [
    "a",
  ]);
  assert.equal(restored.playlists.length, 101);
  assert.deepEqual(restored.playlists[100], {
    id: "p100",
    name: "Playlist 100",
    tracks: ["a"],
  });
});
