import asyncio
import json
from datetime import datetime, timedelta

known_email_ids = set()

async def poll_for_new_emails(get_service, connected_clients):
    """Background task that checks for new emails every 15 seconds"""
    while True:
        try:
            service = get_service()
            if service is None:
                await asyncio.sleep(15)
                continue

            # Check for recent emails
            after = (datetime.now() - timedelta(minutes=2)).strftime("%Y/%m/%d")
            results = service.users().messages().list(
                userId="me", q=f"after:{after} is:inbox", maxResults=5
            ).execute()

            messages = results.get("messages", [])
            for msg in messages:
                if msg["id"] not in known_email_ids:
                    known_email_ids.add(msg["id"])
                    # Fetch full email detail
                    from services.gmail_service import get_email_detail
                    email = get_email_detail(service, msg["id"])

                    # Broadcast to all connected clients
                    for client in connected_clients[:]:
                        try:
                            await client.send_text(json.dumps({
                                "type": "new_email",
                                "data": email
                            }))
                        except:
                            connected_clients.remove(client)

        except Exception as e:
            print(f"Polling error: {e}")

        await asyncio.sleep(15)