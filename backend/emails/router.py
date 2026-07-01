from fastapi import APIRouter
from datetime import datetime, timedelta
from auth.router import token_store
from services.gmail_service import (
    get_gmail_service, list_emails, get_email_detail, send_email
)

router = APIRouter(prefix="/emails")

@router.get("")
async def get_emails(days: int = None, sender: str = None, unread: bool = None, q: str = None):
    service = get_gmail_service(token_store)
    query_parts = []
    if days:
        from datetime import datetime, timedelta
        after = (datetime.now() - timedelta(days=days)).strftime("%Y/%m/%d")
        query_parts.append(f"after:{after}")
    if sender:
        query_parts.append(f"from:{sender}")
    if unread:
        query_parts.append("is:unread")
    if q:
        query_parts.append(q)
    return list_emails(service, " ".join(query_parts))

@router.get("/{email_id}")
async def get_email(email_id: str):
    service = get_gmail_service(token_store)
    return get_email_detail(service, email_id)

@router.post("/send")
async def send(to: str, subject: str, body: str):
    service = get_gmail_service(token_store)
    return send_email(service, to, subject, body)

@router.get("/sent")
async def get_sent_emails():
    service = get_gmail_service(token_store)
    return list_emails(service, "in:sent")


last_history_id = None
@router.get("/new")
async def check_new_emails(since_minutes: int = 1):
    """Check for emails received in the last N minutes"""
    service = get_gmail_service(token_store)
    after = (datetime.now() - timedelta(minutes=since_minutes)).strftime("%Y/%m/%d")
    query = f"after:{after} is:inbox newer_than:1m"
    try:
        results = service.users().messages().list(
            userId="me", q=query, maxResults=5
        ).execute()
        messages = results.get("messages", [])
        return [get_email_detail(service, m["id"]) for m in messages]
    except Exception as e:
        return []