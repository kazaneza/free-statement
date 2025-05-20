from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..database import get_db_connection
from ..models import Branch, BranchCreate, BranchResponse
from ..auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(
    prefix="/api/branches",
    tags=["branches"]
)

@router.post("/", response_model=BranchResponse)
async def create_branch(branch: BranchCreate, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if branch code already exists
        cursor.execute("SELECT code FROM branches WHERE code = ?", branch.code)
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Branch code already exists")
        
        branch_id = str(uuid.uuid4())
        created_at = datetime.utcnow()
        
        cursor.execute("""
            INSERT INTO branches (id, code, name, created_at)
            VALUES (?, ?, ?, ?)
        """, (branch_id, branch.code, branch.name, created_at))
        
        conn.commit()
        
        return BranchResponse(
            id=branch_id,
            code=branch.code,
            name=branch.name,
            created_at=created_at
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/", response_model=List[BranchResponse])
async def get_branches(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, code, name, created_at FROM branches ORDER BY created_at DESC")
        branches = []
        for row in cursor.fetchall():
            branches.append(BranchResponse(
                id=row[0],
                code=row[1],
                name=row[2],
                created_at=row[3]
            ))
        return branches
    finally:
        cursor.close()
        conn.close()

@router.delete("/{branch_id}")
async def delete_branch(branch_id: str, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM branches WHERE id = ?", branch_id)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Branch not found")
        conn.commit()
        return {"message": "Branch deleted successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()