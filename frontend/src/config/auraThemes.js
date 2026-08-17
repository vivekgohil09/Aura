import React from 'react';

export const AURA_THEMES = [
  {
    id: 'aura-living',
    name: 'Aura Living Ivory',
    subtitle: 'Warm Ivory & Soft Indigo',
    preview: 'linear-gradient(135deg, #FCFBF7 0%, #FFFFFF 50%, #F4F3EF 100%)',
    bg: 'radial-gradient(circle at 10% 20%, rgba(252, 251, 247, 0.98) 0%, rgba(244, 243, 239, 0.92) 90%)',
    vfx: 'radial-gradient(circle, rgba(91, 95, 239, 0.12) 0%, rgba(128, 103, 232, 0.03) 60%, transparent 80%)',
    bubbleSent: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
    bubbleSentText: '#FFFFFF',
    bubbleSentBorder: 'none',
    bubbleSentTime: '#E0E7FF',
    accentColor: '#5B5FEF'
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
    subtitle: 'Neon Magenta & Violet',
    preview: 'linear-gradient(135deg, #831843 0%, #BE185D 50%, #8067E8 100%)',
    bg: 'radial-gradient(circle at 80% 20%, #4A044E 0%, #1E1B4B 100%)',
    vfx: 'radial-gradient(circle, rgba(244, 63, 94, 0.25) 0%, rgba(128, 103, 232, 0.08) 60%, transparent 80%)',
    bubbleSent: 'linear-gradient(135deg, #BE185D 0%, #831843 100%)',
    bubbleSentText: '#FFFFFF',
    bubbleSentBorder: '1.5px solid rgba(251, 113, 133, 0.45)',
    bubbleSentTime: '#FBCFE8',
    accentColor: '#F43F5E'
  },
  {
    id: 'obsidian-velvet',
    name: 'Obsidian Velvet',
    subtitle: 'Minimal Pure Black & Violet Glow',
    preview: 'linear-gradient(135deg, #090D16 0%, #151D2C 100%)',
    bg: 'radial-gradient(circle at 50% 50%, #090D16 0%, #000000 100%)',
    vfx: 'radial-gradient(circle, rgba(91, 95, 239, 0.2) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 80%)',
    bubbleSent: 'linear-gradient(135deg, #171827 0%, #2D2F48 100%)',
    bubbleSentText: '#FFFFFF',
    bubbleSentBorder: '1.5px solid rgba(91, 95, 239, 0.35)',
    bubbleSentTime: '#E0E7FF',
    accentColor: '#5B5FEF'
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
  return AURA_THEMES[0]; // Default Living Ivory
};
