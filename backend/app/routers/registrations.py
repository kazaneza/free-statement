```python
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..database import get_db_connection
from ..models import (
    Registration, RegistrationCreate, RegistrationResponse
)
from ..auth import get_current_user
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/registrations",
    tags=["registrations"]
)

@router.get("/verify/{account_number}", response_model=dict)
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
                has_statement, issued_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            registration_id,
            registration.account_number,
            registration.full_name,
            registration.phone_number,
            registration.email,
            registration.id_number,
            now,
            now,
            0,  # has_statement = 0 (no statement yet)
            current_user
        ))
        
        conn.commit()
        
        return {
            "id": registration_id,
            "accountNumber": registration.account_number,
            "fullName": registration.full_name,
            "phoneNumber": registration.phone_number,
            "email": registration.email,
            "idNumber": registration.id_number,
            "registrationDate": now,
            "hasStatement": 0,
            "issuedBy": current_user
        }
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Error registering account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/stats", response_model=dict)
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

@router.get("/", response_model=List[RegistrationResponse])
async def get_registrations(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, account_number, full_name, phone_number,
                   email, id_number, registration_date, created_at,
                   has_statement, issued_by
            FROM registrations
            ORDER BY registration_date DESC
        """)
        
        registrations = []
        for row in cursor.fetchall():
            registrations.append({
                "id": row[0],
                "accountNumber": row[1],
                "fullName": row[2],
                "phoneNumber": row[3],
                "email": row[4],
                "idNumber": row[5],
                "registrationDate": row[6],
                "createdAt": row[7],
                "hasStatement": row[8],
                "issuedBy": row[9]
            })
        return registrations
    finally:
        cursor.close()
        conn.close()
```