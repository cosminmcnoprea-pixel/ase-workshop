from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
import os
from sqlalchemy import create_engine, Column, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://taskuser:taskpass@postgres:5432/taskdb")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database model
class TaskModel(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    priority = Column(String, default="medium")
    status = Column(String, default="todo")
    created_at = Column(String, default=datetime.now().isoformat())

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"

class Task(TaskCreate):
    id: str
    status: str = "todo"
    created_at: str

app = FastAPI(title="Task Service", version="1.0.0")

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
    return {"status": "healthy", "service": "task-service"}

@app.get("/tasks")
def list_tasks():
    db = SessionLocal()
    try:
        tasks = db.query(TaskModel).all()
        return [Task(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            created_at=task.created_at
        ) for task in tasks]
    finally:
        db.close()

@app.post("/tasks", status_code=201)
def create_task(task_in: TaskCreate):
    db = SessionLocal()
    try:
        task = TaskModel(
            title=task_in.title,
            description=task_in.description,
            priority=task_in.priority,
            created_at=datetime.now().isoformat(),
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return Task(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            created_at=task.created_at
        )
    finally:
        db.close()

@app.get("/tasks/{task_id}")
def get_task(task_id: str):
    db = SessionLocal()
    try:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return Task(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            created_at=task.created_at
        )
    finally:
        db.close()

@app.patch("/tasks/{task_id}")
def update_task(task_id: str, update: dict):
    db = SessionLocal()
    try:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        for key, value in update.items():
            if hasattr(task, key) and key != "id":
                setattr(task, key, value)
        
        db.commit()
        db.refresh(task)
        return Task(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            created_at=task.created_at
        )
    finally:
        db.close()

@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: str):
    db = SessionLocal()
    try:
        task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        db.delete(task)
        db.commit()
    finally:
        db.close()
