# AI-Powered Mail Web Application

An AI-powered email client with an integrated assistant that controls the UI programmatically — composing emails, navigating between views, displaying filtered results, and interacting with the interface through natural language commands.

Built with **React + TypeScript**, **FastAPI (Python)**, **CopilotKit**, and **Gmail API**.

---

## Architecture

The application consists of three servers working together:

```
┌─────────────────────────┐     ┌────────────────────────┐     ┌─────────────────────────┐
│   React Frontend        │     │  CopilotKit Runtime    │     │   FastAPI Backend        │
│   localhost:5173        │     │  localhost:4000         │     │   localhost:8000          │
│                         │     │                        │     │                           │
│  • Mail UI (Inbox,      │────▶│  • Receives user       │     │  • Google OAuth2 login    │
│    Sent, Compose,       │     │    messages from chat   │     │  • Gmail API integration  │
│    Email Detail)        │     │  • Sends to OpenAI     │     │  • Email CRUD endpoints   │
│  • CopilotKit Sidebar   │     │    (gpt-4o-mini)       │     │  • WebSocket for          │
│  • AI Action Handlers   │     │  • Returns tool calls  │     │    real-time sync          │
│  • WebSocket client     │────▶│    (which action to    │     │  • Background email       │
│    for real-time sync   │     │    execute)            │     │    polling (every 15s)     │
│                         │     │                        │     │                           │
└─────────────────────────┘     └────────────────────────┘     └───────────────────────────┘
         │                                                                │
         │              REST API calls (/api/emails)                      │
         └───────────────────────────────────────────────────────────────▶│
                                                                         │
                                                                         ▼
                                                               ┌──────────────────┐
                                                               │   Gmail API       │
                                                               │   (Google Cloud)  │
                                                               └──────────────────┘
```

### How the AI Assistant Works

1. User types a command in the chat sidebar (e.g., "Send an email to john@test.com with subject Hello")
2. CopilotKit collects the message + available action schemas + current app state
3. CopilotKit Runtime forwards everything to OpenAI (gpt-4o-mini)
4. OpenAI decides which function to call and with what arguments (e.g., `composeEmail({ to: "john@test.com", subject: "Hello" })`)
5. CopilotKit streams the tool call back to the frontend
6. The frontend executes the matching `useCopilotAction()` handler — which updates React state
7. The UI visibly updates (compose form opens, fields fill in, inbox filters, etc.)

The AI never touches the UI directly — it only tells the frontend which function to call. Your React code does the actual rendering.

---

## Features

### Core Features
- **Inbox** — View received emails with sender, subject, preview, and date
- **Sent** — View sent emails
- **Compose** — Write and send emails (To, Subject, Body)
- **Email Detail** — Read the full content of any email
- **AI Assistant** — Natural language commands to control the entire UI

### AI Assistant Capabilities
- **Compose & Send** — "Send an email to john@test.com with subject 'Meeting' and body 'Let's meet at 3pm'"
- **Search & Filter** — "Show me emails from the last 10 days" / "Show only unread emails"
- **Navigate & Open** — "Open the latest email from Google" / "Go to sent"
- **Context Awareness** — "Reply to this" (while reading an email)

### Real-Time Sync
- New emails appear automatically without manual refresh
- Backend polls Gmail every 15 seconds
- Updates pushed to frontend via WebSocket

---

## Prerequisites

Before setting up, you need accounts on these services:

| Service | Purpose | Cost |
|---------|---------|------|
| [Google Cloud Console](https://console.cloud.google.com) | Gmail API access (OAuth2) | Free |
| [OpenAI Platform](https://platform.openai.com) | LLM for AI assistant (gpt-4o-mini) | ~$5 minimum credit |
| [Node.js](https://nodejs.org) (v18+) | CopilotKit runtime server | Free |
| [Python](https://python.org) (3.10+) | FastAPI backend | Free |

---

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-mail-app.git
cd ai-mail-app
```

### Step 2: Google Cloud Project Setup

This is required to connect to Gmail. Follow these steps carefully:

#### 2a. Create a Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **"New Project"** → Name it `ai-mail-app` → Click **Create**
3. Select the newly created project from the dropdown

#### 2b. Enable Required APIs
1. Go to **APIs & Services → Library**
2. Search for and enable:
   - **Gmail API**
   - **Cloud Pub/Sub API** (optional, for advanced real-time sync)

#### 2c. Configure OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen** (or **Google Auth Platform → Branding**)
2. Select **"External"** → Click **Create**
3. Fill in:
   - App name: `AI Mail App`
   - User support email: your email
4. Click **Save and Continue**

#### 2d. Add API Scopes
1. Go to **Data access** (or Scopes page)
2. Click **"Add or Remove Scopes"**
3. Add these scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.modify
   ```
4. Click **Update** → **Save and Continue**

#### 2e. Add Test Users
1. Go to **Audience** (or Test users page)
2. Click **"Add Users"**
3. Add the Gmail address you'll use for testing
4. Click **Save**

> **Important:** While the app is in "Testing" mode, only users listed here can sign in.

#### 2f. Create OAuth Credentials
1. Go to **Clients** (or **APIs & Services → Credentials**)
2. Click **"Create OAuth Client"** → Select **"Web application"**
3. Add Authorized redirect URI:
   ```
   http://localhost:8000/auth/google/callback
   ```
4. Click **Create**
5. **Download the JSON file** → Save it as `credentials.json` in the `backend/` directory

### Step 3: Get an OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to [API Keys](https://platform.openai.com/api-keys) → Click **"Create new secret key"**
4. Copy the key (starts with `sk-`)
5. Add billing credits: Go to [Billing](https://platform.openai.com/settings/organization/billing) → Add $5 minimum
6. The model used is `gpt-4o-mini` — costs approximately $0.15 per million input tokens

### Step 4: Configure and Install All Three Servers

This application runs three servers. Each needs its own configuration:

#### A) Backend (Python — FastAPI)

**Location:** `backend/`

**Environment file:** Create `backend/.env` with:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
FRONTEND_URL=http://localhost:5173
SECRET_KEY=any-random-string-for-session
```

> You'll find `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` inside the downloaded `credentials.json` file or on the Google Cloud Credentials page.

**Credentials file:** Place the downloaded `credentials.json` from Google Cloud Console into the `backend/` directory.

**Install dependencies:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

The `requirements.txt` includes: fastapi, uvicorn, python-dotenv, google-auth, google-auth-oauthlib, google-api-python-client, and websockets.

#### B) CopilotKit Runtime (Node.js)

**Location:** `copilot-runtime/`

**Configuration:** Open `copilot-runtime/server.js` and replace the OpenAI API key:
```javascript
process.env.OPENAI_API_KEY = "sk-your-openai-key-here";
```

Get your key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys). The model used is `gpt-4o-mini`. You need at least $5 in billing credits.

**Install dependencies:**
```bash
cd copilot-runtime
npm install
```

This installs `@copilotkit/runtime` (v1.61.2) and `openai`.

#### C) Frontend (React + TypeScript)

**Location:** `frontend/`

**Configuration:** No API keys needed. The frontend connects to:
- FastAPI backend via Vite proxy (`/api` → `localhost:8000`)
- CopilotKit runtime via Vite proxy (`/copilotkit` → `localhost:4000`)
- WebSocket directly at `ws://localhost:8000/ws`

These proxies are configured in `frontend/vite.config.ts`.

**Install dependencies:**
```bash
cd frontend
npm install
```

This installs React, TypeScript, CopilotKit (`@copilotkit/react-core`, `@copilotkit/react-ui`), Zustand, Axios, and Tailwind CSS.

### Step 5: Run the Application

You need **three terminal windows**, one for each server:

#### Terminal 1 — Backend (FastAPI)
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

#### Terminal 2 — CopilotKit Runtime (Node.js)
```bash
cd copilot-runtime
node server.js
```

#### Terminal 3 — Frontend (React)
```bash
cd frontend
npm run dev
```

### Step 6: First-Time Authentication

1. Open your browser and go to: `http://localhost:8000/auth/google/login`
2. Sign in with the Gmail account you added as a test user
3. Click **"Allow"** on the consent screen
4. You'll be redirected to the frontend

> **Note:** After the first sign-in, tokens are saved to `backend/token.json`. You won't need to sign in again unless you delete this file.

### Step 7: Use the Application

1. Open `http://localhost:5173`
2. Your Gmail inbox should load automatically
3. Try typing commands in the AI Assistant sidebar:
   - `Show my unread emails`
   - `Send an email to someone@example.com with subject 'Test' and body 'Hello!'`
   - `Open the latest email from Google`
   - `Go to compose`
   - `Show me emails from the last 7 days`

---

## Project Structure

```
ai-mail-app/
├── backend/                          # FastAPI (Python)
│   ├── main.py                       # App entry, CORS, WebSocket, email polling
│   ├── .env                          # Environment variables (not committed)
│   ├── credentials.json              # Google OAuth client config (not committed)
│   ├── token.json                    # Stored OAuth tokens (not committed)
│   ├── auth/
│   │   ├── __init__.py
│   │   └── router.py                 # OAuth2 login/callback endpoints
│   ├── emails/
│   │   ├── __init__.py
│   │   ├── router.py                 # Email CRUD endpoints
│   │   └── schemas.py                # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gmail_service.py          # Gmail API wrapper
│   │   └── email_poller.py           # Background polling for new emails
│   └── ws/
│       ├── __init__.py
│       └── manager.py                # WebSocket connection manager
│
├── copilot-runtime/                  # CopilotKit Runtime (Node.js)
│   ├── server.js                     # Node.js server connecting to OpenAI
│   ├── package.json
│   └── node_modules/
│
├── frontend/                         # React + TypeScript
│   ├── src/
│   │   ├── App.tsx                   # Main layout + CopilotKit provider
│   │   ├── components/
│   │   │   ├── Inbox.tsx             # Inbox email list
│   │   │   ├── SentMail.tsx          # Sent email list
│   │   │   ├── Compose.tsx           # Email compose form
│   │   │   ├── EmailDetail.tsx       # Single email view
│   │   │   └── Sidebar.tsx           # Navigation sidebar
│   │   ├── copilot/
│   │   │   └── actions.ts            # CopilotKit action definitions
│   │   ├── hooks/
│   │   │   └── useRealtimeEmails.ts  # WebSocket hook for live updates
│   │   ├── store/
│   │   │   └── useMailStore.ts       # Zustand global state
│   │   └── api/
│   │       └── client.ts             # Axios API wrapper
│   ├── vite.config.ts                # Vite config with proxy settings
│   └── package.json
│
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google/login` | Initiates Google OAuth2 flow |
| GET | `/auth/google/callback` | OAuth2 callback (receives tokens) |
| GET | `/emails` | List inbox emails (supports `?days=`, `?sender=`, `?unread=`, `?q=`) |
| GET | `/emails/{id}` | Get a single email by ID |
| GET | `/emails/sent` | List sent emails |
| POST | `/emails/send` | Send a new email (`?to=`, `?subject=`, `?body=`) |
| GET | `/emails/new` | Check for new emails (used by poller) |
| WS | `/ws` | WebSocket for real-time email notifications |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | Mail UI components |
| Styling | Tailwind CSS | Dark-themed responsive design |
| State | Zustand | Global app state management |
| AI UI | CopilotKit (react-core, react-ui) | Chat sidebar + action framework |
| AI Runtime | CopilotKit Runtime (Node.js) | AG-UI protocol, LLM communication |
| LLM | OpenAI gpt-4o-mini | Natural language understanding + function calling |
| Backend | FastAPI (Python) | REST API + WebSocket server |
| Email | Gmail API | Real email send/receive |
| Auth | Google OAuth2 | Secure Gmail access |
| Real-time | WebSocket + Polling | Live inbox updates |

---

## Architecture Decisions & Trade-offs

- **CopilotKit over custom AI integration:** CopilotKit provides the chat UI, AG-UI streaming protocol, and action dispatching framework. This saved significant development time on the AI-to-UI bridge.

- **Three-server architecture:** Separating the CopilotKit runtime (Node.js) from the FastAPI backend (Python) allows each to use its native ecosystem. CopilotKit's runtime SDK is Node.js-only, while Gmail API integration is cleaner in Python.

- **Polling over Pub/Sub for real-time:** Gmail's push notifications require Google Cloud Pub/Sub with a public HTTPS endpoint. For local development, polling every 15 seconds is simpler and sufficient. The architecture supports swapping to Pub/Sub for production.

- **Zustand over Redux:** Simpler API with less boilerplate, well-suited for the scope of this application.

- **Token file storage over database:** For a demo app, storing OAuth tokens in `token.json` is pragmatic. Production would use encrypted database storage with refresh token rotation.

- **gpt-4o-mini over larger models:** Fast, cheap, and supports the function calling + Responses API that CopilotKit v1.61.x requires.

---

## What I'd Improve With More Time

- **Pub/Sub push notifications** instead of polling for true real-time sync
- **Thread/conversation view** for email chains
- **Rich HTML email rendering** in the detail view
- **Attachment support** (upload and download)
- **Multiple account support**
- **Database for token storage** with encryption
- **Rate limiting and error retry** on Gmail API calls
- **End-to-end tests** with Playwright
- **Deploy to production** (Vercel for frontend, Railway for backend)
- **Human-in-the-loop confirmation** before the AI sends emails

---

## Troubleshooting

### "KeyError: 'access_token'" on backend
You need to sign in first. Go to `http://localhost:8000/auth/google/login`

### Emails not loading (500 error)
Sign in again — your tokens may have expired. Delete `backend/token.json` and sign in fresh.

### CopilotKit sidebar not responding
Check that the CopilotKit runtime is running on port 4000 (`node server.js`).

### WebSocket "connection closed" spam
This is normal during startup before authentication. Sign in first, then refresh.

### "OpenAI server error" in chat
Temporary OpenAI issue. Wait a moment and try again. Check your billing at platform.openai.com.

---

## License

MIT