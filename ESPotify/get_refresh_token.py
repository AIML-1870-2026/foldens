"""
ESPotify - One-time Spotify token generator
Run this on your PC to get a refresh token, then paste it into secrets.h

Usage:
    python get_refresh_token.py

Requirements:
    pip install requests
"""

import http.server
import threading
import webbrowser
import urllib.parse
import requests
import base64
import sys

# ── Paste your credentials here ──────────────────────────────────────────────
CLIENT_ID     = "06929aa214d642b0813a2d6b76ea3720"   # from secrets.h
CLIENT_SECRET = "ac5692bc3e48402191130da083985abc"   # from secrets.h
# ─────────────────────────────────────────────────────────────────────────────

REDIRECT_URI  = "http://127.0.0.1:8888/callback"
SCOPE         = "user-read-playback-state user-modify-playback-state user-read-currently-playing"
PORT          = 8888

auth_code = None

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if "code" in params:
            auth_code = params["code"][0]
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"<h2>Auth complete! You can close this tab.</h2>")
        else:
            error = params.get("error", ["unknown"])[0]
            self.send_response(400)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(f"<h2>Error: {error}</h2>".encode())

    def log_message(self, *args):
        pass  # suppress access log noise


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        print("ERROR: Fill in CLIENT_ID and CLIENT_SECRET at the top of this script.")
        sys.exit(1)

    # Build authorization URL
    params = urllib.parse.urlencode({
        "client_id":     CLIENT_ID,
        "response_type": "code",
        "redirect_uri":  REDIRECT_URI,
        "scope":         SCOPE,
    })
    auth_url = f"https://accounts.spotify.com/authorize?{params}"

    # Start local callback server in background thread
    server = http.server.HTTPServer(("127.0.0.1", PORT), CallbackHandler)
    thread = threading.Thread(target=server.handle_request)
    thread.daemon = True
    thread.start()

    print(f"Opening Spotify login in your browser...")
    print(f"If it doesn't open, visit:\n  {auth_url}\n")
    webbrowser.open(auth_url)

    thread.join(timeout=120)

    if not auth_code:
        print("ERROR: Timed out waiting for auth callback.")
        sys.exit(1)

    # Exchange code for tokens
    creds = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    resp = requests.post(
        "https://accounts.spotify.com/api/token",
        headers={
            "Authorization": f"Basic {creds}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={
            "grant_type":   "authorization_code",
            "code":         auth_code,
            "redirect_uri": REDIRECT_URI,
        },
    )

    if resp.status_code != 200:
        print(f"ERROR: Token exchange failed: {resp.text}")
        sys.exit(1)

    tokens = resp.json()
    refresh_token = tokens.get("refresh_token", "")
    access_token  = tokens.get("access_token", "")

    print("\n" + "="*60)
    print("SUCCESS! Add this to your secrets.h:")
    print("="*60)
    print(f'#define SPOTIFY_REFRESH_TOKEN "{refresh_token}"')
    print("="*60)
    print(f"\n(access token for testing: {access_token[:40]}...)")


if __name__ == "__main__":
    main()
