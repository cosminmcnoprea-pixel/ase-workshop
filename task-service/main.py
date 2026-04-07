from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Text, Boolean, TIMESTAMP, text
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./tasks.db")
engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class TaskModel(Base):
    __tablename__ = "tasks"
    
    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    status: Mapped[str] = mapped_column(String(20), default="todo")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)

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

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
def health():
    return {"status": "healthy", "service": "task-service"}

@app.get("/tasks")
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
        id=str(uuid4()),
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority,
        created_at=datetime.now().isoformat(),
    )
    
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
