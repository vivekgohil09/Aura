import React, { useState, useRef, useEffect } from 'react'
import { isSameSender, isLastMessage, isSameSenderMargin, isSameUser } from "../config/ChatsLogic"
import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import { useSelector } from "react-redux"
import { toast } from 'react-toastify';
import axios from 'axios';
import { getJwtToken } from '../config/getJwt';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, PhoneCall, PhoneMissed, Play, Pause, Volume2, VolumeX, Mic, Video as VideoIcon, Lock, ShieldCheck, Eye, Clock, Sparkles } from 'lucide-react';

import { decompressData, decompressionCache } from '../config/dataCompressor';
import { stompService } from '../config/stompService2';

// ── Ultra-Sleek Aura Voice Note Player ──
const AuraVoiceNotePlayer = ({ audioSrc, isMe, initialDuration }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const waveformBars = [40, 65, 85, 45, 90, 70, 35, 80, 100, 60, 40, 75, 95, 55, 30, 85, 60, 40, 70, 90, 50, 65, 45, 35];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSpeedToggle = () => {
    if (!audioRef.current) return;
    const rates = [1.0, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleSeek = (index) => {
    if (!audioRef.current || !duration) return;
    const targetTime = (index / waveformBars.length) * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) : 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      background: isMe 
        ? 'linear-gradient(135deg, rgba(91, 95, 239, 0.12) 0%, rgba(128, 103, 232, 0.06) 100%)' 
        : '#FFFFFF',
      borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
      border: isMe ? '1.5px solid rgba(91, 95, 239, 0.35)' : '1px solid rgba(23, 24, 39, 0.08)',
      boxShadow: '0 6px 20px rgba(23, 24, 39, 0.04)',
      minWidth: '240px',
      maxWidth: '300px',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Play/Pause Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={togglePlay}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
          color: '#FFFFFF',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(91, 95, 239, 0.3)',
          flexShrink: 0
        }}
      >
        {isPlaying ? <Pause size={15} fill="#FFFFFF" /> : <Play size={15} fill="#FFFFFF" style={{ marginLeft: '2px' }} />}
      </motion.button>

      {/* Waveform & Scrubber Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px', cursor: 'pointer' }}>
          {waveformBars.map((h, i) => {
            const barProgress = i / waveformBars.length;
            const isPlayed = barProgress <= progressPercent;
            return (
              <div
                key={i}
                onClick={() => handleSeek(i)}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background: isPlayed ? '#5B5FEF' : 'rgba(23, 24, 39, 0.15)',
                  borderRadius: '2px',
                  transition: 'background 0.15s ease, height 0.2s ease',
                }}
              />
            );
          })}
        </div>

        {/* Time & Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: '#727486' }}>
          <span>{isPlaying ? formatTime(currentTime) : (duration ? formatTime(duration) : formatTime(currentTime))}</span>
          <button
            type="button"
            onClick={handleSpeedToggle}
            style={{
              background: 'rgba(91, 95, 239, 0.08)',
              border: 'none',
              borderRadius: '99px',
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: 800,
              color: '#5B5FEF',
              cursor: 'pointer'
            }}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Telegram-Style Circular Video Short Note Player ──
const AuraVideoNotePlayer = ({ videoSrc, isMe, initialDuration }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };
    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress(video.currentTime / video.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      video.currentTime = 0;
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: isMe ? 'flex-end' : 'flex-start',
      marginTop: '4px'
    }}>
      {/* Circular Video Container */}
      <div 
        onClick={togglePlay}
        style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(91, 95, 239, 0.2), 0 4px 12px rgba(23, 24, 39, 0.08)',
          border: '2.5px solid #5B5FEF',
          background: '#0F172A'
        }}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          muted={isMuted}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            transform: 'scale(1.02)'
          }}
        />

        {/* Circular Progress Ring Overlay */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)',
            pointerEvents: 'none'
          }}
          viewBox="0 0 200 200"
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="3.5"
            fill="transparent"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="#5B5FEF"
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>

        {/* Play Icon Badge when paused */}
        {!isPlaying && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(23, 24, 39, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(2px)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #5B5FEF, #8067E8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(91, 95, 239, 0.4)'
            }}>
              <Play size={20} fill="#FFFFFF" style={{ marginLeft: '3px' }} />
            </div>
          </div>
        )}

        {/* Mute Toggle Badge */}
        <button
          type="button"
          onClick={toggleMute}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(23, 24, 39, 0.75)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.72rem', fontWeight: 800, color: isMe ? '#5B5FEF' : '#727486' }}>
        <span>📹 Video Note</span>
      </div>
    </div>
  );
};

const DecompressedContent = ({ content, isMe, msgId, expiredOnce, revealedOnce, viewCountdown, revealViewOnce }) => {
  const isEncrypted = typeof content === 'string' && (content.startsWith('[gz]') || content.startsWith('[enc]'));
  const cachedVal = isEncrypted ? decompressionCache.get(content) : content;
  const [text, setText] = useState(cachedVal !== undefined ? cachedVal : '');

  useEffect(() => {
    let isMounted = true;
    if (isEncrypted && cachedVal === undefined) {
      decompressData(content).then(res => {
        if (isMounted) setText(res || '');
      }).catch(() => {
        if (isMounted) setText(content);
      });
    } else if (!isEncrypted) {
      setText(content);
    }
    return () => { isMounted = false; };
  }, [content, isEncrypted, cachedVal]);

  if (!text) return null;

  if (text.startsWith('[view-once]')) {
    const viewOnceText = text.replace('[view-once]', '').trim();
    const remainingTime = (viewCountdown && viewCountdown[msgId]) ?? 5;

    if (expiredOnce && expiredOnce.has(msgId)) {
      return (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '14px',
          background: isMe ? 'rgba(255, 255, 255, 0.12)' : 'rgba(239, 68, 68, 0.08)',
          border: isMe ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          color: isMe ? '#FFFFFF' : '#EF4444',
          fontSize: '0.82rem',
          fontWeight: 800,
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <ShieldCheck size={16} color={isMe ? '#FFFFFF' : '#EF4444'} />
          <span>🚫 Opened • Auto-Purged from Vault</span>
        </div>
      );
    }

    if (revealedOnce && revealedOnce.has(msgId)) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '4px 0'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            alignSelf: 'flex-start',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#10B981',
            padding: '3px 10px',
            borderRadius: '99px',
            fontSize: '0.72rem',
            fontWeight: 800
          }}>
            <Clock size={12} />
            <span>⏳ Auto Purging in {remainingTime}s</span>
          </div>
          {viewOnceText.startsWith('data:image') ? (
            <img src={viewOnceText} alt="Self-destructing photo" style={{ maxWidth: '280px', maxHeight: '280px', borderRadius: '16px', objectFit: 'cover' }} />
          ) : viewOnceText.startsWith('data:video') || viewOnceText.includes('.mp4') ? (
            <video src={viewOnceText} autoPlay controls style={{ maxWidth: '280px', borderRadius: '16px' }} />
          ) : viewOnceText.startsWith('[voice] ') || viewOnceText.startsWith('data:audio') ? (
            <AuraVoiceNotePlayer audioSrc={viewOnceText.replace('[voice] ', '')} isMe={isMe} />
          ) : (
            <div style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.5 }}>
              {viewOnceText}
            </div>
          )}
        </div>
      );
    }

    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => revealViewOnce && revealViewOnce(msgId)}
        style={{
          background: isMe
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.12) 100%)'
            : 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
          border: isMe ? '1.5px solid rgba(255, 255, 255, 0.4)' : '1.5px solid #C084FC',
          borderRadius: '99px',
          padding: '8px 18px',
          cursor: 'pointer',
          color: isMe ? '#FFFFFF' : '#7E22CE',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: isMe ? '0 4px 16px rgba(0, 0, 0, 0.1)' : '0 4px 16px rgba(192, 132, 252, 0.2)',
          textAlign: 'left',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}
      >
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: isMe ? 'rgba(255, 255, 255, 0.3)' : 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 900,
          fontSize: '0.85rem',
          boxShadow: '0 2px 8px rgba(168, 85, 247, 0.4)'
        }}>
          ①
        </div>
        <div>
          <div style={{ fontSize: '0.86rem', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            {viewOnceText.startsWith('data:image') || viewOnceText.startsWith('[img]') ? 'Photo' : 'View-Once'}
          </div>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, opacity: 0.82, marginTop: '2px' }}>
            Tap to view
          </div>
        </div>
      </motion.button>
    );
  }

  if (text.startsWith('[call] ')) {
    const callText = text.replace('[call] ', '').toLowerCase();
    const isNegative = callText.includes('declined') || callText.includes('cancelled') || callText.includes('missed');
    const isVideo = callText.includes('video');

    const IconComponent = isNegative ? PhoneOff : PhoneCall;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 18px',
        background: isMe
          ? 'linear-gradient(135deg, rgba(91, 95, 239, 0.12) 0%, rgba(128, 103, 232, 0.06) 100%)'
          : '#FFFFFF',
        borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
        border: isMe
          ? '1.5px solid rgba(91, 95, 239, 0.35)'
          : (isNegative ? '1.5px solid rgba(254, 202, 202, 0.9)' : '1.5px solid rgba(167, 243, 208, 0.9)'),
        boxShadow: isMe
          ? '0 6px 20px rgba(91, 95, 239, 0.12), 0 2px 6px rgba(0, 0, 0, 0.03)'
          : '0 6px 20px rgba(23, 24, 39, 0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        minWidth: '250px',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '14px',
          background: isNegative
            ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
            : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isNegative
            ? '0 4px 14px rgba(239, 68, 68, 0.35)'
            : '0 4px 14px rgba(16, 185, 129, 0.35)',
          flexShrink: 0
        }}>
          <IconComponent size={20} color="#FFFFFF" strokeWidth={2.4} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{
              fontSize: '0.94rem',
              fontWeight: 800,
              color: '#0F172A',
              textTransform: 'capitalize',
              letterSpacing: '-0.01em',
              lineHeight: 1.2
            }}>
              Call {callText}
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: isNegative ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: isNegative ? '#DC2626' : '#059669',
              padding: '2px 8px',
              borderRadius: '99px'
            }}>
              {isNegative ? 'Unanswered' : 'Connected'}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isMe ? '#B45309' : '#64748B', marginTop: '3px' }}>
            {isVideo ? 'HD Video Call' : 'HD Voice Call'}
          </span>
        </div>
      </div>
    );
  }

  // ── Video Short Note (Telegram-style circular video note) ──
  if (text.startsWith('[video_note] ') || text.startsWith('[video-note] ')) {
    let raw = text.startsWith('[video_note] ') ? text.replace('[video_note] ', '') : text.replace('[video-note] ', '');
    let videoData = raw;
    let duration = null;
    try {
      const parsed = JSON.parse(raw);
      videoData = parsed.data || videoData;
      duration = parsed.duration;
    } catch (e) {
      videoData = raw;
    }
    return <AuraVideoNotePlayer videoSrc={videoData} isMe={isMe} initialDuration={duration} />;
  }

  // ── Voice Note / Audio Message ──
  if (text.startsWith('[voice] ') || (text.startsWith('data:audio') && !text.startsWith('[doc]')) || text.includes('audio/mp3') || text.includes('audio/mpeg') || text.includes('audio/webm') || text.includes('.mp3') || text.includes('.webm')) {
    let audioData = text;
    let duration = null;
    if (text.startsWith('[voice] ')) {
      try {
        const parsed = JSON.parse(text.replace('[voice] ', ''));
        audioData = parsed.data || audioData;
        duration = parsed.duration;
      } catch (e) {
        audioData = text.replace('[voice] ', '');
      }
    }
    return <AuraVoiceNotePlayer audioSrc={audioData} isMe={isMe} initialDuration={duration} />;
  }

  if (text.startsWith('data:image') || text.startsWith('[img] ')) {
    const imgSrc = text.startsWith('[img] ') ? text.replace('[img] ', '') : text;
    return (
      <motion.div
        whileHover={{ scale: 1.015 }}
        style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          maxWidth: '320px',
          maxHeight: '380px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          border: '1.5px solid rgba(255, 255, 255, 0.6)',
          cursor: 'pointer'
        }}
        onClick={() => {
          // Open high-res lightbox
          const w = window.open('');
          if (w) {
            w.document.write(`
              <html>
                <head>
                  <title>Aura High-Res Photo</title>
                  <style>
                    body { margin: 0; background: #0B0C10; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; font-family: sans-serif; }
                    img { max-width: 95vw; max-height: 95vh; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.8); object-fit: contain; }
                  </style>
                </head>
                <body>
                  <img src="${imgSrc}" />
                </body>
              </html>
            `);
          }
        }}
      >
        <img
          src={imgSrc}
          alt="Shared Photo"
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '380px',
            objectFit: 'cover',
            display: 'block',
            borderRadius: '18px'
          }}
          loading="lazy"
        />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(8px)',
          padding: '2px 8px',
          borderRadius: '99px',
          fontSize: '0.66rem',
          color: '#FFFFFF',
          fontWeight: 700
        }}>
          🔍 Tap to Expand
        </div>
      </motion.div>
    );
  }
  if (text.startsWith('data:video') || text.includes('video/mp4') || text.includes('.mp4')) {
    return <video src={text} controls style={{ maxWidth: '280px', borderRadius: '16px', marginTop: '4px' }} />;
  }
  if (text.startsWith('[doc] ') || text.startsWith('data:application') || text.startsWith('data:text') || text.includes('application/pdf')) {
    let fileName = '';
    let fileSize = '';
    let docType = 'Document';
    let fileData = text;
    let icon = '📄';
    let extBadge = 'FILE';
    let themeColor = '#64748B';
    let themeBg = 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)';

    if (text.startsWith('[doc] ')) {
      try {
        const jsonStr = text.replace('[doc] ', '');
        const meta = JSON.parse(jsonStr);
        fileName = meta.name || meta.filename || meta.originalName || '';
        fileSize = meta.size || '';
        fileData = meta.data || meta.url || text;
      } catch (e) {
        fileData = text;
      }
    }

    // If fileName was not in json, try extracting from URL/data string
    if (!fileName) {
      const fnMatch = text.match(/filename=["']?([^"';&\n]+)["']?/i);
      if (fnMatch && fnMatch[1]) {
        fileName = decodeURIComponent(fnMatch[1].trim());
      } else if (text.startsWith('http://') || text.startsWith('https://')) {
        try {
          const url = new URL(text);
          const base = url.pathname.split('/').pop();
          if (base && base.includes('.')) fileName = decodeURIComponent(base);
        } catch (e) {}
      }
    }

    if (!fileName) {
      if (text.includes('pdf') || text.includes('application/pdf')) fileName = 'Document.pdf';
      else if (text.includes('word') || text.includes('docx')) fileName = 'Document.docx';
      else if (text.includes('excel') || text.includes('xlsx') || text.includes('csv')) fileName = 'Spreadsheet.xlsx';
      else if (text.includes('zip') || text.includes('compressed')) fileName = 'Archive.zip';
      else fileName = 'Attached_File';
    }

    // Dynamic icon, badge and theme styling according to real original file extension
    const ext = fileName.includes('.') ? fileName.split('.').pop().toUpperCase() : 'FILE';
    extBadge = ext.length <= 5 ? ext : 'FILE';

    if (fileName.toLowerCase().endsWith('.pdf') || text.includes('application/pdf')) {
      docType = 'PDF Document';
      extBadge = 'PDF';
      icon = '📕';
      themeColor = '#EF4444';
      themeBg = 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)';
    } else if (fileName.match(/\.(docx?|doc|rtf|odt)$/i)) {
      docType = 'Word Document';
      extBadge = extBadge || 'DOCX';
      icon = '📝';
      themeColor = '#2563EB';
      themeBg = 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)';
    } else if (fileName.match(/\.(xlsx?|xls|csv|tsv)$/i)) {
      docType = 'Excel Spreadsheet';
      extBadge = extBadge || 'XLSX';
      icon = '📊';
      themeColor = '#10B981';
      themeBg = 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)';
    } else if (fileName.match(/\.(pptx?|ppt|key)$/i)) {
      docType = 'Presentation';
      extBadge = extBadge || 'PPTX';
      icon = '📽';
      themeColor = '#F59E0B';
      themeBg = 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)';
    } else if (fileName.match(/\.(zip|rar|7z|tar|gz)$/i)) {
      docType = 'Compressed Archive';
      extBadge = extBadge || 'ZIP';
      icon = '🗜️';
      themeColor = '#8B5CF6';
      themeBg = 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)';
    } else if (fileName.match(/\.(txt|md|json|js|jsx|ts|tsx|py|java|c|cpp|html|css)$/i)) {
      docType = 'Source Code / Text';
      extBadge = extBadge || 'TXT';
      icon = '💻';
      themeColor = '#0284C7';
      themeBg = 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)';
    } else {
      docType = 'File Document';
      icon = '📄';
      themeColor = '#64748B';
      themeBg = 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)';
    }

    return (
      <a
        href={fileData}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: isMe
            ? 'linear-gradient(135deg, rgba(91, 95, 239, 0.12) 0%, rgba(128, 103, 232, 0.06) 100%)'
            : '#FFFFFF',
          padding: '13px 18px',
          borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
          border: isMe
            ? '1.5px solid rgba(91, 95, 239, 0.35)'
            : '1px solid rgba(23, 24, 39, 0.08)',
          boxShadow: isMe
            ? '0 8px 24px rgba(91, 95, 239, 0.12), 0 2px 6px rgba(0, 0, 0, 0.03)'
            : '0 8px 24px -4px rgba(23, 24, 39, 0.06), 0 2px 6px rgba(0, 0, 0, 0.02)',
          width: '300px',
          maxWidth: '100%',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          background: themeBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', textAlign: 'left' }}>
          <span style={{
            fontSize: '0.92rem',
            fontWeight: 800,
            color: '#171827',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {fileName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 800,
              color: isMe ? '#5B5FEF' : themeColor,
              background: isMe ? 'rgba(91, 95, 239, 0.12)' : 'rgba(0,0,0,0.05)',
              padding: '1px 6px',
              borderRadius: '6px',
              letterSpacing: '0.04em'
            }}>
              {extBadge}
            </span>
            {fileSize && (
              <span style={{ fontSize: '0.72rem', color: '#727486', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                • {fileSize}
              </span>
            )}
          </div>
        </div>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 800,
          flexShrink: 0,
          boxShadow: '0 3px 10px rgba(91, 95, 239, 0.35)'
        }}>
          ↓
        </div>
      </a>
    );
  }
  return <span>{text}</span>;
};

const TAG_COLORS = {
  important: { bg: '#FFF0F2', color: '#E63946', border: '#FFD0D5' },
  work: { bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' },
  personal: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  follow_up: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
};

const parseUtcDate = (dateInput) => {
  if (!dateInput) return new Date();
  try {
    if (typeof dateInput === 'string') {
      let str = dateInput;
      if (str.includes('T') && !str.endsWith('Z') && !str.includes('+')) {
        str += 'Z';
      }
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
    } else if (typeof dateInput === 'number') {
      const d = new Date(dateInput);
      if (!isNaN(d.getTime())) return d;
    } else if (Array.isArray(dateInput)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
  } catch (e) { }
  return new Date();
};

const formatTime = (dateInput) => {
  if (!dateInput) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  try {
    const d = parseUtcDate(dateInput);
    if (d && !isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  } catch (e) { }
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getRelativeTime = (dateInput) => {
  if (!dateInput) return "just now";
  try {
    const d = parseUtcDate(dateInput);
    if (!d || isNaN(d.getTime())) return "just now";

    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now - d) / 1000));
    if (diffSec < 45) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  } catch (e) {
    return "just now";
  }
};

const getDateLabel = (dateInput) => {
  if (!dateInput) return null;
  const d = parseUtcDate(dateInput);
  if (!d || isNaN(d.getTime())) return null;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
};

const shouldShowDateDivider = (messages, index) => {
  if (index === 0) return true;
  const currentMsg = messages[index];
  const prevMsg = messages[index - 1];

  const d1 = parseUtcDate(currentMsg.createdAt || currentMsg.timestamp);
  const d2 = parseUtcDate(prevMsg.createdAt || prevMsg.timestamp);

  if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return d1.toDateString() !== d2.toDateString();
};

const senderId = (m) => {
  if (!m) return null;
  if (typeof m.sender === 'string') return m.sender;
  return m.sender?._id || m.sender?.id || m.senderId;
};

const ScrollableChat = ({ chatId, otherUser, messages, setMessages, isTyping }) => {
  const user = useSelector(state => state.user);
  const loggedId = user?._id || user?.id || user?.userLogin?._id || user?.userLogin?.id;

  // ── Interactive Reactions Bar State
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [reactionsMap, setReactionsMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aura_reactions_map') || '{}'); } catch { return {}; }
  });
  const [confettiEmoji, setConfettiEmoji] = useState(null);

  // ── MESSAGE DELETE & SWIPE RIGHT STATE ──
  const [deletingMsg, setDeletingMsg] = useState(null);
  const [swipingMsgId, setSwipingMsgId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState({});
  const touchStartPosRef = useRef({ x: 0, y: 0, time: 0 });
  const longPressTimerRef = useRef(null);

  // Real-time STOMP & Socket Listener for Message Deletion
  useEffect(() => {
    if (!chatId) return;

    // 1. Socket.io listener
    const sock = window.__auraSocket;
    const handleRemoteDelete = (data) => {
      if (data && data.messageId) {
        setMessages(prev => prev.filter(m => (m._id || m.id) !== data.messageId));
      }
    };
    if (sock) {
      sock.on('message-deleted', handleRemoteDelete);
    }

    // 2. STOMP subscription
    let unsubStomp = null;
    if (stompService && stompService.isConnected && stompService.isConnected()) {
      unsubStomp = stompService.subscribeToTopic(`/topic/message-deleted/${chatId}`, (msg) => {
        try {
          let data = msg && msg.body ? msg.body : msg;
          if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) {}
          }
          if (data && data.messageId) {
            setMessages(prev => prev.filter(m => (m._id || m.id) !== data.messageId));
          }
        } catch (e) {
          console.error("Delete STOMP handler error:", e);
        }
      });
    }

    return () => {
      if (sock) sock.off('message-deleted', handleRemoteDelete);
      if (unsubStomp) {
        try { unsubStomp(); } catch (e) {}
      }
    };
  }, [chatId]);

  // Handle Delete for Me
  const handleDeleteForMe = (msg) => {
    if (!msg) return;
    const msgId = msg._id || msg.id;
    try {
      const stored = JSON.parse(localStorage.getItem('aura_deleted_for_me') || '[]');
      if (!stored.includes(msgId)) {
        stored.push(msgId);
        localStorage.setItem('aura_deleted_for_me', JSON.stringify(stored));
      }
    } catch (e) {}

    setMessages(prev => prev.filter(m => (m._id || m.id) !== msgId));
    setDeletingMsg(null);
    toast.info("Message deleted for you", { autoClose: 1500, hideProgressBar: true });
  };

  // Handle Delete for Everyone (both sender & receiver)
  const handleDeleteForEveryone = async (msg) => {
    if (!msg) return;
    const msgId = msg._id || msg.id;
    setMessages(prev => prev.filter(m => (m._id || m.id) !== msgId));
    setDeletingMsg(null);

    try {
      const config = {
        headers: { Authorization: "Bearer " + getJwtToken() },
      };
      await axios.delete(`/api/message/${msgId}?type=everyone`, config);

      const delSignal = { messageId: msgId, chatId, deleteType: 'everyone' };
      const sock = window.__auraSocket;
      if (sock) {
        sock.emit('delete-message', delSignal);
      }
      toast.success("Message deleted for everyone", { autoClose: 1500, hideProgressBar: true });
    } catch (e) {
      console.error("Delete message error:", e);
      toast.error("Failed to delete message for everyone");
    }
  };

  // ── GESTURE ENGINE: TAP TO REACT vs HOLD/LONG-PRESS FOR ACTIONS ──
  const openActionMenuAt = (m, clientX, clientY) => {
    const menuWidth = 230;
    const menuHeight = 220;
    const safeX = Math.min(Math.max(16, clientX), (window.innerWidth || 400) - menuWidth - 16);
    const safeY = Math.min(Math.max(16, clientY), (window.innerHeight || 800) - menuHeight - 20);

    setActiveReactionMsgId(null);
    setCtxMenu({ x: safeX, y: safeY, msg: m });
  };

  const handleMsgPointerDown = (m, e) => {
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    touchStartPosRef.current = { x: clientX, y: clientY, time: Date.now() };

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    // 400ms Long-Press triggers Action Menu (Edit, Bookmark, Delete, Copy)
    longPressTimerRef.current = setTimeout(() => {
      openActionMenuAt(m, clientX, clientY);
      if (window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(30); } catch (err) {}
      }
    }, 420);
  };

  const handleMsgPointerMove = (m, e) => {
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    const deltaX = clientX - touchStartPosRef.current.x;
    const deltaY = Math.abs(clientY - touchStartPosRef.current.y);

    const msgId = m._id || m.id;

    // If movement > 15px, cancel long-press
    if (Math.abs(deltaX) > 15 || deltaY > 15) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // Right swipe gesture (deltaX > 20px)
    if (deltaX > 20 && deltaY < 40) {
      setSwipingMsgId(msgId);
      setSwipeOffset(prev => ({ ...prev, [msgId]: Math.min(deltaX, 85) }));
    }
  };

  const handleMsgPointerUp = (m, e) => {
    const elapsed = Date.now() - touchStartPosRef.current.time;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    const msgId = m._id || m.id;
    const currentOffset = swipeOffset[msgId] || 0;

    setSwipeOffset(prev => ({ ...prev, [msgId]: 0 }));
    setSwipingMsgId(null);

    // If swiped right > 45px ➔ Trigger Delete
    if (currentOffset > 45) {
      setDeletingMsg(m);
      if (window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(25); } catch (err) {}
      }
      return;
    }

    // If Quick Tap (< 300ms and minimal movement) ➔ Toggle Emoji Reaction Bar!
    if (elapsed < 300 && Math.abs(currentOffset) < 15 && !ctxMenu) {
      setActiveReactionMsgId(prev => prev === msgId ? null : msgId);
      if (window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(15); } catch (err) {}
      }
    }
  };

  const REACTION_EMOJIS = ['❤️', '🔥', '💎', '👏', '😂', '✨', '⚡'];

  const triggerHapticFeedback = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate(25); } catch (e) {}
    }
  };

  const handleToggleReaction = (msg, emoji) => {
    triggerHapticFeedback();
    const id = msg._id || msg.id;
    if (!id) return;

    // Trigger visual confetti explosion effect
    setConfettiEmoji({ emoji, x: window.innerWidth / 2, y: window.innerHeight / 2, id: Date.now() });
    setTimeout(() => setConfettiEmoji(null), 1200);

    setReactionsMap(prev => {
      const currentList = prev[id] || [];
      const hasMyReaction = currentList.find(r => r.userId === loggedId && r.emoji === emoji);
      let updated;
      if (hasMyReaction) {
        // remove
        updated = currentList.filter(r => !(r.userId === loggedId && r.emoji === emoji));
      } else {
        // add or replace my reaction
        const otherReactions = currentList.filter(r => r.userId !== loggedId);
        updated = [...otherReactions, { userId: loggedId, emoji, userName: user?.name || 'You' }];
      }
      const newMap = { ...prev, [id]: updated };
      try { localStorage.setItem('aura_reactions_map', JSON.stringify(newMap)); } catch (e) {}
      return newMap;
    });

    // Broadcast reaction through socket if connected
    try {
      const sock = window.__auraSocket;
      if (sock) {
        sock.emit('aura-reaction', { chatId, msgId: id, userId: loggedId, emoji, userName: user?.name || 'User' });
      }
    } catch (e) {}
  };

  // Listen for real-time reactions
  useEffect(() => {
    const sock = window.__auraSocket;
    if (!sock) return;
    const onReceiveReaction = (data) => {
      if (data && data.msgId) {
        setReactionsMap(prev => {
          const currentList = prev[data.msgId] || [];
          const updated = [...currentList.filter(r => r.userId !== data.userId), { userId: data.userId, emoji: data.emoji, userName: data.userName }];
          const newMap = { ...prev, [data.msgId]: updated };
          try { localStorage.setItem('aura_reactions_map', JSON.stringify(newMap)); } catch (e) {}
          return newMap;
        });
      }
    };
    sock.on('aura-reaction-received', onReceiveReaction);
    return () => { sock.off('aura-reaction-received', onReceiveReaction); };
  }, [chatId]);

  // ── Tap to React & Hold for Actions State ──
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null); // Tap to react
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, msg } - Hold/Right click for actions
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const ctxRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Track whether user is scrolled to (near) bottom so auto-scroll doesn't interrupt manual scroll-up
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 60; // px from bottom to still consider "at bottom"
      const atBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) <= threshold;
      setIsAtBottom(atBottom);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // initialize
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAtBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Emit read receipts for any incoming unread messages when user is viewing (near bottom)
    try {
      const sock = window.__auraSocket || null;
      if (!sock || !messages || !Array.isArray(messages) || !chatId) return;
      if (!isAtBottom) return; // Only mark read when user is at bottom viewing latest

      const localLoggedId = user?._id || user?.id || user?.userLogin?._id || user?.userLogin?.id;
      const unreadIncoming = messages.filter(m => {
        const sid = senderId(m);
        const id = m._id || m.id;
        const isMe = String(sid) === String(localLoggedId);
        const alreadyRead = m.isRead || m.seen || m.read;
        return !isMe && !alreadyRead && id;
      });

      if (unreadIncoming.length === 0) return;

      const ids = unreadIncoming.map(m => m._id || m.id);
      // Optimistically mark them read locally
      setMessages(prev => prev.map(m => ids.includes(m._id || m.id) ? { ...m, isRead: true, seen: true, read: true } : m));

      // Emit to server
      if (sock && sock.__isStompShim) {
        try { stompService.sendMessageRead(chatId, ids, localLoggedId); } catch (e) { }
      } else {
        try { sock.emit('message-read', { chatId, messageIds: ids, readerId: localLoggedId }); } catch (e) { }
      }
    } catch (e) { }
  }, [messages, isAtBottom, chatId]);

  // ── Schedule badge display
  const [scheduledBadges] = useState({}); // msgId -> ISO time (stored locally)

  // ── Bookmark modal
  const [bookmarkModal, setBookmarkModal] = useState(null); // msg
  const [bTag, setBTag] = useState('important');
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aura_bookmarks') || '[]'); } catch { return []; }
  });

  // ── View-once revealed set
  const [revealedOnce, setRevealedOnce] = useState(new Set());

  // Close context menu on outside click
  useEffect(() => {
    const close = (e) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target)) setCtxMenu(null);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  const openCtx = (e, msg) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, msg });
  };

  // ── 1. Silent Edit (no "Edited" label shown to anyone)
  const startEdit = (msg) => {
    setEditingId(msg._id || msg.id);
    setEditText(msg.content);
    setCtxMenu(null);
  };

  const saveEdit = async (msg) => {
    const id = msg._id || msg.id;
    const trimmed = editText.trim();
    if (!trimmed || trimmed === msg.content) { setEditingId(null); return; }
    try {
      const config = { headers: { Authorization: 'Bearer ' + getJwtToken(), 'Content-Type': 'application/json' } };
      // Use PUT /api/message/:id to update content silently
      await axios.put(`/api/message/${id}`, { content: trimmed, silent: true }, config);
      if (setMessages) {
        setMessages(prev => prev.map(m => (m._id || m.id) === id ? { ...m, content: trimmed } : m));
      }
    } catch {
      // Optimistic update even if backend returns 404 (feature pending)
      if (setMessages) {
        setMessages(prev => prev.map(m => (m._id || m.id) === id ? { ...m, content: trimmed } : m));
      }
    }
    setEditingId(null);
  };

  const [expiredOnce, setExpiredOnce] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('aura_expired_once') || '[]'));
    } catch {
      return new Set();
    }
  });

  const [viewCountdown, setViewCountdown] = useState({});

  // ── 2. View-once reveal with 5s countdown and permanent expiration
  const revealViewOnce = (id) => {
    if (expiredOnce.has(id)) return;
    setRevealedOnce(prev => new Set([...prev, id]));
    setViewCountdown(prev => ({ ...prev, [id]: 5 }));

    const interval = setInterval(() => {
      setViewCountdown(prev => {
        const current = prev[id];
        if (current === undefined || current <= 1) {
          clearInterval(interval);
          setExpiredOnce(ePrev => {
            const updated = new Set([...ePrev, id]);
            localStorage.setItem('aura_expired_once', JSON.stringify([...updated]));
            return updated;
          });
          setRevealedOnce(rPrev => { const s = new Set(rPrev); s.delete(id); return s; });
          return { ...prev, [id]: 0 };
        }
        return { ...prev, [id]: current - 1 };
      });
    }, 1000);
  };

  // ── 3. Bookmark with tag
  const saveBookmark = (msg) => {
    const newBm = { id: msg._id || msg.id, content: msg.content, tag: bTag, savedAt: new Date().toISOString() };
    const updated = [...bookmarks.filter(b => b.id !== newBm.id), newBm];
    setBookmarks(updated);
    localStorage.setItem('aura_bookmarks', JSON.stringify(updated));
    toast.success(`📌 Bookmarked as "${bTag}"`, { autoClose: 2000, hideProgressBar: true });
    setBookmarkModal(null);
  };

  const isBookmarked = (msg) => bookmarks.some(b => b.id === (msg._id || msg.id));

  // ── 4. Schedule message (display-only — scheduling happens at input level; here we show badge)
  return (
    <div ref={scrollContainerRef} style={{ position: 'relative', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
      <div style={{ display: 'block' }}>

        {messages && messages.map((m, i) => {
          const isMe = Boolean(senderId(m) && loggedId && String(senderId(m)) === String(loggedId));
          const msgId = m._id || m.id;
          const editing = editingId === msgId;
          const bmked = isBookmarked(m);
          const tag = bookmarks.find(b => b.id === msgId)?.tag;
          const isCallMsg = Boolean(m.content && m.content.startsWith("[call]"));

          return (
            <React.Fragment key={msgId + '-wrap'}>
              {shouldShowDateDivider(messages, i) && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '26px 0 16px 0', width: '100%' }}>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: '#475569',
                    padding: '5px 18px',
                    borderRadius: '99px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                    textTransform: 'uppercase',
                    fontFamily: "'Outfit', sans-serif"
                  }}>
                    {getDateLabel(m.createdAt || m.timestamp)}
                  </span>
                </div>
              )}
              <div
                key={msgId}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  width: '100%',
                  marginTop: isSameUser(messages, m, i, loggedId) ? 3 : 10,
                  marginBottom: 2,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => setHoveredMsgId(msgId)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleToggleReaction(m, '❤️');
                  }}
                  onContextMenu={(e) => { if (!isCallMsg) openCtx(e, m); }}
                  style={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '78%',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  {editing ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', width: 320 }}>
                      <input
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(m); if (e.key === 'Escape') setEditingId(null); }}
                        style={{
                          flex: 1, border: '1.5px solid #FF2A54', borderRadius: 14, padding: '8px 14px',
                          fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif"
                        }}
                      />
                      <button onClick={() => saveEdit(m)} style={{ background: '#FF2A54', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}>✕</button>
                    </div>
                  ) : (() => {
                    const rawText = typeof m.content === 'string' ? m.content : '';
                    const cachedText = decompressionCache.get(m.content) || rawText;
                    const isCallMsg = rawText.includes('[call]') || cachedText.includes('[call]');
                    const isDocMsg = rawText.includes('[doc] ') || cachedText.includes('[doc] ') || 
                                     rawText.startsWith('data:application') || cachedText.startsWith('data:application') ||
                                     rawText.includes('application/pdf') || cachedText.includes('application/pdf') ||
                                     rawText.startsWith('data:image') || cachedText.startsWith('data:image') ||
                                     rawText.startsWith('data:video') || cachedText.startsWith('data:video');

                    if (isCallMsg || isDocMsg) {
                      return (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', width: 'auto', padding: 0, margin: '2px 0' }}>
                          <DecompressedContent
                            content={m.content}
                            isMe={isMe}
                            msgId={msgId}
                            expiredOnce={expiredOnce}
                            revealedOnce={revealedOnce}
                            viewCountdown={viewCountdown}
                            revealViewOnce={revealViewOnce}
                          />
                          <span
                            style={{
                              fontSize: '0.66rem',
                              opacity: 0.75,
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              color: '#64748B',
                              marginTop: '4px',
                              paddingRight: isMe ? '4px' : '0',
                              paddingLeft: !isMe ? '4px' : '0',
                              fontFamily: "'Outfit', sans-serif"
                            }}
                          >
                            {formatTime(m.createdAt || m.updatedAt || m.timestamp || m.time)}
                          </span>
                        </div>
                      );
                    }

                    const isRecentEnergy = i >= (messages.length - 3);

                    return (
                      <span
                        className={`animate-message ${isRecentEnergy ? 'message-energy-active' : ''}`}
                        onMouseEnter={() => setHoveredMsgId(msgId)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                        onPointerDown={(e) => handleMsgPointerDown(m, e)}
                        onPointerMove={(e) => handleMsgPointerMove(m, e)}
                        onPointerUp={(e) => handleMsgPointerUp(m, e)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setDeletingMsg(m);
                        }}
                        style={{
                          display: 'inline-block',
                          width: 'auto',
                          background: isMe
                            ? 'linear-gradient(135deg, #5B5FEF 0%, #6D8CFF 100%)'
                            : '#FFFFFF',
                          color: isMe ? '#FFFFFF' : '#171827',
                          border: isMe
                            ? '1px solid rgba(255, 255, 255, 0.25)'
                            : '1px solid rgba(23, 24, 39, 0.06)',
                          boxShadow: isMe
                            ? '0 6px 20px rgba(91, 95, 239, 0.22)'
                            : '0 4px 16px rgba(23, 24, 39, 0.03)',
                          borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
                          padding: '12px 18px',
                          fontSize: '0.94rem',
                          lineHeight: '1.52',
                          fontWeight: 500,
                          wordBreak: 'normal',
                          overflowWrap: 'anywhere',
                          whiteSpace: 'pre-wrap',
                          cursor: 'context-menu',
                          position: 'relative',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          letterSpacing: '-0.01em',
                          backdropFilter: isMe ? 'none' : 'blur(16px)',
                          WebkitBackdropFilter: isMe ? 'none' : 'blur(16px)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14 }}>
                            <div style={{ flex: 1 }}>
                              <DecompressedContent
                                content={m.content}
                                isMe={isMe}
                                msgId={msgId}
                                expiredOnce={expiredOnce}
                                revealedOnce={revealedOnce}
                                viewCountdown={viewCountdown}
                                revealViewOnce={revealViewOnce}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                opacity: 0.85,
                                alignSelf: 'flex-end',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                color: isMe ? 'rgba(255, 255, 255, 0.85)' : '#727486',
                                paddingLeft: '8px',
                                fontFamily: "'Plus Jakarta Sans', sans-serif"
                              }}
                            >
                              {formatTime(m.createdAt || m.updatedAt || m.timestamp || m.time)}
                            </span>
                          </div>

                          {/* Bookmark tag badge */}
                          {bmked && tag && (
                            <span style={{
                              display: 'block', fontSize: 10, fontWeight: 700, marginTop: 2,
                              color: TAG_COLORS[tag]?.color || '#5B5FEF',
                              opacity: 0.9,
                            }}>
                              📌 {tag.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </span>
                    );
                  })()}

                  {/* ── Floating Living Reactions Bar on Tap / Click ── */}
                  <AnimatePresence>
                    {activeReactionMsgId === msgId && !isCallMsg && !editing && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 6 }}
                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                        style={{
                          position: 'absolute',
                          top: '-44px',
                          [isMe ? 'right' : 'left']: '4px',
                          zIndex: 60,
                          background: 'rgba(255, 255, 255, 0.98)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          borderRadius: '99px',
                          padding: '4px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(91, 95, 239, 0.2)'
                        }}
                      >
                        {REACTION_EMOJIS.map((emoji) => {
                          const msgReactions = reactionsMap[msgId] || [];
                          const isMine = msgReactions.some(r => r.userId === loggedId && r.emoji === emoji);
                          return (
                            <motion.button
                              key={emoji}
                              whileHover={{ scale: 1.35, y: -2 }}
                              whileTap={{ scale: 0.85 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReaction(m, emoji);
                                setActiveReactionMsgId(null);
                              }}
                              style={{
                                background: isMine ? 'rgba(91, 95, 239, 0.15)' : 'transparent',
                                border: isMine ? '1.5px solid #5B5FEF' : 'none',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {emoji}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ── Active Reactions Badge Cluster (WhatsApp/Slack/iMessage Style) ── */}
                {(() => {
                  const msgReactions = reactionsMap[msgId] || [];
                  if (msgReactions.length === 0) return null;
                  
                  // Group by emoji
                  const counts = {};
                  msgReactions.forEach(r => {
                    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
                  });

                  return (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '-6px',
                        marginBottom: '4px',
                        zIndex: 10,
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        paddingRight: isMe ? '8px' : '0',
                        paddingLeft: !isMe ? '8px' : '0'
                      }}
                    >
                      {Object.entries(counts).map(([emoji, count]) => {
                        const hasMyReact = msgReactions.some(r => r.userId === loggedId && r.emoji === emoji);
                        return (
                          <motion.div
                            key={emoji}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleReaction(m, emoji)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              background: hasMyReact ? '#EEF0FF' : '#FFFFFF',
                              border: hasMyReact ? '1.5px solid #5B5FEF' : '1px solid rgba(23, 24, 39, 0.08)',
                              borderRadius: '99px',
                              padding: '2px 8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: '#171827',
                              boxShadow: '0 2px 8px rgba(23, 24, 39, 0.04)',
                              cursor: 'pointer'
                            }}
                          >
                            <span>{emoji}</span>
                            {count > 1 && <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800 }}>{count}</span>}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  );
                })()}

                {/* Instagram-style Transparent Seen / Sent Receipt below last sent message */}
                {isMe && i === messages.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 0.85, y: 0 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      width: '100%',
                      marginTop: '2px',
                      marginRight: '6px'
                    }}
                  >
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: (m.isRead || m.seen || m.read) ? '#0284C7' : '#94A3B8',
                      fontFamily: "'Outfit', 'Inter', sans-serif",
                      letterSpacing: '-0.01em'
                    }}>
                      {(m.isRead || m.seen || m.read) ? 'Seen ✓✓' : 'Sent ✓'} • {getRelativeTime(m.createdAt || m.updatedAt || m.timestamp)}
                    </span>
                  </motion.div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* Live Animated Typing Bubble Indicator on Left Side */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              marginTop: '10px',
              marginBottom: '6px',
              gap: 10,
            }}
          >
            {otherUser && (
              <div style={{ width: 36, height: 36, flexShrink: 0 }}>
                <img src={otherUser?.pic || ''} alt={otherUser?.name || 'User'} style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover', border: '1.5px solid rgba(226,232,240,0.9)' }} />
              </div>
            )}

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '18px 18px 18px 4px',
                padding: '8px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>
                  {`${otherUser?.name || otherUser?.username || 'User'} is typing...`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ y: [0, -6, 0], opacity: [0.35, 1, 0.35] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.14, ease: "easeInOut" }}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#5B5FEF',
                        display: 'inline-block'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── LUXURY ACTION MENU (Hold / Long-Press / Right Click) ── */}
      <AnimatePresence>
        {ctxMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              onClick={() => setCtxMenu(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            />
            <motion.div
              ref={ctxRef}
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: Math.min(ctxMenu.y, (window.innerHeight || 800) - 220),
                left: Math.min(ctxMenu.x, (window.innerWidth || 400) - 230),
                zIndex: 9999,
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1.5px solid rgba(226, 232, 240, 0.95)',
                borderRadius: 20,
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.22), 0 0 1px rgba(91, 95, 239, 0.15)',
                padding: '8px 6px',
                width: 215,
                maxWidth: 'calc(100vw - 32px)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                overflow: 'hidden'
              }}
            >
              {[
                {
                  icon: '✏️', label: 'Edit message',
                  show: (senderId(ctxMenu.msg) === loggedId) && !ctxMenu.msg?.content?.startsWith('[doc]') && !ctxMenu.msg?.content?.startsWith('[voice]') && !ctxMenu.msg?.content?.startsWith('[video_note]'),
                  action: () => {
                    startEdit(ctxMenu.msg);
                    setCtxMenu(null);
                  },
                },
                {
                  icon: '🗑️', label: 'Delete message',
                  show: true,
                  action: () => {
                    setDeletingMsg(ctxMenu.msg);
                    setCtxMenu(null);
                  },
                },
                {
                  icon: '📌', label: isBookmarked(ctxMenu.msg) ? 'Update bookmark' : 'Bookmark',
                  show: true,
                  action: () => { setBookmarkModal(ctxMenu.msg); setCtxMenu(null); },
                },
                {
                  icon: '📋', label: 'Copy text',
                  show: true,
                  action: () => {
                    navigator.clipboard.writeText(ctxMenu.msg?.content || '');
                    setCtxMenu(null);
                    toast.success('Copied!', { autoClose: 1200, hideProgressBar: true });
                  },
                },
              ].filter(item => item.show !== false).map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer', fontSize: '0.86rem', fontWeight: 700, color: '#0F172A',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(91, 95, 239, 0.08)';
                    e.currentTarget.style.color = '#5B5FEF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = '#0F172A';
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Bookmark Tag Modal */}
      <AnimatePresence>
        {bookmarkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
              zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 20 }}
              style={{
                background: '#FFFFFF', borderRadius: 20, padding: 28, minWidth: 320,
                boxShadow: '0 24px 60px rgba(61,43,38,0.18)',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#3D2B26', marginBottom: 6 }}>
                📌 Bookmark Message
              </h3>
              <p style={{ fontSize: 13, color: '#806C65', marginBottom: 18, lineHeight: 1.5, background: '#FFF9F2', padding: '10px 14px', borderRadius: 10 }}>
                "{bookmarkModal.content?.slice(0, 80)}{bookmarkModal.content?.length > 80 ? '…' : ''}"
              </p>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#806C65', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Choose Tag</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {Object.entries(TAG_COLORS).map(([tag, style]) => (
                  <button
                    key={tag}
                    onClick={() => setBTag(tag)}
                    style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                      background: bTag === tag ? style.color : style.bg,
                      color: bTag === tag ? '#fff' : style.color,
                      border: `1.5px solid ${style.border}`,
                      cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
                    }}
                  >
                    {tag.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => saveBookmark(bookmarkModal)}
                  style={{
                    flex: 1, background: 'linear-gradient(135deg, #E63946, #d62839)',
                    color: '#fff', border: 'none', borderRadius: 12, padding: '11px',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >Save Bookmark</button>
                <button
                  onClick={() => setBookmarkModal(null)}
                  style={{
                    padding: '11px 18px', background: '#F5F5F5', border: 'none',
                    borderRadius: 12, fontSize: 14, cursor: 'pointer', fontWeight: 600, color: '#806C65',
                  }}
                >Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Micro-Interaction Flying Reaction Confetti Animation ── */}
      <AnimatePresence>
        {confettiEmoji && (
          <motion.div
            key={confettiEmoji.id}
            initial={{ scale: 0.3, opacity: 1, y: 30 }}
            animate={{ scale: [1, 2.5, 3.2], opacity: [1, 0.9, 0], y: -90, rotate: [0, 15, -15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              left: confettiEmoji.x,
              top: confettiEmoji.y,
              transform: 'translate(-50%, -50%)',
              fontSize: '54px',
              pointerEvents: 'none',
              zIndex: 99999,
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))'
            }}
          >
            {confettiEmoji.emoji}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ScrollableChat;
