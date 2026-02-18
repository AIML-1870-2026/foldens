#include "spotify_api.h"
#include <ArduinoJson.h>
#include <base64.h>   // ESP32 built-in base64

void SpotifyAPI::begin(const char* clientId, const char* clientSecret, const String& redirectUri) {
    _clientId     = clientId;
    _clientSecret = clientSecret;
    _redirectUri  = redirectUri;

    _client.setInsecure();  // Skip cert verification (saves RAM)

    loadRefreshToken();
}

// ---- Auth ----

void SpotifyAPI::loadRefreshToken() {
    _prefs.begin(NVS_NAMESPACE, true);  // Read-only
    _refreshToken = _prefs.getString(NVS_KEY_REFRESH_TOK, "");
    _prefs.end();

    if (_refreshToken.length() > 0) {
        Serial.println(F("[Spotify] Refresh token loaded from NVS"));
    }
}

void SpotifyAPI::saveRefreshToken() {
    _prefs.begin(NVS_NAMESPACE, false);
    _prefs.putString(NVS_KEY_REFRESH_TOK, _refreshToken);
    _prefs.end();
    Serial.println(F("[Spotify] Refresh token saved to NVS"));
}

bool SpotifyAPI::hasValidToken() const {
    return _accessToken.length() > 0 && millis() < _tokenExpiresAt;
}

bool SpotifyAPI::hasRefreshToken() const {
    return _refreshToken.length() > 0;
}

bool SpotifyAPI::exchangeCode(const String& authCode) {
    String body = "grant_type=authorization_code";
    body += "&code=" + authCode;
    body += "&redirect_uri=" + _redirectUri;

    String credentials = _clientId + ":" + _clientSecret;
    String authHeader = "Basic " + base64::encode(credentials);

    String response = httpPost("accounts.spotify.com", "/api/token",
                               body, "application/x-www-form-urlencoded",
                               authHeader);

    if (response.length() == 0) return false;

    DynamicJsonBuffer jsonBuffer(512);
    JsonObject& root = jsonBuffer.parseObject(response);
    if (!root.success()) {
        Serial.println(F("[Spotify] JSON parse error"));
        return false;
    }

    if (root.containsKey("access_token")) {
        _accessToken  = root["access_token"].as<String>();
        _refreshToken = root["refresh_token"].as<String>();
        int expiresIn = root["expires_in"].as<int>();
        _tokenExpiresAt = millis() + (expiresIn - 60) * 1000UL;  // Refresh 60s early

        saveRefreshToken();
        Serial.println(F("[Spotify] Tokens obtained successfully"));
        return true;
    }

    Serial.printf("[Spotify] Token error: %s\n",
                  root.containsKey("error") ? root["error"].as<const char*>() : "unknown");
    return false;
}

bool SpotifyAPI::refreshAccessToken() {
    if (_refreshToken.length() == 0) return false;

    String body = "grant_type=refresh_token&refresh_token=" + _refreshToken;

    String credentials = _clientId + ":" + _clientSecret;
    String authHeader = "Basic " + base64::encode(credentials);

    String response = httpPost("accounts.spotify.com", "/api/token",
                               body, "application/x-www-form-urlencoded",
                               authHeader);

    if (response.length() == 0) return false;

    DynamicJsonBuffer jsonBuffer(512);
    JsonObject& root = jsonBuffer.parseObject(response);
    if (!root.success()) return false;

    if (root.containsKey("access_token")) {
        _accessToken = root["access_token"].as<String>();
        int expiresIn = root["expires_in"].as<int>();
        _tokenExpiresAt = millis() + (expiresIn - 60) * 1000UL;

        // Spotify may issue a new refresh token
        if (root.containsKey("refresh_token")) {
            _refreshToken = root["refresh_token"].as<String>();
            saveRefreshToken();
        }

        Serial.println(F("[Spotify] Token refreshed"));
        return true;
    }

    return false;
}

// ---- Playback Info ----

bool SpotifyAPI::getCurrentlyPlaying(TrackInfo& info) {
    if (!hasValidToken()) {
        if (!refreshAccessToken()) return false;
    }

    String authHeader = "Bearer " + _accessToken;
    String response = httpGet("api.spotify.com", "/v1/me/player/currently-playing",
                              authHeader);

    if (response.length() == 0) {
        info.title     = "";
        info.artist    = "";
        info.album     = "";
        info.isPlaying = false;
        return false;
    }

    DynamicJsonBuffer jsonBuffer(2048);
    JsonObject& root = jsonBuffer.parseObject(response);
    if (!root.success()) return false;

    info.isPlaying  = root["is_playing"].as<bool>();
    info.progressMs = root["progress_ms"].as<int>();

    JsonObject& item = root["item"];
    if (!item.success()) return false;

    info.title      = item["name"].as<String>();
    info.durationMs = item["duration_ms"].as<int>();
    info.album      = item["album"]["name"].as<String>();

    // Build artist string (may have multiple)
    info.artist = "";
    JsonArray& artists = item["artists"];
    for (int i = 0; i < artists.size() && i < 3; i++) {
        if (i > 0) info.artist += ", ";
        info.artist += artists[i]["name"].as<String>();
    }

    return true;
}

// ---- Playback Control ----

bool SpotifyAPI::play() {
    if (!hasValidToken() && !refreshAccessToken()) return false;
    String authHeader = "Bearer " + _accessToken;
    String response = httpPut("api.spotify.com", "/v1/me/player/play", "", authHeader);
    return true;
}

bool SpotifyAPI::pause() {
    if (!hasValidToken() && !refreshAccessToken()) return false;
    String authHeader = "Bearer " + _accessToken;
    String response = httpPut("api.spotify.com", "/v1/me/player/pause", "", authHeader);
    return true;
}

bool SpotifyAPI::next() {
    if (!hasValidToken() && !refreshAccessToken()) return false;
    String authHeader = "Bearer " + _accessToken;
    // next/previous use POST
    String response = httpPost("api.spotify.com", "/v1/me/player/next",
                               "", "application/json", "Bearer " + _accessToken);
    return true;
}

bool SpotifyAPI::previous() {
    if (!hasValidToken() && !refreshAccessToken()) return false;
    String response = httpPost("api.spotify.com", "/v1/me/player/previous",
                               "", "application/json", "Bearer " + _accessToken);
    return true;
}

bool SpotifyAPI::setVolume(int percent) {
    if (!hasValidToken() && !refreshAccessToken()) return false;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;

    String path = "/v1/me/player/volume?volume_percent=" + String(percent);
    String authHeader = "Bearer " + _accessToken;
    httpPut("api.spotify.com", path, "", authHeader);
    return true;
}

// ---- Polling Loop ----

void SpotifyAPI::loop() {
    unsigned long now = millis();
    if (now - _lastPollMs < SPOTIFY_POLL_MS) return;
    _lastPollMs = now;

    if (!hasValidToken() && hasRefreshToken()) {
        refreshAccessToken();
    }

    if (!hasValidToken()) return;

    TrackInfo newInfo;
    if (getCurrentlyPlaying(newInfo)) {
        if (newInfo.title != _lastTrack.title || newInfo.artist != _lastTrack.artist) {
            _newTrackAvailable = true;
        }
        _lastTrack = newInfo;
    }
}

// ---- HTTP Helpers ----

String SpotifyAPI::httpPost(const String& host, const String& path,
                            const String& body, const String& contentType,
                            const String& authHeader) {
    if (!_client.connect(host.c_str(), 443)) {
        Serial.printf("[HTTP] POST connect failed: %s\n", host.c_str());
        return "";
    }

    _client.printf("POST %s HTTP/1.1\r\n", path.c_str());
    _client.printf("Host: %s\r\n", host.c_str());
    _client.printf("Content-Type: %s\r\n", contentType.c_str());
    _client.printf("Content-Length: %d\r\n", body.length());
    if (authHeader.length() > 0) {
        _client.printf("Authorization: %s\r\n", authHeader.c_str());
    }
    _client.print("Connection: close\r\n\r\n");
    _client.print(body);

    // Skip headers
    while (_client.connected()) {
        String line = _client.readStringUntil('\n');
        if (line == "\r") break;
    }

    String response = _client.readString();
    _client.stop();
    return response;
}

String SpotifyAPI::httpGet(const String& host, const String& path,
                           const String& authHeader) {
    if (!_client.connect(host.c_str(), 443)) {
        Serial.printf("[HTTP] GET connect failed: %s\n", host.c_str());
        return "";
    }

    _client.printf("GET %s HTTP/1.1\r\n", path.c_str());
    _client.printf("Host: %s\r\n", host.c_str());
    if (authHeader.length() > 0) {
        _client.printf("Authorization: %s\r\n", authHeader.c_str());
    }
    _client.print("Connection: close\r\n\r\n");

    while (_client.connected()) {
        String line = _client.readStringUntil('\n');
        if (line == "\r") break;
    }

    String response = _client.readString();
    _client.stop();
    return response;
}

String SpotifyAPI::httpPut(const String& host, const String& path,
                           const String& body, const String& authHeader) {
    if (!_client.connect(host.c_str(), 443)) {
        Serial.printf("[HTTP] PUT connect failed: %s\n", host.c_str());
        return "";
    }

    _client.printf("PUT %s HTTP/1.1\r\n", path.c_str());
    _client.printf("Host: %s\r\n", host.c_str());
    _client.print("Content-Type: application/json\r\n");
    _client.printf("Content-Length: %d\r\n", body.length());
    if (authHeader.length() > 0) {
        _client.printf("Authorization: %s\r\n", authHeader.c_str());
    }
    _client.print("Connection: close\r\n\r\n");
    if (body.length() > 0) {
        _client.print(body);
    }

    while (_client.connected()) {
        String line = _client.readStringUntil('\n');
        if (line == "\r") break;
    }

    String response = _client.readString();
    _client.stop();
    return response;
}
