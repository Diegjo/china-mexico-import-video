import { beatGrid } from '../lib/motion.js';

export const W = 1080;
export const H = 1920;
export const DUR = 60;
export const { B, BAR, beat, bar, bpm } = beatGrid(120);

export const C = {
  bg: '#EEE7DB',
  paper: '#F8F4EC',
  rule: '#D6CDBE',
  muted: '#6F685D',
  ink: '#1A1814',
  ink2: '#3B372F',
  ink3: '#5A5449',
  ink4: '#8C8475',
  kraft: '#DCD2C2',
  accent: '#E4472A',
};

// Static instances of Archivo (OFL) + IBM Plex Mono (OFL), see film/fonts/.
export const FONTS = {
  XCond: 'Archivo-XCondBlack.ttf', // display: mega + H1
  CondXB: 'Archivo-CondXBold.ttf', // condensed labels inside diagrams
  XBold: 'Archivo-XBold.ttf',      // H2
  Med: 'Archivo-Medium.ttf',       // body
  XExp: 'Archivo-XExpBold.ttf',    // wide accents (≠, units)
  Plex: 'IBMPlexMono-Medium.ttf',  // data / labels
  PlexSB: 'IBMPlexMono-SemiBold.ttf',
};
export const F = {
  xcond: 'XCond', cond: 'CondXB', bold: 'XBold', med: 'Med', exp: 'XExp', mono: 'Plex', monoB: 'PlexSB',
};

export const M = 96; // left/right margin
export const SAFE = { top: 220, bottom: 1640 };
