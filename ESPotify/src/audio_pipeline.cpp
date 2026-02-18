#include "audio_pipeline.h"
#include <math.h>

// EQ band center frequencies (Hz)
static const float bandFreqs[EQ_BANDS] = {
    100.0f,    // Bass
    400.0f,    // Lo-Mid
    1600.0f,   // Mid
    4500.0f,   // Hi-Mid
    10000.0f   // Treble
};

// Q factors for each band
static const float bandQ[EQ_BANDS] = {
    0.8f, 1.0f, 1.0f, 1.0f, 0.8f
};

void AudioPipeline::begin() {
    // Initialize all bands to flat (0 dB)
    for (int i = 0; i < EQ_BANDS; i++) {
        _bands[i].gainDb = 0.0f;
        _bands[i].stateL = {0, 0};
        _bands[i].stateR = {0, 0};
        recalcBand(i);
    }

    memset(_fftRing, 0, sizeof(_fftRing));
    _fftWritePos = 0;
    _fftReady = false;
    _fftSampleCount = 0;

    Serial.println(F("[Audio] Pipeline initialized"));
}

void AudioPipeline::setEQGain(int band, float gainDb) {
    if (band < 0 || band >= EQ_BANDS) return;
    if (gainDb < EQ_MIN_DB) gainDb = EQ_MIN_DB;
    if (gainDb > EQ_MAX_DB) gainDb = EQ_MAX_DB;

    _bands[band].gainDb = gainDb;
    recalcBand(band);
}

void AudioPipeline::processSamples(const int16_t* data, int sampleCount) {
    // data is interleaved stereo: L0, R0, L1, R1, ...
    // sampleCount = number of stereo pairs

    for (int i = 0; i < sampleCount; i++) {
        float left  = (float)data[i * 2]     / 32768.0f;
        float right = (float)data[i * 2 + 1] / 32768.0f;

        // Apply EQ filter chain
        if (_eqEnabled) {
            for (int b = 0; b < EQ_BANDS; b++) {
                if (_bands[b].gainDb != 0.0f) {
                    left  = applyBiquad(_bands[b].stateL, _bands[b].coeffs, left);
                    right = applyBiquad(_bands[b].stateR, _bands[b].coeffs, right);
                }
            }
        }

        // Soft clipping
        if (left > 1.0f) left = 1.0f;
        if (left < -1.0f) left = -1.0f;
        if (right > 1.0f) right = 1.0f;
        if (right < -1.0f) right = -1.0f;

        // Write back to the sample buffer (modify in-place for I2S output)
        // Note: The A2DP library handles I2S write internally.
        // We cast away const to modify the buffer before it reaches I2S.
        int16_t* mutableData = (int16_t*)data;
        mutableData[i * 2]     = (int16_t)(left  * 32767.0f);
        mutableData[i * 2 + 1] = (int16_t)(right * 32767.0f);

        // Feed mono mix to FFT ring buffer
        float mono = (left + right) * 0.5f;
        _fftRing[_fftWritePos] = mono;
        _fftWritePos = (_fftWritePos + 1) % FFT_RING_SIZE;

        _fftSampleCount++;
        if (_fftSampleCount >= FFT_SAMPLES) {
            _fftReady = true;
            _fftSampleCount = 0;
        }
    }
}

void AudioPipeline::getFftBuffer(float* outMono, int count) {
    // Copy the last 'count' samples from ring buffer
    int readPos = (_fftWritePos - count + FFT_RING_SIZE) % FFT_RING_SIZE;
    for (int i = 0; i < count; i++) {
        outMono[i] = _fftRing[(readPos + i) % FFT_RING_SIZE];
    }
}

// ---- Biquad Filter Math ----

float AudioPipeline::applyBiquad(BiquadState& state, const BiquadCoeffs& c, float input) {
    // Direct Form II Transposed
    float output = c.b0 * input + state.z1;
    state.z1 = c.b1 * input - c.a1 * output + state.z2;
    state.z2 = c.b2 * input - c.a2 * output;
    return output;
}

void AudioPipeline::recalcBand(int band) {
    float freq   = bandFreqs[band];
    float gainDb = _bands[band].gainDb;
    float Q      = bandQ[band];

    if (band == 0) {
        computeLowShelf(_bands[band].coeffs, freq, gainDb, Q);
    } else if (band == EQ_BANDS - 1) {
        computeHighShelf(_bands[band].coeffs, freq, gainDb, Q);
    } else {
        computePeakingEQ(_bands[band].coeffs, freq, gainDb, Q);
    }

    // Reset filter state to avoid pops
    _bands[band].stateL = {0, 0};
    _bands[band].stateR = {0, 0};
}

void AudioPipeline::computePeakingEQ(BiquadCoeffs& c, float freq, float gainDb, float Q) {
    float A  = powf(10.0f, gainDb / 40.0f);
    float w0 = 2.0f * M_PI * freq / SAMPLE_RATE;
    float alpha = sinf(w0) / (2.0f * Q);

    float a0 = 1.0f + alpha / A;

    c.b0 = (1.0f + alpha * A) / a0;
    c.b1 = (-2.0f * cosf(w0)) / a0;
    c.b2 = (1.0f - alpha * A) / a0;
    c.a1 = (-2.0f * cosf(w0)) / a0;
    c.a2 = (1.0f - alpha / A) / a0;
}

void AudioPipeline::computeLowShelf(BiquadCoeffs& c, float freq, float gainDb, float Q) {
    float A  = powf(10.0f, gainDb / 40.0f);
    float w0 = 2.0f * M_PI * freq / SAMPLE_RATE;
    float alpha = sinf(w0) / (2.0f * Q);
    float sqA = sqrtf(A);

    float a0 = (A + 1.0f) + (A - 1.0f) * cosf(w0) + 2.0f * sqA * alpha;

    c.b0 = (A * ((A + 1.0f) - (A - 1.0f) * cosf(w0) + 2.0f * sqA * alpha)) / a0;
    c.b1 = (2.0f * A * ((A - 1.0f) - (A + 1.0f) * cosf(w0))) / a0;
    c.b2 = (A * ((A + 1.0f) - (A - 1.0f) * cosf(w0) - 2.0f * sqA * alpha)) / a0;
    c.a1 = (-2.0f * ((A - 1.0f) + (A + 1.0f) * cosf(w0))) / a0;
    c.a2 = ((A + 1.0f) + (A - 1.0f) * cosf(w0) - 2.0f * sqA * alpha) / a0;
}

void AudioPipeline::computeHighShelf(BiquadCoeffs& c, float freq, float gainDb, float Q) {
    float A  = powf(10.0f, gainDb / 40.0f);
    float w0 = 2.0f * M_PI * freq / SAMPLE_RATE;
    float alpha = sinf(w0) / (2.0f * Q);
    float sqA = sqrtf(A);

    float a0 = (A + 1.0f) - (A - 1.0f) * cosf(w0) + 2.0f * sqA * alpha;

    c.b0 = (A * ((A + 1.0f) + (A - 1.0f) * cosf(w0) + 2.0f * sqA * alpha)) / a0;
    c.b1 = (-2.0f * A * ((A - 1.0f) + (A + 1.0f) * cosf(w0))) / a0;
    c.b2 = (A * ((A + 1.0f) + (A - 1.0f) * cosf(w0) - 2.0f * sqA * alpha)) / a0;
    c.a1 = (2.0f * ((A - 1.0f) - (A + 1.0f) * cosf(w0))) / a0;
    c.a2 = ((A + 1.0f) - (A - 1.0f) * cosf(w0) - 2.0f * sqA * alpha) / a0;
}
