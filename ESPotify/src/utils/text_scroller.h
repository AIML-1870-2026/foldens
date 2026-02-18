#pragma once
#include <Arduino.h>

class TextScroller {
public:
    void setText(const String& text, int maxChars);
    void reset();
    int getOffset();   // Call each frame; returns pixel X offset for drawString
    bool needsScroll() const { return _needsScroll; }

private:
    String _text;
    int    _textWidthPx  = 0;
    int    _maxWidthPx   = 0;
    bool   _needsScroll  = false;

    unsigned long _startMs    = 0;
    unsigned long _pauseEndMs = 0;
    bool          _pausing    = true;
    int           _offset     = 0;

    static const int CHAR_WIDTH  = 6;  // Default Adafruit GFX font
    static const int PAUSE_MS    = 1500;
    static const int SCROLL_PX_S = 30;
    static const int END_PAUSE   = 1000;
};
