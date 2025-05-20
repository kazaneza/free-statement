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
        cursor.execute("""
            SELECT id, full_name, phone_number, registration_date, is_issued
            FROM registrations 
            WHERE account_number = ?
        """, account_number)
        existing_registration = cursor.fetchone()
        if existing_registration:
            return {
                "accountNumber": account_number,
                "isRegistered": True,
                "registrationDate": existing_registration[3],
                "isIssued": bool(existing_registration[4]) if existing_registration[4] is not None else False,
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
def register_account(reg: RegistrationCreate, user=Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if account exists
        cursor.execute("SELECT id, is_issued FROM registrations WHERE account_number = ?", (reg.account_number,))
        row = cursor.fetchone()
        if row:
            reg_id, is_issued = row
            if is_issued:
                raise HTTPException(status_code=400, detail="Account has already received a free statement")
            # Update pending registration
            cursor.execute("""
                UPDATE registrations
                SET full_name=?, phone_number=?, email=?, id_number=?, registration_date=?, issued_by=?, is_issued=1
                WHERE id=?
            """, (
                reg.full_name, reg.phone_number, reg.email, reg.id_number,
                datetime.now(), user, reg_id
            ))
            conn.commit()
            # Fetch the updated record
            cursor.execute("""
                SELECT id, account_number, full_name, phone_number, email, id_number, registration_date, created_at, issued_by, is_issued
                FROM registrations WHERE id=?
            """, (reg_id,))
            updated_row = cursor.fetchone()
        else:
            # Insert new registration
            reg_id = str(uuid.uuid4())
            now = datetime.now()
            cursor.execute("""
                INSERT INTO registrations (id, account_number, full_name, phone_number, email, id_number, registration_date, created_at, issued_by, is_issued)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                reg_id, reg.account_number, reg.full_name, reg.phone_number, reg.email, reg.id_number,
                now, now, user
            ))
            conn.commit()
            # Fetch the inserted record
            cursor.execute("""
                SELECT id, account_number, full_name, phone_number, email, id_number, registration_date, created_at, issued_by, is_issued
                FROM registrations WHERE id=?
            """, (reg_id,))
            updated_row = cursor.fetchone()
        # Return all required fields
        return RegistrationResponse(
            id=updated_row[0],
            account_number=updated_row[1],
            full_name=updated_row[2],
            phone_number=updated_row[3],
            email=updated_row[4],
            id_number=updated_row[5],
            registration_date=updated_row[6],
            created_at=updated_row[7],
            issued_by=updated_row[8],
            is_issued=bool(updated_row[9])
        )
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

@router.patch("/{registration_id}/issue")
def issue_registration(registration_id: str, user=Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE registrations SET is_issued = 1 WHERE id = ?",
            (registration_id,)
        )
        conn.commit()
        return {"message": "Registration issued successfully."}
    except Exception as e:
        conn.rollback()
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

def get_issued_registrations():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM registrations WHERE is_issued = 1")
        results = cursor.fetchall()
        return results
    finally:
        cursor.close()
        conn.close()
