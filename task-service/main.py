from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
import os
from sqlalchemy import create_engine, Column, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tasks.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class TaskModel(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    priority = Column(String, default="medium")
    status = Column(String, default="todo")
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"

class Task(TaskCreate):
    id: str
    status: str = "todo"
    created_at: str

<<<<<<< HEAD
=======
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
>>>>>>> main

@app.get("/health")
def health():
    return {"status": "healthy", "service": "task-service"}

@app.get("/tasks")
<<<<<<< HEAD
def list_tasks(db: Session = Depends(get_db)):
    tasks = db.query(TaskDB).all()
    return [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "status": task.status,
            "created_at": task.created_at.isoformat()
        }
        for task in tasks
    ]

@app.post("/tasks", status_code=201)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    task = TaskDB(
=======
async def list_tasks():
    async with SessionLocal() as session:
        result = await session.execute(text("SELECT * FROM tasks ORDER BY created_at DESC"))
        tasks = result.fetchall()
        return [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "priority": task.priority,
                "status": task.status,
                "created_at": task.created_at.isoformat()
            }
            for task in tasks
        ]

@app.post("/tasks", status_code=201)
async def create_task(task_in: TaskCreate):
    task = Task(
>>>>>>> main
        id=str(uuid4()),
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority,
        created_at=datetime.utcnow(),
    )
<<<<<<< HEAD
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "created_at": task.created_at.isoformat()
    }

@app.get("/tasks/{task_id}")
def get_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "created_at": task.created_at.isoformat()
    }

@app.patch("/tasks/{task_id}")
def update_task(task_id: str, update: dict, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in update.items():
        if hasattr(task, key) and key != "id":
            setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "created_at": task.created_at.isoformat()
    }

@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
=======
    
    async with SessionLocal() as session:
        db_task = TaskModel(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            created_at=datetime.fromisoformat(task.created_at.replace('Z', '+00:00'))
        )
        session.add(db_task)
        await session.commit()
        await session.refresh(db_task)
    
    return task

@app.get("/tasks/{task_id}")
async def get_task(task_id: str):
    async with SessionLocal() as session:
        result = await session.execute(text(f"SELECT * FROM tasks WHERE id = '{task_id}'"))
        task = result.fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "status": task.status,
            "created_at": task.created_at.isoformat()
        }

@app.patch("/tasks/{task_id}")
async def update_task(task_id: str, update: dict):
    async with SessionLocal() as session:
        result = await session.execute(text(f"SELECT * FROM tasks WHERE id = '{task_id}'"))
        task = result.fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Update fields
        update_fields = []
        for key, value in update.items():
            if hasattr(task, key) and key != "id":
                update_fields.append(f"{key} = '{value}'")
        
        if update_fields:
            await session.execute(
                text(f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = '{task_id}'")
            )
            await session.commit()
        
        # Get updated task
        result = await session.execute(text(f"SELECT * FROM tasks WHERE id = '{task_id}'"))
        updated_task = result.fetchone()
        
        return {
            "id": updated_task.id,
            "title": updated_task.title,
            "description": updated_task.description,
            "priority": updated_task.priority,
            "status": updated_task.status,
            "created_at": updated_task.created_at.isoformat()
        }

@app.delete("/tasks/{task_id}", status_code=204)
async def delete_task(task_id: str):
    async with SessionLocal() as session:
        result = await session.execute(text(f"SELECT * FROM tasks WHERE id = '{task_id}'"))
        task = result.fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        await session.execute(text(f"DELETE FROM tasks WHERE id = '{task_id}'"))
        await session.commit()
>>>>>>> main
