#include "bt_audio.h"
#include <BluetoothA2DPSink.h>

static BluetoothA2DPSink a2dpSink;

BTAudio* BTAudio::_instance = nullptr;

void BTAudio::begin(const char* deviceName) {
    _instance = this;

    // Use ESP32 internal DAC (no external DAC board needed)
    // GPIO25 = right channel, GPIO26 = left channel
    // Note: 8-bit output quality — good enough to verify BT audio works.
    // Swap to external pin config when PCM5102A DAC is wired.
    i2s_config_t i2sCfg = {
        .mode                 = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX | I2S_MODE_DAC_BUILT_IN),
        .sample_rate          = 44100,
        .bits_per_sample      = (i2s_bits_per_sample_t)16,
        .channel_format       = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_MSB,
        .intr_alloc_flags     = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count        = 8,
        .dma_buf_len          = 64,
        .use_apll             = false,
        .tx_desc_auto_clear   = true,
        .fixed_mclk           = 0,
        .mclk_multiple        = I2S_MCLK_MULTIPLE_DEFAULT,
        .bits_per_chan         = I2S_BITS_PER_CHAN_DEFAULT
    };
    a2dpSink.set_i2s_config(i2sCfg);

    // Set raw data callback for FFT/EQ processing
    a2dpSink.set_stream_reader(audioDataCallback, false);

    // Connection state callback
    a2dpSink.set_on_connection_state_changed(connectionStateCallback);

    // AVRCP: request title, artist, album, and duration from the phone
    a2dpSink.set_avrc_metadata_attribute_mask(
        ESP_AVRC_MD_ATTR_TITLE |
        ESP_AVRC_MD_ATTR_ARTIST |
        ESP_AVRC_MD_ATTR_ALBUM |
        ESP_AVRC_MD_ATTR_PLAYING_TIME);
    a2dpSink.set_avrc_metadata_callback(avrcMetadataCallback);
    a2dpSink.set_avrc_rn_playstatus_callback(avrcPlayStatusCallback);
    a2dpSink.set_avrc_rn_play_pos_callback(avrcPlayPosCallback, 1);  // Update every 1s
    a2dpSink.set_avrc_rn_track_change_callback(avrcTrackChangeCallback);

    // Start A2DP sink with device name
    a2dpSink.start(deviceName);

    Serial.printf("[BT] A2DP sink started as '%s'\n", deviceName);
}

void BTAudio::audioDataCallback(const uint8_t* data, uint32_t len) {
    if (!_instance || !_instance->_dataCb) return;

    const int16_t* samples = (const int16_t*)data;
    int sampleCount = len / (2 * sizeof(int16_t));  // Stereo pairs

    _instance->_dataCb(samples, sampleCount);
}

// Strip non-ASCII bytes so Adafruit GFX doesn't render UTF-8 sequences as garbage
static String sanitize(const uint8_t* text) {
    String out;
    for (const uint8_t* p = text; *p; p++) {
        if (*p >= 0x20 && *p < 0x7F) out += (char)*p;
    }
    return out;
}

void BTAudio::avrcMetadataCallback(uint8_t id, const uint8_t* text) {
    if (!_instance) return;
    String value = sanitize(text);
    switch (id) {
        case ESP_AVRC_MD_ATTR_TITLE:
            if (value != _instance->_trackInfo.title) {
                _instance->_trackInfo.title = value;
                _instance->_trackInfo.progressMs = 0;
                _instance->_lastPositionUpdateMs = millis();
                _instance->_newTrack = true;
            }
            break;
        case ESP_AVRC_MD_ATTR_ARTIST:
            _instance->_trackInfo.artist = value;
            break;
        case ESP_AVRC_MD_ATTR_ALBUM:
            _instance->_trackInfo.album = value;
            break;
        case ESP_AVRC_MD_ATTR_PLAYING_TIME:
            _instance->_trackInfo.durationMs = value.toInt();
            break;
    }
    Serial.printf("[BT] AVRC meta %d: %s\n", id, value.c_str());
}

void BTAudio::avrcPlayStatusCallback(esp_avrc_playback_stat_t playback) {
    if (!_instance) return;
    _instance->_trackInfo.isPlaying = (playback == ESP_AVRC_PLAYBACK_PLAYING);
    // Reset the local timer so tickPosition() has a fresh reference
    _instance->_lastPositionUpdateMs = _instance->_trackInfo.isPlaying ? millis() : 0;
}

void BTAudio::avrcPlayPosCallback(uint32_t playPos) {
    if (!_instance) return;
    // Sync to the authoritative position if the phone does send it
    _instance->_trackInfo.progressMs = (int)playPos;
    _instance->_lastPositionUpdateMs = _instance->_trackInfo.isPlaying ? millis() : 0;
}

void BTAudio::tickPosition() {
    if (!_trackInfo.isPlaying || _lastPositionUpdateMs == 0) {
        _lastPositionUpdateMs = _trackInfo.isPlaying ? millis() : 0;
        return;
    }
    unsigned long now = millis();
    int delta = (int)(now - _lastPositionUpdateMs);
    _trackInfo.progressMs += delta;
    if (_trackInfo.durationMs > 0 && _trackInfo.progressMs > _trackInfo.durationMs) {
        _trackInfo.progressMs = _trackInfo.durationMs;
    }
    _lastPositionUpdateMs = now;
}

void BTAudio::avrcTrackChangeCallback(uint8_t* /*id*/) {
    Serial.println(F("[BT] AVRC track changed"));
}

void BTAudio::connectionStateCallback(esp_a2d_connection_state_t state, void* ptr) {
    if (!_instance) return;

    switch (state) {
        case ESP_A2D_CONNECTION_STATE_CONNECTED:
            _instance->_connected = true;
            Serial.println(F("[BT] Device connected"));
            break;
        case ESP_A2D_CONNECTION_STATE_DISCONNECTED:
            _instance->_connected = false;
            _instance->_peerName = "";
            Serial.println(F("[BT] Device disconnected"));
            break;
        default:
            break;
    }
}
