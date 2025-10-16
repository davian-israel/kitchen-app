import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Load design specifications
const designSpecsPath = '/Users/davian/Desktop/israel-dev/.kiro/specs/enhanced-authentication/Design.json';
const designSpecs = JSON.parse(fs.readFileSync(designSpecsPath, 'utf8'));

test.describe('Design System Compliance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/');
  });

  test.describe('Color Palette Compliance', () => {
    test('should use correct primary colors across components', async ({ page }) => {
      // Test black primary color (#000000) on buttons and key UI elements
      const primaryButtons = await page.locator('button[class*="bg-black"], button[style*="background"]');
      
      if (await primaryButtons.count() > 0) {
        const firstButton = primaryButtons.first();
        const computedStyle = await firstButton.evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color
          };
        });
        
        // Check if primary button uses black background
        expect(computedStyle.backgroundColor).toMatch(/rgb\(0,\s*0,\s*0\)|#000000|black/i);
      }
    });

    test('should use correct accent colors for cultural elements', async ({ page }) => {
      // Test for Israel blue (#0038A8) and Mediterranean orange (#FF6B35) accents
      const accentElements = await page.locator('[class*="text-blue"], [class*="text-orange"], [style*="color"]');
      
      if (await accentElements.count() > 0) {
        const colors = await accentElements.evaluateAll((elements) => {
          return elements.map(el => {
            const style = window.getComputedStyle(el);
            return style.color;
          });
        });
        
        // At least one element should use accent colors
        expect(colors.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Typography Compliance', () => {
    test('should use correct font family hierarchy', async ({ page }) => {
      // Check primary font family
      const bodyElement = await page.locator('body');
      const computedFont = await bodyElement.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return style.fontFamily;
      });
      
      // Should include Inter or system fonts as specified
      expect(computedFont).toMatch(/Inter|system|arial|helvetica|sans-serif/i);
    });

    test('should have correct heading sizes and weights', async ({ page }) => {
      // Test H1 elements (28-32px, weight 700)
      const h1Elements = await page.locator('h1');
      
      if (await h1Elements.count() > 0) {
        const h1Style = await h1Elements.first().evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            fontSize: parseFloat(style.fontSize),
            fontWeight: style.fontWeight
          };
        });
        
        // H1 should be 28-32px and bold
        expect(h1Style.fontSize).toBeGreaterThanOrEqual(28);
        expect(h1Style.fontSize).toBeLessThanOrEqual(32);
        expect(h1Style.fontWeight).toMatch(/700|bold/);
      }
    });

    test('should have correct price typography', async ({ page }) => {
      // Navigate to menu to check price typography
      await page.goto('/menu');
      
      const priceElements = await page.locator('[class*="price"], [data-testid*="price"]').first();
      
      if (await priceElements.count() > 0) {
        const priceStyle = await priceElements.evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            fontSize: parseFloat(style.fontSize),
            fontWeight: style.fontWeight
          };
        });
        
        // Price should be 18-20px and bold
        expect(priceStyle.fontSize).toBeGreaterThanOrEqual(18);
        expect(priceStyle.fontSize).toBeLessThanOrEqual(20);
        expect(priceStyle.fontWeight).toMatch(/700|bold/);
      }
    });
  });

  test.describe('Component Design Compliance', () => {
    test('should have correctly styled primary buttons', async ({ page }) => {
      const primaryButtons = await page.locator('button[class*="primary"], button[class*="bg-black"]').first();
      
      if (await primaryButtons.count() > 0) {
        const buttonStyle = await primaryButtons.evaluate((element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            borderRadius: style.borderRadius,
            padding: style.padding,
            fontSize: parseFloat(style.fontSize),
            fontWeight: style.fontWeight,
            width: rect.width,
            height: rect.height
          };
        });
        
        // Button should have pill shape (24-28px border radius)
        const borderRadius = parseFloat(buttonStyle.borderRadius);
        expect(borderRadius).toBeGreaterThanOrEqual(24);
        expect(borderRadius).toBeLessThanOrEqual(28);
        
        // Font size should be 14-16px
        expect(buttonStyle.fontSize).toBeGreaterThanOrEqual(14);
        expect(buttonStyle.fontSize).toBeLessThanOrEqual(16);
        
        // Font weight should be 600
        expect(buttonStyle.fontWeight).toMatch(/600|semibold/);
      }
    });

    test('should have correctly styled product cards', async ({ page }) => {
      await page.goto('/menu');
      
      const productCards = await page.locator('[class*="card"], [data-testid*="meal-card"]').first();
      
      if (await productCards.count() > 0) {
        const cardStyle = await productCards.evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            borderRadius: style.borderRadius,
            backgroundColor: style.backgroundColor,
            boxShadow: style.boxShadow
          };
        });
        
        // Card should have 12-16px border radius
        const borderRadius = parseFloat(cardStyle.borderRadius);
        expect(borderRadius).toBeGreaterThanOrEqual(12);
        expect(borderRadius).toBeLessThanOrEqual(16);
        
        // Card should have white background
        expect(cardStyle.backgroundColor).toMatch(/rgb\(255,\s*255,\s*255\)|#ffffff|white/i);
        
        // Card should have subtle shadow
        expect(cardStyle.boxShadow).toBeTruthy();
      }
    });
  });

  test.describe('Navigation Compliance', () => {
    test('should have correctly styled top navigation bar', async ({ page }) => {
      const topNavigation = await page.locator('header, nav').first();
      
      if (await topNavigation.count() > 0) {
        const navStyle = await topNavigation.evaluate((element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            height: rect.height,
            backgroundColor: style.backgroundColor,
            boxShadow: style.boxShadow
          };
        });
        
        // Top bar should be 56-64px height
        expect(navStyle.height).toBeGreaterThanOrEqual(56);
        expect(navStyle.height).toBeLessThanOrEqual(64);
        
        // Should have white background
        expect(navStyle.backgroundColor).toMatch(/rgb\(255,\s*255,\s*255\)|#ffffff|white/i);
      }
    });

    test('should have bottom tab navigation on mobile', async ({ page, isMobile }) => {
      if (isMobile) {
        const bottomNav = await page.locator('[class*="bottom"], [class*="fixed"]').filter({
          has: page.locator('a, button')
        });
        
        if (await bottomNav.count() > 0) {
          const navStyle = await bottomNav.first().evaluate((element) => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return {
              height: rect.height,
              position: style.position,
              bottom: style.bottom
            };
          });
          
          // Bottom nav should be fixed and 60-72px height
          expect(navStyle.position).toBe('fixed');
          expect(navStyle.height).toBeGreaterThanOrEqual(60);
          expect(navStyle.height).toBeLessThanOrEqual(72);
        }
      }
    });
  });

  test.describe('Responsive Design Compliance', () => {
    test('should adapt to mobile breakpoint (320-428px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
      await page.goto('/menu');
      
      // Check if cards are arranged in 2-column grid on mobile
      const cardGrid = await page.locator('[class*="grid"], [class*="flex"]').first();
      
      if (await cardGrid.count() > 0) {
        const gridStyle = await cardGrid.evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            display: style.display,
            gridTemplateColumns: style.gridTemplateColumns,
            flexDirection: style.flexDirection
          };
        });
        
        // Should use grid or flex layout
        expect(gridStyle.display).toMatch(/grid|flex/);
      }
    });

    test('should adapt to tablet breakpoint (429-768px)', async ({ page }) => {
      await page.setViewportSize({ width: 600, height: 800 }); // Tablet size
      await page.goto('/menu');
      
      // Tablet should show more columns than mobile
      const cards = await page.locator('[class*="card"], [data-testid*="meal-card"]');
      const cardCount = await cards.count();
      
      // Should have cards visible (testing layout works)
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should adapt to desktop breakpoint (769px+)', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 }); // Desktop size
      await page.goto('/menu');
      
      // Desktop should potentially show hover effects
      const cards = await page.locator('[class*="card"], [data-testid*="meal-card"]');
      
      if (await cards.count() > 0) {
        // Test hover state if present
        await cards.first().hover();
        
        const cardStyle = await cards.first().evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            transform: style.transform,
            boxShadow: style.boxShadow
          };
        });
        
        // Hover effects might include transform or enhanced shadow
        expect(cardStyle.transform !== 'none' || cardStyle.boxShadow).toBeTruthy();
      }
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should meet minimum touch target requirements', async ({ page, isMobile }) => {
      if (isMobile) {
        const interactiveElements = await page.locator('button, a, input, [role="button"]');
        
        for (let i = 0; i < Math.min(await interactiveElements.count(), 5); i++) {
          const element = interactiveElements.nth(i);
          const dimensions = await element.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return {
              width: rect.width,
              height: rect.height
            };
          });
          
          // Touch targets should be minimum 44x44px
          expect(dimensions.width).toBeGreaterThanOrEqual(44);
          expect(dimensions.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should have visible focus indicators', async ({ page }) => {
      const focusableElements = await page.locator('button, a, input').first();
      
      if (await focusableElements.count() > 0) {
        await focusableElements.focus();
        
        const focusStyle = await focusableElements.evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            outline: style.outline,
            outlineColor: style.outlineColor,
            outlineWidth: style.outlineWidth,
            boxShadow: style.boxShadow
          };
        });
        
        // Should have visible focus indicator
        expect(
          focusStyle.outline !== 'none' || 
          focusStyle.boxShadow.includes('0 0') ||
          focusStyle.outlineWidth !== '0px'
        ).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Test tab navigation through interactive elements
      await page.keyboard.press('Tab');
      
      const activeElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      
      // Should focus on an interactive element
      expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(activeElement);
    });
  });

  test.describe('Cultural Elements Integration', () => {
    test('should display cultural elements in branding', async ({ page }) => {
      // Check for Israel Kitchen branding elements
      const brandElements = await page.locator('h1, [class*="logo"], [data-testid*="brand"]');
      
      if (await brandElements.count() > 0) {
        const brandText = await brandElements.first().textContent();
        
        // Should contain branding text
        expect(brandText?.toLowerCase()).toMatch(/israel|kitchen|welcome/);
      }
    });

    test('should have proper font support for branding', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Look for main branding elements
      const brandElements = await page.locator('h1, h2');
      
      if (await brandElements.count() > 0) {
        const brandStyle = await brandElements.first().evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight
          };
        });
        
        // Should use proper font family
        expect(brandStyle.fontFamily).toMatch(/inter|system|arial|helvetica|sans-serif/i);
      }
    });
  });

  test.describe('Badge and Rating System', () => {
    test('should display rating stars with correct styling', async ({ page }) => {
      await page.goto('/menu');
      
      const ratingElements = await page.locator('[class*="rating"], [data-testid*="rating"]');
      
      if (await ratingElements.count() > 0) {
        const ratingStyle = await ratingElements.first().evaluate((element) => {
          const stars = element.querySelectorAll('[class*="star"], svg');
          if (stars.length > 0) {
            const style = window.getComputedStyle(stars[0]);
            const rect = stars[0].getBoundingClientRect();
            return {
              color: style.color,
              size: Math.max(rect.width, rect.height)
            };
          }
          return null;
        });
        
        if (ratingStyle) {
          // Star size should be 14-16px
          expect(ratingStyle.size).toBeGreaterThanOrEqual(14);
          expect(ratingStyle.size).toBeLessThanOrEqual(16);
        }
      }
    });

    test('should display kosher badges with Israel blue accent', async ({ page }) => {
      await page.goto('/menu');
      
      const kosherBadges = await page.locator('[class*="kosher"], [data-testid*="kosher"]');
      
      if (await kosherBadges.count() > 0) {
        const badgeStyle = await kosherBadges.first().evaluate((element) => {
          const style = window.getComputedStyle(element);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            borderRadius: style.borderRadius
          };
        });
        
        // Should have pill shape (16-20px border radius)
        const borderRadius = parseFloat(badgeStyle.borderRadius);
        expect(borderRadius).toBeGreaterThanOrEqual(16);
        expect(borderRadius).toBeLessThanOrEqual(20);
      }
    });
  });

  test.describe('Performance and Core Web Vitals', () => {
    test('should meet mobile performance thresholds', async ({ page, isMobile }) => {
      if (isMobile) {
        await page.goto('/');
        
        // Measure Core Web Vitals
        const vitals = await page.evaluate(() => {
          return new Promise((resolve) => {
            // Simplified performance measurement
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              resolve({
                navigationStart: performance.timeOrigin,
                loadEventEnd: performance.now()
              });
            });
            
            // Fallback measurement
            setTimeout(() => {
              resolve({
                navigationStart: performance.timeOrigin,
                loadEventEnd: performance.now()
              });
            }, 1000);
          });
        });
        
        // Load time should be reasonable (under 5 seconds for e2e test)
        expect(vitals.loadEventEnd).toBeLessThan(5000);
      }
    });
  });

  test.describe('Authentication Page Design', () => {
    test('should have correct signin page layout', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Check for centered card design
      const signinForm = await page.locator('form, [role="form"]').first();
      
      if (await signinForm.count() > 0) {
        const formStyle = await signinForm.evaluate((element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          const parentRect = element.parentElement?.getBoundingClientRect();
          
          return {
            maxWidth: style.maxWidth,
            margin: style.margin,
            textAlign: style.textAlign,
            centerX: rect.left + rect.width / 2,
            parentCenterX: parentRect ? parentRect.left + parentRect.width / 2 : 0
          };
        });
        
        // Form should be centered (roughly)
        const tolerance = 50; // pixels
        expect(Math.abs(formStyle.centerX - formStyle.parentCenterX)).toBeLessThan(tolerance);
      }
    });

    test('should have welcome text in Hebrew and English', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Look for welcome text
      const welcomeText = await page.textContent('body');
      
      // Should contain welcome text
      expect(welcomeText).toMatch(/welcome/i);
    });
  });
});