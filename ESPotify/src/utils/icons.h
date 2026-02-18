#pragma once
#include <stdint.h>

// 8x8 pixel icons stored as PROGMEM bitmaps
// Each byte = one row, MSB = leftmost pixel

// Play triangle
static const uint8_t PROGMEM icon_play[] = {
    0b01000000,
    0b01100000,
    0b01110000,
    0b01111000,
    0b01111000,
    0b01110000,
    0b01100000,
    0b01000000
};

// Pause bars
static const uint8_t PROGMEM icon_pause[] = {
    0b00000000,
    0b01100110,
    0b01100110,
    0b01100110,
    0b01100110,
    0b01100110,
    0b01100110,
    0b00000000
};

// Skip forward
static const uint8_t PROGMEM icon_next[] = {
    0b00000000,
    0b01001000,
    0b01101100,
    0b01110100,
    0b01111100,
    0b01110100,
    0b01101100,
    0b01001000
};

// Skip backward
static const uint8_t PROGMEM icon_prev[] = {
    0b00000000,
    0b00010010,
    0b00110110,
    0b00101110,
    0b00111110,
    0b00101110,
    0b00110110,
    0b00010010
};

// Bluetooth icon
static const uint8_t PROGMEM icon_bt[] = {
    0b00010000,
    0b00010100,
    0b01010010,
    0b00111100,
    0b00010000,
    0b00111100,
    0b01010010,
    0b00010100
};

// WiFi icon
static const uint8_t PROGMEM icon_wifi[] = {
    0b00111100,
    0b01000010,
    0b10011001,
    0b00100100,
    0b01000010,
    0b00011000,
    0b00100100,
    0b00011000
};

// Speaker / volume icon
static const uint8_t PROGMEM icon_speaker[] = {
    0b00000000,
    0b00010000,
    0b00110000,
    0b01111010,
    0b01111010,
    0b00110000,
    0b00010000,
    0b00000000
};

// Music note
static const uint8_t PROGMEM icon_note[] = {
    0b00001100,
    0b00001010,
    0b00001000,
    0b00001000,
    0b00001000,
    0b01101000,
    0b11111000,
    0b01100000
};

// Gear / settings
static const uint8_t PROGMEM icon_gear[] = {
    0b00011000,
    0b01111110,
    0b01100110,
    0b11100111,
    0b11100111,
    0b01100110,
    0b01111110,
    0b00011000
};
