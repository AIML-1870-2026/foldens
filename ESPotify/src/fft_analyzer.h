#pragma once
#include <Arduino.h>
#include "config.h"
#include "gui_manager.h"  // For SpectrumData

class FFTAnalyzer {
public:
    void begin();
    void process(float* monoSamples, int count);   // Run FFT on buffer
    void getSpectrumData(SpectrumData& out);        // Get visualization data
    void updatePeaks();                             // Call each frame for peak decay

private:
    float _magnitudes[FFT_BANDS];
    float _smoothed[FFT_BANDS];
    float _peaks[FFT_BANDS];
    unsigned long _peakTimers[FFT_BANDS];

    // Logarithmic bin-to-band mapping
    struct BandRange {
        int startBin;
        int endBin;
    };
    BandRange _bandMap[FFT_BANDS];

    void buildBandMap();

    static const float PEAK_DECAY;       // Peak fall rate per frame
    static const int   PEAK_HOLD_MS;     // Hold time before falling
};
