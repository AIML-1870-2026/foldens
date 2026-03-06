#pragma once
#include <Arduino.h>
#include "config.h"

// Ring buffer for FFT analysis
#define FFT_RING_SIZE (FFT_SAMPLES * 2)  // Double buffer

class AudioPipeline {
public:
    void begin();

    // Process incoming stereo PCM samples (called from A2DP callback)
    void processSamples(const int16_t* data, int sampleCount);

    // EQ control
    void setEQGain(int band, float gainDb);  // band 0-4, gain -12 to +12
    void setEQEnabled(bool enabled) { _eqEnabled = enabled; }
    bool isEQEnabled() const { return _eqEnabled; }

    // FFT buffer access
    bool   fftBufferReady() const { return _fftReady; }
    void   getFftBuffer(float* outMono, int count);
    void   clearFftReady() { _fftReady = false; }

private:
    // Biquad filter state (Direct Form II Transposed)
    struct BiquadCoeffs {
        float b0, b1, b2, a1, a2;
    };

    struct BiquadState {
        float z1 = 0, z2 = 0;  // State variables
        void reset() { z1 = 0; z2 = 0; }
    };

    struct EQBand {
        BiquadCoeffs coeffs;
        BiquadState  stateL;   // Left channel state
        BiquadState  stateR;   // Right channel state
        float        gainDb;
    };

    EQBand _bands[EQ_BANDS];
    bool   _eqEnabled = true;

    // FFT ring buffer (mono, downmixed)
    float  _fftRing[FFT_RING_SIZE];
    int    _fftWritePos = 0;
    volatile bool _fftReady = false;
    int    _fftSampleCount = 0;

    // Helper
    float applyBiquad(BiquadState& state, const BiquadCoeffs& c, float input);
    void computePeakingEQ(BiquadCoeffs& c, float freq, float gainDb, float Q);
    void computeLowShelf(BiquadCoeffs& c, float freq, float gainDb, float Q);
    void computeHighShelf(BiquadCoeffs& c, float freq, float gainDb, float Q);
    void recalcBand(int band);
};
