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
        # Check if branches table exists
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='branches' AND xtype='U')
            CREATE TABLE branches (
                id VARCHAR(36) PRIMARY KEY,
                code VARCHAR(10) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                created_at DATETIME NOT NULL DEFAULT GETDATE()
            )
        """)

        # Check if issuers table exists
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='issuers' AND xtype='U')
            CREATE TABLE issuers (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                branch_id VARCHAR(36) NOT NULL,
                created_at DATETIME NOT NULL DEFAULT GETDATE(),
                active BIT NOT NULL DEFAULT 1,
                FOREIGN KEY (branch_id) REFERENCES branches(id)
            )
        """)

        # Check if registrations table exists
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
                created_at DATETIME NOT NULL DEFAULT GETDATE()
            )
        """)

        # Check if statement_history table exists
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='statement_history' AND xtype='U')
            CREATE TABLE statement_history (
                id VARCHAR(36) PRIMARY KEY,
                registration_id VARCHAR(36) NOT NULL,
                issuer_id VARCHAR(36) NOT NULL,
                statement_url VARCHAR(500),
                issue_date DATETIME NOT NULL DEFAULT GETDATE(),
                created_at DATETIME NOT NULL DEFAULT GETDATE(),
                FOREIGN KEY (registration_id) REFERENCES registrations(id),
                FOREIGN KEY (issuer_id) REFERENCES issuers(id)
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