"""Todo CRUD routes."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import TodoItem, User
from schemas import TodoCreate, TodoResponse, TodoUpdate
from security import get_current_user

router = APIRouter(tags=["todos"])


@router.get("/api/todos")
async def get_todos(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    todos_list = db.query(TodoItem).all()
    result = []
    for t in todos_list:
        user = db.query(User).filter(User.id == t.user_id).first()
        result.append({
            "id": str(t.id),
            "title": t.title,
            "completed": t.completed,
            "due_date": t.due_date,
            "created_at": t.created_at,
            "created_by": user.name if user else "Unknown",
            "created_by_initials": user.initials if user else "?",
        })
    return result


@router.post("/api/todos", response_model=TodoResponse)
async def create_todo(todo: TodoCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_todo = TodoItem(
        user_id=current_user.id,
        title=todo.title,
        due_date=todo.due_date
    )
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)

    return TodoResponse(
        id=str(new_todo.id),
        title=new_todo.title,
        completed=new_todo.completed,
        due_date=new_todo.due_date,
        created_at=new_todo.created_at
    )


@router.patch("/api/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: str, todo: TodoUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_todo = db.query(TodoItem).filter(
        TodoItem.id == todo_id,
        TodoItem.user_id == current_user.id
    ).first()

    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    if todo.title is not None:
        db_todo.title = todo.title
    if todo.completed is not None:
        db_todo.completed = todo.completed
        if todo.completed:
            db_todo.completed_at = datetime.utcnow()
    if todo.due_date is not None:
        db_todo.due_date = todo.due_date

    db.commit()
    db.refresh(db_todo)

    return TodoResponse(
        id=str(db_todo.id),
        title=db_todo.title,
        completed=db_todo.completed,
        due_date=db_todo.due_date,
        created_at=db_todo.created_at
    )


@router.delete("/api/todos/{todo_id}")
async def delete_todo(todo_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_todo = db.query(TodoItem).filter(
        TodoItem.id == todo_id,
        TodoItem.user_id == current_user.id
    ).first()

    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    db.delete(db_todo)
    db.commit()

    return {"message": "Todo deleted"}
