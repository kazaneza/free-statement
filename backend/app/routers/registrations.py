from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional  
from ..database import get_db_connection
from ..models import RegistrationCreate, RegistrationResponse
from ..auth import get_current_user
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/registrations",
    tags=["registrations"]
)

@router.get("/verify/{account_number}")
async def verify_account(
    account_number: str,
    current_user: str = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if account already exists in registrations
        cursor.execute("""
            SELECT id, full_name, phone_number, registration_date
            FROM registrations 
            WHERE account_number = ?
        """, account_number)
        
        existing_registration = cursor.fetchone()
        
        if existing_registration:
            return {
                "accountNumber": account_number,
                "isRegistered": True,
                "registrationDate": existing_registration[3],
                "accountDetails": {
                    "fullName": existing_registration[1],
                    "phoneNumber": existing_registration[2]
                }
            }
        
        # For demo purposes, return mock account details
        # In production, this would query your core banking system
        return {
            "accountNumber": account_number,
            "isRegistered": False,
            "accountDetails": {
                "fullName": "John Doe",
                "phoneNumber": "0788123456"
            }
        }
        
    except Exception as e:
        logger.error(f"Error verifying account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.post("/", response_model=RegistrationResponse)
async def register_account(
    registration: RegistrationCreate,
    current_user: str = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if account already exists
        cursor.execute("""
            SELECT id FROM registrations 
            WHERE account_number = ?
        """, registration.account_number)
        
        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Account already registered"
            )
        
        registration_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        cursor.execute("""
            INSERT INTO registrations (
                id, account_number, full_name, phone_number,
                email, id_number, registration_date, created_at,
                issued_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            registration_id,
            registration.account_number,
            registration.full_name,
            registration.phone_number,
            registration.email,
            registration.id_number,
            now,
            now,
            current_user
        ))
        
        conn.commit()
        
        return {
            "id": registration_id,
            "account_number": registration.account_number,
            "full_name": registration.full_name,
            "phone_number": registration.phone_number,
            "email": registration.email,
            "id_number": registration.id_number,
            "registration_date": now,
            "created_at": now,
            "issued_by": current_user
        }
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Error registering account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/stats")
async def get_registration_stats(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get total registrations
        cursor.execute("SELECT COUNT(*) FROM registrations")
        total_registrations = cursor.fetchone()[0]
        
        # Get today's registrations
        cursor.execute("""
            SELECT COUNT(*) 
            FROM registrations 
            WHERE CAST(registration_date AS DATE) = CAST(GETDATE() AS DATE)
        """)
        todays_registrations = cursor.fetchone()[0]
        
        # Get registrations by branch
        cursor.execute("""
            SELECT issued_by, COUNT(*) as count
            FROM registrations
            GROUP BY issued_by
            ORDER BY count DESC
        """)
        branch_stats = [{"branch": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        return {
            "total_registrations": total_registrations,
            "todays_registrations": todays_registrations,
            "branch_stats": branch_stats
        }
    finally:
        cursor.close()
        conn.close()

@router.put("/{registration_id}/issue")
async def mark_as_issued(
    registration_id: str,
    current_user: str = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE registrations 
            SET is_issued = 1 
            WHERE id = ?
        """, registration_id)
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registration not found")
            
        conn.commit()
        return {"message": "Statement marked as issued successfully"}
    except Exception as e:
        conn.rollback()
        logger.error(f"Error marking registration as issued: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# Also update the get_registrations endpoint to include filtering by issued status
@router.get("/", response_model=List[RegistrationResponse])
async def get_registrations(
    current_user: str = Depends(get_current_user),
    issued_only: bool = Query(False, description="Filter by issued statements only")
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        query = """
            SELECT id, account_number, full_name, phone_number,
                   email, id_number, registration_date, created_at,
                   issued_by, is_issued
            FROM registrations
        """
        
        # Add filter if requested
        if issued_only:
            query += " WHERE is_issued = 1"
            
        query += " ORDER BY registration_date DESC"
        
        cursor.execute(query)
        
        registrations = []
        for row in cursor.fetchall():
            registrations.append(RegistrationResponse(
                id=row[0],
                account_number=row[1],
                full_name=row[2],
                phone_number=row[3],
                email=row[4],
                id_number=row[5],
                registration_date=row[6],
                created_at=row[7],
                issued_by=row[8] if row[8] is not None else "",
                is_issued=bool(row[9]) if len(row) > 9 else False
            ))
        return registrations
    finally:
        cursor.close()
        conn.close()