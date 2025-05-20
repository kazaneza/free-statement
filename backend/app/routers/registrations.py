from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from ..database import get_db_connection
from ..models import (
    Registration, RegistrationCreate, RegistrationResponse,
    BulkRegistrationItem, StatementHistory, StatementHistoryCreate, StatementHistoryResponse
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
            SELECT b.name as branch_name, COUNT(sh.id) as count
            FROM branches b
            LEFT JOIN issuers i ON i.branch_id = b.id
            LEFT JOIN statement_history sh ON sh.issuer_id = i.id
            GROUP BY b.name
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

@router.post("/bulk", response_model=dict)
async def create_bulk_registrations(
    registrations: List[BulkRegistrationItem],
    current_user: str = Depends(get_current_user)
):
    logger.debug(f"Processing bulk registration request: {len(registrations)} items")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    results = {
        "success": 0,
        "failed": 0,
        "errors": []
    }
    
    try:
        for idx, reg in enumerate(registrations, 1):
            try:
                # Validate required fields
                if not reg.account_number or not reg.customer_name or not reg.phone_number:
                    raise ValueError("Missing required fields")

                # Check if account number already exists
                cursor.execute("""
                    SELECT id FROM registrations 
                    WHERE account_number = ?
                """, reg.account_number)
                
                if cursor.fetchone():
                    raise ValueError("Account number already registered")

                reg_id = str(uuid.uuid4())
                registration_date = datetime.utcnow()
                
                cursor.execute("""
                    INSERT INTO registrations (
                        id, account_number, full_name, phone_number,
                        registration_date, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    reg_id,
                    reg.account_number,
                    reg.customer_name,
                    reg.phone_number,
                    registration_date,
                    datetime.utcnow()
                ))
                
                results["success"] += 1
                
            except ValueError as ve:
                results["failed"] += 1
                results["errors"].append(f"Row {idx}: {str(ve)}")
                logger.warning(f"Validation error in row {idx}: {str(ve)}")
                continue
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Row {idx}: {str(e)}")
                logger.error(f"Error processing row {idx}: {str(e)}")
                continue
        
        conn.commit()
        logger.info(f"Bulk registration completed: {results['success']} successful, {results['failed']} failed")
        return results
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Bulk registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/", response_model=List[RegistrationResponse])
async def get_registrations(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT r.id, r.account_number, r.full_name, r.phone_number,
                   r.email, r.id_number, r.registration_date, r.created_at,
                   sh.statement_url, i.name as issuer_name
            FROM registrations r
            LEFT JOIN statement_history sh ON sh.registration_id = r.id
            LEFT JOIN issuers i ON i.id = sh.issuer_id
            ORDER BY r.created_at DESC
        """)
        
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
                created_at=row[7]
            ))
        return registrations
    finally:
        cursor.close()
        conn.close()

@router.post("/statement-history", response_model=StatementHistoryResponse)
async def create_statement_history(
    statement: StatementHistoryCreate,
    current_user: str = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        statement_id = str(uuid.uuid4())
        issue_date = datetime.utcnow()
        
        cursor.execute("""
            INSERT INTO statement_history (
                id, registration_id, issuer_id, statement_url,
                issue_date, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            statement_id,
            statement.registration_id,
            statement.issuer_id,
            statement.statement_url,
            issue_date,
            datetime.utcnow()
        ))
        
        conn.commit()
        
        return StatementHistoryResponse(
            id=statement_id,
            registration_id=statement.registration_id,
            issuer_id=statement.issuer_id,
            statement_url=statement.statement_url,
            issue_date=issue_date,
            created_at=datetime.utcnow()
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()