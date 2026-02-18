#include "text_scroller.h"

void TextScroller::setText(const String& text, int maxChars) {
    if (text == _text) return;  // No change
    _text        = text;
    _textWidthPx = text.length() * CHAR_WIDTH;
    _maxWidthPx  = maxChars * CHAR_WIDTH;
    _needsScroll = _textWidthPx > _maxWidthPx;
    reset();
}

void TextScroller::reset() {
    _offset     = 0;
    _pausing    = true;
    _startMs    = millis();
    _pauseEndMs = _startMs + PAUSE_MS;
}

int TextScroller::getOffset() {
    if (!_needsScroll) return 0;

    unsigned long now = millis();

    if (_pausing) {
        if (now < _pauseEndMs) {
            return _offset;
        }
        _pausing = false;
        _startMs = now;
    }

    unsigned long elapsed = now - _startMs;
    _offset = (elapsed * SCROLL_PX_S) / 1000;

    int maxOffset = _textWidthPx - _maxWidthPx;
    if (_offset >= maxOffset) {
        _offset     = 0;
        _pausing    = true;
        _pauseEndMs = now + END_PAUSE;
    }

    return _offset;
}
