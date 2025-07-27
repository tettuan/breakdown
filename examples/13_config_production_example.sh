#!/bin/bash
# Example 10: Production configuration with bug detection
# This example demonstrates the two-parameter command with production settings

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Production Find Bugs Example ==="

# Run from examples directory
CONFIG_DIR="./.agent/breakdown/config"

# Check if initialized
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Project not initialized. Please run 'breakdown init' first."
    exit 1
fi

# Ensure local template directories exist
echo "Setting up local production template directories..."
mkdir -p prompts/production/defect/issue

# Create production configuration with find bugs settings
# Create production configuration with find bugs settings (only if it doesn't exist)
if [ ! -f "${CONFIG_DIR}/production-bugs-app.yml" ]; then
  cat > "${CONFIG_DIR}/production-bugs-app.yml" << 'EOF'
# Breakdown Configuration for Production Bugs Profile
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^[a-z]+$"
    layerType:
      pattern: "^[a-z]+$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
production_mode: true
bug_detection: true
EOF
  echo "Created production bugs configuration: ${CONFIG_DIR}/production-bugs-app.yml"
else
  echo "Using existing production bugs configuration: ${CONFIG_DIR}/production-bugs-app.yml"
fi

# Create sample code with various bug indicators
mkdir -p sample_code
cat > sample_code/payment_service.ts << 'EOF'
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
EOF

cat > sample_code/user_auth.py << 'EOF'
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
EOF

echo "Created sample code with bug indicators"

# Create a markdown file listing the code files
cat > code_files.md << EOF
# Code Files for Bug Detection

## TypeScript Files
\`\`\`typescript
$(cat sample_code/payment_service.ts)
\`\`\`

## Python Files
\`\`\`python
$(cat sample_code/user_auth.py)
\`\`\`
EOF

# Run breakdown find bugs command
echo ""
echo "Running breakdown find bugs command..."
echo "Command: deno run --allow-all ../cli/breakdown.ts find bugs --config=production-bugs < code_files.md"
deno run --allow-all ../cli/breakdown.ts find bugs --config=production-bugs < code_files.md > bugs_report.md

echo ""
echo "=== Bugs Report ==="
cat bugs_report.md

# Cleanup
rm -rf sample_code
rm -f code_files.md bugs_report.md

echo ""
echo "=== Production Find Bugs Example Completed ==="