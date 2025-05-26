from ldap3 import Server, Connection, ALL, SUBTREE

# LDAP config
LDAP_SERVER = 'ldap://bk.local'
LDAP_BASE_DN = 'DC=bk,DC=local'
LDAP_USERNAME = 'bk\\crmadmin'  # Try this format
LDAP_PASSWORD = 'BKsiege12'

# Connect to the server
server = Server(LDAP_SERVER, get_info=ALL)
conn = Connection(server, user=LDAP_USERNAME, password=LDAP_PASSWORD)
if not conn.bind():
    print("Bind failed:", conn.result)
else:
    print("Bind successful")
    # Filter: all user objects
    search_filter = '(objectClass=user)'

    # Search with ALL attributes
    conn.search(search_base=LDAP_BASE_DN,
                search_filter=search_filter,
                search_scope=SUBTREE,
                attributes='*')  # Use '*' to get all attributes

    # Display results
    for entry in conn.entries:
        print("=" * 40)
        print(entry)

    # Cleanup
    conn.unbind()
