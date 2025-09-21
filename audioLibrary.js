export const OUTRO_CLIPS = [
  { id: "clean_bright_f", label: "Clean Bright F", file: "/hey_clean_bright_f.mp3" },
  { id: "clean_bright_m", label: "Clean Bright M", file: "/hey_clean_bright_m.mp3" },
  { id: "hype_radio_2", label: "Hype Radio", file: "/hey_hype_radio (2).mp3" },
  { id: "whisper", label: "Whisper", file: "/hey_whisper.mp3" },
  { id: "robotic", label: "Robotic", file: "/hey_robotic.mp3" },
  { id: "retro_8bit", label: "Retro 8-Bit", file: "/hey_retro_8bit.mp3" },
  { id: "cinematic", label: "Cinematic", file: "/hey_cinematic.mp3" },
  { id: "telephone", label: "Telephone", file: "/hey_telephone.mp3" },
  { id: "short_snap", label: "Short Snap", file: "/hey_short_snap.mp3" },
  { id: "long_tag", label: "Long Tag", file: "/hey_long_tag.mp3" },
  { id: "chorus", label: "Chorus", file: "/hey_chorus.mp3" },
  { id: "dark_trailer", label: "Dark Trailer", file: "/hey_dark_trailer.mp3" },
  { id: "navi", label: "Navi Fairy", file: "/hey_navi.mp3" },
  { id: "autotune_pop", label: "Auto-Tune Pop", file: "/hey_autotune_pop.mp3" },
  { id: "vaporwave", label: "Vaporwave", file: "/hey_vaporwave.mp3" },
  { id: "tts_flat", label: "TTS Flat", file: "/hey_tts_flat.mp3" },
  { id: "metal_scream", label: "Metal Scream", file: "/hey_metal_scream.mp3" },
  { id: "country_drawl", label: "Country Drawl", file: "/hey_country_drawl.mp3" },
  { id: "synthwave_lead", label: "Synthwave Lead", file: "/hey_synthwave_lead.mp3" },
  { id: "airport_pa", label: "Airport PA", file: "/hey_airport_pa.mp3" },
  { id: "cartoon_bounce", label: "Cartoon Bounce", file: "/hey_cartoon_bounce.mp3" },
  { id: "barbershop_quartet", label: "Barbershop Quartet", file: "/hey_barbershop_quartet.mp3" },
  { id: "crowd_chant", label: "Crowd Chant", file: "/hey_crowd_chant.mp3" },
  { id: "binaural_asmr", label: "Binaural ASMR", file: "/hey_binaural_asmr.mp3" },
  { id: "space_astronaut", label: "Space Astronaut", file: "/hey_space_astronaut.mp3" },
  { id: "opera_vibrato", label: "Opera Vibrato", file: "/hey_opera_vibrato.mp3" },
  { id: "brit_announce", label: "British Announcer", file: "/hey_brit_announce.mp3" },
  { id: "sports_announce", label: "Sports Announcer", file: "/hey_sports_announce.mp3" },
  { id: "choir_epic", label: "Epic Choir", file: "/hey_choir_epic.mp3" },
  { id: "gameshow_hype", label: "Game Show Hype", file: "/hey_gameshow_hype.mp3" },
  { id: "soft_piano_bed", label: "Soft Piano Bed", file: "/hey_soft_piano_bed.mp3" },
  { id: "lofi_tape", label: "Lo-Fi Tape", file: "/hey_lofi_tape.mp3" },
  { id: "monster_low", label: "Monster Low", file: "/hey_monster_low.mp3" },
  { id: "child_joy", label: "Child Joy", file: "/hey_child_joy.mp3" },
  { id: "glitch_fx", label: "Glitch FX", file: "/hey_glitch_fx.mp3" },
  { id: "jazz_scat", label: "Jazz Scat", file: "/hey_jazz_scat.mp3" },
  { id: "surfer_dude", label: "Surfer Dude", file: "/hey_surfer_dude.mp3" },
  { id: "goth_whisper", label: "Goth Whisper", file: "/hey_goth_whisper.mp3" },
  { id: "french_rp", label: "French Accent", file: "/hey_french_rp.mp3" },
  { id: "spanish_tv", label: "Spanish TV", file: "/hey_spanish_tv.mp3" },
  { id: "anime_hype", label: "Anime Hype", file: "/hey_anime_hype.mp3" },
  { id: "newscaster", label: "News Anchor", file: "/hey_newscaster.mp3" },
  { id: "drill_sergeant", label: "Drill Sergeant", file: "/hey_drill_sergeant.mp3" },
  { id: "pirate", label: "Pirate", file: "/hey_pirate.mp3" },
  { id: "beatbox_tag", label: "Beatbox", file: "/hey_beatbox_tag.mp3" },
  { id: "cowboy_quick", label: "Cowboy", file: "/hey_cowboy_quick.mp3" },
  { id: "medieval_towncrier", label: "Town Crier", file: "/hey_medieval_towncrier.mp3" },
];

export const DEFAULT_OUTRO_REGIONS = new Map([
  ["clean_bright_f", [0.32, 1.43]],
  ["clean_bright_m", [0.34, 1.46]],
  ["retro_8bit", [0.11, 1.20]],
  ["robotic", [0.33, 1.43]],
  ["cinematic", [0.04, 1.80]],
  ["country_drawl", [2.04, 3.95]],
  ["tts_flat", [2.25, 3.90]],
  ["binaural_asmr", [2.40, 3.75]],
  ["lofi_tape", [2.23, 3.80]],
  ["child_joy", [1.10, 2.90]],
  ["sports_announce", [1.39, 3.80]],
]);

export function createAudioPlayer() {
  let audioContext;
  const audioBuffers = new Map();
  let source = null,
    currentId = null,
    startTime = 0,
    currentDur = 0,
    currentRegionNorm = null;

  const init = () => {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  };

  document.addEventListener("click", init, { once: true });
  document.addEventListener("keydown", init, { once: true });

  const ensureBuffer = async (id, file) => {
    if (!audioContext) init();
    let buf = audioBuffers.get(id);
    if (buf) return buf;
    const res = await fetch(file);
    const ab = await res.arrayBuffer();
    buf = await audioContext.decodeAudioData(ab);
    audioBuffers.set(id, buf);
    return buf;
  };

  const play = async (
    id,
    file,
    { gain = 1.0, onEnded = () => {}, regionSec = null } = {}
  ) => {
    if (!audioContext) init();
    if (!audioContext) return;
    stop();
    const g = audioContext.createGain();
    g.gain.setValueAtTime(gain, audioContext.currentTime);
    g.connect(audioContext.destination);

    try {
      const buf = await ensureBuffer(id, file);
      source = audioContext.createBufferSource();
      currentId = id;
      const offset = regionSec ? Math.max(0, regionSec.start) : 0;
      const dur = regionSec
        ? Math.max(0.001, regionSec.end - regionSec.start)
        : undefined;
      startTime = audioContext.currentTime;
      currentDur = dur ?? buf.duration;
      currentRegionNorm = regionSec
        ? { start: offset / buf.duration, end: regionSec.end / buf.duration }
        : null;
      source.buffer = buf;
      source.connect(g);
      source.onended = () => {
        currentId = null;
        currentRegionNorm = null;
        onEnded();
      };
      source.start(0, offset, dur);
    } catch (e) {
      console.error(e);
    }
  };

  const stop = () => {
    if (source) {
      source.onended = null;
      source.stop();
      source = null;
    }
    currentId = null;
  };

  const getProgressX = (id) => {
    const p =
      id === currentId && currentDur > 0
        ? Math.min(1, (audioContext.currentTime - startTime) / currentDur)
        : null;
    if (p == null) return null;
    if (currentRegionNorm)
      return currentRegionNorm.start + p * (currentRegionNorm.end - currentRegionNorm.start);
    return p;
  };

  return { play, stop, ensureBuffer, getProgressX };
}

export function drawWaveform(cv, buffer, sel, progress) {
  const c = cv.getContext("2d");
  const w = cv.width = cv.clientWidth * window.devicePixelRatio;
  const h = cv.height = cv.clientHeight * window.devicePixelRatio;
  cv.style.width = `${cv.clientWidth}px`;
  cv.style.height = `${cv.clientHeight}px`;
  c.clearRect(0, 0, w, h);
  c.fillStyle = "#eee";
  c.fillRect(0, 0, w, h);
  if (!buffer) return;

  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / w);
  c.strokeStyle = "#111";
  c.beginPath();

  for (let x = 0; x < w; x++) {
    let min = 1,
      max = -1;
    for (let i = 0; i < step; i++) {
      const y = data[x * step + i] || 0;
      min = Math.min(min, y);
      max = Math.max(max, y);
    }
    c.moveTo(x, (1 + min) * 0.5 * h);
    c.lineTo(x, (1 + max) * 0.5 * h);
  }
  c.stroke();
  if (sel) {
    const sx = sel.start * w,
      ex = sel.end * w;
    c.fillStyle = "rgba(0,0,0,0.12)";
    c.fillRect(Math.min(sx, ex), 0, Math.abs(ex - sx), h);
  }
  if (progress != null) {
    const px = Math.max(0, Math.min(1, progress)) * w;
    c.fillStyle = "rgba(0,0,0,0.55)";
    c.fillRect(px | 0, 0, 2, h);
  }
}