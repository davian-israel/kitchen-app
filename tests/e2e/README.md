# E2E Tests for Israel Kitchen

## Kitchen Staff Login Tests

Comprehensive end-to-end tests for the kitchen staff authentication and authorization flow.

### Test Coverage

The `kitchen-staff-login.spec.ts` test suite includes:

#### 1. **Basic Login Flow**
- ✅ Sign-in page loads correctly
- ✅ Kitchen staff can log in with valid credentials
- ✅ Automatic redirect to `/kitchen/orders` after login
- ✅ Invalid credentials are rejected with error message

#### 2. **Kitchen Orders Page Verification**
- ✅ Page displays "Kitchen Orders" heading
- ✅ Statistics cards are visible (Pending, In Preparation, Ready)
- ✅ Filter buttons work correctly
- ✅ Refresh button functions properly
- ✅ Navigation links are role-specific

#### 3. **Authorization Tests**
- ✅ Customer users cannot access kitchen orders page
- ✅ Unauthorized users are redirected to dashboard
- ✅ Kitchen staff have appropriate permissions

#### 4. **Session Management**
- ✅ Session persists after page reload
- ✅ Login state is maintained across navigation

#### 5. **Error Handling**
- ✅ Network errors are handled gracefully
- ✅ Page renders even if data fetch fails

#### 6. **Performance**
- ✅ Page loads within acceptable time (<10s)
- ✅ Login flow completes efficiently

#### 7. **Mobile Responsiveness**
- ✅ Kitchen orders page works on mobile devices
- ✅ Mobile layout renders correctly

---

## Running the Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install
```

### Run Kitchen Staff Tests

```bash
# Run all kitchen staff tests (headless)
npm run test:kitchen

# Run with browser UI (watch mode)
npm run test:kitchen:ui

# Run in headed mode (see browser)
npm run test:kitchen:headed

# Run all E2E tests
npm run test:e2e

# Run with Playwright UI
npm run test:e2e:ui
```

### Run Specific Tests

```bash
# Run a specific test by name
npx playwright test -g "should successfully login as kitchen staff"

# Run tests in a specific browser
npx playwright test --project=chromium

# Run tests on mobile
npx playwright test --project="Mobile Chrome"
```

---

## Test Configuration

### Production URL

Tests run against the production URL:
```
https://israel-kitchen-qzsdui82b-davianrs-projects.vercel.app
```

### Test Credentials

**Kitchen Staff:**
- Email: `kitchen@israelkitchen.com`
- Password: `kitchen123`

**Customer (for authorization tests):**
- Email: `customer@example.com`
- Password: `customer123`

### Browsers Tested

- ✅ Chromium (Desktop Chrome)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)
- ✅ iPad

---

## Test Results

### Screenshots

Test screenshots are saved to `test-results/`:
- `kitchen-login-before.png` - Before login
- `kitchen-orders-page.png` - After successful login
- `kitchen-orders-mobile.png` - Mobile view

### Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

---

## Debugging Failed Tests

### Enable Debug Mode

```bash
# Run with debug mode
PWDEBUG=1 npm run test:kitchen

# Run specific test with trace
npx playwright test tests/e2e/kitchen-staff-login.spec.ts --trace on
```

### View Traces

```bash
# Open trace viewer
npx playwright show-trace trace.zip
```

### Common Issues

#### Issue: Test times out
**Solution**: Increase timeout in test file or check network connection

#### Issue: Elements not found
**Solution**: Check if selectors have changed or page layout has been updated

#### Issue: Authentication fails
**Solution**: Verify credentials are correct in production database

---

## CI/CD Integration

These tests can be run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: npm run test:kitchen
  env:
    CI: true
```

---

## Test Maintenance

### Updating Tests

When updating the kitchen orders page:
1. Update selectors if UI changes
2. Add new test cases for new features
3. Update credentials if they change in production

### Best Practices

- ✅ Use role-based selectors (`getByRole`) when possible
- ✅ Use meaningful test names
- ✅ Add console logs for debugging
- ✅ Take screenshots on critical steps
- ✅ Test both happy path and error cases
- ✅ Clean up test data if needed

---

## Contact

For issues or questions about these tests, please refer to the project documentation or contact the development team.

---

**Last Updated**: December 11, 2025
**Test Suite Version**: 1.0.0
**Production URL**: https://israel-kitchen-qzsdui82b-davianrs-projects.vercel.app

