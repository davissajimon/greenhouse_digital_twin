import React, { useState, useEffect, useRef } from 'react';
import './AmbientMusic.css';

export function AmbientMusic() {
  const [isPlaying, setIsPlaying] = useState(() => {
    return localStorage.getItem('greensim_music') === 'on';
  });
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let fadeInterval;

    if (isPlaying) {
      audio.volume = 0;
      audio.play().catch(e => {
        console.warn('Audio play failed (might need user interaction):', e);
        setIsPlaying(false);
        localStorage.setItem('greensim_music', 'off');
      });

      let vol = 0;
      fadeInterval = setInterval(() => {
        vol += 0.02;
        if (vol >= 0.15) {
          audio.volume = 0.15;
          clearInterval(fadeInterval);
        } else {
          audio.volume = vol;
        }
      }, 100);
    } else {
      let vol = audio.volume;
      fadeInterval = setInterval(() => {
        vol -= 0.05;
        if (vol <= 0) {
          audio.volume = 0;
          audio.pause();
          clearInterval(fadeInterval);
        } else {
          audio.volume = vol;
        }
      }, 100);
    }

    return () => clearInterval(fadeInterval);
  }, [isPlaying]);

  const toggleMusic = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    localStorage.setItem('greensim_music', next ? 'on' : 'off');
  };

  return (
    <>
      {/* Place ambient.mp3 in /public/ folder */}
      <audio ref={audioRef} src="/ambient.mp3" loop preload="none" />
      <button 
        className={`ambient-music-btn ${isPlaying ? 'playing' : 'muted'}`} 
        onClick={toggleMusic}
        title={isPlaying ? "Mute Ambient Background" : "Play Ambient Background"}
      >
        {isPlaying ? '🔊' : '🔇'}
      </button>
    </>
  );
}
