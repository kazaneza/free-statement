from ldap3 import Server, Connection, ALL, SUBTREE, LEVEL, ASYNC
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from .config import get_settings
from .models import ADUser, RegistrationResponse
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_ldap_credentials(username: str, password: str):
    try:
        logger.debug(f"Attempting LDAP authentication for user: {username}")
        server = Server(settings.ldap_server, get_info=ALL)
        
        # Try direct bind first with UPN
        upn = f"{username}@bk.local"
        logger.debug(f"Attempting direct bind with UPN: {upn}")
        
        try:
            conn = Connection(server, user=upn, password=password)
            if conn.bind():
                logger.debug("Direct bind successful")
                return True
        except Exception as e:
            logger.debug(f"Direct bind failed: {str(e)}")
        
        # If direct bind fails, try CN-based bind
        try:
            cn_dn = f"CN={username},{settings.ldap_base_dn}"
            logger.debug(f"Attempting CN-based bind with DN: {cn_dn}")
            
            conn = Connection(server, user=cn_dn, password=password)
            if conn.bind():
                logger.debug("CN-based bind successful")
                return True
        except Exception as e:
            logger.debug(f"CN-based bind failed: {str(e)}")
        
        # If both methods fail, try searching for the user
        search_connection = Connection(server, auto_bind=True)
        search_filter = f"(|(sAMAccountName={username})(userPrincipalName={username}@bk.local))"
        
        search_connection.search(
            search_base=settings.ldap_base_dn,
            search_filter=search_filter,
            search_scope=SUBTREE,
            attributes=['distinguishedName']
        )
        
        if not search_connection.entries:
            logger.error(f"User {username} not found in LDAP")
            return False
            
        user_dn = search_connection.entries[0].distinguishedName.value
        logger.debug(f"Found user DN: {user_dn}")
        
        # Try binding with found DN
        user_connection = Connection(server, user=user_dn, password=password)
        if user_connection.bind():
            logger.debug("LDAP authentication successful")
            return True
            
        logger.error("LDAP bind failed - invalid credentials")
        return False
        
    except Exception as e:
        logger.error(f"LDAP Error: {str(e)}")
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=8)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def get_ad_users(search_term: str = None):
    try:
        logger.debug(f"Starting AD users fetch with search term: {search_term}")
        settings = get_settings()
        server = Server(settings.ldap_server, get_info=ALL)
        
        # Use the authenticated user's credentials for searching
        conn = Connection(server, auto_bind=True)
        logger.debug("LDAP connection established")
        
        # Build search filter for enabled users
        if search_term:
            search_filter = f'(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2))(|(sAMAccountName=*{search_term}*)(displayName=*{search_term}*)))'
        else:
            search_filter = '(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))'
        
        logger.debug(f"Using search filter: {search_filter}")
        
        # Perform the search
        conn.search(
            search_base=settings.ldap_base_dn,
            search_filter=search_filter,
            search_scope=SUBTREE,
            attributes=['sAMAccountName', 'displayName', 'mail', 'department']
        )
        
        logger.debug(f"Found {len(conn.entries)} users")
        
        users = []
        for entry in conn.entries:
            try:
                username = entry.sAMAccountName.value if hasattr(entry, 'sAMAccountName') else None
                if not username:
                    continue
                    
                display_name = entry.displayName.value if hasattr(entry, 'displayName') else username
                email = entry.mail.value if hasattr(entry, 'mail') else None
                department = entry.department.value if hasattr(entry, 'department') else None
                
                user = ADUser(
                    username=username,
                    display_name=display_name,
                    email=email,
                    department=department
                )
                users.append(user)
                logger.debug(f"Added user: {username}")
            except Exception as e:
                logger.error(f"Error processing user entry: {str(e)}")
                continue
        
        logger.debug(f"Successfully processed {len(users)} users")
        return users
        
    except Exception as e:
        logger.error(f"Error in get_ad_users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def register_user_to_db(user_data):
    try:
        logger.debug(f"Registering user to DB: {user_data}")
        settings = get_settings()
        server = Server(settings.ldap_server, get_info=ALL)
        
        # Connect to LDAP
        conn = Connection(server, auto_bind=True)
        logger.debug("LDAP connection established")
        
        # Prepare user attributes
        user_attributes = {
            'objectClass': ['top', 'person', 'organizationalPerson', 'user'],
            'sAMAccountName': user_data.username,
            'userPrincipalName': f"{user_data.username}@bk.local",
            'givenName': user_data.first_name,
            'sn': user_data.last_name,
            'displayName': user_data.display_name,
            'mail': user_data.email,
            'userAccountControl': '512',  # Normal account
            'department': user_data.department
        }
        
        # Add user to LDAP
        conn.add(
            dn=f"CN={user_data.username},{settings.ldap_base_dn}",
            attributes=user_attributes
        )
        
        if not conn.result['description'] == 'success':
            logger.error(f"Failed to add user to LDAP: {conn.result['description']}")
            raise HTTPException(status_code=500, detail="Failed to register user")
        
        logger.info(f"User registered successfully: {user_data.username}")
        
        # Fetch the newly created user row
        search_filter = f"(sAMAccountName={user_data.username})"
        conn.search(
            search_base=settings.ldap_base_dn,
            search_filter=search_filter,
            search_scope=SUBTREE,
            attributes=['distinguishedName', 'memberOf', 'whenCreated', 'lastLogon']
        )
        
        if not conn.entries:
            logger.error(f"User {user_data.username} not found after registration")
            raise HTTPException(status_code=500, detail="User not found after registration")
        
        updated_row = conn.entries[0]
        
        return RegistrationResponse(
            username=updated_row.sAMAccountName,
            email=updated_row.mail,
            display_name=updated_row.displayName,
            department=updated_row.department,
            registered_on=updated_row.whenCreated,
            last_login=updated_row.lastLogon,
            status="Active",
            issued_by=updated_row[8] if updated_row[8] else "",
        )
        
    except Exception as e:
        logger.error(f"Error in register_user_to_db: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))