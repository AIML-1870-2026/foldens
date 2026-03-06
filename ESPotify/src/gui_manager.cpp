#include "gui_manager.h"
#include "utils/icons.h"
#include "utils/text_scroller.h"

const char* EQState::bandNames[EQ_BANDS] = {
    "Bass", "Lo-Mid", "Mid", "Hi-Mid", "Treble"
};

static TextScroller titleScroller;
static TextScroller artistScroller;

bool GUIManager::begin() {
    // SH1107: begin(i2c_addr, reset)
    if (!_display.begin(OLED_I2C_ADDR, true)) {
        Serial.println(F("[GUI] SH1107 init failed"));
        return false;
    }
    // Rotate 90 degrees: SH1107 is natively 64 wide x 128 tall;
    // rotation=1 gives us 128 wide x 64 tall (landscape)
    _display.setRotation(1);
    _display.clearDisplay();
    _display.setTextColor(SH110X_WHITE);
    _display.setTextSize(1);
    _display.display();

    // Init EQ defaults
    for (int i = 0; i < EQ_BANDS; i++) _eq.gains[i] = 0;
    _eq.selectedBand = 0;
    _eq.enabled = true;

    return true;
}

void GUIManager::setTrackInfo(const TrackInfo& info) {
    titleScroller.setText(info.title, MAX_DISPLAY_CHARS);
    artistScroller.setText(info.artist, MAX_DISPLAY_CHARS);
    _track = info;
}

void GUIManager::setDeviceStatus(const DeviceStatus& status) {
    _status = status;
}

void GUIManager::setSpectrumData(const SpectrumData& data) {
    _spectrum = data;
}

void GUIManager::setEQState(const EQState& state) {
    _eq = state;
}

void GUIManager::setScreen(ScreenID screen) {
    _currentScreen = screen;
}

void GUIManager::cycleScreen() {
    // Cycle through main screens: NOW_PLAYING -> SPECTRUM -> EQ -> SETTINGS -> NOW_PLAYING
    switch (_currentScreen) {
        case SCREEN_NOW_PLAYING: _currentScreen = SCREEN_SPECTRUM; break;
        case SCREEN_SPECTRUM:    _currentScreen = SCREEN_EQ;       break;
        case SCREEN_EQ:          _currentScreen = SCREEN_SETTINGS; break;
        case SCREEN_SETTINGS:    _currentScreen = SCREEN_NOW_PLAYING; break;
        default:                 _currentScreen = SCREEN_NOW_PLAYING; break;
    }
}

void GUIManager::handleButton(ButtonEvent evt) {
    if (evt == BTN_NONE) return;

    switch (_currentScreen) {
        case SCREEN_NOW_PLAYING:
            switch (evt) {
                case BTN_A_SHORT: if (onPlayPause) onPlayPause(); break;
                case BTN_B_SHORT: if (onNext) onNext(); break;
                case BTN_B_LONG:  if (onPrev) onPrev(); break;
                case BTN_C_SHORT: cycleScreen(); break;
                default: break;
            }
            break;

        case SCREEN_SPECTRUM:
            switch (evt) {
                case BTN_A_SHORT: /* reserved for mode toggle */ break;
                case BTN_B_SHORT: _spectrumStyle = (_spectrumStyle + 1) % 3; break;
                case BTN_C_SHORT: cycleScreen(); break;
                default: break;
            }
            break;

        case SCREEN_EQ:
            switch (evt) {
                case BTN_A_SHORT:
                    _eq.gains[_eq.selectedBand] += EQ_STEP_DB;
                    if (_eq.gains[_eq.selectedBand] > EQ_MAX_DB)
                        _eq.gains[_eq.selectedBand] = EQ_MIN_DB;  // Wrap around
                    if (onEQChange) onEQChange(_eq.selectedBand, _eq.gains[_eq.selectedBand]);
                    break;
                case BTN_A_LONG:
                    _eq.gains[_eq.selectedBand] = 0;  // Reset band
                    if (onEQChange) onEQChange(_eq.selectedBand, 0);
                    break;
                case BTN_B_SHORT:
                    _eq.selectedBand = (_eq.selectedBand + 1) % EQ_BANDS;
                    break;
                case BTN_C_SHORT: cycleScreen(); break;
                default: break;
            }
            break;

        case SCREEN_SETTINGS:
            switch (evt) {
                case BTN_A_SHORT: /* toggle selected setting */ break;
                case BTN_B_SHORT: _settingsScroll++; break;
                case BTN_B_LONG:  if (_settingsScroll > 0) _settingsScroll--; break;
                case BTN_C_SHORT: cycleScreen(); break;
                default: break;
            }
            break;

        default:
            break;
    }

    // External buttons work on any screen
    if (evt == BTN_PREV_SHORT && onVolume) onVolume(-5);
    if (evt == BTN_NEXT_SHORT && onVolume) onVolume(5);
}

void GUIManager::render() {
    unsigned long now = millis();
    if (now - _lastRenderMs < OLED_FRAME_MS) return;
    _lastRenderMs = now;

    _display.clearDisplay();

    switch (_currentScreen) {
        case SCREEN_BOOT:        drawBootScreen(); break;
        case SCREEN_AUTH:         drawAuthScreen(); break;
        case SCREEN_NOW_PLAYING: drawNowPlaying(); break;
        case SCREEN_SPECTRUM:    drawSpectrum(); break;
        case SCREEN_EQ:          drawEQ(); break;
        case SCREEN_SETTINGS:    drawSettings(); break;
        default: break;
    }

    _display.display();
}

// ---- Status Bar (8px tall, shown on main screens) ----

void GUIManager::drawStatusBar() {
    // Music note icon
    _display.drawBitmap(0, 0, icon_note, 8, 8, SH110X_WHITE);

    // Screen label
    _display.setCursor(10, 0);
    switch (_currentScreen) {
        case SCREEN_NOW_PLAYING: _display.print(F("Playing")); break;
        case SCREEN_SPECTRUM:    _display.print(F("Spectrum")); break;
        case SCREEN_EQ:          _display.print(F("EQ")); break;
        case SCREEN_SETTINGS:    _display.print(F("Settings")); break;
        default: break;
    }

    // Play state icon
    if (_track.isPlaying) {
        _display.drawBitmap(80, 0, icon_play, 8, 8, SH110X_WHITE);
    } else {
        _display.drawBitmap(80, 0, icon_pause, 8, 8, SH110X_WHITE);
    }

    // Bluetooth icon
    if (_status.btConnected) {
        _display.drawBitmap(104, 0, icon_bt, 8, 8, SH110X_WHITE);
    }

    // WiFi icon
    if (_status.wifiConnected) {
        _display.drawBitmap(120, 0, icon_wifi, 8, 8, SH110X_WHITE);
    }

    // Separator line
    _display.drawFastHLine(0, 9, SCREEN_WIDTH, SH110X_WHITE);
}

// ---- Boot Screen ----

void GUIManager::drawBootScreen() {
    _display.setTextSize(2);
    _display.setCursor(10, 8);
    _display.print(F("ESPotify"));

    _display.setTextSize(1);
    _display.setCursor(16, 32);
    if (_status.wifiConnected) {
        _display.print(F("WiFi Connected!"));
        _display.setCursor(16, 44);
        _display.print(_status.ipAddress);
    } else {
        _display.print(F("Connecting WiFi..."));

        // Animated dots
        int dots = (millis() / 500) % 4;
        _display.setCursor(16, 44);
        for (int i = 0; i < dots; i++) _display.print('.');
    }
}

// ---- Auth Screen ----

void GUIManager::drawAuthScreen() {
    _display.setTextSize(1);
    _display.setCursor(4, 4);
    _display.print(F("Spotify Login"));

    _display.setCursor(4, 18);
    _display.print(F("Open browser:"));

    _display.setTextSize(1);
    _display.setCursor(4, 32);
    _display.print(F("http://"));
    _display.setCursor(4, 42);
    _display.print(_status.ipAddress);

    _display.setCursor(4, 56);
    _display.print(F("Waiting for auth..."));
}

// ---- Now Playing ----

void GUIManager::drawNowPlaying() {
    drawStatusBar();

    if (_track.title.length() == 0) {
        _display.setCursor(16, 28);
        _display.print(F("No track playing"));
        return;
    }

    _display.setTextSize(1);
    _display.setTextWrap(false);  // Prevent long strings overflowing onto next line

    // Title (scrolling)
    _display.setCursor(-titleScroller.getOffset(), 11);
    _display.print(_track.title);

    // Artist (scrolling)
    _display.setCursor(-artistScroller.getOffset(), 21);
    _display.print(_track.artist);

    // Album (static, clipped at display edge)
    _display.setCursor(0, 31);
    _display.print(_track.album);

    _display.setTextWrap(true);

    // Full-width progress bar + elapsed/total times below
    drawProgressBar(41, _track.progressMs, _track.durationMs);

    // Button hints
    _display.setCursor(0, 56);
    _display.print(F("[Play] [Skip]   [>>]"));
}

// ---- Spectrum Visualizer ----

void GUIManager::drawSpectrum() {
    drawStatusBar();

    int barWidth  = 7;
    int gap       = 2;
    int startX    = 2;
    int maxHeight = 30;
    int baseY     = 44;

    for (int i = 0; i < FFT_BANDS; i++) {
        int x = startX + i * (barWidth + gap);
        float mag = _spectrum.bands[i];
        if (mag > 1.0f) mag = 1.0f;
        int h = (int)(mag * maxHeight);

        if (_spectrumStyle == 0) {
            // Solid bars
            if (h > 0) {
                _display.fillRect(x, baseY - h, barWidth, h, SH110X_WHITE);
            }
        } else if (_spectrumStyle == 1) {
            // Dots only (peak dot)
            if (h > 0) {
                _display.fillRect(x, baseY - h, barWidth, 2, SH110X_WHITE);
            }
        } else {
            // Mirrored bars
            int halfH = h / 2;
            int midY = baseY - maxHeight / 2;
            if (halfH > 0) {
                _display.fillRect(x, midY - halfH, barWidth, halfH * 2, SH110X_WHITE);
            }
        }

        // Peak hold indicator
        float peak = _spectrum.peaks[i];
        if (peak > 1.0f) peak = 1.0f;
        int peakY = baseY - (int)(peak * maxHeight);
        if (peak > 0.02f) {
            _display.drawFastHLine(x, peakY, barWidth, SH110X_WHITE);
        }
    }

    // Compact now-playing at bottom
    _display.setCursor(0, 48);
    String compactTitle = _track.title;
    if (compactTitle.length() > 16) compactTitle = compactTitle.substring(0, 15) + ".";
    _display.print(compactTitle);

    // Time on right
    if (_track.durationMs > 0) {
        String timeStr = formatTime(_track.progressMs);
        _display.setCursor(104, 48);
        _display.print(timeStr);
    }

    // Button hints
    _display.setCursor(0, 56);
    _display.print(F("[Mode] [Style]  [>>]"));
}

// ---- EQ Screen ----

void GUIManager::drawEQ() {
    drawStatusBar();

    _display.setCursor(0, 12);
    _display.print(F("Frequency Bands"));

    for (int i = 0; i < EQ_BANDS; i++) {
        int y = 22 + i * 8;
        bool selected = (i == _eq.selectedBand);

        // Selection indicator
        if (selected) {
            _display.setCursor(0, y);
            _display.print(F(">"));
        }

        // Band name
        _display.setCursor(8, y);
        _display.print(EQState::bandNames[i]);

        // Gain bar
        int barX  = 50;
        int barW  = 50;
        int barH  = 5;
        int midX  = barX + barW / 2;

        _display.drawRect(barX, y, barW, barH, SH110X_WHITE);

        // Fill from center based on gain
        int fillW = (int)((float)_eq.gains[i] / EQ_MAX_DB * (barW / 2));
        if (fillW > 0) {
            _display.fillRect(midX, y + 1, fillW, barH - 2, SH110X_WHITE);
        } else if (fillW < 0) {
            _display.fillRect(midX + fillW, y + 1, -fillW, barH - 2, SH110X_WHITE);
        }

        // Center line
        _display.drawFastVLine(midX, y, barH, SH110X_WHITE);

        // dB value
        _display.setCursor(104, y);
        if (_eq.gains[i] >= 0) _display.print('+');
        _display.print(_eq.gains[i]);
    }

    // Button hints
    _display.setCursor(0, 56);
    _display.print(F("[Adj] [Band]    [>>]"));
}

// ---- Settings Screen ----

void GUIManager::drawSettings() {
    _display.drawBitmap(0, 0, icon_gear, 8, 8, SH110X_WHITE);
    _display.setCursor(10, 0);
    _display.print(F("Settings"));
    _display.drawFastHLine(0, 9, SCREEN_WIDTH, SH110X_WHITE);

    const char* labels[] = {
        "WiFi:", "Bluetooth:", "EQ:", "FFT Size:", "Heap:"
    };
    String values[] = {
        _status.wifiConnected ? "Connected" : "Disconnected",
        _status.btConnected ? _status.btPeerName : "Not paired",
        _eq.enabled ? "ON" : "OFF",
        String(FFT_SAMPLES),
        String(_status.freeHeap / 1024) + "KB"
    };

    int numItems = 5;
    int startItem = _settingsScroll;
    if (startItem > numItems - 4) startItem = numItems - 4;
    if (startItem < 0) startItem = 0;

    for (int i = 0; i < 4 && (startItem + i) < numItems; i++) {
        int idx = startItem + i;
        int y = 12 + i * 10;
        _display.setCursor(4, y);
        _display.print(labels[idx]);
        _display.setCursor(60, y);
        _display.print(values[idx]);
    }

    _display.setCursor(0, 56);
    _display.print(F("[Sel] [Scroll]  [>>]"));
}

// ---- Helpers ----

void GUIManager::drawProgressBar(int y, int progressMs, int durationMs) {
    int barW = SCREEN_WIDTH;
    int barH = 3;

    // Track bar (always draw so the user sees something)
    _display.drawRect(0, y, barW, barH, SH110X_WHITE);

    if (durationMs > 0) {
        int fillW = (int)((float)progressMs / durationMs * (barW - 2));
        if (fillW < 0) fillW = 0;
        if (fillW > barW - 2) fillW = barW - 2;
        if (fillW > 0) {
            _display.fillRect(1, y + 1, fillW, barH - 2, SH110X_WHITE);
        }
        // Knob at fill endpoint
        _display.fillCircle(max(2, 1 + fillW), y + 1, 2, SH110X_WHITE);
    }

    // Elapsed time — left-aligned below bar
    _display.setCursor(0, y + 5);
    _display.print(formatTime(progressMs));

    // Total duration — right-aligned below bar
    if (durationMs > 0) {
        String totalStr = formatTime(durationMs);
        _display.setCursor(SCREEN_WIDTH - (int)(totalStr.length() * 6), y + 5);
        _display.print(totalStr);
    }
}

String GUIManager::formatTime(int ms) {
    int totalSec = ms / 1000;
    int minutes  = totalSec / 60;
    int seconds  = totalSec % 60;
    char buf[8];
    snprintf(buf, sizeof(buf), "%d:%02d", minutes, seconds);
    return String(buf);
}
