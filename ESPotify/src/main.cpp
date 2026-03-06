#include <Arduino.h>
#include <Wire.h>

#include "config.h"
#include "secrets.h"
#include "wifi_manager.h"
#include "spotify_api.h"
#if ENABLE_BLUETOOTH
#include "bt_audio.h"
#endif
#include "audio_pipeline.h"
#include "fft_analyzer.h"
#include "gui_manager.h"
#include "button_handler.h"

// ============================================================
// Module instances
// ============================================================
static WiFiManager    wifiMgr;
static SpotifyAPI     spotify;
#if ENABLE_BLUETOOTH
static BTAudio        btAudio;
#endif
static AudioPipeline  audioPipe;
static FFTAnalyzer    fftAnalyzer;
static GUIManager     gui;
static ButtonHandler  buttons;

// ============================================================
// Audio callback (called from Bluetooth A2DP context)
// ============================================================
#if ENABLE_BLUETOOTH
static void onAudioData(const int16_t* data, int sampleCount) {
    // Process through EQ filter bank (modifies data in-place)
    audioPipe.processSamples(data, sampleCount);
}
#endif

// ============================================================
// Spotify control callbacks (called from GUI button events)
// ============================================================
static void onPlayPause() {
    TrackInfo info = spotify.getLastTrack();
    if (info.isPlaying) {
        spotify.pause();
    } else {
        spotify.play();
    }
    Serial.println(F("[Main] Play/Pause toggled"));
}

static void onNext() {
    spotify.next();
    Serial.println(F("[Main] Next track"));
}

static void onPrev() {
    spotify.previous();
    Serial.println(F("[Main] Previous track"));
}

static void onVolume(int delta) {
    // Get current volume from BT AVRCP, apply delta
    static int currentVolume = 80;
    currentVolume += delta;
    if (currentVolume < 0) currentVolume = 0;
    if (currentVolume > 100) currentVolume = 100;
    spotify.setVolume(currentVolume);
    Serial.printf("[Main] Volume: %d%%\n", currentVolume);
}

static void onEQChange(int band, int gainDb) {
    audioPipe.setEQGain(band, (float)gainDb);
    Serial.printf("[Main] EQ Band %d: %+ddB\n", band, gainDb);
}

// ============================================================
// FFT processing buffer
// ============================================================
static float fftBuffer[FFT_SAMPLES];

// ============================================================
// State machine
// ============================================================
enum AppState {
    STATE_BOOT,
    STATE_WIFI_CONNECTING,
    STATE_AUTH_NEEDED,
    STATE_AUTH_PORTAL,
    STATE_TOKEN_REFRESH,
    STATE_RUNNING
};

static AppState appState = STATE_BOOT;

// ============================================================
// Setup
// ============================================================
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println(F("\n=== ESPotify ===\n"));

    // Init I2C for OLED - HUZZAH32 routes Feather SDA to GPIO 23, SCL to GPIO 22
    Wire.begin(23, 22);
    delay(100);

    // Init OLED display
    if (!gui.begin()) {
        Serial.println(F("[Main] FATAL: OLED init failed!"));
        while (1) delay(1000);
    }
    gui.setScreen(SCREEN_BOOT);

    // Register callbacks
    gui.onPlayPause = onPlayPause;
    gui.onNext      = onNext;
    gui.onPrev      = onPrev;
    gui.onVolume    = onVolume;
    gui.onEQChange  = onEQChange;

    // Init buttons
    buttons.begin();

    // Init audio pipeline
    audioPipe.begin();
    fftAnalyzer.begin();

    // Show boot screen
    DeviceStatus status = {};
    status.wifiConnected = false;
    status.btConnected   = false;
    gui.setDeviceStatus(status);
    gui.render();

    // Connect WiFi
    appState = STATE_WIFI_CONNECTING;
    Serial.println(F("[Main] Connecting to WiFi..."));
    wifiMgr.begin(WIFI_SSID, WIFI_PASS);

    if (wifiMgr.isConnected()) {
        status.wifiConnected = true;
        status.ipAddress     = wifiMgr.getIP();
        gui.setDeviceStatus(status);
        gui.render();

        Serial.printf("[Main] WiFi connected: %s\n", wifiMgr.getIP().c_str());

        // Init Spotify API
        String redirectUri = "http://" + wifiMgr.getIP() + "/callback";
        spotify.begin(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, redirectUri,
                      SPOTIFY_REFRESH_TOKEN);  // Pre-seeded token (empty = use captive portal)

        // Check for saved refresh token
        if (spotify.hasRefreshToken()) {
            appState = STATE_TOKEN_REFRESH;
            Serial.println(F("[Main] Found saved refresh token, refreshing..."));
            if (spotify.refreshAccessToken()) {
                appState = STATE_RUNNING;
                Serial.println(F("[Main] Token refreshed, starting!"));
            } else {
                appState = STATE_AUTH_NEEDED;
            }
        } else {
            appState = STATE_AUTH_NEEDED;
        }
    } else {
        Serial.println(F("[Main] WiFi failed, continuing with BT only"));
        appState = STATE_RUNNING;
    }

    // If auth needed, start captive portal
    if (appState == STATE_AUTH_NEEDED) {
        gui.setScreen(SCREEN_AUTH);
        wifiMgr.startPortal(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET);
        appState = STATE_AUTH_PORTAL;
        Serial.println(F("[Main] Auth needed - portal started"));
    }

    // Fetch initial track before BT starts (BT fragments heap, breaking TLS)
    if (appState == STATE_RUNNING) {
        TrackInfo initial;
        if (spotify.getCurrentlyPlaying(initial)) {
            gui.setTrackInfo(initial);
            Serial.printf("[Main] Now playing: %s - %s\n",
                          initial.title.c_str(), initial.artist.c_str());
        }
    }

#if ENABLE_BLUETOOTH
    // Start Bluetooth A2DP sink
    btAudio.setDataCallback(onAudioData);
    btAudio.begin(BT_DEVICE_NAME);
    Serial.println(F("[Main] Bluetooth A2DP started"));
#else
    Serial.println(F("[Main] Bluetooth disabled (set ENABLE_BLUETOOTH=1 when DAC is ready)"));
#endif

    // If already authenticated, go to now playing
    if (appState == STATE_RUNNING) {
        gui.setScreen(SCREEN_NOW_PLAYING);
    }

    Serial.printf("[Main] Free heap: %d bytes\n", ESP.getFreeHeap());
}

// ============================================================
// Main Loop
// ============================================================
void loop() {
    unsigned long now = millis();

    // --- WiFi manager (handles portal + reconnect) ---
    wifiMgr.loop();

    // --- Handle auth portal completion ---
    if (appState == STATE_AUTH_PORTAL && wifiMgr.hasAuthCode()) {
        String code = wifiMgr.getAuthCode();
        Serial.println(F("[Main] Auth code received, exchanging for tokens..."));

        if (spotify.exchangeCode(code)) {
            Serial.println(F("[Main] Authentication successful!"));
            wifiMgr.stopPortal();
            appState = STATE_RUNNING;
            gui.setScreen(SCREEN_NOW_PLAYING);
        } else {
            Serial.println(F("[Main] Token exchange failed"));
        }
    }

    // --- Track info: AVRCP (BT) when connected, Spotify API otherwise ---
#if ENABLE_BLUETOOTH
    if (btAudio.isConnected()) {
        // Phone pushes metadata via AVRCP — no WiFi polling needed.
        // Advance elapsed time locally (Spotify doesn't send AVRCP position events).
        btAudio.tickPosition();
        if (btAudio.hasNewTrack()) {
            btAudio.clearNewTrack();
        }
        gui.setTrackInfo(btAudio.getTrackInfo());
    } else
#endif
    if (appState == STATE_RUNNING && wifiMgr.isConnected()) {
        spotify.loop();
        if (spotify.hasNewTrack()) {
            spotify.clearNewTrack();
        }
        gui.setTrackInfo(spotify.getLastTrack());
    }

    // --- FFT processing ---
    if (audioPipe.fftBufferReady()) {
        audioPipe.getFftBuffer(fftBuffer, FFT_SAMPLES);
        audioPipe.clearFftReady();
        fftAnalyzer.process(fftBuffer, FFT_SAMPLES);
    }
    fftAnalyzer.updatePeaks();

    SpectrumData specData;
    fftAnalyzer.getSpectrumData(specData);
    gui.setSpectrumData(specData);

    // --- Update device status ---
    static unsigned long lastStatusUpdate = 0;
    if (now - lastStatusUpdate > 1000) {
        lastStatusUpdate = now;
        DeviceStatus status;
        status.wifiConnected = wifiMgr.isConnected();
        status.ipAddress     = wifiMgr.getIP();
#if ENABLE_BLUETOOTH
        status.btConnected   = btAudio.isConnected();
        status.btPeerName    = btAudio.getPeerName();
#else
        status.btConnected   = false;
        status.btPeerName    = "";
#endif
        status.freeHeap      = ESP.getFreeHeap();
        gui.setDeviceStatus(status);
    }

    // --- Button handling ---
    ButtonEvent evt = buttons.poll();
    if (evt != BTN_NONE) {
        gui.handleButton(evt);
    }

    // --- Render OLED ---
    gui.render();
}
