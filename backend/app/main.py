from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from .auth import verify_ldap_credentials, create_access_token
from .routers.registrations import router as registrations_router
from .database import init_db
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title="Bank Statement Registration API")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    llow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(registrations_router)

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    logger.debug(f"Login attempt for user: {form_data.username}")
    
    if not verify_ldap_credentials(form_data.username, form_data.password):
        logger.error(f"Authentication failed for user: {form_data.username}")
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.debug(f"Authentication successful for user: {form_data.username}")
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/")
async def root():
    return {"message": "Bank Statement Registration API"}

# python -m uvicorn app.main:app --host 0.0.0.0 --port 9000