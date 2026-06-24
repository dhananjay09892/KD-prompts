---
applyTo: "**/*.test.{ts,tsx,js,jsx},**/*.spec.{ts,tsx,js,jsx},**/tests/**,**/__tests__/**"
---

# Testing Rules

Channel: `agents/development-team/test-generator.md`

## Test Stack
- Unit/integration: **Vitest** (not Jest — faster, native ESM)
- Component: **Testing Library** (test behavior, not implementation)
- E2E: **Playwright** (not Cypress — better parallel support)

## What to Test
- ✅ Business logic in services (pure functions — easy to test)
- ✅ API route handlers (input validation, error cases, auth)
- ✅ Critical UI flows (auth, checkout, core user journey)
- ❌ Don't test: implementation details, internal state, third-party lib behavior

## Test Naming Pattern
```
describe('[unit under test]', () => {
  it('[should do X] when [condition Y]', () => { ... })
})
```

## Component Test Pattern
```typescript
// Test what the user sees, not implementation
it('shows error when email is invalid', async () => {
  render(<LoginForm />)
  await userEvent.type(screen.getByLabelText('Email'), 'bad-email')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(screen.getByText('Invalid email address')).toBeInTheDocument()
})
```

## Coverage Target
- Services: 90%+
- API routes: 80%+
- UI components: 70%+ (critical paths only)
- No coverage theater — meaningful assertions, not just execution coverage
