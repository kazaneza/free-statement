from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RegistrationCreate(BaseModel):
    account_number: str
    full_name: str
    phone_number: str
    email: Optional[str] = None
    id_number: Optional[str] = None

class RegistrationResponse(BaseModel):
    id: str
    account_number: str
    full_name: str
    phone_number: str
    email: Optional[str] = None
    id_number: Optional[str] = None
    registration_date: datetime
    created_at: datetime
    issued_by: Optional[str] = None  

class ADUser(BaseModel):
    username: str
    display_name: str
    email: Optional[str] = None
    department: Optional[str] = None