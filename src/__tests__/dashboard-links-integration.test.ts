/**
 * Integration Tests for Dashboard Page Links
 * Verifies all links on the dashboard page work correctly
 */

import { jest } from '@jest/globals'
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js modules
jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: any) {
    return React.createElement('a', { href, className, 'data-testid': `link-${href}` }, children)
  }
})

jest.mock('@/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: { 
      id: '1', 
      email: 'test@example.com', 
      name: 'Test User',
      role: 'USER' 
    },
    expires: '2024-12-31'
  }))
}))

describe('Dashboard Links Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('Navigation Header Links', () => {
    it('should render Israel Kitchen logo link to dashboard', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // Find the logo link
      const logoLink = container.querySelector('[data-testid="link-/dashboard"]')
      expect(logoLink).toBeTruthy()
      expect(logoLink).toHaveAttribute('href', '/dashboard')
      expect(logoLink).toHaveTextContent('Israel Kitchen')
      expect(logoLink).toHaveClass('text-xl', 'font-bold', 'text-orange-600')
    })

    it('should render Menu navigation link', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // Find the menu nav link
      const menuLinks = container.querySelectorAll('[data-testid="link-/menu"]')
      const navMenuLink = Array.from(menuLinks).find(link => 
        link.textContent === 'Menu' && 
        link.classList.contains('text-gray-700')
      )
      
      expect(navMenuLink).toBeTruthy()
      expect(navMenuLink).toHaveAttribute('href', '/menu')
      expect(navMenuLink).toHaveTextContent('Menu')
      expect(navMenuLink).toHaveClass('text-gray-700', 'hover:text-orange-600', 'font-medium')
    })

    it('should render My Orders navigation link', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // Find the orders nav link
      const ordersLinks = container.querySelectorAll('[data-testid="link-/orders"]')
      const navOrdersLink = Array.from(ordersLinks).find(link => 
        link.textContent === 'My Orders' && 
        link.classList.contains('text-gray-700')
      )
      
      expect(navOrdersLink).toBeTruthy()
      expect(navOrdersLink).toHaveAttribute('href', '/orders')
      expect(navOrdersLink).toHaveTextContent('My Orders')
      expect(navOrdersLink).toHaveClass('text-gray-700', 'hover:text-orange-600', 'font-medium')
    })
  })

  describe('Quick Action Cards Links', () => {
    it('should render Browse Menu quick action card', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // Find the Browse Menu card
      const menuLinks = container.querySelectorAll('[data-testid="link-/menu"]')
      const browseMenuCard = Array.from(menuLinks).find(link => {
        const cardContent = link.textContent
        return cardContent?.includes('Browse Menu') && cardContent?.includes('Explore our delicious israel dishes')
      })
      
      expect(browseMenuCard).toBeTruthy()
      expect(browseMenuCard).toHaveAttribute('href', '/menu')
      expect(browseMenuCard).toHaveClass('bg-white', 'p-6', 'rounded-lg', 'shadow', 'hover:shadow-md', 'transition-shadow')
      expect(browseMenuCard).toHaveTextContent('Browse Menu')
      expect(browseMenuCard).toHaveTextContent('Explore our delicious israel dishes')
      expect(browseMenuCard).toHaveTextContent('🍽️')
    })

    it('should render My Orders quick action card', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // Find the My Orders card
      const ordersLinks = container.querySelectorAll('[data-testid="link-/orders"]')
      const myOrdersCard = Array.from(ordersLinks).find(link => {
        const cardContent = link.textContent
        return cardContent?.includes('My Orders') && cardContent?.includes('Track your order history')
      })
      
      expect(myOrdersCard).toBeTruthy()
      expect(myOrdersCard).toHaveAttribute('href', '/orders')
      expect(myOrdersCard).toHaveClass('bg-white', 'p-6', 'rounded-lg', 'shadow', 'hover:shadow-md', 'transition-shadow')
      expect(myOrdersCard).toHaveTextContent('My Orders')
      expect(myOrdersCard).toHaveTextContent('Track your order history')
      expect(myOrdersCard).toHaveTextContent('📋')
    })

    it('should render Profile quick action card', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // Find the Profile card
      const profileLink = container.querySelector('[data-testid="link-/profile"]')
      
      expect(profileLink).toBeTruthy()
      expect(profileLink).toHaveAttribute('href', '/profile')
      expect(profileLink).toHaveClass('bg-white', 'p-6', 'rounded-lg', 'shadow', 'hover:shadow-md', 'transition-shadow')
      expect(profileLink).toHaveTextContent('Profile')
      expect(profileLink).toHaveTextContent('Manage your account settings')
      expect(profileLink).toHaveTextContent('👤')
    })
  })

  describe('Recent Activity Section Links', () => {
    it('should render Browse Menu button in Recent Activity', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // Find the Browse Menu button in Recent Activity
      const menuLinks = container.querySelectorAll('[data-testid="link-/menu"]')
      const recentActivityMenuLink = Array.from(menuLinks).find(link => {
        return link.classList.contains('inline-block') && 
               link.classList.contains('mt-4') &&
               link.classList.contains('bg-orange-600')
      })
      
      expect(recentActivityMenuLink).toBeTruthy()
      expect(recentActivityMenuLink).toHaveAttribute('href', '/menu')
      expect(recentActivityMenuLink).toHaveTextContent('Browse Menu')
      expect(recentActivityMenuLink).toHaveClass(
        'inline-block', 'mt-4', 'bg-orange-600', 'hover:bg-orange-700', 
        'text-white', 'px-6', 'py-2', 'rounded-md', 'font-medium'
      )
    })
  })

  describe('Form Actions', () => {
    it('should render Sign Out form with correct action', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // Find the sign out form
      const signOutForm = container.querySelector('form[action="/api/auth/signout"]')
      expect(signOutForm).toBeTruthy()
      expect(signOutForm).toHaveAttribute('action', '/api/auth/signout')
      expect(signOutForm).toHaveAttribute('method', 'post')
      
      // Find the sign out button
      const signOutButton = signOutForm?.querySelector('button[type="submit"]')
      expect(signOutButton).toBeTruthy()
      expect(signOutButton).toHaveTextContent('Sign Out')
      expect(signOutButton).toHaveClass(
        'bg-red-600', 'hover:bg-red-700', 'text-white', 
        'px-3', 'py-2', 'rounded-md', 'text-sm', 'font-medium'
      )
    })
  })

  describe('Link Accessibility and Attributes', () => {
    it('should verify all links have proper href attributes', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // Get all links
      const allLinks = container.querySelectorAll('a[href]')
      
      // Expected links and their counts
      const expectedLinks = {
        '/dashboard': 1,  // Logo
        '/menu': 3,       // Nav, card, recent activity button
        '/orders': 2,     // Nav, card
        '/profile': 1     // Card
      }
      
      Object.entries(expectedLinks).forEach(([href, expectedCount]) => {
        const linksWithHref = container.querySelectorAll(`[data-testid="link-${href}"]`)
        expect(linksWithHref).toHaveLength(expectedCount)
      })
    })

    it('should verify all interactive elements are keyboard accessible', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // All links should be focusable (have href)
      const allLinks = container.querySelectorAll('a')
      allLinks.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
      
      // Form button should be focusable
      const signOutButton = container.querySelector('button[type="submit"]')
      expect(signOutButton).toBeTruthy()
      expect(signOutButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('User Session Context', () => {
    it('should display user name in welcome message and header', async () => {
      const { default: DashboardPage } = await import('@/app/(app)/dashboard/page')
      
      const component = await DashboardPage()
      const { container } = render(component)
      
      // Should display user name in header
      const headerWelcome = container.querySelector('.text-sm.text-gray-600')
      expect(headerWelcome).toHaveTextContent('Welcome, Test User')
      
      // Should display user name in main welcome section
      const mainWelcome = container.querySelector('h1')
      expect(mainWelcome).toHaveTextContent('Welcome back, Test User!')
    })
  })

  describe('Route Structure Validation', () => {
    it('should verify all linked routes exist in the file system', () => {
      const fs = require('fs')
      const path = require('path')
      
      // Routes that should exist
      const expectedRoutes = [
        'src/app/(app)/dashboard/page.tsx',  // Current page
        'src/app/(app)/menu/page.tsx',       // Menu page
        'src/app/(app)/orders/page.tsx',     // Orders page  
        'src/app/(app)/profile/page.tsx',    // Profile page
      ]
      
      expectedRoutes.forEach(routePath => {
        const fullPath = path.join(process.cwd(), routePath)
        expect(fs.existsSync(fullPath)).toBe(true)
      })
    })

    it('should verify NextAuth signout endpoint exists', () => {
      // The /api/auth/signout is provided by NextAuth.js
      // We verify the auth configuration exists
      const fs = require('fs')
      const path = require('path')
      
      const authConfigPath = path.join(process.cwd(), 'src/lib/auth-config.ts')
      expect(fs.existsSync(authConfigPath)).toBe(true)
      
      const authPath = path.join(process.cwd(), 'src/auth.ts')
      expect(fs.existsSync(authPath)).toBe(true)
    })
  })
})