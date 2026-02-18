#pragma once
#include <Arduino.h>
#include "config.h"

enum ButtonEvent {
    BTN_NONE = 0,
    BTN_A_SHORT,
    BTN_A_LONG,
    BTN_B_SHORT,
    BTN_B_LONG,
    BTN_C_SHORT,
    BTN_C_LONG,
    BTN_PREV_SHORT,
    BTN_NEXT_SHORT
};

class ButtonHandler {
public:
    void begin();
    ButtonEvent poll();  // Call in loop; returns event or BTN_NONE

private:
    struct ButtonState {
        uint8_t  pin;
        bool     lastReading;
        bool     pressed;
        unsigned long debounceTime;
        unsigned long pressStart;
        bool     longFired;
    };

    static const int NUM_BUTTONS = 5;
    ButtonState _buttons[NUM_BUTTONS];

    ButtonEvent checkButton(int idx, ButtonEvent shortEvt, ButtonEvent longEvt);
};
