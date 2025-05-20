from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    db_driver: str = os.getenv("DRIVER")
    db_server: str = os.getenv("DB_SERVER")
    db_name: str = os.getenv("DB_NAME")
    db_username: str = os.getenv("DB_USERNAME")
    db_password: str = os.getenv("DB_PASSWORD")
    ldap_server: str = os.getenv("LDAP_SERVER")
    ldap_base_dn: str = os.getenv("LDAP_BASE_DN")
    ldap_username: str = os.getenv("LDAP_USERNAME", "crmadmin")
    ldap_password: str = os.getenv("LDAP_PASSWORD", "admin123")
    jwt_secret: str = os.getenv("JWT_SECRET")
    
    @property
    def db_connection_string(self) -> str:
        return f"DRIVER={self.db_driver};SERVER={self.db_server};DATABASE={self.db_name};UID={self.db_username};PWD={self.db_password}"

@lru_cache()
def get_settings():
    return Settings()