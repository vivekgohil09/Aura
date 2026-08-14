import React from 'react';

export const AURA_THEMES = [
  {
    id: 'cream-gold',
    name: 'Aura Luxury Cream',
    subtitle: 'Warm Golden Glow',
    preview: 'linear-gradient(135deg, #FFFDF7 0%, #FEF9EB 50%, #F5EBE1 100%)',
    bg: 'radial-gradient(circle at 10% 20%, rgba(255, 253, 247, 0.95) 0%, rgba(254, 249, 235, 0.9) 90%)',
    vfx: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(245, 158, 11, 0.04) 60%, transparent 80%)',
    bubbleSent: 'linear-gradient(135deg, #FFFDF7 0%, #FEF9EB 100%)',
    bubbleSentText: '#0F172A',
    bubbleSentBorder: '1.5px solid rgba(212, 175, 55, 0.45)',
    bubbleSentTime: '#B45309',
    accentColor: '#D4AF37'
  },
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    subtitle: 'Deep Royal Indigo',
    preview: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
    bg: 'radial-gradient(circle at 50% 10%, #0F172A 0%, #020617 100%)',
    vfx: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(30, 58, 138, 0.08) 60%, transparent 80%)',
    bubbleSent: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
    bubbleSentText: '#FFFFFF',
    bubbleSentBorder: '1.5px solid rgba(59, 130, 246, 0.4)',
    bubbleSentTime: '#93C5FD',
    accentColor: '#3B82F6'
  },
  {
    id: 'aurora-emerald',
    name: 'Aurora Borealis',
    subtitle: 'Lush Forest Emerald',
    preview: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
    bg: 'radial-gradient(circle at 20% 30%, #064E3B 0%, #022C22 100%)',
    vfx: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.06) 60%, transparent 80%)',
    bubbleSent: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)',
    bubbleSentText: '#FFFFFF',
    bubbleSentBorder: '1.5px solid rgba(52, 211, 153, 0.45)',
    bubbleSentTime: '#A7F3D0',
    accentColor: '#10B981'
  },
  {
    id: 'sunset-cyberpunk',
    name: 'Tokyo Sunset',
    subtitle: 'Neon Magenta & Gold',
    preview: 'linear-gradient(135deg, #831843 0%, #BE185D 50%, #F59E0B 100%)',
    bg: 'radial-gradient(circle at 80% 20%, #4A044E 0%, #1E1B4B 100%)',
    vfx: 'radial-gradient(circle, rgba(244, 63, 94, 0.25) 0%, rgba(245, 158, 11, 0.08) 60%, transparent 80%)',
    bubbleSent: 'linear-gradient(135deg, #BE185D 0%, #831843 100%)',
    bubbleSentText: '#FFFFFF',
    bubbleSentBorder: '1.5px solid rgba(251, 113, 133, 0.45)',
    bubbleSentTime: '#FBCFE8',
    accentColor: '#F43F5E'
  },
  {
    id: 'cyber-dark',
    name: 'Obsidian Velvet',
    subtitle: 'Minimal Pure Black & 24K Gold',
    preview: 'linear-gradient(135deg, #090D16 0%, #151D2C 100%)',
    bg: 'radial-gradient(circle at 50% 50%, #090D16 0%, #000000 100%)',
    vfx: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 80%)',
    bubbleSent: 'linear-gradient(135deg, #090D16 0%, #151D2C 100%)',
    bubbleSentText: '#FFFFFF',
    bubbleSentBorder: '1.5px solid rgba(212, 175, 55, 0.45)',
    bubbleSentTime: '#FDE68A',
    accentColor: '#D4AF37'
  }
];

export const getActiveTheme = () => {
  try {
    const saved = localStorage.getItem('aura_chat_theme');
    if (saved) {
      const found = AURA_THEMES.find(t => t.id === saved);
      if (found) return found;
    }
  } catch (e) {}
  return AURA_THEMES[0]; // Default Luxury Cream
};
