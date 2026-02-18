#include "fft_analyzer.h"
#include <arduinoFFT.h>
#include <math.h>

const float FFTAnalyzer::PEAK_DECAY   = 0.03f;
const int   FFTAnalyzer::PEAK_HOLD_MS = 500;

// FFT buffers (static to keep off stack)
static double vReal[FFT_SAMPLES];
static double vImag[FFT_SAMPLES];
static ArduinoFFT<double> fft(vReal, vImag, FFT_SAMPLES, SAMPLE_RATE);

void FFTAnalyzer::begin() {
    memset(_magnitudes, 0, sizeof(_magnitudes));
    memset(_smoothed, 0, sizeof(_smoothed));
    memset(_peaks, 0, sizeof(_peaks));
    memset(_peakTimers, 0, sizeof(_peakTimers));

    buildBandMap();
    Serial.println(F("[FFT] Analyzer initialized"));
}

void FFTAnalyzer::buildBandMap() {
    // Logarithmic frequency band mapping
    // Maps FFT bins to display bands using exponential spacing
    // Frequency per bin = SAMPLE_RATE / FFT_SAMPLES = ~86 Hz

    float minFreq = 80.0f;     // Start at 80 Hz
    float maxFreq = 16000.0f;  // End at 16 kHz
    float logMin  = log10f(minFreq);
    float logMax  = log10f(maxFreq);
    float logStep = (logMax - logMin) / FFT_BANDS;
    float binWidth = (float)SAMPLE_RATE / FFT_SAMPLES;

    for (int i = 0; i < FFT_BANDS; i++) {
        float freqLow  = powf(10.0f, logMin + logStep * i);
        float freqHigh = powf(10.0f, logMin + logStep * (i + 1));

        _bandMap[i].startBin = max(1, (int)(freqLow / binWidth));
        _bandMap[i].endBin   = min(FFT_SAMPLES / 2 - 1, (int)(freqHigh / binWidth));

        // Ensure at least one bin per band
        if (_bandMap[i].endBin < _bandMap[i].startBin) {
            _bandMap[i].endBin = _bandMap[i].startBin;
        }
    }
}

void FFTAnalyzer::process(float* monoSamples, int count) {
    // Copy samples and apply Hamming window
    int n = min(count, FFT_SAMPLES);
    for (int i = 0; i < n; i++) {
        vReal[i] = (double)monoSamples[i];
        vImag[i] = 0.0;
    }
    // Zero-pad if needed
    for (int i = n; i < FFT_SAMPLES; i++) {
        vReal[i] = 0.0;
        vImag[i] = 0.0;
    }

    // Windowing
    fft.windowing(FFTWindow::Hamming, FFTDirection::Forward);

    // Compute FFT
    fft.compute(FFTDirection::Forward);

    // Compute magnitudes
    fft.complexToMagnitude();

    // Map bins to bands
    for (int i = 0; i < FFT_BANDS; i++) {
        float sum = 0;
        int   count = 0;
        for (int b = _bandMap[i].startBin; b <= _bandMap[i].endBin; b++) {
            sum += (float)vReal[b];
            count++;
        }

        // Average magnitude for this band
        float avg = (count > 0) ? sum / count : 0;

        // Convert to normalized 0-1 range using log scale
        // Tuned for typical music levels from A2DP
        float normalized = 0;
        if (avg > 1.0f) {
            normalized = (log10f(avg) - 0.5f) / 3.0f;  // Adjust range
        }
        if (normalized < 0) normalized = 0;
        if (normalized > 1.0f) normalized = 1.0f;

        _magnitudes[i] = normalized;

        // Exponential smoothing
        _smoothed[i] = _smoothed[i] * (1.0f - FFT_SMOOTHING) + normalized * FFT_SMOOTHING;
    }
}

void FFTAnalyzer::updatePeaks() {
    unsigned long now = millis();

    for (int i = 0; i < FFT_BANDS; i++) {
        if (_smoothed[i] > _peaks[i]) {
            _peaks[i] = _smoothed[i];
            _peakTimers[i] = now;
        } else if (now - _peakTimers[i] > (unsigned long)PEAK_HOLD_MS) {
            _peaks[i] -= PEAK_DECAY;
            if (_peaks[i] < 0) _peaks[i] = 0;
        }
    }
}

void FFTAnalyzer::getSpectrumData(SpectrumData& out) {
    for (int i = 0; i < FFT_BANDS; i++) {
        out.bands[i] = _smoothed[i];
        out.peaks[i] = _peaks[i];
    }
}
