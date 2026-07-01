import os
import json
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow

router = APIRouter(prefix="/auth/google")

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
]

TOKEN_FILE = "token.json"

def load_tokens():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r") as f:
            return json.load(f)
    return {}

def save_tokens(tokens):
    with open(TOKEN_FILE, "w") as f:
        json.dump(tokens, f)

token_store = load_tokens()

_flow_store = {}

@router.get("/login")
async def login():
    flow = Flow.from_client_secrets_file(
        "credentials.json",
        scopes=SCOPES,
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI"),
    )
    auth_url, state = flow.authorization_url(
        access_type="offline", prompt="consent"
    )
    _flow_store["flow"] = flow
    return RedirectResponse(auth_url)

@router.get("/callback")
async def callback(code: str):
    flow = _flow_store.get("flow")
    if not flow:
        return {"error": "No active login flow"}

    flow.fetch_token(code=code)
    creds = flow.credentials

    token_store["access_token"] = creds.token
    token_store["refresh_token"] = creds.refresh_token
    save_tokens(token_store)

    _flow_store.pop("flow", None)
    return RedirectResponse(os.getenv("FRONTEND_URL"))