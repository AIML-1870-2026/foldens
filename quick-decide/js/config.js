/* ============================================
   Quick, Decide! — Configuration
   ============================================ */

const CONFIG = {
    // Timing
    ROUND_TIME: 20,
    ROUNDS_PER_GAME: 6,
    PROMPT_DISPLAY_TIME: 2000,
    COUNTDOWN_TIME: 3000,
    RESULT_DISPLAY_TIME: 3000,
    INFERENCE_INTERVAL: 250,
    CONFIDENCE_THRESHOLD: 0.50,

    // Canvas
    CANVAS_SIZE: 500,
    MODEL_INPUT_SIZE: 28,
    STROKE_COLOR: '#2D2D2D',
    STROKE_WIDTH: 8,

    // Colors
    COLORS: {
        paper:           '#FFF8F0',
        charcoal:        '#2D2D2D',
        softGray:        '#8B8B8B',
        inkBlue:         '#4A90D9',
        eraserPink:      '#E8A0BF',
        highlightYellow: '#F5D547',
        correctGreen:    '#7BC47F',
        paperLines:      '#D4E4F7',
        heatmapCool:     '#4A90D9',
        heatmapHot:      '#D94A8A'
    },

    // Model
    MODEL_URL: 'model/model.json',
    INDEXEDDB_KEY: 'quick-decide-model-v1',

    // Storage
    STORAGE_KEYS: {
        stats: 'qd-stats',
        settings: 'qd-settings'
    }
};
