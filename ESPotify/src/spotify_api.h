#pragma once
#include <Arduino.h>
#include <WiFiClientSecure.h>
#include <Preferences.h>
#include "config.h"
#include "gui_manager.h"  // For TrackInfo struct

class SpotifyAPI {
public:
    void begin(const char* clientId, const char* clientSecret, const String& redirectUri);

    // Auth flow
    bool exchangeCode(const String& authCode);   // Exchange OAuth code for tokens
    bool refreshAccessToken();                    // Refresh expired token
    bool hasValidToken() const;
    bool hasRefreshToken() const;
    void loadRefreshToken();                      // Load from NVS

    // Playback info
    bool getCurrentlyPlaying(TrackInfo& info);

    // Playback control
    bool play();
    bool pause();
    bool next();
    bool previous();
    bool setVolume(int percent);  // 0-100

    // Polling
    void loop();   // Call in main loop for periodic polling
    TrackInfo getLastTrack() const { return _lastTrack; }
    bool hasNewTrack() const { return _newTrackAvailable; }
    void clearNewTrack() { _newTrackAvailable = false; }

private:
    String _clientId;
    String _clientSecret;
    String _redirectUri;
    String _accessToken;
    String _refreshToken;
    unsigned long _tokenExpiresAt = 0;

    TrackInfo _lastTrack;
    bool      _newTrackAvailable = false;
    unsigned long _lastPollMs = 0;

    Preferences _prefs;
    WiFiClientSecure _client;

    String httpPost(const String& host, const String& path,
                    const String& body, const String& contentType,
                    const String& authHeader = "");
    String httpGet(const String& host, const String& path,
                   const String& authHeader);
    String httpPut(const String& host, const String& path,
                   const String& body, const String& authHeader);

    void saveRefreshToken();
    String base64Encode(const String& input);
};
