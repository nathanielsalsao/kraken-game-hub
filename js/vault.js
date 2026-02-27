
window.audioCtx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
window.bgMusicStarted = false;


function playUISound(freq, type, duration, vol) {
    const osc = window.audioCtx.createOscillator();
    const gain = window.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, window.audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, window.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, window.audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(window.audioCtx.destination);
    osc.start();
    osc.stop(window.audioCtx.currentTime + duration);
}


function startVaultMusic() {
    if (window.bgMusicStarted) return;
    window.bgMusicStarted = true;

    const drone = window.audioCtx.createOscillator();
    const dGain = window.audioCtx.createGain();
    const dFilter = window.audioCtx.createBiquadFilter();
    drone.type = 'sawtooth';
    drone.frequency.setValueAtTime(41.20, window.audioCtx.currentTime); 
    dFilter.type = 'lowpass';
    dFilter.frequency.setValueAtTime(120, window.audioCtx.currentTime);
    dGain.gain.setValueAtTime(0.05, window.audioCtx.currentTime);
    drone.connect(dFilter);
    dFilter.connect(dGain);
    dGain.connect(window.audioCtx.destination);
    drone.start();


    function pulse() {
        if (!window.bgMusicStarted) return;
        playUISound(60, 'triangle', 0.8, 0.03);
        setTimeout(pulse, 2000); 
    }
    pulse();

    
    function playMelody() {
        const notes = [164.81, 196.00, 220.00, 174.61]; 
        notes.forEach((f, i) => {
            const osc = window.audioCtx.createOscillator();
            const g = window.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, window.audioCtx.currentTime + (i * 4));
            g.gain.setValueAtTime(0, window.audioCtx.currentTime + (i * 4));
            g.gain.linearRampToValueAtTime(0.02, window.audioCtx.currentTime + (i * 4) + 2);
            g.gain.linearRampToValueAtTime(0, window.audioCtx.currentTime + (i * 4) + 4);
            osc.connect(g);
            g.connect(window.audioCtx.destination);
            osc.start(window.audioCtx.currentTime + (i * 4));
            osc.stop(window.audioCtx.currentTime + (i * 4) + 4);
        });
        setTimeout(playMelody, 16000);
    }
    playMelody();
}

['click', 'keydown', 'mousedown', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
        if (window.audioCtx.state === 'suspended') {
            window.audioCtx.resume();
        }
        startVaultMusic();
    }, { once: true });
});