from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Branch(BaseModel):
    id: Optional[str] = None
    code: str
    name: str
    created_at: Optional[datetime] = None

class BranchCreate(BaseModel):
    code: str
    name: str

class BranchResponse(Branch):
    pass

class Issuer(BaseModel):
    id: Optional[str] = None
    name: str
    branch_id: str
    created_at: Optional[datetime] = None
    active: bool = True

class IssuerCreate(BaseModel):
    name: str
    branch_id: str

class IssuerResponse(Issuer):
    pass

class ADUser(BaseModel):
    username: str
    display_name: str
    email: Optional[str] = None
    department: Optional[str] = None

class Registration(BaseModel):
    id: Optional[str] = None
    account_number: str
    full_name: str
    phone_number: str
    email: Optional[str] = None
    id_number: Optional[str] = None
    registration_date: datetime
    created_at: Optional[datetime] = None

class RegistrationCreate(BaseModel):
    account_number: str
    full_name: str
    phone_number: str
    email: Optional[str] = None
    id_number: Optional[str] = None

class RegistrationResponse(Registration):
    pass

class StatementHistory(BaseModel):
    id: Optional[str] = None
    registration_id: str
    issuer_id: str
    statement_url: Optional[str] = None
    issue_date: datetime
    created_at: Optional[datetime] = None

class StatementHistoryCreate(BaseModel):
    registration_id: str
    issuer_id: str
    statement_url: Optional[str] = None

class StatementHistoryResponse(StatementHistory):
    pass

class BulkRegistrationItem(BaseModel):
    account_number: str
    customer_name: str
    phone_number: str