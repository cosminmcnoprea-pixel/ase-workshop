from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Dict, Any
import os
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://taskuser:taskpass@postgres:5432/taskdb")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Analytics models
class TaskAnalytics(Base):
    __tablename__ = "task_analytics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False)  # YYYY-MM-DD format
    total_tasks = Column(Integer, default=0)
    completed_tasks = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    avg_priority_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.now)

class UserAnalytics(Base):
    __tablename__ = "user_analytics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False)  # YYYY-MM-DD format
    active_users = Column(Integer, default=0)
    new_users = Column(Integer, default=0)
    tasks_per_user = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.now)

class NotificationAnalytics(Base):
    __tablename__ = "notification_analytics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False)  # YYYY-MM-DD format
    total_notifications = Column(Integer, default=0)
    read_notifications = Column(Integer, default=0)
    read_rate = Column(Float, default=0.0)
    notifications_by_type = Column(Text, default="{}")  # JSON string
    created_at = Column(DateTime, default=datetime.now)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class TaskAnalyticsResponse(BaseModel):
    date: str
    total_tasks: int
    completed_tasks: int
    completion_rate: float
    avg_priority_score: float

class UserAnalyticsResponse(BaseModel):
    date: str
    active_users: int
    new_users: int
    tasks_per_user: float

class NotificationAnalyticsResponse(BaseModel):
    date: str
    total_notifications: int
    read_notifications: int
    read_rate: float
    notifications_by_type: Dict[str, int]

app = FastAPI(title="Analytics Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "healthy", "service": "analytics-service"}

@app.get("/analytics/tasks", response_model=List[TaskAnalyticsResponse])
def get_task_analytics(days: int = 7):
    """Get task analytics for the last N days"""
    db = SessionLocal()
    try:
        # Get analytics from database
        analytics = db.query(TaskAnalytics).order_by(TaskAnalytics.date.desc()).limit(days).all()
        
        # If no data, generate sample data
        if not analytics:
            return generate_sample_task_analytics(days)
        
        return [TaskAnalyticsResponse(
            date=task.date,
            total_tasks=task.total_tasks,
            completed_tasks=task.completed_tasks,
            completion_rate=task.completion_rate,
            avg_priority_score=task.avg_priority_score
        ) for task in analytics]
    finally:
        db.close()

@app.get("/analytics/users", response_model=List[UserAnalyticsResponse])
def get_user_analytics(days: int = 7):
    """Get user analytics for the last N days"""
    db = SessionLocal()
    try:
        analytics = db.query(UserAnalytics).order_by(UserAnalytics.date.desc()).limit(days).all()
        
        if not analytics:
            return generate_sample_user_analytics(days)
        
        return [UserAnalyticsResponse(
            date=user.date,
            active_users=user.active_users,
            new_users=user.new_users,
            tasks_per_user=user.tasks_per_user
        ) for user in analytics]
    finally:
        db.close()

@app.get("/analytics/notifications", response_model=List[NotificationAnalyticsResponse])
def get_notification_analytics(days: int = 7):
    """Get notification analytics for the last N days"""
    db = SessionLocal()
    try:
        analytics = db.query(NotificationAnalytics).order_by(NotificationAnalytics.date.desc()).limit(days).all()
        
        if not analytics:
            return generate_sample_notification_analytics(days)
        
        return [NotificationAnalyticsResponse(
            date=notif.date,
            total_notifications=notif.total_notifications,
            read_notifications=notif.read_notifications,
            read_rate=notif.read_rate,
            notifications_by_type=eval(notif.notifications_by_type) if notif.notifications_by_type else {}
        ) for notif in analytics]
    finally:
        db.close()

@app.get("/analytics/summary")
def get_analytics_summary():
    """Get overall analytics summary"""
    db = SessionLocal()
    try:
        # Get latest analytics
        latest_task = db.query(TaskAnalytics).order_by(TaskAnalytics.date.desc()).first()
        latest_user = db.query(UserAnalytics).order_by(UserAnalytics.date.desc()).first()
        latest_notification = db.query(NotificationAnalytics).order_by(NotificationAnalytics.date.desc()).first()
        
        return {
            "tasks": {
                "total_today": latest_task.total_tasks if latest_task else 0,
                "completed_today": latest_task.completed_tasks if latest_task else 0,
                "completion_rate": latest_task.completion_rate if latest_task else 0.0
            },
            "users": {
                "active_today": latest_user.active_users if latest_user else 0,
                "new_today": latest_user.new_users if latest_user else 0,
                "tasks_per_user": latest_user.tasks_per_user if latest_user else 0.0
            },
            "notifications": {
                "total_today": latest_notification.total_notifications if latest_notification else 0,
                "read_today": latest_notification.read_notifications if latest_notification else 0,
                "read_rate": latest_notification.read_rate if latest_notification else 0.0
            }
        }
    finally:
        db.close()

@app.post("/analytics/refresh")
def refresh_analytics():
    """Refresh analytics data (this would typically be called by a scheduled job)"""
    db = SessionLocal()
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Generate sample analytics data for today
        task_analytics = TaskAnalytics(
            date=today,
            total_tasks=45,
            completed_tasks=32,
            completion_rate=71.1,
            avg_priority_score=2.3
        )
        
        user_analytics = UserAnalytics(
            date=today,
            active_users=12,
            new_users=3,
            tasks_per_user=3.8
        )
        
        notification_analytics = NotificationAnalytics(
            date=today,
            total_notifications=28,
            read_notifications=19,
            read_rate=67.9,
            notifications_by_type='{"info": 15, "success": 8, "warning": 5}'
        )
        
        # Check if analytics for today already exist
        existing_task = db.query(TaskAnalytics).filter(TaskAnalytics.date == today).first()
        existing_user = db.query(UserAnalytics).filter(UserAnalytics.date == today).first()
        existing_notification = db.query(NotificationAnalytics).filter(NotificationAnalytics.date == today).first()
        
        if existing_task:
            db.delete(existing_task)
        if existing_user:
            db.delete(existing_user)
        if existing_notification:
            db.delete(existing_notification)
        
        db.add(task_analytics)
        db.add(user_analytics)
        db.add(notification_analytics)
        db.commit()
        
        return {"message": "Analytics refreshed successfully"}
    finally:
        db.close()

# Helper functions for sample data
def generate_sample_task_analytics(days: int) -> List[TaskAnalyticsResponse]:
    """Generate sample task analytics data"""
    analytics = []
    for i in range(days):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        analytics.append(TaskAnalyticsResponse(
            date=date,
            total_tasks=40 + i * 2,
            completed_tasks=30 + i,
            completion_rate=75.0 + i * 0.5,
            avg_priority_score=2.2 + i * 0.1
        ))
    return analytics

def generate_sample_user_analytics(days: int) -> List[UserAnalyticsResponse]:
    """Generate sample user analytics data"""
    analytics = []
    for i in range(days):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        analytics.append(UserAnalyticsResponse(
            date=date,
            active_users=10 + i,
            new_users=2 + i // 3,
            tasks_per_user=3.5 + i * 0.1
        ))
    return analytics

def generate_sample_notification_analytics(days: int) -> List[NotificationAnalyticsResponse]:
    """Generate sample notification analytics data"""
    analytics = []
    for i in range(days):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        analytics.append(NotificationAnalyticsResponse(
            date=date,
            total_notifications=20 + i * 3,
            read_notifications=15 + i * 2,
            read_rate=75.0 + i * 0.3,
            notifications_by_type={"info": 10 + i, "success": 5 + i, "warning": 5 + i}
        ))
    return analytics

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4002)
