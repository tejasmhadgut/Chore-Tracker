/**
 * ChoreTrack Design System
 * Central source of truth for spacing, colors, typography, and visual constants
 */

// Color Palette
export const colors = {
  // Primary accent - use sparingly for key actions and highlights
  primary: {
    DEFAULT: '#06b6d4', // cyan-500
    hover: '#0891b2',   // cyan-600
    light: '#22d3ee',   // cyan-400
    dark: '#0e7490',    // cyan-700
  },
  
  // Background colors
  background: {
    primary: '#0f172a',   // slate-950
    secondary: '#1e293b', // slate-800
    tertiary: '#334155',  // slate-700
    card: 'rgba(30, 41, 59, 0.5)', // slate-800/50
  },
  
  // Text colors
  text: {
    primary: '#f1f5f9',   // slate-100
    secondary: '#cbd5e1', // slate-300
    muted: '#94a3b8',     // slate-400
    inverse: '#0f172a',   // slate-950
  },
  
  // State colors
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444',   // red-500
  info: '#3b82f6',    // blue-500
};

// Spacing scale (8px base unit)
export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  
  // Semantic spacing
  section: '3rem',        // Between major sections
  card: '1.5rem',         // Inside cards
  element: '1rem',        // Between related elements
  tight: '0.5rem',        // Tight grouping
};

// Typography scale
export const typography = {
  // Font sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px (body)
    lg: '1.125rem',     // 18px (section headers)
    xl: '1.25rem',      // 20px (section headers)
    '2xl': '1.5rem',    // 24px (card titles)
    '3xl': '2rem',      // 32px (page titles)
    '4xl': '2.25rem',   // 36px (large titles)
  },
  
  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Border radius
export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  full: '9999px',   // Pills/circles
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  glow: '0 0 20px rgba(6, 182, 212, 0.3)', // Cyan glow
};

// Transitions
export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// Z-index layers
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Button variants
export const buttonStyles = {
  primary: `
    bg-gradient-to-r from-cyan-500 to-cyan-600 
    hover:from-cyan-600 hover:to-cyan-700 
    text-white font-semibold
    shadow-lg shadow-cyan-500/30
    hover:shadow-xl hover:shadow-cyan-500/40
    active:scale-95
    transition-all duration-200
  `,
  
  secondary: `
    bg-slate-700/50 
    hover:bg-slate-700
    border border-slate-600
    hover:border-cyan-500/50
    text-slate-200
    font-medium
    transition-all duration-200
  `,
  
  outline: `
    bg-transparent
    border-2 border-cyan-500
    hover:bg-cyan-500/10
    text-cyan-400
    hover:text-cyan-300
    font-medium
    transition-all duration-200
  `,
  
  ghost: `
    bg-transparent
    hover:bg-slate-700/50
    text-slate-300
    hover:text-white
    font-medium
    transition-all duration-200
  `,
};

// Card variants
export const cardStyles = {
  default: `
    bg-gradient-to-br from-slate-800 to-slate-900
    rounded-xl p-6
    shadow-lg
    border border-slate-700
    hover:border-cyan-500/30
    transition-all duration-300
  `,
  
  flat: `
    bg-slate-800/50
    rounded-lg p-4
    border border-slate-700
    transition-all duration-200
  `,
  
  elevated: `
    bg-gradient-to-br from-slate-800 to-slate-900
    rounded-xl p-6
    shadow-xl
    border border-slate-700
    hover:shadow-2xl hover:shadow-cyan-500/10
    transition-all duration-300
  `,
};
