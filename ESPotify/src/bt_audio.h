#pragma once
#include <Arduino.h>
#include <BluetoothA2DPSink.h>
#include "config.h"
#include "gui_manager.h"  // For TrackInfo

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

    // AVRCP track metadata — updated automatically while connected
    TrackInfo getTrackInfo() const { return _trackInfo; }
    bool hasNewTrack() const { return _newTrack; }
    void clearNewTrack() { _newTrack = false; }
    void tickPosition();  // Call from main loop to advance elapsed time locally

    // Volume (0-127, from AVRCP)
    int getVolume() const { return _volume; }

private:
    static BTAudio* _instance;
    static void audioDataCallback(const uint8_t* data, uint32_t len);
    static void connectionStateCallback(esp_a2d_connection_state_t state, void* ptr);
    static void avrcMetadataCallback(uint8_t id, const uint8_t* text);
    static void avrcPlayStatusCallback(esp_avrc_playback_stat_t playback);
    static void avrcPlayPosCallback(uint32_t playPos);
    static void avrcTrackChangeCallback(uint8_t* id);

    AudioDataCallback _dataCb = nullptr;
    volatile bool     _connected = false;
    String            _peerName;
    int               _volume = 100;

    TrackInfo      _trackInfo;
    volatile bool  _newTrack = false;
    unsigned long  _lastPositionUpdateMs = 0;  // millis() at last position sync
};
