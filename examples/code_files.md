# Code Files for Bug Detection

## TypeScript Files
```typescript
// Payment Service Implementation

export class PaymentService {
  private apiKey: string = "sk_live_1234"; // TODO: Move to environment variables
  
  async processPayment(amount: number, currency: string) {
    // FIXME: Add proper error handling for network failures
    try {
      // BUG: Currency validation is missing
      const result = await this.callPaymentAPI(amount, currency);
      
      // HACK: Temporary workaround for decimal precision
      const roundedAmount = Math.round(amount * 100) / 100;
      
      if (result.status === 'success') {
        // XXX: Should we log successful payments?
        return { success: true, transactionId: result.id };
      }
    } catch (error) {
      // TODO: Implement proper error logging
      console.error('Payment failed:', error);
      throw error;
    }
  }
  
  // DEPRECATED: Use processPayment instead
  async oldProcessPayment(amount: number) {
    // Legacy code - remove after migration
    return this.processPayment(amount, 'USD');
  }
  
  private async callPaymentAPI(amount: number, currency: string) {
    // FIXME: Add timeout and retry logic
    // BUG: API endpoint should be configurable
    const endpoint = 'https://api.payment.com/v1/charge';
    
    // TODO: Add request validation
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`, // HACK: Hardcoded auth
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, currency })
    });
    
    return response.json();
  }
}
```

## Python Files
```python
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
```
