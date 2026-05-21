import requests

def send_email(api_key: str, from_addr: str, to: str, subject: str, body: str) -> str:
    resp = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"from": from_addr, "to": [to], "subject": subject, "text": body},
        timeout=15
    )
    if not resp.ok:
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text
        raise RuntimeError(f"Resend API error {resp.status_code}: {detail}")
    return resp.json().get("id", "")

def get_email_status(api_key: str, email_id: str) -> dict:
    resp = requests.get(
        f"https://api.resend.com/emails/{email_id}",
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=10
    )
    if resp.status_code == 404:
        return {}
    resp.raise_for_status()
    return resp.json()
