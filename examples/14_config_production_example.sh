#!/bin/bash
# Example 21: Production configuration with find bugs command
# This example demonstrates using 'breakdown find bugs' with production-app.yml configuration
set -euo pipefail

# Error handling
handle_error() {
    echo "Error: $1" >&2
    exit 1
}

# Set trap for better error reporting
trap 'handle_error "Command failed: ${BASH_COMMAND}"' ERR

# Get script directory and project root
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || handle_error "Failed to change to project root"

# Use the production configuration
CONFIG_NAME="production"

echo "Using production configuration: $CONFIG_NAME"
echo "This configuration enables the 'find bugs' two-parameter command"

# Create sample code with various bug indicators for testing
mkdir -p /tmp/production-test/src || handle_error "Failed to create temporary src directory"
cat > /tmp/production-test/src/payment_service.ts << 'EOF'
/**
 * Payment processing service
 * TODO: Add proper error handling for failed transactions
 */
export class PaymentService {
  private apiKey: string;
  
  constructor() {
    // FIXME: Move API key to environment variables
    this.apiKey = 'sk_test_hardcoded_key';
  }
  
  async processPayment(amount: number, currency: string) {
    // TODO: Validate amount and currency
    
    // HACK: Temporary workaround for decimal handling
    const roundedAmount = Math.round(amount * 100) / 100;
    
    try {
      // BUG: Race condition when processing multiple payments
      const result = await this.chargeCard(roundedAmount, currency);
      
      // XXX: This logging might expose sensitive data
      console.log('Payment processed:', result);
      
      return result;
    } catch (error) {
      // TODO: Implement proper error recovery
      throw error;
    }
  }
  
  // DEPRECATED: Use processPayment instead
  async oldChargeMethod(amount: number) {
    console.warn('This method is deprecated');
    return this.processPayment(amount, 'USD');
  }
  
  private async chargeCard(amount: number, currency: string) {
    // FIXME: Add retry logic for network failures
    return { status: 'success', amount, currency };
  }
}
EOF

cat > /tmp/production-test/src/user_auth.ts << 'EOF'
/**
 * User authentication module
 */
export class UserAuth {
  // TODO: Implement proper session management
  private sessions = new Map();
  
  async login(username: string, password: string) {
    // BUG: No password hashing implemented
    if (username === 'admin' && password === 'admin') {
      // HACK: Using timestamp as session ID
      const sessionId = Date.now().toString();
      this.sessions.set(sessionId, { username });
      return sessionId;
    }
    
    // FIXME: Timing attack vulnerability
    return null;
  }
  
  // XXX: Missing rate limiting
  async validateSession(sessionId: string) {
    return this.sessions.has(sessionId);
  }
  
  // TODO: Add logout functionality
}
EOF

cat > /tmp/production-test/README.md << 'EOF'
# Production Test Project

This is a sample project for testing bug detection.

## Known Issues

- TODO: Complete documentation
- FIXME: Update dependencies
- BUG: Memory leak in long-running processes

## Installation

```bash
# TODO: Add installation instructions
```

## Usage

See the code files for implementation details.

Note: This codebase contains several intentional bug indicators for testing purposes.
EOF

# Run breakdown find bugs with production configuration
echo -e "\n=== Running 'breakdown find bugs' with production configuration ==="
echo "Command: .deno/bin/breakdown find bugs --config production --from /tmp/production-test/src/payment_service.ts --destination /tmp/bug-report"
echo -e "\nSearching for bugs in /tmp/production-test using production-app.yml settings..."

# Execute the command
.deno/bin/breakdown find bugs --config production --from /tmp/production-test/src/payment_service.ts --destination /tmp/bug-report

# Show what the command found
echo -e "\n=== Bug Report Generated ==="
if [ -d "/tmp/bug-report" ]; then
  echo "Files created:"
  find /tmp/bug-report -type f -name "*.md" | while read -r file; do
    echo "  - $file"
  done
  
  # Display a sample of the report
  if [ -f "/tmp/bug-report/bug_report.md" ]; then
    echo -e "\n=== Sample of Bug Report ==="
    head -20 /tmp/bug-report/bug_report.md
  fi
else
  echo "No output directory created. Check if the command executed successfully."
fi

# Show configuration details used
echo -e "\n=== Production Configuration Details ==="
echo "The production-app.yml configuration includes:"
echo "  - Bug patterns: TODO, FIXME, HACK, BUG, XXX, DEPRECATED"
echo "  - File extensions: .ts, .js, .tsx, .jsx, .md"
echo "  - Excluded directories: node_modules, .git, dist, build, coverage, .obsidian"
echo "  - Maximum results: 100"
echo "  - Detailed reports: enabled"
echo "  - Bug detection sensitivity: medium"

# Clean up
echo -e "\n=== Cleaning up ==="
rm -rf /tmp/production-test /tmp/bug-report
echo "Temporary files removed."

echo -e "\nExample completed successfully!"