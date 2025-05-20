```python
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
    has_statement: int = 0
    issued_by: str

class ADUser(BaseModel):
    username: str
    display_name: str
    email: Optional[str] = None
    department: Optional[str] = None
```