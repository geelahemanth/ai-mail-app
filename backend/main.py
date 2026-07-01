from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from auth.router import router as auth_router, token_store
from emails.router import router as email_router
from services.email_poller import poll_for_new_emails
from services.gmail_service import get_gmail_service
import asyncio

load_dotenv()

connected_clients: list[WebSocket] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start polling on startup
    def get_service():
        try:
            return get_gmail_service(token_store)
        except:
            return None

    task = asyncio.create_task(
        poll_for_new_emails(get_service, connected_clients)
    )
    yield
    task.cancel()

app = FastAPI(title="AI Mail App", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(email_router)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

@app.get("/health")
async def health():
    return {"status": "ok"}