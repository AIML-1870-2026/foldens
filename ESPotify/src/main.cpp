#include <Arduino.h>
#include <Wire.h>

#include "config.h"
#include "secrets.h"
#include "wifi_manager.h"
#include "spotify_api.h"
#include "bt_audio.h"
#include "audio_pipeline.h"
#include "fft_analyzer.h"
#include "gui_manager.h"
#include "button_handler.h"

// ============================================================
// Module instances
// ============================================================
static WiFiManager    wifiMgr;
static SpotifyAPI     spotify;
static BTAudio        btAudio;
static AudioPipeline  audioPipe;
static FFTAnalyzer    fftAnalyzer;
static GUIManager     gui;
static ButtonHandler  buttons;

// ============================================================
// Audio callback (called from Bluetooth A2DP context)
// ============================================================
static void onAudioData(const int16_t* data, int sampleCount) {
    // Process through EQ filter bank (modifies data in-place)
    audioPipe.processSamples(data, sampleCount);
}

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

    // Init I2C for OLED
    Wire.begin();

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
        spotify.begin(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, redirectUri);

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

    // Start Bluetooth A2DP sink
    btAudio.setDataCallback(onAudioData);
    btAudio.begin(BT_DEVICE_NAME);
    Serial.println(F("[Main] Bluetooth A2DP started"));

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

    // --- Spotify API polling ---
    if (appState == STATE_RUNNING && wifiMgr.isConnected()) {
        spotify.loop();

        if (spotify.hasNewTrack()) {
            spotify.clearNewTrack();
            gui.setTrackInfo(spotify.getLastTrack());
        } else {
            // Update progress even when same track
            gui.setTrackInfo(spotify.getLastTrack());
        }
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
        status.btConnected   = btAudio.isConnected();
        status.ipAddress     = wifiMgr.getIP();
        status.btPeerName    = btAudio.getPeerName();
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
