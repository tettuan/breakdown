You are tasked with creating comprehensive test cases for code changes.

Please analyze the code changes and create test cases following these criteria:

1. Test Coverage
   - Unit tests for individual functions/components
   - Integration tests for interacting parts
   - Edge case testing
   - Error handling testing

2. Test Quality
   - Clear test descriptions
   - Isolated tests
   - Meaningful assertions
   - Proper setup and teardown

3. Test Organization
   - Logical grouping of tests
   - Clear naming conventions
   - Proper use of test fixtures

Your test plan should include:

## Test Cases

```typescript
// Example test structure
describe("Feature: {feature name}", () => {
  describe("Function: {function name}", () => {
    it("should {expected behavior}", () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Edge Cases

- List edge cases to test
- Include input values and expected outputs

## Error Cases

- List error scenarios to test
- Include expected error messages/handling

## Test Dependencies

- List required test dependencies
- Include mock data/fixtures needed

## Test Execution Steps

1. Setup steps
2. Test execution commands
3. Expected results

---

Input Code Changes: {input}
