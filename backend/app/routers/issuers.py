from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from ..database import get_db_connection
from ..models import Issuer, IssuerCreate, IssuerResponse, ADUser
from ..auth import get_current_user, get_ad_users
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/issuers",
    tags=["issuers"]
)

@router.get("/ad-users", response_model=List[ADUser])
async def get_users_from_ad(
    search: str = Query(None, description="Search term for filtering users"),
    current_user: str = Depends(get_current_user)
):
    try:
        logger.debug(f"Searching AD users with term: {search}")
        users = get_ad_users(search)
        logger.debug(f"Found {len(users)} matching users")
        return users
    except Exception as e:
        logger.error(f"Error fetching AD users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=IssuerResponse)
async def create_issuer(issuer: IssuerCreate, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verify branch exists
        cursor.execute("SELECT id FROM branches WHERE id = ?", issuer.branch_id)
        if not cursor.fetchone():
            raise HTTPException(status_code=400, detail="Branch not found")
        
        # Verify user exists in AD
        ad_users = get_ad_users(issuer.name)
        if not any(user.username == issuer.name for user in ad_users):
            raise HTTPException(status_code=400, detail="User not found in Active Directory")
        
        issuer_id = str(uuid.uuid4())
        created_at = datetime.utcnow()
        
        cursor.execute("""
            INSERT INTO issuers (id, name, branch_id, created_at, active)
            VALUES (?, ?, ?, ?, ?)
        """, (issuer_id, issuer.name, issuer.branch_id, created_at, True))
        
        conn.commit()
        
        return IssuerResponse(
            id=issuer_id,
            name=issuer.name,
            branch_id=issuer.branch_id,
            created_at=created_at,
            active=True
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/", response_model=List[IssuerResponse])
async def get_issuers(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT i.id, i.name, i.branch_id, i.created_at, i.active 
            FROM issuers i
            JOIN branches b ON i.branch_id = b.id
            ORDER BY i.created_at DESC
        """)
        
        issuers = []
        for row in cursor.fetchall():
            issuers.append(IssuerResponse(
                id=row[0],
                name=row[1],
                branch_id=row[2],
                created_at=row[3],
                active=row[4]
            ))
        return issuers
    finally:
        cursor.close()
        conn.close()

@router.delete("/{issuer_id}")
async def delete_issuer(issuer_id: str, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM issuers WHERE id = ?", issuer_id)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Issuer not found")
        conn.commit()
        return {"message": "Issuer deleted successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.put("/{issuer_id}/toggle-active")
async def toggle_issuer_active(issuer_id: str, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE issuers 
            SET active = ~active 
            OUTPUT inserted.active
            WHERE id = ?
        """, issuer_id)
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Issuer not found")
            
        conn.commit()
        return {"active": bool(result[0])}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()