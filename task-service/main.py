from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
from sqlalchemy.orm import Session
from database import TaskDB, get_db, init_db

app = FastAPI(title="Task Service", version="1.0.0")

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

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


@app.get("/health")
def health():
    return {"status": "healthy", "service": "task-service"}

@app.get("/tasks")
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
        id=str(uuid4()),
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority,
        created_at=datetime.utcnow(),
    )
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
