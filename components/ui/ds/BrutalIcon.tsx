/**
 * BrutalIcon — Custom SVG Icon System for HearMe Neo Brutalism Design
 *
 * On web: renders actual inline SVG with thick strokes
 * On native: renders emoji-based fallback text
 *
 * Usage:
 *   <BrutalIcon name="ai" size={32} color="#5B5EF7" />
 */
import React from 'react';
import { Platform, Text, View } from 'react-native';
import { NB } from '@/constants/theme';

export type IconName =
  | 'ai'
  | 'camera'
  | 'flashcard'
  | 'library'
  | 'lesson'
  | 'achievement'
  | 'progress'
  | 'check'
  | 'lock'
  | 'correct'
  | 'wrong'
  | 'home'
  | 'profile'
  | 'search'
  | 'star'
  | 'arrow-right'
  | 'play'
  | 'menu'
  | 'close'
  | 'edit'
  | 'trash'
  | 'plus'
  | 'hand'
  | 'brain'
  | 'spark';

interface BrutalIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: object;
}

// ─── Emoji fallbacks for native ─────────────────────────────────────────────
const EMOJI_MAP: Record<IconName, string> = {
  ai: '🤖',
  camera: '📷',
  flashcard: '🗂️',
  library: '📖',
  lesson: '📚',
  achievement: '🏆',
  progress: '📊',
  check: '✓',
  lock: '🔒',
  correct: '✅',
  wrong: '❌',
  home: '🏠',
  profile: '👤',
  search: '🔍',
  star: '⭐',
  'arrow-right': '→',
  play: '▶',
  menu: '☰',
  close: '✕',
  edit: '✏️',
  trash: '🗑️',
  plus: '＋',
  hand: '🤟',
  brain: '🧠',
  spark: '✨',
};

// ─── SVG path definitions ────────────────────────────────────────────────────
function getSVGContent(name: IconName, size: number, color: string, strokeWidth: number): string {
  const half = size / 2;
  const s = strokeWidth;
  const c = color;

  const paths: Record<IconName, string> = {
    ai: `<circle cx="${half}" cy="${half * 0.7}" r="${half * 0.45}" stroke="${c}" stroke-width="${s}" fill="none"/>
         <line x1="${half}" y1="${half * 1.15}" x2="${half}" y2="${size * 0.75}" stroke="${c}" stroke-width="${s}"/>
         <line x1="${half * 0.3}" y1="${size * 0.85}" x2="${half}" y2="${size * 0.75}" stroke="${c}" stroke-width="${s}"/>
         <line x1="${half * 1.7}" y1="${size * 0.85}" x2="${half}" y2="${size * 0.75}" stroke="${c}" stroke-width="${s}"/>
         <circle cx="${half * 0.65}" cy="${half * 0.62}" r="${s * 0.8}" fill="${c}"/>
         <circle cx="${half * 1.35}" cy="${half * 0.62}" r="${s * 0.8}" fill="${c}"/>
         <path d="M ${half * 0.7} ${half * 0.95} Q ${half} ${half * 1.1} ${half * 1.3} ${half * 0.95}" stroke="${c}" stroke-width="${s * 0.8}" fill="none"/>`,

    camera: `<rect x="${size * 0.1}" y="${size * 0.25}" width="${size * 0.8}" height="${size * 0.55}" rx="3" stroke="${c}" stroke-width="${s}" fill="none"/>
             <circle cx="${half}" cy="${half * 0.95}" r="${size * 0.16}" stroke="${c}" stroke-width="${s}" fill="none"/>
             <rect x="${size * 0.6}" y="${size * 0.18}" width="${size * 0.2}" height="${size * 0.1}" rx="2" stroke="${c}" stroke-width="${s * 0.7}" fill="none"/>`,

    flashcard: `<rect x="${size * 0.15}" y="${size * 0.25}" width="${size * 0.7}" height="${size * 0.55}" rx="3" stroke="${c}" stroke-width="${s}" fill="none"/>
                <rect x="${size * 0.1}" y="${size * 0.18}" width="${size * 0.7}" height="${size * 0.55}" rx="3" stroke="${c}" stroke-width="${s * 0.6}" fill="none" opacity="0.4"/>
                <line x1="${size * 0.3}" y1="${half}" x2="${size * 0.7}" y2="${half}" stroke="${c}" stroke-width="${s * 0.8}"/>
                <line x1="${size * 0.3}" y1="${half * 1.15}" x2="${size * 0.6}" y2="${half * 1.15}" stroke="${c}" stroke-width="${s * 0.8}"/>`,

    library: `<path d="M ${size * 0.15} ${size * 0.2} L ${size * 0.15} ${size * 0.8}" stroke="${c}" stroke-width="${s * 1.5}"/>
              <path d="M ${size * 0.35} ${size * 0.15} L ${size * 0.35} ${size * 0.85}" stroke="${c}" stroke-width="${s}"/>
              <path d="M ${size * 0.55} ${size * 0.2} Q ${size * 0.85} ${half} ${size * 0.55} ${size * 0.8}" stroke="${c}" stroke-width="${s}" fill="none"/>
              <line x1="${size * 0.12}" y1="${size * 0.82}" x2="${size * 0.88}" y2="${size * 0.82}" stroke="${c}" stroke-width="${s}"/>`,

    lesson: `<path d="M ${size * 0.15} ${size * 0.2} L ${size * 0.85} ${size * 0.2} L ${size * 0.85} ${size * 0.8} L ${size * 0.15} ${size * 0.8} Z" stroke="${c}" stroke-width="${s}" fill="none"/>
             <polyline points="${size * 0.3},${half} ${size * 0.45},${size * 0.62} ${size * 0.72},${size * 0.4}" stroke="${c}" stroke-width="${s * 1.2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,

    achievement: `<path d="M ${half} ${size * 0.12} L ${size * 0.6} ${size * 0.38} L ${size * 0.88} ${size * 0.38} L ${size * 0.65} ${size * 0.58} L ${size * 0.73} ${size * 0.86} L ${half} ${size * 0.7} L ${size * 0.27} ${size * 0.86} L ${size * 0.35} ${size * 0.58} L ${size * 0.12} ${size * 0.38} L ${size * 0.4} ${size * 0.38} Z" stroke="${c}" stroke-width="${s}" fill="none"/>`,

    progress: `<rect x="${size * 0.1}" y="${size * 0.55}" width="${size * 0.2}" height="${size * 0.35}" stroke="${c}" stroke-width="${s}" fill="${c}" opacity="0.3"/>
               <rect x="${size * 0.38}" y="${size * 0.35}" width="${size * 0.2}" height="${size * 0.55}" stroke="${c}" stroke-width="${s}" fill="${c}" opacity="0.6"/>
               <rect x="${size * 0.66}" y="${size * 0.15}" width="${size * 0.2}" height="${size * 0.75}" stroke="${c}" stroke-width="${s}" fill="${c}"/>`,

    check: `<polyline points="${size * 0.2},${half} ${size * 0.42},${size * 0.68} ${size * 0.8},${size * 0.32}" stroke="${c}" stroke-width="${s * 1.5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,

    lock: `<rect x="${size * 0.25}" y="${size * 0.45}" width="${size * 0.5}" height="${size * 0.42}" rx="3" stroke="${c}" stroke-width="${s}" fill="none"/>
           <path d="M ${size * 0.35} ${size * 0.45} L ${size * 0.35} ${size * 0.3} Q ${size * 0.35} ${size * 0.15} ${half} ${size * 0.15} Q ${size * 0.65} ${size * 0.15} ${size * 0.65} ${size * 0.3} L ${size * 0.65} ${size * 0.45}" stroke="${c}" stroke-width="${s}" fill="none"/>
           <circle cx="${half}" cy="${size * 0.68}" r="${size * 0.05}" fill="${c}"/>`,

    correct: `<circle cx="${half}" cy="${half}" r="${half * 0.85}" stroke="#00C2A8" stroke-width="${s}" fill="none"/>
              <polyline points="${size * 0.3},${half} ${size * 0.45},${size * 0.62} ${size * 0.72},${size * 0.38}" stroke="#00C2A8" stroke-width="${s * 1.3}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,

    wrong: `<circle cx="${half}" cy="${half}" r="${half * 0.85}" stroke="#FF4D6D" stroke-width="${s}" fill="none"/>
            <line x1="${size * 0.33}" y1="${size * 0.33}" x2="${size * 0.67}" y2="${size * 0.67}" stroke="#FF4D6D" stroke-width="${s * 1.3}" stroke-linecap="round"/>
            <line x1="${size * 0.67}" y1="${size * 0.33}" x2="${size * 0.33}" y2="${size * 0.67}" stroke="#FF4D6D" stroke-width="${s * 1.3}" stroke-linecap="round"/>`,

    home: `<path d="M ${size * 0.1} ${half} L ${half} ${size * 0.15} L ${size * 0.9} ${half}" stroke="${c}" stroke-width="${s}" fill="none" stroke-linejoin="round"/>
           <path d="M ${size * 0.22} ${half} L ${size * 0.22} ${size * 0.85} L ${size * 0.78} ${size * 0.85} L ${size * 0.78} ${half}" stroke="${c}" stroke-width="${s}" fill="none"/>
           <rect x="${size * 0.4}" y="${size * 0.6}" width="${size * 0.2}" height="${size * 0.25}" stroke="${c}" stroke-width="${s * 0.7}" fill="none"/>`,

    profile: `<circle cx="${half}" cy="${size * 0.35}" r="${size * 0.2}" stroke="${c}" stroke-width="${s}" fill="none"/>
              <path d="M ${size * 0.15} ${size * 0.85} Q ${size * 0.15} ${size * 0.6} ${half} ${size * 0.6} Q ${size * 0.85} ${size * 0.6} ${size * 0.85} ${size * 0.85}" stroke="${c}" stroke-width="${s}" fill="none"/>`,

    search: `<circle cx="${half * 0.9}" cy="${half * 0.9}" r="${half * 0.55}" stroke="${c}" stroke-width="${s}" fill="none"/>
             <line x1="${size * 0.6}" y1="${size * 0.6}" x2="${size * 0.85}" y2="${size * 0.85}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>`,

    star: `<polygon points="${half},${size * 0.12} ${size * 0.61},${size * 0.4} ${size * 0.9},${size * 0.4} ${size * 0.67},${size * 0.6} ${size * 0.76},${size * 0.88} ${half},${size * 0.72} ${size * 0.24},${size * 0.88} ${size * 0.33},${size * 0.6} ${size * 0.1},${size * 0.4} ${size * 0.39},${size * 0.4}" stroke="${c}" stroke-width="${s}" fill="none"/>`,

    'arrow-right': `<line x1="${size * 0.15}" y1="${half}" x2="${size * 0.8}" y2="${half}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>
                    <polyline points="${size * 0.58},${size * 0.32} ${size * 0.82},${half} ${size * 0.58},${size * 0.68}" stroke="${c}" stroke-width="${s}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,

    play: `<polygon points="${size * 0.25},${size * 0.18} ${size * 0.82},${half} ${size * 0.25},${size * 0.82}" stroke="${c}" stroke-width="${s}" fill="none"/>`,

    menu: `<line x1="${size * 0.15}" y1="${size * 0.3}" x2="${size * 0.85}" y2="${size * 0.3}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>
           <line x1="${size * 0.15}" y1="${half}" x2="${size * 0.85}" y2="${half}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>
           <line x1="${size * 0.15}" y1="${size * 0.7}" x2="${size * 0.85}" y2="${size * 0.7}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>`,

    close: `<line x1="${size * 0.2}" y1="${size * 0.2}" x2="${size * 0.8}" y2="${size * 0.8}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>
            <line x1="${size * 0.8}" y1="${size * 0.2}" x2="${size * 0.2}" y2="${size * 0.8}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>`,

    edit: `<path d="M ${size * 0.6} ${size * 0.15} L ${size * 0.85} ${size * 0.4} L ${size * 0.4} ${size * 0.85} L ${size * 0.15} ${size * 0.85} L ${size * 0.15} ${size * 0.6} Z" stroke="${c}" stroke-width="${s}" fill="none"/>
           <line x1="${size * 0.55}" y1="${size * 0.2}" x2="${size * 0.8}" y2="${size * 0.45}" stroke="${c}" stroke-width="${s}"/>`,

    trash: `<rect x="${size * 0.2}" y="${size * 0.3}" width="${size * 0.6}" height="${size * 0.55}" rx="2" stroke="${c}" stroke-width="${s}" fill="none"/>
            <line x1="${size * 0.1}" y1="${size * 0.3}" x2="${size * 0.9}" y2="${size * 0.3}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>
            <line x1="${size * 0.35}" y1="${size * 0.15}" x2="${size * 0.65}" y2="${size * 0.15}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>
            <line x1="${size * 0.38}" y1="${size * 0.47}" x2="${size * 0.38}" y2="${size * 0.73}" stroke="${c}" stroke-width="${s * 0.8}" stroke-linecap="round"/>
            <line x1="${size * 0.62}" y1="${size * 0.47}" x2="${size * 0.62}" y2="${size * 0.73}" stroke="${c}" stroke-width="${s * 0.8}" stroke-linecap="round"/>`,

    plus: `<line x1="${half}" y1="${size * 0.15}" x2="${half}" y2="${size * 0.85}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>
           <line x1="${size * 0.15}" y1="${half}" x2="${size * 0.85}" y2="${half}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>`,

    hand: `<path d="M ${size * 0.5} ${size * 0.8} L ${size * 0.5} ${size * 0.35}" stroke="${c}" stroke-width="${s * 1.2}" stroke-linecap="round"/>
           <path d="M ${size * 0.38} ${size * 0.8} L ${size * 0.38} ${size * 0.25}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>
           <path d="M ${size * 0.26} ${size * 0.8} L ${size * 0.26} ${size * 0.35}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>
           <path d="M ${size * 0.62} ${size * 0.8} L ${size * 0.62} ${size * 0.3}" stroke="${c}" stroke-width="${s}" stroke-linecap="round"/>
           <path d="M ${size * 0.74} ${size * 0.55} L ${size * 0.74} ${size * 0.4}" stroke="${c}" stroke-width="${s * 0.8}" stroke-linecap="round"/>
           <path d="M ${size * 0.2} ${size * 0.8} Q ${size * 0.2} ${size * 0.92} ${half} ${size * 0.92} Q ${size * 0.8} ${size * 0.92} ${size * 0.8} ${size * 0.8}" stroke="${c}" stroke-width="${s}" fill="none"/>`,

    brain: `<path d="M ${half} ${size * 0.75} Q ${size * 0.15} ${size * 0.7} ${size * 0.15} ${size * 0.45} Q ${size * 0.15} ${size * 0.15} ${half} ${size * 0.15} Q ${size * 0.85} ${size * 0.15} ${size * 0.85} ${size * 0.45} Q ${size * 0.85} ${size * 0.7} ${half} ${size * 0.75}" stroke="${c}" stroke-width="${s}" fill="none"/>
            <line x1="${half}" y1="${size * 0.15}" x2="${half}" y2="${size * 0.85}" stroke="${c}" stroke-width="${s * 0.6}"/>
            <path d="M ${size * 0.35} ${size * 0.35} Q ${size * 0.5} ${size * 0.5} ${size * 0.35} ${size * 0.62}" stroke="${c}" stroke-width="${s * 0.7}" fill="none"/>`,

    spark: `<path d="M ${half} ${size * 0.1} L ${size * 0.55} ${size * 0.42} L ${size * 0.9} ${half} L ${size * 0.55} ${size * 0.58} L ${half} ${size * 0.9} L ${size * 0.45} ${size * 0.58} L ${size * 0.1} ${half} L ${size * 0.45} ${size * 0.42} Z" stroke="${c}" stroke-width="${s}" fill="none"/>`,
  };

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${paths[name]}</svg>`;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function BrutalIcon({
  name,
  size = 24,
  color = NB.color.text,
  strokeWidth = 2,
  style,
}: BrutalIconProps) {
  if (Platform.OS === 'web') {
    // Render actual SVG on web via dangerouslySetInnerHTML
    const svgContent = getSVGContent(name, size, color, strokeWidth);
    return (
      <View style={[{ width: size, height: size }, style]}>
        <div
          style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </View>
    );
  }

  // Native fallback: emoji text
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: size * 0.7, lineHeight: size }}>{EMOJI_MAP[name]}</Text>
    </View>
  );
}
