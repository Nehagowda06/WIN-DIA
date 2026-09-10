# 🔧 Fixes & Features Restored

This PR restores all the work that was accidentally reverted and adds automatic refund functionality.

## ✅ Changes Included

### 1. Admin Dashboard Revenue Fix
- **Fixed**: Dashboard now excludes cancelled orders from revenue calculation
- **Query**: `.eq("payment_status", "paid").neq("order_status", "cancelled")`
- **Impact**: Revenue numbers now accurate

### 2. Two-Day Cancellation Policy
- **Feature**: Customers can only cancel orders until 2 days before shipping date (12:00 PM cutoff)
- **Logic**: Checks `shipments.shipped_at` and blocks cancellation if within 2-day window
- **Example**: Shipping on Friday → Cancel by Wednesday 12:00 PM
- **Dynamic**: Real-time calculation based on actual shipping date from database

### 3. 🆕 Automatic Refund Implementation
- **NEW**: When customers cancel paid orders, refund is automatically processed via Razorpay API
- **Process**: 
  1. Customer cancels order
  2. System checks if order was paid online (not COD)
  3. Razorpay refund API called automatically
  4. Payment status updated to "refunded" in database
  5. Customer sees confirmation: "Refund processed, credited within 5-7 days"
- **Frontend**: Shows "(Refunded)" badge on cancelled orders
- **Database**: Stores refund_id and refund details in `payments.raw_response`
- **Events**: Logs 'payment.refunded' event for tracking

### 4. Admin Authentication Fix
- **Fixed**: Changed to read `profiles.role` via admin client (bypasses RLS)
- **Before**: Read from JWT `app_metadata.role` (never written to)
- **After**: Query `profiles` table as single source of truth

### 5. Excel Export for Orders
- **Feature**: Admin can export orders to CSV (opens in Excel)
- **Includes**: Order number, customer, items, payment status, total
- **Button**: "Download CSV" on admin orders page

### 6. Inline Price Editing
- **Feature**: Admin can edit product prices directly in table
- **UI**: Price field becomes editable input
- **Real-time**: Saves to Supabase on change

### 7. Receipt-Sized Packing Slip
- **Feature**: Generate 80mm thermal printer receipt
- **Data**: All real data from Supabase (no mocks)
- **Includes**: Order items, customer address, pricing, WIN-DIA branding

### 8. Order Confirmation Fix
- **Fixed**: Order items no longer blank on confirmation page
- **Solution**: Modified `/api/orders/[id]/route.ts` to fetch `order_items`

### 9. Auth Token Fix
- **Fixed**: `useAuth.js` now redirects to login when token is null
- **Before**: Sent "Bearer null" causing authentication errors
- **After**: Checks token before making API calls

---

## 📊 Technical Details

### Files Modified
- `src/backend/services/payment.service.ts` - Added `processRefund()` method
- `src/backend/services/order.service.ts` - Added auto-refund on cancellation + 2-day policy
- `app/admin/page.jsx` - Fixed revenue calculation
- `app/admin/orders/page.jsx` - Added Excel export + packing slip
- `app/admin/products/page.jsx` - Inline price editing
- `app/profile/orders/page.js` - Show refund status + confirmation
- `app/profile/orders/orders.css` - Refund badge styling
- `app/api/orders/[id]/route.ts` - Include order_items in response
- `src/backend/middleware/auth.middleware.ts` - Fixed admin role check
- `src/frontend/hooks/useAuth.js` - Token validation

### API Integration
- **Razorpay Refund API**: `razorpay.payments.refund(payment_id, { amount })`
- **Credentials**: Uses `RAZORPAY_KEY_SECRET` from `.env`
- **Amount**: Full refund in paise (amount * 100)

### Database Schema Updates
- `orders.payment_status` can now be 'refunded'
- `payments.status` can now be 'refunded'
- `payments.raw_response` stores refund details
- `payment_events` logs 'payment.refunded' events

---

## 🧪 Testing

### Test Refund Flow:
1. Create order with online payment (Razorpay test mode)
2. Complete payment
3. Cancel order from profile page
4. ✅ Should see "Refund processed" message
5. ✅ Order shows "(Refunded)" badge
6. ✅ Check Razorpay dashboard for refund record

### Test 2-Day Policy:
1. Manually set `shipments.shipped_at` to tomorrow's date
2. Try to cancel order (should fail with deadline message)
3. Set `shipped_at` to 3 days from now
4. Try to cancel (should succeed)

---

## 🚀 Deployment Notes

- **Environment**: Requires `RAZORPAY_KEY_SECRET` in production `.env`
- **Razorpay**: Switch to live mode keys for production refunds
- **Testing**: Currently using test mode keys (`rzp_test_...`)
- **Refund Timeline**: 5-7 business days (Razorpay standard)

---

## ⚠️ Important

**All data is real and fetched from Supabase** - no mocks, no hardcoded values. Everything is end-to-end real implementation.

**Note**: This PR restores work from multiple teammates that was lost in a previous revert.
