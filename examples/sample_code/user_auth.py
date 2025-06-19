# User Authentication Module

import hashlib
import time

class UserAuth:
    def __init__(self):
        # TODO: Initialize database connection
        self.users = {}  # FIXME: Replace with proper database
        
    def create_user(self, username, password):
        # BUG: No validation for username format
        if username in self.users:
            return False
            
        # XXX: Should we use bcrypt instead of SHA256?
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # HACK: Store user in memory for now
        self.users[username] = {
            'password': hashed_password,
            'created_at': time.time(),
            'failed_attempts': 0  # TODO: Implement account lockout
        }
        
        return True
        
    def authenticate(self, username, password):
        # FIXME: Add rate limiting to prevent brute force
        if username not in self.users:
            return False
            
        user = self.users[username]
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        if user['password'] == hashed_password:
            # TODO: Generate and return JWT token
            return True
        else:
            # BUG: Failed attempts counter not working
            user['failed_attempts'] += 1
            return False
            
    # DEPRECATED: Use authenticate() instead
    def login(self, username, password):
        # Legacy method - remove in v2.0
        return self.authenticate(username, password)
