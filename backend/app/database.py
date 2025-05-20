import pyodbc
from .config import get_settings

settings = get_settings()

def get_db_connection():
    try:
        conn = pyodbc.connect(settings.db_connection_string)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create registrations table
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='registrations' AND xtype='U')
            CREATE TABLE registrations (
                id VARCHAR(36) PRIMARY KEY,
                account_number VARCHAR(20) NOT NULL UNIQUE,
                full_name VARCHAR(100) NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                email VARCHAR(100),
                id_number VARCHAR(50),
                registration_date DATETIME NOT NULL,
                created_at DATETIME NOT NULL DEFAULT GETDATE(),
                has_statement INT NOT NULL DEFAULT 0,
                issued_by VARCHAR(100) NOT NULL
            )
        """)
        
        conn.commit()
    except Exception as e:
        print(f"Error initializing database: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()