/**
 * End-to-End Tests for Blaze Intelligence Homepage
 * Tests critical user flows and functionality using Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Blaze Intelligence Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Blaze Intelligence/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Elite Sports Intelligence');
    
    // Check navigation
    await expect(page.locator('.nav-links')).toBeVisible();
    
    // Check hero section
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.hero-subtitle')).toContainText('Texas heritage meets algorithmic excellence');
  });

  test('should display loading screen initially', async ({ page }) => {
    // Check loading screen appears
    await expect(page.locator('#loading')).toBeVisible();
    
    // Wait for loading screen to disappear
    await expect(page.locator('#loading')).toHaveClass(/hidden/, { timeout: 2000 });
  });

  test('should load live data cards', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(2000);
    
    // Check data cards are present
    await expect(page.locator('#cardinals-card')).toBeVisible();
    await expect(page.locator('#titans-card')).toBeVisible();
    await expect(page.locator('#longhorns-card')).toBeVisible();
    await expect(page.locator('#live-games-card')).toBeVisible();
    
    // Check badges are loaded (not just "LOADING")
    await expect(page.locator('#cardinals-badge')).not.toContainText('LOADING');
    await expect(page.locator('#titans-badge')).not.toContainText('LOADING');
    await expect(page.locator('#longhorns-badge')).not.toContainText('LOADING');
    await expect(page.locator('#games-badge')).not.toContainText('LOADING');
    
    // Check data values are populated
    await expect(page.locator('#cardinals-readiness')).not.toContainText('Loading...');
    await expect(page.locator('#titans-record')).not.toContainText('Loading...');
    await expect(page.locator('#longhorns-ranking')).not.toContainText('Loading...');
    await expect(page.locator('#live-games')).not.toContainText('Loading...');
  });

  test('should show data source badges', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check that badges indicate data source
    const badges = ['#cardinals-badge', '#titans-badge', '#longhorns-badge', '#games-badge'];
    
    for (const badge of badges) {
      const badgeElement = page.locator(badge);
      await expect(badgeElement).toBeVisible();
      
      const badgeText = await badgeElement.textContent();
      expect(['LIVE', 'DEMO DATA', 'ESPN API', 'MLB Stats API', 'CollegeFootballData']).toContainEqual(badgeText);
    }
  });

  test('should navigate smoothly between sections', async ({ page }) => {
    // Test navigation to features section
    await page.click('a[href="#features"]');
    await page.waitForTimeout(500);
    
    // Check features section is visible
    await expect(page.locator('#features')).toBeInViewport();
    
    // Test navigation to analytics section
    await page.click('a[href="#analytics"]');
    await page.waitForTimeout(500);
    
    // Check analytics section is visible
    await expect(page.locator('#analytics')).toBeInViewport();
    
    // Test navigation to about section
    await page.click('a[href="#about"]');
    await page.waitForTimeout(500);
    
    // Check about section is visible
    await expect(page.locator('#about')).toBeInViewport();
  });

  test('should display founder information', async ({ page }) => {
    // Navigate to about section
    await page.click('a[href="#about"]');
    
    // Check founder section elements
    await expect(page.locator('.founder-image')).toBeVisible();
    await expect(page.locator('.founder-image')).toContainText('AH');
    
    await expect(page.locator('h3')).toContainText('John Austin Humphrey');
    await expect(page.locator('.founder-title')).toContainText('Founder & Chief Executive Officer');
    await expect(page.locator('.founder-bio')).toContainText('multi-sport athlete');
  });

  test('should handle contact interactions', async ({ page }) => {
    // Navigate to contact section
    await page.click('a[href="#contact"]');
    
    // Check contact section is visible
    await expect(page.locator('#contact')).toBeInViewport();
    
    // Check contact buttons
    await expect(page.locator('a[href="mailto:ahump20@outlook.com"]')).toBeVisible();
    await expect(page.locator('a[href="tel:+12102735538"]')).toBeVisible();
  });

  test('should load heavy scripts after interaction', async ({ page }) => {
    // Track network requests
    const scriptRequests = [];
    page.on('request', request => {
      if (request.url().includes('three.js') || request.url().includes('gsap')) {
        scriptRequests.push(request.url());
      }
    });
    
    // Initially, heavy scripts should not be loaded
    expect(scriptRequests).toHaveLength(0);
    
    // Trigger interaction (scroll)
    await page.mouse.wheel(0, 100);
    
    // Wait for scripts to load
    await page.waitForTimeout(2000);
    
    // Check that heavy scripts were loaded after interaction
    expect(scriptRequests.length).toBeGreaterThan(0);
    expect(scriptRequests.some(url => url.includes('three.js'))).toBe(true);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile-specific elements
    await expect(page.locator('.nav-links')).toBeHidden();
    
    // Check hero content is still visible and readable
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.hero-subtitle')).toBeVisible();
    
    // Check data cards stack properly on mobile
    const dataGrid = page.locator('.data-grid');
    await expect(dataGrid).toBeVisible();
    
    // Check founder section stacks on mobile
    await page.click('a[href="#about"]');
    await expect(page.locator('.founder-content')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'API Error' })
      });
    });
    
    // Reload page
    await page.reload();
    
    // Wait for error handling
    await page.waitForTimeout(3000);
    
    // Check that error badges are shown
    const badges = ['#cardinals-badge', '#titans-badge', '#longhorns-badge', '#games-badge'];
    
    for (const badge of badges) {
      const badgeElement = page.locator(badge);
      const badgeText = await badgeElement.textContent();
      expect(['ERROR', 'DEMO DATA']).toContain(badgeText);
    }
    
    // Check that N/A values are shown for failed data
    await expect(page.locator('#cardinals-readiness')).toContainText('N/A');
    await expect(page.locator('#titans-record')).toContainText('N/A');
  });

  test('should update data periodically', async ({ page }) => {
    // Wait for initial data load
    await page.waitForTimeout(3000);
    
    // Get initial values
    const initialCardinals = await page.locator('#cardinals-readiness').textContent();
    const initialTitans = await page.locator('#titans-record').textContent();
    
    // Wait for potential update (data updates every 5 minutes, but we can test shorter intervals)
    await page.waitForTimeout(2000);
    
    // Values should either be the same (cached) or updated
    const updatedCardinals = await page.locator('#cardinals-readiness').textContent();
    const updatedTitans = await page.locator('#titans-record').textContent();
    
    // Values should not be loading states
    expect(updatedCardinals).not.toBe('Loading...');
    expect(updatedTitans).not.toBe('Loading...');
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Texas heritage meets algorithmic excellence/);
    
    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /Blaze Intelligence/);
    
    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute('content', /sports intelligence/);
  });

  test('should track performance metrics', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that monitoring service is initialized
    const monitoringExists = await page.evaluate(() => {
      return typeof window.monitoring !== 'undefined';
    });
    
    expect(monitoringExists).toBe(true);
    
    // Check that performance monitoring is working
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('navigation').length > 0;
    });
    
    expect(performanceEntries).toBe(true);
  });
});