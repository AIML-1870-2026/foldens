#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include "config.h"

class WiFiManager {
public:
    void begin(const char* ssid, const char* password);
    void loop();       // Call in main loop for captive portal handling
    void stop();

    bool isConnected() const { return WiFi.status() == WL_CONNECTED; }
    String getIP() const;

    // Captive portal for Spotify OAuth
    void startPortal(const char* clientId, const char* clientSecret);
    void stopPortal();
    bool isPortalActive() const { return _portalActive; }

    // OAuth result
    bool   hasAuthCode() const { return _authCode.length() > 0; }
    String getAuthCode() { String c = _authCode; _authCode = ""; return c; }

private:
    const char* _ssid     = nullptr;
    const char* _password = nullptr;
    bool        _portalActive = false;
    String      _authCode;
    String      _clientId;
    String      _clientSecret;

    WebServer*  _server = nullptr;
    unsigned long _connectStartMs = 0;

    void handleRoot();
    void handleCallback();
    void handleNotFound();
};
