#pragma once
#include <Arduino.h>
#include "config.h"

// Callback type for receiving PCM audio data
// data: interleaved stereo int16_t samples (L, R, L, R, ...)
// sampleCount: number of stereo sample pairs
typedef void (*AudioDataCallback)(const int16_t* data, int sampleCount);

class BTAudio {
public:
    void begin(const char* deviceName);
    void setDataCallback(AudioDataCallback cb) { _dataCb = cb; }

    bool isConnected() const { return _connected; }
    String getPeerName() const { return _peerName; }

    // Volume (0-127, from AVRCP)
    int getVolume() const { return _volume; }

private:
    static BTAudio* _instance;
    static void audioDataCallback(const uint8_t* data, uint32_t len);
    static void connectionStateCallback(esp_a2d_connection_state_t state, void* ptr);

    AudioDataCallback _dataCb = nullptr;
    volatile bool     _connected = false;
    String            _peerName;
    int               _volume = 100;
};
