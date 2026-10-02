let audioCtx: AudioContext | null = null;
let isMuted = false;

export const initAudio = () => {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const toggleMute = () => {
  isMuted = !isMuted;
  if (!isMuted) initAudio();
  return isMuted;
};

export const getMuteState = () => isMuted;

// オシレーターを作成するヘルパー
const createOscillator = (type: OscillatorType, freq: number, duration: number, vol = 0.1) => {
  if (isMuted || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

// ノイズを生成するヘルパー（打撃音やカードドローの摩擦音用）
const playNoise = (duration: number, vol = 0.2, filterFreq = 1000, filterType: BiquadFilterType = 'bandpass') => {
  if (isMuted || !audioCtx) return;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);
  if (filterType === 'bandpass') {
    filter.frequency.linearRampToValueAtTime(filterFreq * 3, audioCtx.currentTime + duration);
  }
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
};

export const playCardDrawSound = () => {
  if (isMuted || !audioCtx) return;
  playNoise(0.1, 0.15, 800, 'highpass');
};

export const playCardPlaySound = () => {
  if (isMuted || !audioCtx) return;
  createOscillator('square', 880, 0.1, 0.05);
  setTimeout(() => createOscillator('square', 1760, 0.1, 0.05), 50);
};

export const playSlashSound = () => {
  if (isMuted || !audioCtx) return;
  createOscillator('sawtooth', 150, 0.3, 0.2);
  playNoise(0.2, 0.3, 1500, 'lowpass');
};

export const playShieldSound = () => {
  if (isMuted || !audioCtx) return;
  createOscillator('sine', 1200, 0.4, 0.1);
  createOscillator('triangle', 2400, 0.4, 0.05);
};

export const playHealSound = () => {
  if (isMuted || !audioCtx) return;
  createOscillator('sine', 523.25, 0.3, 0.05); // C5
  setTimeout(() => createOscillator('sine', 659.25, 0.3, 0.05), 50); // E5
  setTimeout(() => createOscillator('sine', 783.99, 0.4, 0.05), 100); // G5
};

export const playEnemyIntentSound = () => {
  if (isMuted || !audioCtx) return;
  createOscillator('sawtooth', 60, 0.5, 0.3);
  createOscillator('square', 65, 0.5, 0.2); // Dissonance
};

export const playWeakHitSound = () => {
  if (isMuted || !audioCtx) return;
  // Intense explosion
  createOscillator('square', 80, 0.5, 0.4);
  createOscillator('sawtooth', 40, 0.5, 0.4);
  playNoise(0.4, 0.6, 500, 'lowpass');
};
