#!/bin/bash
# Example: Team Bug Detection Workflow with breakdown find bugs
#
# This script demonstrates practical use of breakdown find bugs command
# in a team development workflow for automated code quality assurance.
#
# Demonstrates:
# - Automated bug detection in development workflow
# - Integration with code review process
# - Custom bug categorization and reporting
# - CI/CD pipeline integration patterns

# Add at the top after any initial setup:
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
pushd "$PROJECT_ROOT" > /dev/null

# Error handling function
handle_error() {
    echo -e "\033[1;31mError: Bug detection workflow failed\033[0m"
    echo "Use case: Team bug detection workflow"
    echo "Failed command: $FAILED_COMMAND"
    echo "Error details: $1"
    exit 1
}

# Error handling setup
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== Team Bug Detection Workflow with breakdown find bugs ==="
echo ""
echo "⚠️  WARNING: Due to BreakdownParams v1.0.1 limitations, this example is currently non-functional."
echo "See examples/KNOWN_LIMITATIONS.md for details."
echo ""
echo "Temporarily skipping demonstration..."
exit 0
echo "This example shows automated bug detection in team development"
echo

# Create output directories
mkdir -p tmp/examples/bug_workflow/reports
mkdir -p tmp/examples/bug_workflow/code_samples
mkdir -p tmp/examples/bug_workflow/fixes

# Team context variables
TEAM_NAME="Backend Development Team"
PROJECT_NAME="e-commerce-api"
BRANCH="feature/payment-integration"
REVIEWER="Senior Developer"

echo "🏢 Team Context:"
echo "  Team: $TEAM_NAME"
echo "  Project: $PROJECT_NAME"
echo "  Branch: $BRANCH"
echo "  Reviewer: $REVIEWER"
echo

# Example 1: Pre-commit Bug Detection
echo "🔍 Example 1: Pre-commit automated bug detection..."
cat > tmp/examples/bug_workflow/code_samples/payment_service.md << 'EOF'
# Payment Service Implementation

## New Feature: Credit Card Processing

### Core Implementation
```typescript
class PaymentService {
    private apiKey: string = "pk_live_abc123_hardcoded"; // BUG: Hardcoded API key
    
    async processPayment(amount: number, cardToken: string) {
        // BUG: Input validation missing
        const payload = {
            amount: amount,
            source: cardToken,
            currency: "usd"
        };
        
        // BUG: Error handling insufficient
        const response = await fetch("https://api.stripe.com/v1/charges", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(payload)
        });
        
        const result = await response.json();
        
        // BUG: Success assumption without checking
        return { success: true, transactionId: result.id };
    }
    
    // BUG: Sensitive data logging
    logTransaction(details: any) {
        console.log("Transaction details:", JSON.stringify(details));
    }
    
    validateCard(cardNumber: string): boolean {
        // BUG: Weak validation
        return cardNumber.length >= 13;
    }
}
```

### Database Integration
```typescript
async function savePaymentRecord(paymentData: any) {
    // BUG: SQL injection vulnerability
    const query = `
        INSERT INTO payments (amount, card_last_four, status) 
        VALUES (${paymentData.amount}, '${paymentData.cardLast4}', '${paymentData.status}')
    `;
    
    // BUG: No transaction handling
    await db.execute(query);
    
    // BUG: No error recovery
    return true;
}
```

## Code Review Notes
- New payment integration for credit card processing
- Needs security review before production deployment
- Performance testing required for high-volume scenarios
EOF

echo "Generating pre-commit bug detection report..."
.deno/bin/breakdown find bugs \
  --from tmp/examples/bug_workflow/code_samples/payment_service.md \
  -o tmp/examples/bug_workflow/reports/pre_commit_bugs.md

# Example 2: Code Review Bug Analysis
echo
echo "📝 Example 2: Code review bug analysis with detailed reporting..."
.deno/bin/breakdown find bugs \
  tmp/examples/bug_workflow/code_samples/payment_service.md \
  --extended \
  --error-format detailed \
  -o tmp/examples/bug_workflow/reports/code_review_analysis.md

# Example 3: Security-focused Bug Detection
echo
echo "🔒 Example 3: Security-focused bug detection..."
cat > tmp/examples/bug_workflow/code_samples/auth_module.md << 'EOF'
# Authentication Module Security Review

## JWT Token Implementation
```typescript
class AuthService {
    // BUG: Weak secret
    private jwtSecret = "secret123";
    
    generateToken(userId: string) {
        // BUG: No expiration time
        return jwt.sign({ userId }, this.jwtSecret);
    }
    
    verifyToken(token: string) {
        try {
            // BUG: No algorithm specification
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            // BUG: Error info leakage
            throw new Error(`JWT verification failed: ${error.message}`);
        }
    }
}
```

## Password Handling
```typescript
async function changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await getUserById(userId);
    
    // BUG: Plaintext password comparison
    if (user.password !== oldPassword) {
        throw new Error("Invalid old password");
    }
    
    // BUG: No password strength validation
    // BUG: Plaintext password storage
    await updateUser(userId, { password: newPassword });
    
    // BUG: Sensitive data in logs
    console.log(`Password changed for user ${userId}: ${newPassword}`);
}
```
EOF

echo "Generating security-focused bug analysis..."
.deno/bin/breakdown find bugs \
  --from tmp/examples/bug_workflow/code_samples/auth_module.md \
  --extended \
  -o tmp/examples/bug_workflow/reports/security_analysis.md

# Example 4: Batch Bug Detection for Multiple Files
echo
echo "📊 Example 4: Batch bug detection workflow..."

# Create multiple code samples
cat > tmp/examples/bug_workflow/code_samples/api_endpoints.md << 'EOF'
# API Endpoints Implementation

```typescript
// BUG: No rate limiting
app.post('/api/upload', (req, res) => {
    // BUG: No file size limit
    // BUG: No file type validation
    const file = req.file;
    
    // BUG: Path traversal vulnerability
    const uploadPath = `./uploads/${req.body.filename}`;
    
    fs.writeFileSync(uploadPath, file.buffer);
    res.json({ success: true });
});

// BUG: No authentication
app.get('/api/admin/users', (req, res) => {
    // BUG: No pagination
    const users = db.getAllUsers();
    res.json(users);
});
```
EOF

# Process multiple files
echo "Processing multiple code files for comprehensive analysis..."
for file in tmp/examples/bug_workflow/code_samples/*.md; do
    filename=$(basename "$file" .md)
    echo "Analyzing: $filename"
    .deno/bin/breakdown find bugs \
      --from "$file" \
      -o "tmp/examples/bug_workflow/reports/${filename}_bugs.md"
done

# Example 5: STDIN workflow for quick checks
echo
echo "⚡ Example 5: Quick bug check via STDIN..."
QUICK_CODE_CHECK="
# Quick code snippet for review
\`\`\`javascript
function getUserData(id) {
    // BUG: No input validation
    return database.query('SELECT * FROM users WHERE id = ' + id);
}
\`\`\`
"

echo "Processing quick code snippet via STDIN..."
echo "$QUICK_CODE_CHECK" | .deno/bin/breakdown find bugs \
  -o tmp/examples/bug_workflow/reports/quick_check.md

# Display comprehensive results
echo
echo "✅ Team bug detection workflow completed!"
echo
echo "📁 Generated Bug Analysis Reports:"
echo "├── pre_commit_bugs.md       - Pre-commit automated check"
echo "├── code_review_analysis.md  - Detailed code review analysis"
echo "├── security_analysis.md     - Security-focused analysis"
echo "├── payment_service_bugs.md  - Payment service bugs"
echo "├── auth_module_bugs.md      - Authentication module bugs"
echo "├── api_endpoints_bugs.md    - API endpoints bugs"
echo "└── quick_check.md           - Quick STDIN analysis"

echo
echo "🔍 Sample Bug Detection Results:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
head -15 tmp/examples/bug_workflow/reports/pre_commit_bugs.md 2>/dev/null || echo "Bug analysis completed - check individual reports"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo
echo "💡 Team Workflow Benefits:"
echo "  ✓ Automated pre-commit bug detection"
echo "  ✓ Standardized code review process"
echo "  ✓ Security vulnerability identification"
echo "  ✓ Comprehensive batch analysis capability"
echo "  ✓ Quick snippet validation via STDIN"
echo "  ✓ Integration-ready reporting format"

echo
echo "🚀 Integration Patterns:"
echo "  1. Git pre-commit hooks with bug detection"
echo "  2. CI/CD pipeline integration for automated QA"
echo "  3. Code review workflow enhancement"
echo "  4. Security audit automation"
echo "  5. Development environment integration"

echo
echo "📈 Quality Metrics Tracked:"
echo "  • Security vulnerabilities found and fixed"
echo "  • Logic errors detected pre-deployment"  
echo "  • Code quality improvement over time"
echo "  • Team adherence to coding standards"

popd > /dev/null
exit 0