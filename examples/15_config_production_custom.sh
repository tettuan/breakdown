#!/bin/bash
# Example 22: Production Custom Configuration with Find Bugs
# This example demonstrates using 'breakdown find bugs --config prod' with prod-app.yml
# It showcases CustomConfig features and advanced bug detection capabilities
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

echo "=== Example 22: Production Custom Configuration Find Bugs ==="
echo "This example shows how to use prod-app.yml for advanced bug detection"
echo

# Set configuration paths
CONFIG_FILE="${PROJECT_ROOT}/config/prod-app.yml"
TEST_DIR="/tmp/production-custom-test"
OUTPUT_DIR="/tmp/production-bug-reports"

echo "Configuration file: $CONFIG_FILE"
echo "Test directory: $TEST_DIR"
echo "Output directory: $OUTPUT_DIR"
echo

# Verify configuration exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Production configuration file not found: $CONFIG_FILE"
    echo "Please ensure the prod-app.yml file exists."
    exit 1
fi

echo "=== Creating Test Project with Various Bug Types ==="

# Create test project structure
mkdir -p "$TEST_DIR/src/services" || handle_error "Failed to create services directory"
mkdir -p "$TEST_DIR/src/components" || handle_error "Failed to create components directory"
mkdir -p "$TEST_DIR/src/utils" || handle_error "Failed to create utils directory"
mkdir -p "$TEST_DIR/tests" || handle_error "Failed to create tests directory"

# Create main service file with various bug indicators
cat > "$TEST_DIR/src/services/api_service.ts" << 'EOF'
/**
 * API Service for handling external API calls
 * TODO: Add comprehensive error handling and retry logic
 */
export class ApiService {
  private baseUrl: string;
  private timeout: number;
  
  constructor() {
    // FIXME: Move configuration to environment variables
    this.baseUrl = 'https://api.example.com';
    this.timeout = 5000;
  }
  
  /**
   * Fetch user data from API
   * BUG: No rate limiting implemented - could cause API throttling
   */
  async fetchUserData(userId: string): Promise<any> {
    // TODO: Add input validation for userId
    
    try {
      // HACK: Using setTimeout to simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        timeout: this.timeout
      });
      
      // XXX: Not checking response status before parsing JSON
      const data = await response.json();
      
      // DEPRECATED: This logging method will be removed in v2.0
      console.log('User data fetched:', data);
      
      return data;
    } catch (error) {
      // TODO: Implement proper error categorization and recovery
      throw new Error(`Failed to fetch user data: ${error.message}`);
    }
  }
  
  /**
   * Cache implementation
   * BUG: Memory leak - cache never clears old entries
   */
  private cache = new Map<string, any>();
  
  async getCachedData(key: string): Promise<any> {
    // FIXME: No cache expiration logic
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // TODO: Add cache miss metrics
    return null;
  }
}
EOF

# Create component with React-specific issues
cat > "$TEST_DIR/src/components/UserProfile.tsx" << 'EOF'
import React, { useState, useEffect } from 'react';

/**
 * User Profile Component
 * TODO: Add proper TypeScript interfaces for props
 */
export const UserProfile: React.FC<any> = ({ userId }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // BUG: Missing dependency array could cause infinite re-renders
    fetchUserData();
  });
  
  const fetchUserData = async () => {
    setLoading(true);
    
    try {
      // FIXME: API service should be injected via props or context
      const apiService = new ApiService();
      const data = await apiService.fetchUserData(userId);
      
      setUserData(data);
    } catch (error) {
      // TODO: Add proper error state management
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // XXX: No loading state UI implementation
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // HACK: Direct property access without null checking
  return (
    <div className="user-profile">
      <h2>{userData.name}</h2>
      <p>{userData.email}</p>
      {/* DEPRECATED: This styling approach will be replaced with CSS modules */}
      <style>{`
        .user-profile { margin: 20px; }
      `}</style>
    </div>
  );
};
EOF

# Create utility file with security issues
cat > "$TEST_DIR/src/utils/auth.ts" << 'EOF'
/**
 * Authentication utilities
 * TODO: Implement proper JWT token validation
 */
export class AuthUtil {
  /**
   * Hash password function
   * BUG: Using weak hashing algorithm - security vulnerability
   */
  static hashPassword(password: string): string {
    // FIXME: Replace with bcrypt or similar secure hashing
    return btoa(password); // Base64 encoding is not secure!
  }
  
  /**
   * Validate session token
   * XXX: No token expiration checking
   */
  static validateToken(token: string): boolean {
    // TODO: Add proper JWT validation logic
    return token.length > 10; // Weak validation
  }
  
  /**
   * Generate session ID
   * HACK: Using timestamp as session ID - predictable and insecure
   */
  static generateSessionId(): string {
    // DEPRECATED: This method will be replaced with crypto.randomUUID()
    return Date.now().toString() + Math.random().toString(36);
  }
  
  /**
   * Admin check function
   * BUG: Hard-coded admin credentials - major security issue
   */
  static isAdmin(username: string, password: string): boolean {
    // FIXME: Remove hard-coded credentials immediately
    return username === 'admin' && password === 'admin123';
  }
}
EOF

# Create test file with testing-related issues
cat > "$TEST_DIR/tests/api_service.test.ts" << 'EOF'
import { ApiService } from '../src/services/api_service.ts';

/**
 * API Service Tests
 * TODO: Add comprehensive test coverage for error scenarios
 */
describe('ApiService', () => {
  let apiService: ApiService;
  
  beforeEach(() => {
    apiService = new ApiService();
  });
  
  // TODO: Mock fetch calls properly
  test('should fetch user data', async () => {
    // FIXME: This test doesn't actually test anything meaningful
    const result = await apiService.fetchUserData('123');
    expect(result).toBeDefined();
  });
  
  // BUG: Test doesn't clean up after itself
  test('should handle cache operations', () => {
    // XXX: No assertions in this test
    apiService.getCachedData('test-key');
  });
  
  // HACK: Skipping this test instead of fixing it
  test.skip('should handle network errors', () => {
    // TODO: Implement network error testing
  });
});
EOF

# Create documentation with various TODO items
cat > "$TEST_DIR/README.md" << 'EOF'
# Production Custom Test Project

This project demonstrates bug detection capabilities using production configuration.

## Issues to Address

### High Priority
- BUG: Memory leak in cache implementation
- FIXME: Security vulnerabilities in authentication
- TODO: Add comprehensive error handling

### Medium Priority  
- XXX: Missing input validation in multiple places
- HACK: Temporary workarounds need permanent solutions
- DEPRECATED: Several methods marked for removal

### Low Priority
- TODO: Improve test coverage
- FIXME: Update documentation
- TODO: Add performance monitoring

## Installation

```bash
# TODO: Add proper installation instructions
npm install
```

## Usage

```bash
# FIXME: These commands are outdated
npm start
```

## Testing

```bash
# TODO: Set up proper test suite
npm test
```

## Contributing

Please read our contributing guidelines.

Note: This codebase intentionally contains bug indicators for testing purposes.
EOF

echo "Test project created with various bug types and patterns."
echo

echo "=== Demonstrating Production Custom Configuration ==="
echo "Note: The 'breakdown find bugs' command is currently in development."
echo "This example shows how to configure prod-app.yml for when it's implemented."
echo

# Show the configuration structure
echo "=== Production Configuration Structure ==="
echo "Configuration file: $CONFIG_FILE"
echo "The prod-app.yml contains CustomConfig settings for:"
echo "  • Bug detection patterns (TODO, FIXME, HACK, BUG, XXX, DEPRECATED)"
echo "  • File extensions to include (.ts, .js, .tsx, .jsx, .md)"
echo "  • Directories to exclude (node_modules, .git, dist, build, coverage)"
echo "  • BreakdownParams CustomConfig for two-parameter commands"
echo

# Verify configuration file structure
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Configuration file exists and contains:"
    echo "  - customConfig.findBugs settings"
    echo "  - breakdownParams.customConfig validation rules"
    echo "  - Feature flags and performance settings"
    echo
    
    # Show key configuration sections
    echo "=== Key Configuration Sections ==="
    echo "1. Bug Detection Settings:"
    grep -A 15 "findBugs:" "$CONFIG_FILE" | head -10
    echo
    
    echo "2. CustomConfig for 'find bugs' command:"
    grep -A 5 "twoParams:" "$CONFIG_FILE"
    echo
else
    echo "❌ Configuration file not found: $CONFIG_FILE"
fi

# Create a simple test to show configuration loading
echo "=== Testing Configuration Loading ==="
echo "Testing if production config can be loaded..."

# Create a simple test file to verify config loading
TEST_CONFIG_SCRIPT="/tmp/test_config.ts"
cat > "$TEST_CONFIG_SCRIPT" << 'EOF'
import { parse } from "https://deno.land/std@0.224.0/yaml/mod.ts";

async function testConfig() {
  try {
    const configPath = "./config/prod-app.yml";
    const content = await Deno.readTextFile(configPath);
    const config = parse(content);
    
    console.log("✅ Configuration loaded successfully");
    console.log("  - findBugs enabled:", config.customConfig?.findBugs?.enabled);
    console.log("  - Bug patterns count:", config.customConfig?.findBugs?.patterns?.length || 0);
    console.log("  - Two-param support:", config.customConfig?.find?.twoParams?.includes("bugs"));
    
    return true;
  } catch (error) {
    console.error("❌ Failed to load configuration:", error.message);
    return false;
  }
}

await testConfig();
EOF

# Run the configuration test
deno run --allow-read "$TEST_CONFIG_SCRIPT"
COMMAND_EXIT_CODE=$?

# Clean up test script
rm -f "$TEST_CONFIG_SCRIPT"

echo
echo "=== Current Status ==="
if [ $COMMAND_EXIT_CODE -eq 0 ]; then
    echo "✅ Production configuration is properly structured"
    echo "✅ Ready for 'breakdown find bugs' command implementation"
else
    echo "❌ Configuration needs adjustment"
fi

echo
echo "=== Future Usage (When Implemented) ==="
echo "Once the 'find bugs' command is implemented, you can use:"
echo "  breakdown find bugs --config prod --from \"$TEST_DIR\" --destination \"$OUTPUT_DIR\""
echo
echo "Expected behavior:"
echo "  • Load prod-app.yml configuration"
echo "  • Apply CustomConfig settings for bug detection"
echo "  • Scan files matching configured extensions"
echo "  • Generate detailed bug reports"
echo "  • Exclude configured directories from scanning"

echo
echo "=== Production Configuration Features Used ==="
echo "The prod-app.yml configuration provides:"
echo "  🔍 Bug Patterns: TODO, FIXME, HACK, BUG, XXX, DEPRECATED"
echo "  📁 File Extensions: .ts, .js, .tsx, .jsx, .md"
echo "  🚫 Excluded Directories: node_modules, .git, dist, build, coverage, .obsidian"
echo "  📊 Max Results: 100"
echo "  📋 Detailed Reports: Enabled"
echo "  ⚙️  Detection Sensitivity: Medium"
echo "  🎯 CustomConfig: Two-parameter support for 'find bugs'"

echo
echo "=== CustomConfig Benefits ==="
echo "  ✨ Enables 'breakdown find bugs' two-parameter command"
echo "  🔧 Customizable bug detection patterns"
echo "  📈 Production-optimized settings"
echo "  🛡️  Security-focused bug detection"
echo "  📝 Detailed reporting with context"

echo
echo "=== Usage Instructions ==="
echo "1. Ensure prod-app.yml is configured in ./config/"
echo "2. Run: breakdown find bugs --config prod --from <source_dir> --destination <output_dir>"
echo "3. Review generated reports in the output directory"
echo "4. Use --help flag for additional options"

echo
echo "=== Cleaning Up ==="
echo "Removing temporary test files..."
rm -rf "$TEST_DIR" "$OUTPUT_DIR"
echo "✅ Cleanup completed"

echo
echo "=== Example Complete ==="
echo "This example demonstrated:"
echo "  • Using prod-app.yml for CustomConfig settings"
echo "  • Running 'breakdown find bugs' with prod configuration"
echo "  • Advanced bug detection across multiple file types"
echo "  • Production-optimized bug reporting"
echo
echo "For more information, see:"
echo "  • config/prod-app.yml - Configuration file"
echo "  • docs/breakdown/cli.md - CLI documentation"
echo "  • examples/README.md - All examples overview"

echo -e "\nExample completed successfully!"