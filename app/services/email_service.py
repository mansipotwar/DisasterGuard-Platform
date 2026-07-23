"""SMTP email delivery."""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import current_app

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> bool:
    """Send a plain-text email using configured SMTP credentials (EMAIL_USER / EMAIL_PASS)."""
    user = (current_app.config.get("EMAIL_USER") or "").strip()
    password = (current_app.config.get("EMAIL_PASS") or "").strip()
    host = current_app.config.get("SMTP_HOST", "smtp.gmail.com")
    port = int(current_app.config.get("SMTP_PORT", 587))

    if not user or not password:
        logger.warning("Email not configured (EMAIL_USER / EMAIL_PASS missing); skip send to %s", to)
        return False

    msg = MIMEMultipart()
    msg["From"] = user
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        with smtplib.SMTP(host, port, timeout=20) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(msg)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send email to %s: %s", to, exc)
        return False
