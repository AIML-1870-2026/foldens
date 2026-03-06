#pragma once
#include <Adafruit_SH110X.h>
#include "config.h"
#include "button_handler.h"

// Forward declarations for shared state
struct TrackInfo {
    String title;
    String artist;
    String album;
    int    progressMs;
    int    durationMs;
    bool   isPlaying;
};

struct DeviceStatus {
    bool  wifiConnected;
    bool  btConnected;
    String ipAddress;
    String btPeerName;
    int   freeHeap;
};

struct EQState {
    int   gains[EQ_BANDS];      // In dB (-12 to +12)
    int   selectedBand;
    bool  enabled;
    static const char* bandNames[EQ_BANDS];
};

struct SpectrumData {
    float bands[FFT_BANDS];     // Magnitude per bar (0.0 - 1.0)
    float peaks[FFT_BANDS];     // Peak hold values
};

class GUIManager {
public:
    bool begin();
    void handleButton(ButtonEvent evt);
    void render();

    // Data setters (called from main loop)
    void setTrackInfo(const TrackInfo& info);
    void setDeviceStatus(const DeviceStatus& status);
    void setSpectrumData(const SpectrumData& data);
    void setEQState(const EQState& state);
    void setScreen(ScreenID screen);

    ScreenID currentScreen() const { return _currentScreen; }

    // Callbacks for actions triggered by buttons
    typedef void (*ActionCallback)();
    typedef void (*VolumeCallback)(int delta);
    typedef void (*EQCallback)(int band, int gainDb);

    ActionCallback onPlayPause  = nullptr;
    ActionCallback onNext       = nullptr;
    ActionCallback onPrev       = nullptr;
    VolumeCallback onVolume     = nullptr;
    EQCallback     onEQChange   = nullptr;

private:
    Adafruit_SH1107  _display{SCREEN_HEIGHT, SCREEN_WIDTH, &Wire}; // SH1107: h,w order
    ScreenID         _currentScreen = SCREEN_BOOT;
    unsigned long    _lastRenderMs  = 0;

    TrackInfo     _track;
    DeviceStatus  _status;
    SpectrumData  _spectrum;
    EQState       _eq;

    int  _settingsScroll = 0;
    int  _spectrumStyle  = 0;   // 0=bars, 1=dots, 2=mirrored

    void drawStatusBar();
    void drawBootScreen();
    void drawAuthScreen();
    void drawNowPlaying();
    void drawSpectrum();
    void drawEQ();
    void drawSettings();
    void drawProgressBar(int y, int progressMs, int durationMs);
    String formatTime(int ms);
    void cycleScreen();
};
