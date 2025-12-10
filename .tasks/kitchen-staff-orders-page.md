# Task: Kitchen Staff Order Management Page

**Priority**: High  
**Category**: Feature  
**Status**: Pending  
**Created**: 2025-12-10  
**Assignee**: Development Team

---

## 📋 Overview

Create a dedicated page for kitchen staff to view and manage paid orders with the ability to mark orders as ready.

---

## 🎯 Requirements

### 1. New Page: Kitchen Staff Orders
- **Route**: `/kitchen/orders` or `/kitchen-staff/orders`
- **Purpose**: Display all orders that have been paid by customers
- **Access**: Only accessible to users with `KITCHEN_STAFF` role

### 2. Page Features
- [ ] Display all paid orders in a list/table view
- [ ] Show order details:
  - Order number
  - Customer name/info
  - Items ordered (meals)
  - Quantity
  - Order time/date
  - Payment status (must be "paid")
  - Order status (pending/ready/completed)
- [ ] Checkbox for each order: "Mark as Ready"
- [ ] Filter orders by status (pending, ready, completed)
- [ ] Sort orders by time (newest first)
- [ ] Real-time updates when order status changes

### 3. Order Status Management
- [ ] Initial status: `PENDING` (after payment)
- [ ] When checkbox is checked: status changes to `READY`
- [ ] Optional: Add `IN_PREPARATION` status
- [ ] Update order status in database
- [ ] Trigger notification to customer when ready

### 4. Navigation Link
- [ ] Add "Kitchen Orders" link to main navigation
- [ ] Link visibility: Only show if logged-in user has `KITCHEN_STAFF` role
- [ ] Add icon (e.g., Chef hat, cooking pot)
- [ ] Position: Between admin and customer menu items

### 5. Database Schema Updates
- [ ] Add `KITCHEN_STAFF` role to UserRole enum in Prisma schema
- [ ] Ensure Order status includes: `PENDING`, `IN_PREPARATION`, `READY`, `COMPLETED`
- [ ] Add indexes for faster queries on paid orders

### 6. Seed Data
- [ ] Create kitchen staff test user in `prisma/seed.ts`:
  - Email: `kitchen@israelkitchen.com`
  - Password: `kitchen123`
  - Role: `KITCHEN_STAFF`
  - Name: Kitchen Staff User

### 7. Authorization & Security
- [ ] Create middleware/guard for `KITCHEN_STAFF` role
- [ ] Protect `/kitchen/orders` route
- [ ] Hide navigation link for non-kitchen staff users
- [ ] Add role check in API endpoints

---

## 🛠️ Implementation Details

### File Structure
```
src/
├── app/
│   └── (app)/
│       └── kitchen/
│           └── orders/
│               └── page.tsx          # Kitchen orders page
├── components/
│   └── kitchen/
│       ├── OrderList.tsx             # Order list component
│       ├── OrderCard.tsx             # Individual order card
│       └── OrderStatusToggle.tsx     # Ready checkbox component
├── api/
│   └── kitchen/
│       └── orders/
│           ├── route.ts              # Get paid orders
│           └── [orderId]/
│               └── status/
│                   └── route.ts      # Update order status
└── lib/
    └── guards/
        └── kitchen-staff.ts          # Authorization guard
```

### Prisma Schema Changes
```prisma
enum UserRole {
  CUSTOMER
  ADMIN
  KITCHEN_STAFF  // Add this
}

enum OrderStatus {
  PENDING
  IN_PREPARATION
  READY
  COMPLETED
  CANCELLED
}
```

### Navigation Update (ResponsiveHeader.tsx)
```typescript
const kitchenStaffLinks = [
  { href: '/kitchen/orders', label: 'Kitchen Orders', icon: ChefHat },
]

// Show only if user.role === 'KITCHEN_STAFF'
```

### API Endpoint Example
```typescript
// GET /api/kitchen/orders - Fetch all paid orders
// PATCH /api/kitchen/orders/[orderId]/status - Update order status
```

---

## 📊 Acceptance Criteria

- [ ] Kitchen staff user can log in with seeded credentials
- [ ] Kitchen staff sees "Kitchen Orders" link in navigation
- [ ] Non-kitchen staff users don't see the link
- [ ] Page displays all paid orders with status "pending"
- [ ] Kitchen staff can check a box to mark order as "ready"
- [ ] Order status updates in real-time
- [ ] Customer receives notification when order is ready
- [ ] Page is responsive (mobile and desktop)
- [ ] Protected by role-based authorization
- [ ] Database migration runs successfully
- [ ] Seed script creates kitchen staff user

---

## 🧪 Testing Checklist

- [ ] Unit tests for kitchen order API endpoints
- [ ] Integration tests for order status updates
- [ ] E2E tests for kitchen staff workflow
- [ ] Test role-based access control
- [ ] Test with different user roles (customer, admin, kitchen staff)
- [ ] Test order filtering and sorting
- [ ] Test real-time updates
- [ ] Test on mobile devices

---

## 📝 Technical Notes

### Order Query
```typescript
// Fetch only paid orders
const paidOrders = await prisma.order.findMany({
  where: {
    paymentStatus: 'PAID',
    status: {
      in: ['PENDING', 'IN_PREPARATION', 'READY']
    }
  },
  include: {
    items: {
      include: {
        meal: true
      }
    },
    customer: {
      select: {
        name: true,
        email: true
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  }
})
```

### Status Update
```typescript
// Update order status to READY
const updatedOrder = await prisma.order.update({
  where: { id: orderId },
  data: {
    status: 'READY',
    statusHistory: {
      create: {
        status: 'READY',
        notes: 'Order marked as ready by kitchen staff'
      }
    }
  }
})
```

---

## 🔗 Related Tasks

- Add notification system for customers
- Add kitchen display system (KDS) for order queuing
- Add estimated preparation time feature
- Add kitchen performance analytics

---

## 📅 Timeline

**Estimated Time**: 6-8 hours

1. **Phase 1**: Schema & Seed (1 hour)
   - Update Prisma schema
   - Add kitchen staff role
   - Create seed user

2. **Phase 2**: Backend API (2 hours)
   - Create kitchen orders API
   - Add status update endpoint
   - Add authorization guards

3. **Phase 3**: Frontend Components (3 hours)
   - Create kitchen orders page
   - Build order list components
   - Add status toggle functionality

4. **Phase 4**: Navigation & Auth (1 hour)
   - Add navigation link
   - Implement role-based visibility
   - Test authorization

5. **Phase 5**: Testing & QA (1-2 hours)
   - Write tests
   - Manual testing
   - Bug fixes

---

## 🚀 Deployment Steps

1. Run database migration
2. Run seed script to create kitchen staff user
3. Test in staging environment
4. Deploy to production
5. Verify kitchen staff can access the page
6. Monitor for errors

---

## 📞 Questions/Clarifications

- [ ] Should kitchen staff be able to mark order as "in preparation" before "ready"?
- [ ] Do we need to track which kitchen staff member marked the order?
- [ ] Should there be a time limit for marking orders as ready?
- [ ] Do we need to display order preparation time estimates?
- [ ] Should kitchen staff be able to see customer contact information?

---

**Status**: Ready for implementation  
**Next Action**: Review requirements and start with Phase 1 (Schema & Seed)

