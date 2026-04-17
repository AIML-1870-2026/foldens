export const CHIPS = [
  { value: 5,   color: '#c0392b', label: '$5'   },
  { value: 25,  color: '#1e8449', label: '$25'  },
  { value: 50,  color: '#2471a3', label: '$50'  },
  { value: 100, color: '#1c1c1c', label: '$100' },
];

export const STARTING_BALANCE = 500;
export const MIN_BET = 5;

export const ACTION_COLORS = {
  hit:    '#d97706', // amber
  stand:  '#16a34a', // green
  double: '#2563eb', // blue
  split:  '#7c3aed', // purple
};

export const CONFIDENCE_DOTS = {
  high:   '●●●',
  medium: '●●○',
  low:    '●○○',
};

// Delays in ms; model used for AI calls at each speed
export const SPEED_CONFIGS = {
  1:  { label: '1×',  model: 'gpt-4o-mini',   autoAcceptDelay: 800,  autoPlayDelay: 1800, dealerDelay: 600 },
  2:  { label: '2×',  model: 'gpt-4o-mini',   autoAcceptDelay: 350,  autoPlayDelay: 800,  dealerDelay: 280 },
  5:  { label: '5×',  model: 'gpt-4o-mini',   autoAcceptDelay: 120,  autoPlayDelay: 300,  dealerDelay: 100 },
  10: { label: '10×', model: 'gpt-3.5-turbo', autoAcceptDelay: 40,   autoPlayDelay: 120,  dealerDelay: 40  },
  20: { label: '20×', model: 'gpt-3.5-turbo', autoAcceptDelay: 10,   autoPlayDelay: 50,   dealerDelay: 15  },
};

export const RISK_PROFILES = {
  conservative: {
    label: 'Conservative',
    description: 'Prefer standing on borderline totals; avoid doubles unless highly favorable.',
  },
  standard: {
    label: 'Standard',
    description: 'Follow basic strategy exactly.',
  },
  aggressive: {
    label: 'Aggressive',
    description: 'Lean toward doubling and hitting on borderline hands to maximize expected value.',
  },
};
