from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import logging
from datetime import datetime
from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from bs4 import BeautifulSoup
import os
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Ticket Monitor Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class TicketStatus(str, Enum):
    AVAILABLE = "available"
    LOW_AVAILABILITY = "low_availability"
    SOLD_OUT = "sold_out"

@dataclass
class RouteInfo:
    origin: str = "Bucuresti"
    destination: str = "Tecuci"
    url: str = "https://www.cfrcalatori.ro/"  # CFR Calatori official site

class TicketInfo(BaseModel):
    route: str
    available_tickets: int
    status: TicketStatus
    last_checked: datetime
    next_departure: Optional[str] = None

class EmailConfig(BaseModel):
    smtp_server: str
    smtp_port: int
    sender_email: str
    sender_password: str
    recipient_email: str

class TicketMonitor:
    def __init__(self):
        self.email_config = self._load_email_config()
        self.route_info = RouteInfo()
        self.last_ticket_count = None
        
    def _load_email_config(self) -> EmailConfig:
        """Load email configuration from environment variables"""
        return EmailConfig(
            smtp_server=os.getenv("SMTP_SERVER", "smtp.gmail.com"),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            sender_email=os.getenv("SENDER_EMAIL", ""),
            sender_password=os.getenv("SENDER_PASSWORD", ""),
            recipient_email=os.getenv("RECIPIENT_EMAIL", "")
        )
    
    async def check_ticket_availability(self) -> TicketInfo:
        """Check ticket availability for Bucuresti-Tecuci route"""
        try:
            global current_available_tickets
            
            # Use the global variable instead of random generation
            available_tickets = current_available_tickets
            
            if available_tickets == 0:
                status = TicketStatus.SOLD_OUT
            elif available_tickets < 50:
                status = TicketStatus.LOW_AVAILABILITY
            else:
                status = TicketStatus.AVAILABLE
            
            ticket_info = TicketInfo(
                route=f"{self.route_info.origin} - {self.route_info.destination}",
                available_tickets=available_tickets,
                status=status,
                last_checked=datetime.now(),
                next_departure="14:30"  # Simulated next departure
            )
            
            # Check if we need to send notification
            await self._check_and_notify(ticket_info)
            
            self.last_ticket_count = available_tickets
            return ticket_info
            
        except Exception as e:
            logger.error(f"Error checking ticket availability: {e}")
            raise HTTPException(status_code=500, detail="Failed to check ticket availability")
    
    async def _check_and_notify(self, ticket_info: TicketInfo):
        """Check if notification should be sent and send it"""
        if not self.email_config.sender_email or not self.email_config.recipient_email:
            logger.warning("Email configuration not complete - skipping notification")
            return
        
        should_notify = False
        subject = ""
        message = ""
        
        # Notify if tickets become available
        if self.last_ticket_count == 0 and ticket_info.available_tickets > 0:
            should_notify = True
            subject = f" bilete disponibile! {ticket_info.route}"
            message = f"Bilete au devenit disponibile pe ruta {ticket_info.route}!\n\n"
            message += f"Bilete disponibile: {ticket_info.available_tickets}\n"
            message += f"Urmatoarea plecare: {ticket_info.next_departure}\n"
            message += f"Verificat la: {ticket_info.last_checked.strftime('%Y-%m-%d %H:%M:%S')}"
        
        # Notify if low availability (< 50 tickets)
        elif ticket_info.available_tickets < 50 and ticket_info.available_tickets > 0:
            if (self.last_ticket_count is None or 
                self.last_ticket_count >= 50 or 
                abs(self.last_ticket_count - ticket_info.available_tickets) > 10):
                should_notify = True
                subject = f"Atenionare: Puine bilete disponibile! {ticket_info.route}"
                message = f"Numar redus de bilete disponibile pe ruta {ticket_info.route}!\n\n"
                message += f"Bilete disponibile: {ticket_info.available_tickets}\n"
                message += f"Urmatoarea plecare: {ticket_info.next_departure}\n"
                message += f"Verificat la: {ticket_info.last_checked.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                message += "Recomandare: Rezervati curand pentru a va asigura un loc!"
        
        # Notify if sold out (was available before)
        elif self.last_ticket_count is not None and self.last_ticket_count > 0 and ticket_info.available_tickets == 0:
            should_notify = True
            subject = f"Epuizat! {ticket_info.route}"
            message = f"Toate biletele au fost epuizate pe ruta {ticket_info.route}!\n\n"
            message += f"Status: SOLD OUT\n"
            message += f"Verificat la: {ticket_info.last_checked.strftime('%Y-%m-%d %H:%M:%S')}"
        
        if should_notify:
            await self._send_email_notification(subject, message)
    
    async def _send_email_notification(self, subject: str, message: str):
        """Send email notification"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_config.sender_email
            msg['To'] = self.email_config.recipient_email
            msg['Subject'] = f"Ticket Monitor: {subject}"
            
            body = f"""
            {message}
            
            ---
            Aceasta este o notificare automata de la Ticket Monitor Service.
            Pentru a opri notificarile, contactati administratorul sistemului.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.email_config.smtp_server, self.email_config.smtp_port)
            server.starttls()
            server.login(self.email_config.sender_email, self.email_config.sender_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email notification sent: {subject}")
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")

# Global monitor instance
monitor = TicketMonitor()

# Global variable to store current ticket count
current_available_tickets = 50  # Start with 50 tickets

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ticket-monitor"}

@app.get("/tickets/check", response_model=TicketInfo)
async def check_tickets():
    """Check current ticket availability"""
    return await monitor.check_ticket_availability()

@app.get("/tickets/status")
async def get_status():
    """Get current monitoring status"""
    return {
        "route": f"{monitor.route_info.origin} - {monitor.route_info.destination}",
        "last_check": monitor.last_ticket_count,
        "monitoring_active": True,
        "email_configured": bool(monitor.email_config.sender_email and monitor.email_config.recipient_email)
    }

@app.post("/tickets/add")
async def add_tickets():
    """Add one ticket to the available count"""
    global current_available_tickets
    current_available_tickets += 1
    
    logger.info(f"Ticket added. New count: {current_available_tickets}")
    
    return {
        "message": "Ticket added successfully",
        "available_tickets": current_available_tickets,
        "route": f"{monitor.route_info.origin} - {monitor.route_info.destination}"
    }

@app.post("/tickets/notify/test")
async def test_notification():
    """Send a test email notification"""
    if not monitor.email_config.sender_email or not monitor.email_config.recipient_email:
        raise HTTPException(status_code=400, detail="Email configuration not complete")
    
    try:
        await monitor._send_email_notification(
            "Test Notification",
            "Acesta este un test de la Ticket Monitor Service. Sistemul functioneaza corect!"
        )
        return {"message": "Test notification sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test notification: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
