# ESPotify
## A Pocket Spotify Controller & Audio Visualizer

> An ESP32-powered device that receives Bluetooth audio from your phone, displays real-time Spotify track info on an OLED, shows a live spectrum visualizer, and gives you hands-on playback and EQ control.

---

## Table of Contents
1. [Overview](#overview)
2. [Hardware](#hardware)
3. [Architecture](#architecture)
4. [Features](#features)
5. [OLED GUI](#oled-gui)
6. [5-Band EQ](#5-band-eq)
7. [Setup Guide](#setup-guide)
8. [File Structure](#file-structure)
9. [Limitations](#limitations)
10. [Success Criteria](#success-criteria)

---

## Overview

ESPotify turns an Adafruit HUZZAH32 into a Spotify companion device. It connects to your Spotify account via the Web API to display what's playing and control playback, while simultaneously receiving Bluetooth audio from your phone and outputting it through a wired DAC with real-time EQ and spectrum visualization.

### What It Does
- Displays track title, artist, album, and progress on a 128x64 OLED
- Controls playback (play/pause, skip, previous, volume) via physical buttons
- Receives Bluetooth audio from your phone (A2DP Sink)
- Outputs audio through a PCM5102A I2S DAC to wired headphones
- Shows a 14-band real-time spectrum visualizer
- Provides a 5-band parametric EQ with presets

### What It Doesn't Do
- Act as a native Spotify Connect device (uses Web API + BT audio instead)
- True AI-based stem separation (vocals/drums/bass isolation)
- Lossless audio (Bluetooth SBC codec, ~328kbps)

---

## Hardware

| Component | Model | Purpose |
|-----------|-------|---------|
| MCU | Adafruit HUZZAH32 (ESP32 Feather) | WiFi + Bluetooth + processing |
| Display | FeatherWing OLED 128x64 (SSD1306) | GUI + 3 built-in buttons |
| Base | FeatherWing Tripler Mini Kit | Stacking + prototyping area |
| DAC | PCM5102A I2S DAC Breakout | Line-level audio output |
| Output | 3.5mm headphone jack | Wired headphones/speakers |

### Wiring

```
OLED FeatherWing (auto-connected via Tripler stacking):
  SDA = GPIO 23     SCL = GPIO 22
  Btn A = GPIO 15   Btn B = GPIO 32   Btn C = GPIO 14

PCM5102A DAC (wired on Tripler prototyping area):
  BCK  = GPIO 26    LCK  = GPIO 25    DIN  = GPIO 33
  VIN  = 3V rail    GND  = GND rail
  FMT  = GND (I2S)  XSMT = 3V3 (unmute)
```

---

## Architecture

```
Phone (Spotify + Bluetooth)
  |
  |-- WiFi --> ESP32 --> Spotify Web API (track info, playback control)
  |
  |-- Bluetooth A2DP --> ESP32 Audio Pipeline --> I2S --> PCM5102A --> Headphones
                              |
                              |-- FFT --> OLED Spectrum Visualizer
                              |-- Biquad EQ --> Modified audio output
```

### Key Design Decisions

1. **WiFi + Bluetooth coexistence**: The ESP32 shares one radio for both. We configure "prefer Bluetooth" mode so audio stays smooth, with brief WiFi bursts for API calls every 5 seconds.

2. **Spotify Web API over Spotify Connect**: The cspot library (true Spotify Connect) consumes too much memory for FFT + EQ + OLED features. The Web API approach uses minimal memory and is more reliable.

3. **FFT-based EQ, not stem separation**: True audio source separation requires neural networks with gigabytes of RAM. Our 5-band parametric EQ uses biquad IIR filters that run in microseconds per sample.

---

## Features

### Playback Display
- Track title with horizontal scrolling for long names
- Artist name (up to 3 artists listed)
- Album name (truncated if too long)
- Progress bar with elapsed time
- Play/pause state icon

### Playback Control
- Play/Pause (Button A)
- Next Track (Button B short press)
- Previous Track (Button B long press)
- Volume +/- (external buttons or through settings)

### Spectrum Visualizer
- 14-band real-time FFT analysis (80Hz - 16kHz)
- Logarithmic frequency binning (matches human hearing)
- 3 visualization styles: solid bars, peak dots, mirrored
- Peak hold indicators with decay
- Compact now-playing info below spectrum

### 5-Band Equalizer
- Bass (100Hz), Lo-Mid (400Hz), Mid (1.6kHz), Hi-Mid (4.5kHz), Treble (10kHz)
- +/-12dB gain range in 3dB steps
- Low shelf on bass, high shelf on treble, peaking on mids
- Real-time audio modification through biquad IIR filters
- Settings persist across reboots (saved to NVS flash)

---

## OLED GUI

### Screen Flow

```
Boot --> [WiFi Connect] --> Auth Portal --> Now Playing <-> Spectrum <-> EQ <-> Settings
                              (first boot only)           ^______________________________^
                                                              (cycle with Button C)
```

### Button Mapping

| Screen | [A] Short | [A] Long | [B] Short | [B] Long | [C] Short |
|--------|-----------|----------|-----------|----------|-----------|
| Now Playing | Play/Pause | - | Next | Previous | Next Screen |
| Spectrum | Toggle mode | - | Cycle style | - | Next Screen |
| EQ | Adjust gain | Reset band | Next band | - | Next Screen |
| Settings | Select | - | Scroll down | Scroll up | Next Screen |

---

## 5-Band EQ

### Frequency Bands

| Band | Center Freq | Type | Range | What You Hear |
|------|-------------|------|-------|---------------|
| Bass | 100 Hz | Low Shelf | Sub-bass, kick drums | Rumble and thump |
| Lo-Mid | 400 Hz | Peaking | Guitar body, male vocals | Warmth and fullness |
| Mid | 1.6 kHz | Peaking | Vocal presence, snare | Clarity and definition |
| Hi-Mid | 4.5 kHz | Peaking | Vocal sibilance, cymbals | Brightness and edge |
| Treble | 10 kHz | High Shelf | Air, shimmer, hi-hats | Sparkle and openness |

### Important Note
This is frequency-band equalization, not stem separation. Boosting "Bass" makes everything below ~200Hz louder -- bass guitar, kick drum, and low vocal harmonics alike. You cannot isolate just the bass guitar or just the vocals.

---

## Setup Guide

### Prerequisites
1. [PlatformIO](https://platformio.org/) installed (VS Code extension recommended)
2. [Silabs CP2104 USB driver](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)
3. A [Spotify Developer](https://developer.spotify.com/dashboard) application
4. Spotify Premium account

### Step 1: Create Spotify App
1. Go to https://developer.spotify.com/dashboard
2. Create a new application
3. Add redirect URI: `http://YOUR_ESP32_IP/callback`
4. Note your **Client ID** and **Client Secret**

### Step 2: Configure Credentials
```bash
cd ESPotify
cp src/secrets.h.example src/secrets.h
```
Edit `src/secrets.h` with your WiFi and Spotify credentials.

### Step 3: Wire Hardware
1. Stack HUZZAH32 and OLED FeatherWing on the Tripler
2. Wire PCM5102A DAC to GPIO 26 (BCK), 25 (LCK), 33 (DIN)
3. Connect 3.5mm jack to DAC output
4. (Optional) Wire external buttons to GPIO 27 and 21

### Step 4: Build & Flash
```bash
pio run -t upload
pio device monitor
```

### Step 5: Authenticate
1. OLED shows your ESP32's IP address
2. Open that IP in your phone/computer browser
3. Click "Login with Spotify"
4. Authorize the application
5. OLED switches to Now Playing screen

### Step 6: Pair Bluetooth
1. On your phone, go to Bluetooth settings
2. Pair with "ESPotify"
3. Play music through Spotify
4. Audio comes out through the DAC/headphones

---

## File Structure

```
ESPotify/
├── platformio.ini              # Build configuration
├── ESPotify-spec.md            # This document
├── .gitignore
├── src/
│   ├── main.cpp                # Entry point + module coordination
│   ├── config.h                # All pin definitions and constants
│   ├── secrets.h.example       # Credential template
│   ├── wifi_manager.h/.cpp     # WiFi + captive portal
│   ├── spotify_api.h/.cpp      # Spotify Web API client
│   ├── bt_audio.h/.cpp         # Bluetooth A2DP sink
│   ├── audio_pipeline.h/.cpp   # I2S output + biquad EQ
│   ├── fft_analyzer.h/.cpp     # FFT spectrum analysis
│   ├── gui_manager.h/.cpp      # OLED screen state machine
│   ├── button_handler.h/.cpp   # GPIO button input
│   ├── screens/                # (integrated into gui_manager)
│   └── utils/
│       ├── text_scroller.h/.cpp
│       └── icons.h
└── data/
    └── (reserved for SPIFFS)
```

---

## Limitations

- **WiFi + Bluetooth coexistence**: Brief audio micro-stutters (~50-100ms) may occur every 5 seconds during Spotify API polling. This is a hardware limitation of the ESP32's single-radio design.
- **SBC codec only**: Bluetooth audio quality is limited to SBC (~328kbps). No aptX or AAC support.
- **Not a true Spotify Connect device**: Your phone must be paired via Bluetooth for audio. The ESP32 does not appear as a "Spotify Connect" speaker in the Spotify app.
- **Memory constrained**: ~200KB heap shared between WiFi, Bluetooth, OLED, FFT, and EQ. Complex operations may cause instability.
- **Monochrome display**: 128x64 pixels, white-on-black only. No album art.

---

## Success Criteria

- [ ] OLED displays boot screen and connects to WiFi
- [ ] Captive portal serves Spotify OAuth login page
- [ ] After auth, Now Playing screen shows real track info
- [ ] Buttons control playback (play/pause, next, previous)
- [ ] Phone pairs to "ESPotify" via Bluetooth
- [ ] Audio plays through PCM5102A DAC to headphones
- [ ] Spectrum visualizer shows real-time bars matching the music
- [ ] EQ adjustments produce audible frequency changes
- [ ] Device survives 1+ hour continuous operation without crash
- [ ] Settings persist across reboots (refresh token, EQ gains)
