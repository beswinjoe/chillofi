const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Also serve the root directory files (like index.html) for simplicity
app.use('/', express.static(__dirname));
app.use(express.json());

// In-memory like store
const likedTracks = new Set();

// ========== Mood-Based Playlists ==========
// Each mood has its own unique tracks and background video
const playlists = {
  study: {
    name: 'Study Lofi',
    video: 'study.mp4',
    tracks: [
      { id: 1,  title: 'Midnight Study',     artist: 'ChillLofi Sessions',  audioUrl: 'https://live.lofiradio.ru/lofi_mp3_128' },
      { id: 2,  title: 'Deep Focus',          artist: 'Brainwaves',          audioUrl: 'https://a5.asurahosting.com:8150/radio.mp3' },
      { id: 3,  title: 'Exam Prep',           artist: 'Lofi Scholar',        audioUrl: 'https://live.lofiradio.ru/lofi_mp3_128' },
      { id: 4,  title: 'Library Ambience',     artist: 'Quiet Pages',         audioUrl: 'https://radio.loficafe.net/listen/chilling/radio.mp3' },
      { id: 5,  title: 'Late Night Notes',     artist: 'Study Beats',         audioUrl: 'https://a5.asurahosting.com:8150/radio.mp3' },
      { id: 6,  title: 'Morning Revision',     artist: 'Campus Lofi',         audioUrl: 'https://live.lofiradio.ru/lofi_mp3_128' },
    ]
  },
  rain: {
    name: 'Rainy Vibes',
    video: 'rainy.mp4',
    tracks: [
      { id: 7,  title: 'Rainy Window',        artist: 'LofiCafe Beats',      audioUrl: 'https://radio.loficafe.net/listen/chilling/radio.mp3' },
      { id: 8,  title: 'Soft Thunder',         artist: 'Nature Sounds',       audioUrl: 'https://radio.loficafe.net/listen/chilling/radio.mp3' },
      { id: 9,  title: 'Puddles',              artist: 'Rainy Day',           audioUrl: 'https://a5.asurahosting.com:8150/radio.mp3' },
      { id: 10, title: 'Storm Watching',        artist: 'Cloud Collective',    audioUrl: 'https://live.lofiradio.ru/lofi_mp3_128' },
      { id: 11, title: 'Drizzle at Dawn',       artist: 'Rainfall Beats',     audioUrl: 'https://radio.loficafe.net/listen/chilling/radio.mp3' },
      { id: 12, title: 'Umbrella Walk',         artist: 'Wet Streets',         audioUrl: 'https://a5.asurahosting.com:8150/radio.mp3' },
    ]
  },
  sleep: {
    name: 'Sleep & Chill',
    video: 'sleep.mp4',
    tracks: [
      { id: 13, title: 'Sleepy Head',          artist: 'Dreamy Lofi',         audioUrl: 'https://live.lofiradio.ru/lofi_mp3_128' },
      { id: 14, title: 'Midnight Drift',        artist: 'Night Owl',           audioUrl: 'https://radio.loficafe.net/listen/chilling/radio.mp3' },
      { id: 15, title: 'Sweet Dreams',          artist: 'Lullaby Beats',       audioUrl: 'https://a5.asurahosting.com:8150/radio.mp3' },
      { id: 16, title: 'Moonlit Pillow',         artist: 'Dreamscape',          audioUrl: 'https://live.lofiradio.ru/lofi_mp3_128' },
      { id: 17, title: 'Counting Stars',         artist: 'Nightlight Lofi',    audioUrl: 'https://radio.loficafe.net/listen/chilling/radio.mp3' },
      { id: 18, title: '3AM Lullaby',            artist: 'Sleepwalker',         audioUrl: 'https://a5.asurahosting.com:8150/radio.mp3' },
    ]
  },
  focus: {
    name: 'Deep Focus',
    video: 'focus.mp4',
    tracks: [
      { id: 19, title: 'Coffee at 3AM',        artist: 'Retro Focus',         audioUrl: 'https://a5.asurahosting.com:8150/radio.mp3' },
      { id: 20, title: 'Neon Grid',             artist: 'Cyber Beats',         audioUrl: 'https://live.lofiradio.ru/lofi_mp3_128' },
      { id: 21, title: 'Pixel Dreams',           artist: 'Retro Lofi',          audioUrl: 'https://a5.asurahosting.com:8150/radio.mp3' },
      { id: 22, title: 'Flow State',              artist: 'Zone In',             audioUrl: 'https://radio.loficafe.net/listen/chilling/radio.mp3' },
      { id: 23, title: 'Code & Chill',            artist: 'Dev Beats',           audioUrl: 'https://live.lofiradio.ru/lofi_mp3_128' },
      { id: 24, title: 'Productivity Loop',       artist: 'Grind Mode',          audioUrl: 'https://a5.asurahosting.com:8150/radio.mp3' },
    ]
  }
};

// Add mood field and liked getter to all tracks
const moods = Object.keys(playlists);
for (const mood of moods) {
  playlists[mood].tracks = playlists[mood].tracks.map(t => ({
    ...t,
    mood,
    get liked() { return likedTracks.has(t.id); }
  }));
}

let currentMoodIndex = 0;

// ========== API Endpoints ==========

// Get current playlist (mood-filtered)
app.get('/api/playlist', (req, res) => {
  const mood = moods[currentMoodIndex];
  const pl = playlists[mood];
  res.json({
    mood,
    name: pl.name,
    video: pl.video,
    tracks: pl.tracks
  });
});

// Cycle to the next playlist (MUST be before :mood route)
app.get('/api/playlist/next', (req, res) => {
  currentMoodIndex = (currentMoodIndex + 1) % moods.length;
  const mood = moods[currentMoodIndex];
  const pl = playlists[mood];
  res.json({
    mood,
    name: pl.name,
    video: pl.video,
    tracks: pl.tracks
  });
});

// Switch to a specific mood
app.get('/api/playlist/:mood', (req, res) => {
  const mood = req.params.mood;
  if (!playlists[mood]) {
    return res.status(404).json({ error: 'Unknown mood' });
  }
  currentMoodIndex = moods.indexOf(mood);
  const pl = playlists[mood];
  res.json({
    mood,
    name: pl.name,
    video: pl.video,
    tracks: pl.tracks
  });
});

// Shuffle current playlist
app.get('/api/shuffle', (req, res) => {
  const mood = moods[currentMoodIndex];
  const pl = playlists[mood];
  const tracksCopy = [...pl.tracks];
  for (let i = tracksCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tracksCopy[i], tracksCopy[j]] = [tracksCopy[j], tracksCopy[i]];
  }
  res.json({
    mood,
    name: pl.name,
    video: pl.video,
    tracks: tracksCopy
  });
});

// Like API Endpoint
app.post('/api/like', (req, res) => {
  const { trackId, liked } = req.body;
  if (liked) {
    likedTracks.add(trackId);
  } else {
    likedTracks.delete(trackId);
  }
  res.json({ success: true, trackId, liked });
});

// Only listen when run directly (local dev), not when imported
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ChillLofi Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
