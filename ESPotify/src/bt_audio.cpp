#include "bt_audio.h"
#include <BluetoothA2DPSink.h>

static BluetoothA2DPSink a2dpSink;

BTAudio* BTAudio::_instance = nullptr;

void BTAudio::begin(const char* deviceName) {
    _instance = this;

    // Configure I2S output pins
    i2s_pin_config_t pinConfig = {
        .bck_io_num   = I2S_BCLK_PIN,
        .ws_io_num    = I2S_LRC_PIN,
        .data_out_num = I2S_DOUT_PIN,
        .data_in_num  = I2S_PIN_NO_CHANGE
    };
    a2dpSink.set_pin_config(pinConfig);

    // Set raw data callback for FFT/EQ processing
    a2dpSink.set_stream_reader(audioDataCallback, false);

    // Connection state callback
    a2dpSink.set_on_connection_state_changed(connectionStateCallback);

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
