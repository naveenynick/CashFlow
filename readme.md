# Daily Cash Flow

A daily retail cash reconciliation app that connects to Supabase for data storage and sharing across devices.

## Setup & Running

### Local Development
```bash
cd public
# Serve the files locally (e.g., using Python, Node, or any static server)
python3 -m http.server 8000
# or
npx http-server
```

Then open: `http://localhost:8000`

### Online Deployment

This is a **static frontend application** that only requires `index.html`, `styles.css`, and `app.js`. It connects to Supabase for data storage.

**Deployment options:**
- **Netlify**: Drag the `public` folder into Netlify Drop, or connect your Git repository
- **Vercel**: Import the `public` folder as a static project
- **Any static hosting**: Upload the `public` folder contents

## Configuration

Before deploying, add your Supabase projects to the `storeConfigs` array in `public/app.js`:

```javascript
const storeConfigs = [
  {
    id: "store-id",
    title: "Store Name",
    storeLabel: "Store Label",
    supabaseUrl: "https://your-project.supabase.co",
    supabasePublishableKey: "your-publishable-key"
  }
];
```

**Database setup:** Run this SQL in each Supabase project to create the required table:

```sql
CREATE TABLE daily_cash_entries (
  entry_date DATE PRIMARY KEY,
  counts JSONB,
  cash_drawer BIGINT,
  yesterday_balance BIGINT,
  total_cash_sale_today BIGINT,
  ssc_settlement BIGINT,
  card_settlement BIGINT,
  upi_settlement BIGINT,
  digital_payments BIGINT,
  calculated_sale BIGINT,
  system_sale BIGINT,
  difference BIGINT,
  bank_deposit_cash BIGINT,
  bank_deposit_ssc BIGINT,
  bank_deposit BIGINT,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Enable authentication in your Supabase project and add your user credentials.

## What It Tracks

- Cash drawer entries for ₹500, ₹100, ₹50, ₹20, ₹10, coins, and bundle amount
- Balance of yesterday
- SSC payments (manual entry)
- Debit/credit card payments
- UPI payments
- SALE in system (manual entry)
- Money deposited in bank (cash and SSC)
- Signed difference calculation

**Formula:**
```
Total Cash Sale Today = Total cash in drawer - Balance of Yesterday
Calculated Total = Total Cash Sale Today + SSC + Debit/Credit Card + UPI
Difference = Calculated Total - SALE in system
```

## Usage

1. **Sign in** with your Supabase credentials
2. **Enter daily details**: Fill in all required fields
3. **Save entry**: Click "Save daily entry" to store in Supabase
4. **View history**: Open previous entries from the History panel to review or edit
5. **Status indicators**: 
   - "SAVED" = Entry is stored without changes
   - "NOT SAVED" = Entry has unsaved changes

All entries are stored in Supabase and accessible from any device using the same login credentials.
