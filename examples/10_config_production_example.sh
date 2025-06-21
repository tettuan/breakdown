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
CONFIG_DIR=".agent/breakdown/config"

# Check if initialized
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Project not initialized. Please run 'breakdown init' first."
    exit 1
fi

# Create production configuration with find bugs settings
cat > "${CONFIG_DIR}/production-bugs-app.yml" << 'EOF'
# Production configuration with bug detection
working_dir: "."
app_prompt:
  base_dir: "prompts/production"
app_schema:
  base_dir: "schema/production"
  validation_enabled: true

# カスタムパラメータ設定
params:
  two:
    demonstrativeType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"

logger:
  level: "info"
  format: "json"
features:
  customConfig: true
  findBugs: true
customConfig:
  enabled: true
  findBugs:
    enabled: true
    sensitivity: "medium"
    patterns:
      - "TODO"
      - "FIXME"
      - "HACK"
      - "BUG"
      - "XXX"
      - "DEPRECATED"
    includeExtensions:
      - ".ts"
      - ".js"
      - ".py"
      - ".go"
    excludeDirectories:
      - "node_modules"
      - ".git"
      - "dist"
      - "build"
    maxResults: 100
    detailedReports: true
EOF

echo "Created production configuration with find bugs: ${CONFIG_DIR}/production-bugs-app.yml"

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
echo "Command: deno run -A ../cli/breakdown.ts defect issue --config=production-bugs < code_files.md"
deno run -A ../cli/breakdown.ts defect issue --config=production-bugs < code_files.md > bugs_report.md

echo ""
echo "=== Bugs Report ==="
cat bugs_report.md

# Cleanup
rm -rf sample_code
rm -f code_files.md bugs_report.md

echo ""
echo "=== Production Find Bugs Example Completed ==="