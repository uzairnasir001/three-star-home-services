# JazzCash Payment Gateway Integration Guide

## ✅ Installation Complete!

Your Three Stars Home Services app now includes JazzCash payment integration.

## 🚀 Getting Started

### Step 1: Get JazzCash Merchant Account

1. **For Testing (Sandbox):**
   - Visit: https://sandbox.jazzcash.com.pk/
   - Create a test account
   - Get your credentials:
     - Merchant ID
     - Password
     - Integrity Check Key

2. **For Production:**
   - Visit: https://www.jazzcash.com.pk/
   - Register as a merchant
   - Complete KYC verification
   - Get production credentials

### Step 2: Configure Environment Variables

Update `.env.local` in your project root with your JazzCash credentials:

```env
VITE_JAZZCASH_MERCHANT_ID=YOUR_MERCHANT_ID
VITE_JAZZCASH_PASSWORD=YOUR_PASSWORD
VITE_JAZZCASH_INTEGRITY_CHECK_KEY=YOUR_INTEGRITY_CHECK_KEY
VITE_JAZZCASH_BASE_URL=https://sandbox.jazzcash.com.pk/  # or production URL
```

### Step 3: Install MD5 Dependency (Important!)

The payment service uses MD5 hashing. Install the required package:

```bash
npm install js-md5
```

Then update `paymentService.ts`:

```typescript
import md5 from 'js-md5';

// The md5() function in the service will now work correctly
```

### Step 4: Test Payment Flow

1. Run the app:
   ```bash
   npm run dev
   ```

2. Navigate to **Book Now** page

3. Fill in booking details

4. Click **"Authorize Booking Request"**

5. You'll be redirected to **JazzCash payment page**

6. Use test credentials (ask JazzCash support for test accounts)

## 📝 How It Works

### Payment Flow:

```
User fills booking form
        ↓
User clicks "Authorize Booking Request"
        ↓
Booking stored in localStorage (pending)
        ↓
User redirected to JazzCash payment page
        ↓
User completes payment
        ↓
JazzCash redirects back to your app
        ↓
Booking status updated to "completed"
```

### Key Files:

- **[services/paymentService.ts](services/paymentService.ts)** - JazzCash API integration
- **[components/JazzCashPayment.tsx](components/JazzCashPayment.tsx)** - Payment form UI
- **[pages/Book.tsx](pages/Book.tsx)** - Integrated booking + payment flow
- **[types.ts](types.ts)** - Updated with payment fields
- **[services/dataService.ts](services/dataService.ts)** - Updated with payment tracking

## 🔐 Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use HTTPS in production** - JazzCash requires secure connections
3. **Verify payments on backend** - Don't trust client-side validation
4. **Hash sensitive data** - MD5 is used for integrity checks
5. **Keep API keys secret** - Rotate them regularly

## 🧪 Test Payment Details

For sandbox testing, use these test credentials:
- Mobile: Any valid Pakistani mobile format (0333-1234567)
- Amount: Any amount in PKR
- Account: Test account provided by JazzCash

## 📊 Admin Dashboard Features

Track payments in Admin page:
- View all bookings with payment status
- Filter by payment status (pending/completed/failed)
- Download booking reports

## ⚙️ Advanced Configuration

### Custom Return URL:
Edit `JazzCashPayment.tsx` to change success/failure pages:

```typescript
const returnUrl = `${window.location.origin}/#book?payment=complete`;
```

### Custom Notification Handler:
Add a backend endpoint to receive payment notifications:

```typescript
pp_NotificationURL: `${window.location.origin}/api/payment-notification`
```

### Amount Customization:
Prices are stored in PKR. Modify prices in `constants.tsx`:

```typescript
price: 5000 // PKR
```

## 🐛 Troubleshooting

### Issue: "Invalid Amount"
- Ensure amount > 0
- JazzCash minimum is PKR 100

### Issue: "Authentication Failed"
- Check merchant ID matches
- Verify password is correct
- Ensure base URL matches environment (sandbox vs production)

### Issue: "Integrity Check Failed"
- Verify Integrity Check Key is correct
- Ensure MD5 hash is generated correctly
- Check parameter order in hashing

### Issue: "Payment Cancelled"
- User clicked cancel on JazzCash page
- Booking remains in "pending" status
- User can try again

## 📞 Support

- JazzCash Support: https://www.jazzcash.com.pk/support
- Sandbox Issues: https://sandbox.jazzcash.com.pk/

## ✨ Next Steps

1. ✅ Install `npm install js-md5`
2. ✅ Add JazzCash credentials to `.env.local`
3. ✅ Test on sandbox environment
4. ✅ Get production credentials from JazzCash
5. ✅ Update `.env.local` with production URLs
6. ✅ Deploy to production

---

**Happy Payments! 🎉**
