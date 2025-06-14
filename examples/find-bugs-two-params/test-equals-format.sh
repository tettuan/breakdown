#!/bin/bash

# Test script for find bugs two params feature with equals format

echo "Testing find bugs two params with equals format..."
echo "=============================================="
echo ""

# Test 1: Basic equals format
echo "Test 1: Basic -f=file format"
echo "Command: breakdown find bugs -f=buggy-javascript.js"
breakdown find bugs -f=buggy-javascript.js
echo ""

# Test 2: Multiple equals format options
echo "Test 2: Multiple equals format options"
echo "Command: breakdown find bugs -f=buggy-javascript.js --depth=medium --format=json"
breakdown find bugs -f=buggy-javascript.js --depth=medium --format=json
echo ""

# Test 3: Mixed format (equals and traditional)
echo "Test 3: Mixed format"
echo "Command: breakdown find bugs -f=buggy-javascript.js --depth medium --severity=true"
breakdown find bugs -f=buggy-javascript.js --depth medium --severity=true
echo ""

# Test 4: Custom variables with equals
echo "Test 4: Custom variables"
echo "Command: breakdown find bugs -f=buggy-javascript.js --uv-project=TestApp --uv-module=core"
breakdown find bugs -f=buggy-javascript.js --uv-project=TestApp --uv-module=core
echo ""

# Test 5: Value with equals sign in it
echo "Test 5: Value containing equals sign"
echo "Command: breakdown find bugs -f=buggy-javascript.js --uv-config=key=value"
breakdown find bugs -f=buggy-javascript.js --uv-config=key=value
echo ""

echo "=============================================="
echo "All tests completed!"