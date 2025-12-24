# Frontend Testing Guide

This document provides comprehensive information about the frontend testing setup and best practices for the bid-review-system.

## Overview

The frontend uses a professional testing setup with:
- **Jest** as the test runner
- **React Testing Library** for component testing
- **User Event** for realistic user interactions
- **React Query** testing utilities
- **Coverage reporting** with thresholds

## Test Structure

```
src/
├── __tests__/
│   ├── api.test.js              # API connection tests
│   ├── components/
│   │   ├── BidTest.test.js      # BidTest component tests
│   │   └── Login.test.js        # Login component tests
│   ├── services/
│   │   ├── api.test.js          # API service tests
│   │   └── bidService.test.js   # Bid service tests
│   └── integration/
│       ├── bidWorkflow.integration.test.js  # Complete bid workflow tests
│       └── authWorkflow.integration.test.js  # Authentication workflow tests
```

## Running Tests

### Development
```bash
# Run tests in watch mode
npm run test:watch

# Run tests once
npm test

# Run with coverage
npm run test:coverage
```

### CI/CD
```bash
# Run tests for CI (no watch, coverage enabled)
npm run test:ci
```

## Test Categories

### 1. Unit Tests
- **Services**: Test individual service functions in isolation
- **Components**: Test component rendering, user interactions, and state changes
- **Utilities**: Test helper functions and utilities

### 2. Integration Tests
- **Workflows**: Test complete user workflows across multiple components
- **API Integration**: Test API calls with mock responses
- **State Management**: Test React Query integration and data flow

### 3. End-to-End Scenarios
- **Authentication Flow**: Login, token management, protected routes
- **Bid Management**: Create, read, update, delete operations
- **Error Handling**: Network failures, validation errors, edge cases

## Best Practices

### Component Testing
```javascript
// ✅ Good: Test user behavior, not implementation
test('should create bid when form is submitted', async () => {
  const user = userEvent.setup()
  renderWithProviders(<BidForm />)
  
  await user.type(screen.getByLabelText(/title/i), 'Test Bid')
  await user.click(screen.getByRole('button', { name: /create/i }))
  
  expect(mockCreateBid).toHaveBeenCalledWith({ title: 'Test Bid' })
})

// ❌ Bad: Testing internal state
test('should set loading state', () => {
  // Don't test internal implementation details
})
```

### Service Testing
```javascript
// ✅ Good: Test success and error cases
describe('getBids', () => {
  it('should fetch bids successfully', async () => {
    mockApi.get.mockResolvedValue({ data: mockBids })
    const result = await getBids()
    expect(result).toEqual(mockBids)
  })

  it('should handle API errors', async () => {
    mockApi.get.mockRejectedValue(new Error('API Error'))
    await expect(getBids()).rejects.toThrow('API Error')
  })
})
```

### Integration Testing
```javascript
// ✅ Good: Test complete workflows
test('should handle complete bid lifecycle', async () => {
  // Arrange: Mock all API calls
  // Act: Perform user actions
  // Assert: Verify end-to-end behavior
})
```

## Mocking Strategy

### API Services
- Mock all external API calls
- Use consistent mock data across tests
- Test both success and error scenarios

### React Router
- Mock `useNavigate` for navigation testing
- Use `MemoryRouter` for component testing

### Local Storage
- Mock localStorage for authentication tests
- Clear mocks between tests

## Coverage Requirements

The test suite maintains minimum coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## CI/CD Integration

### GitHub Actions
- Tests run on push to main/develop branches
- Tests run on pull requests
- Multi-node version testing (18.x, 20.x)
- Coverage reports uploaded to Codecov

### Pre-commit Hooks (Recommended)
```bash
# Install husky for pre-commit hooks
npm install --save-dev husky

# Add test pre-commit hook
npx husky add .husky/pre-commit "npm run test:ci"
```

## Debugging Tests

### VS Code Integration
1. Install Jest extension
2. Add to `.vscode/settings.json`:
```json
{
  "jest.jestCommandLine": "npm test",
  "jest.rootPath": "src/__tests__"
}
```

### Debug Mode
```bash
# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Performance Considerations

### Test Speed
- Use `runInBand` for CI to reduce memory usage
- Mock expensive operations
- Use `beforeEach`/`afterEach` for cleanup

### Memory Management
- Clear mocks between tests
- Use proper cleanup in useEffect tests
- Avoid memory leaks in async tests

## Common Patterns

### Custom Render Function
```javascript
const renderWithProviders = (component, queryClient = createTestQueryClient()) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  )
}
```

### Async Testing
```javascript
// ✅ Good: Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

// ✅ Good: Use userEvent for realistic interactions
await user.type(input, 'text')
await user.click(button)
```

## Troubleshooting

### Common Issues
1. **Act warnings**: Use `waitFor` instead of `setTimeout`
2. **Mock not clearing**: Use `jest.clearAllMocks()` in beforeEach
3. **Test flakiness**: Ensure proper async handling
4. **Coverage gaps**: Add tests for uncovered branches

### Debug Commands
```bash
# Run specific test file
npm test -- BidService.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create bid"

# Update test snapshots
npm test -- --updateSnapshot
```

## Next Steps

1. **Add E2E Tests**: Consider Cypress or Playwright for end-to-end testing
2. **Visual Regression**: Add visual testing with Percy or Chromatic
3. **Performance Testing**: Add performance benchmarks
4. **Accessibility Testing**: Add axe-core for accessibility testing

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [React Query Testing](https://tanstack.com/query/latest/docs/react/guides/testing)
- [User Event Documentation](https://testing-library.com/docs/user-event/intro/)
