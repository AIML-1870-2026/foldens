#include "wifi_manager.h"

void WiFiManager::begin(const char* ssid, const char* password) {
    _ssid     = ssid;
    _password = password;

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    _connectStartMs = millis();
    Serial.printf("[WiFi] Connecting to %s", ssid);

    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - _connectStartMs > WIFI_CONNECT_TIMEOUT_MS) {
            Serial.println(F("\n[WiFi] Connection timeout"));
            return;
        }
        delay(250);
        Serial.print('.');
    }

    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
}

void WiFiManager::loop() {
    // Handle captive portal requests
    if (_portalActive && _server) {
        _server->handleClient();
    }

    // Auto-reconnect if disconnected
    if (!isConnected() && !_portalActive) {
        static unsigned long lastReconnect = 0;
        if (millis() - lastReconnect > 10000) {
            lastReconnect = millis();
            Serial.println(F("[WiFi] Reconnecting..."));
            WiFi.disconnect();
            WiFi.begin(_ssid, _password);
        }
    }
}

void WiFiManager::stop() {
    stopPortal();
    WiFi.disconnect();
}

String WiFiManager::getIP() const {
    if (isConnected()) {
        return WiFi.localIP().toString();
    }
    return "0.0.0.0";
}

void WiFiManager::startPortal(const char* clientId, const char* clientSecret) {
    _clientId     = clientId;
    _clientSecret = clientSecret;

    if (_server) {
        delete _server;
    }
    _server = new WebServer(80);

    _server->on("/", [this]() { handleRoot(); });
    _server->on("/callback", [this]() { handleCallback(); });
    _server->onNotFound([this]() { handleNotFound(); });

    _server->begin();
    _portalActive = true;
    Serial.println(F("[WiFi] Captive portal started on port 80"));
}

void WiFiManager::stopPortal() {
    if (_server) {
        _server->stop();
        delete _server;
        _server = nullptr;
    }
    _portalActive = false;
}

void WiFiManager::handleRoot() {
    // Build Spotify authorization URL
    String authUrl = "https://accounts.spotify.com/authorize";
    authUrl += "?client_id=" + _clientId;
    authUrl += "&response_type=code";
    authUrl += "&redirect_uri=http%3A%2F%2F" + WiFi.localIP().toString() + "%2Fcallback";
    authUrl += "&scope=user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing";

    String html = R"rawhtml(
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ESPotify Setup</title>
    <style>
        body {
            font-family: -apple-system, sans-serif;
            background: #121212;
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .card {
            background: #282828;
            border-radius: 12px;
            padding: 32px;
            max-width: 400px;
            text-align: center;
        }
        h1 { color: #1DB954; margin-bottom: 8px; }
        p { color: #b3b3b3; line-height: 1.6; }
        .btn {
            display: inline-block;
            background: #1DB954;
            color: #fff;
            padding: 14px 32px;
            border-radius: 24px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            margin-top: 16px;
        }
        .btn:hover { background: #1ed760; }
    </style>
</head>
<body>
    <div class="card">
        <h1>ESPotify</h1>
        <p>Connect your Spotify account to your ESP32 device.</p>
        <p>This grants playback control and now-playing info access.</p>
        <a class="btn" href=")rawhtml";

    html += authUrl;

    html += R"rawhtml(">Login with Spotify</a>
    </div>
</body>
</html>
)rawhtml";

    _server->send(200, "text/html", html);
}

void WiFiManager::handleCallback() {
    if (_server->hasArg("code")) {
        _authCode = _server->arg("code");
        Serial.println(F("[WiFi] OAuth code received!"));

        String html = R"rawhtml(
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ESPotify - Success</title>
    <style>
        body {
            font-family: -apple-system, sans-serif;
            background: #121212;
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .card {
            background: #282828;
            border-radius: 12px;
            padding: 32px;
            max-width: 400px;
            text-align: center;
        }
        h1 { color: #1DB954; }
        p { color: #b3b3b3; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Success!</h1>
        <p>ESPotify is now connected to Spotify.</p>
        <p>You can close this page. Check the OLED display on your device.</p>
    </div>
</body>
</html>
)rawhtml";
        _server->send(200, "text/html", html);
    } else if (_server->hasArg("error")) {
        String error = _server->arg("error");
        Serial.printf("[WiFi] OAuth error: %s\n", error.c_str());
        _server->send(400, "text/plain", "Authorization failed: " + error);
    }
}

void WiFiManager::handleNotFound() {
    _server->sendHeader("Location", "/", true);
    _server->send(302, "text/plain", "Redirecting...");
}
