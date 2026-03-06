#include "spotify_api.h"
#include <ArduinoJson.h>
#include <base64.h>   // ESP32 built-in base64

void SpotifyAPI::begin(const char* clientId, const char* clientSecret, const String& redirectUri,
                       const char* seedRefreshToken) {
    _clientId     = clientId;
    _clientSecret = clientSecret;
    _redirectUri  = redirectUri;

    _client.setInsecure();  // Skip cert verification (saves RAM)

    // If a pre-generated refresh token was provided, use it directly
    if (seedRefreshToken && strlen(seedRefreshToken) > 0) {
        _refreshToken = seedRefreshToken;
        saveRefreshToken();  // Persist it so future boots load from NVS
        Serial.println(F("[Spotify] Using pre-seeded refresh token"));
    } else {
        loadRefreshToken();
    }
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

    JsonDocument doc;
    if (deserializeJson(doc, response) != DeserializationError::Ok) {
        Serial.println(F("[Spotify] JSON parse error"));
        return false;
    }

    if (doc["access_token"].is<const char*>()) {
        _accessToken  = doc["access_token"].as<String>();
        _refreshToken = doc["refresh_token"].as<String>();
        int expiresIn = doc["expires_in"].as<int>();
        _tokenExpiresAt = millis() + (expiresIn - 60) * 1000UL;  // Refresh 60s early

        saveRefreshToken();
        Serial.println(F("[Spotify] Tokens obtained successfully"));
        return true;
    }

    Serial.printf("[Spotify] Token error: %s\n",
                  doc["error"].as<const char*>() ?: "unknown");
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

    JsonDocument doc;
    if (deserializeJson(doc, response) != DeserializationError::Ok) return false;

    if (doc["access_token"].is<const char*>()) {
        _accessToken = doc["access_token"].as<String>();
        int expiresIn = doc["expires_in"].as<int>();
        _tokenExpiresAt = millis() + (expiresIn - 60) * 1000UL;

        // Spotify may issue a new refresh token
        if (doc["refresh_token"].is<const char*>()) {
            _refreshToken = doc["refresh_token"].as<String>();
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

    Serial.printf("[Spotify] /currently-playing response (%d bytes): %.120s\n",
                  response.length(), response.c_str());

    if (response.length() == 0) {
        info.title     = "";
        info.artist    = "";
        info.album     = "";
        info.isPlaying = false;
        return false;
    }

    JsonDocument doc;
    if (deserializeJson(doc, response) != DeserializationError::Ok) return false;

    info.isPlaying  = doc["is_playing"].as<bool>();
    info.progressMs = doc["progress_ms"].as<int>();

    JsonObject item = doc["item"];
    if (item.isNull()) return false;

    info.title      = item["name"].as<String>();
    info.durationMs = item["duration_ms"].as<int>();
    info.album      = item["album"]["name"].as<String>();

    // Build artist string (may have multiple)
    info.artist = "";
    JsonArray artists = item["artists"];
    for (int i = 0; i < (int)artists.size() && i < 3; i++) {
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

// ---- HTTP Helpers (HTTPClient-based for connection reuse + chunked encoding) ----

String SpotifyAPI::httpPost(const String& host, const String& path,
                            const String& body, const String& contentType,
                            const String& authHeader) {
    String url = "https://" + host + path;
    if (!_https.begin(_client, url)) {
        Serial.printf("[HTTP] POST begin failed: %s\n", host.c_str());
        return "";
    }

    if (contentType.length() > 0) _https.addHeader("Content-Type", contentType);
    if (authHeader.length() > 0)  _https.addHeader("Authorization", authHeader);

    int code = _https.POST(body);
    String response = (code > 0) ? _https.getString() : "";
    if (code <= 0) {
        Serial.printf("[HTTP] POST error: %s\n", HTTPClient::errorToString(code).c_str());
        _https.end();
    }
    return response;
}

String SpotifyAPI::httpGet(const String& host, const String& path,
                           const String& authHeader) {
    String url = "https://" + host + path;

    Serial.printf("[HTTP] heap: %u free, %u max-block\n",
                  ESP.getFreeHeap(), ESP.getMaxAllocHeap());

    if (!_https.begin(_client, url)) {
        Serial.printf("[HTTP] GET begin failed: %s\n", host.c_str());
        return "";
    }

    if (authHeader.length() > 0) _https.addHeader("Authorization", authHeader);

    int code = _https.GET();
    String response = "";
    if (code == HTTP_CODE_OK) {
        response = _https.getString();
    } else if (code != HTTP_CODE_NO_CONTENT) {
        // 204 = nothing playing (normal); anything else is an error
        Serial.printf("[HTTP] GET %s -> %d %s\n", path.c_str(), code,
                      HTTPClient::errorToString(code).c_str());
        _https.end();  // Force close on error so next attempt gets a fresh connection
    }
    return response;
}

String SpotifyAPI::httpPut(const String& host, const String& path,
                           const String& body, const String& authHeader) {
    String url = "https://" + host + path;
    if (!_https.begin(_client, url)) {
        Serial.printf("[HTTP] PUT begin failed: %s\n", host.c_str());
        return "";
    }

    _https.addHeader("Content-Type", "application/json");
    if (authHeader.length() > 0) _https.addHeader("Authorization", authHeader);

    int code = _https.sendRequest("PUT", body);
    String response = (code > 0) ? _https.getString() : "";
    if (code <= 0) {
        Serial.printf("[HTTP] PUT error: %s\n", HTTPClient::errorToString(code).c_str());
        _https.end();
    }
    return response;
}
