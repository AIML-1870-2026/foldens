#include "button_handler.h"

void ButtonHandler::begin() {
    uint8_t pins[NUM_BUTTONS] = {
        BTN_A_PIN, BTN_B_PIN, BTN_C_PIN,
        BTN_PREV_PIN, BTN_NEXT_PIN
    };

    for (int i = 0; i < NUM_BUTTONS; i++) {
        _buttons[i].pin          = pins[i];
        _buttons[i].lastReading  = true;   // Pulled HIGH by default
        _buttons[i].pressed      = false;
        _buttons[i].debounceTime = 0;
        _buttons[i].pressStart   = 0;
        _buttons[i].longFired    = false;

        pinMode(pins[i], INPUT_PULLUP);
    }
}

ButtonEvent ButtonHandler::poll() {
    // Check FeatherWing buttons (indices 0-2) with long press support
    ButtonEvent evt;

    evt = checkButton(0, BTN_A_SHORT, BTN_A_LONG);
    if (evt != BTN_NONE) return evt;

    evt = checkButton(1, BTN_B_SHORT, BTN_B_LONG);
    if (evt != BTN_NONE) return evt;

    evt = checkButton(2, BTN_C_SHORT, BTN_C_LONG);
    if (evt != BTN_NONE) return evt;

    // External buttons (indices 3-4) - short press only
    evt = checkButton(3, BTN_PREV_SHORT, BTN_NONE);
    if (evt != BTN_NONE) return evt;

    evt = checkButton(4, BTN_NEXT_SHORT, BTN_NONE);
    if (evt != BTN_NONE) return evt;

    return BTN_NONE;
}

ButtonEvent ButtonHandler::checkButton(int idx, ButtonEvent shortEvt, ButtonEvent longEvt) {
    ButtonState& btn = _buttons[idx];
    bool reading = digitalRead(btn.pin);  // LOW when pressed (active low)
    unsigned long now = millis();

    // Debounce
    if (reading != btn.lastReading) {
        btn.debounceTime = now;
    }
    btn.lastReading = reading;

    if ((now - btn.debounceTime) < DEBOUNCE_MS) {
        return BTN_NONE;
    }

    bool isPressed = !reading;  // Active low

    if (isPressed && !btn.pressed) {
        // Button just pressed
        btn.pressed    = true;
        btn.pressStart = now;
        btn.longFired  = false;
    }
    else if (isPressed && btn.pressed && !btn.longFired) {
        // Held down - check for long press
        if (longEvt != BTN_NONE && (now - btn.pressStart) >= LONG_PRESS_MS) {
            btn.longFired = true;
            return longEvt;
        }
    }
    else if (!isPressed && btn.pressed) {
        // Released
        btn.pressed = false;
        if (!btn.longFired) {
            return shortEvt;  // Short press on release
        }
    }

    return BTN_NONE;
}
