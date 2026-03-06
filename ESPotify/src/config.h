#pragma once

// ============================================================
// ESPotify Configuration
// ============================================================

// --- I2C (HUZZAH32 routes Feather header to GPIO 23/22, not ESP32 default 21/22) ---
#define I2C_SDA_PIN       23
#define I2C_SCL_PIN       22

// --- Display (SSD1306 OLED FeatherWing) ---
#define SCREEN_WIDTH      128
#define SCREEN_HEIGHT     64
#define OLED_RESET        -1      // No reset pin on FeatherWing
#define OLED_I2C_ADDR     0x3C   // Default I2C address

// --- FeatherWing OLED Buttons ---
#define BTN_A_PIN         15     // Left button
#define BTN_B_PIN         32     // Middle button
#define BTN_C_PIN         14     // Right button

// --- Optional External Buttons (on Tripler prototyping area) ---
#define BTN_PREV_PIN      27
#define BTN_NEXT_PIN      21

// --- I2S Audio Output (PCM5102A DAC) ---
#define I2S_BCLK_PIN      26     // Bit clock
#define I2S_LRC_PIN       25     // Word select / LRCK
#define I2S_DOUT_PIN      33     // Data out

// --- I2S Configuration ---
#define I2S_PORT          I2S_NUM_0
#define SAMPLE_RATE       44100
#define BITS_PER_SAMPLE   16
#define CHANNELS          2       // Stereo

// --- Button Timing (ms) ---
#define DEBOUNCE_MS       40
#define LONG_PRESS_MS     600

// --- GUI ---
#define OLED_FPS          15
#define OLED_FRAME_MS     (1000 / OLED_FPS)
#define SCROLL_SPEED_PX   30     // Pixels per second for text scrolling
#define SCROLL_PAUSE_MS   1500   // Pause before scrolling starts
#define MAX_DISPLAY_CHARS 21     // Characters that fit at 6px font width

// --- Spotify API ---
#define SPOTIFY_POLL_MS   5000   // Poll every 5 seconds
#define SPOTIFY_TOKEN_URL "https://accounts.spotify.com/api/token"
#define SPOTIFY_API_BASE  "https://api.spotify.com/v1/me/player"

// --- FFT ---
#define FFT_SAMPLES       512
#define FFT_BANDS         14     // Number of display bars
#define FFT_SMOOTHING     0.3f   // Exponential smoothing alpha

// --- EQ ---
#define EQ_BANDS          5
#define EQ_MIN_DB         -12
#define EQ_MAX_DB         12
#define EQ_STEP_DB        3

// --- Bluetooth ---
// Set to 1 when the PCM5102A DAC is wired and you're ready to test A2DP audio.
// Leaving it 0 frees ~45KB RAM so TLS (Spotify API) can work alongside WiFi.
#define ENABLE_BLUETOOTH  1
#define BT_DEVICE_NAME    "ESPotify"

// --- WiFi ---
#define WIFI_CONNECT_TIMEOUT_MS  15000
#define WIFI_PORTAL_TIMEOUT_MS   300000  // 5 min captive portal timeout

// --- NVS Keys ---
#define NVS_NAMESPACE       "espotify"
#define NVS_KEY_REFRESH_TOK "sp_refresh"
#define NVS_KEY_EQ_BANDS    "eq_bands"

// --- Screen IDs ---
enum ScreenID {
    SCREEN_BOOT = 0,
    SCREEN_AUTH,
    SCREEN_NOW_PLAYING,
    SCREEN_SPECTRUM,
    SCREEN_EQ,
    SCREEN_SETTINGS,
    SCREEN_COUNT
};
