# Daily Cash Flow

A daily retail cash reconciliation app that can connect to different shop databases from one login page.

## Run

```powershell
node server.js
```

Then open:

```text
http://127.0.0.1:8765/
```

## Publish Online

This app can be hosted as a static site because it only needs `index.html`, `styles.css`, and `app.js`.

Fastest options:

- Netlify: drag this folder into Netlify Drop, or connect a Git repository. `netlify.toml` is included.
- Vercel: import this folder/repository as a static project. `vercel.json` is included.
- Node host: run `npm start`; the server listens on the hosting provider's `PORT`.

Important: entries are stored in Supabase after sign-in, so the same records can be shared across devices using the same project and login. Add each shop's Supabase project to `storeConfigs` in `app.js`.

Before deploying this version, run `supabase-bank-deposit-migration.sql` once in each Supabase project.

## What It Tracks

- Cash drawer entries for ₹500, ₹100, ₹50, ₹20, ₹10, coins, and bundle amount
- Balance of yesterday
- SSC payments
- Debit / credit card payments
- UPI payments
- Total of Total Cash Sale Today + SSC + Debit/Credit Card + UPI
- Total sale today in the system
- Money taken for depositing in bank, saved for reference only
- Money deposited in bank today, split into cash and SSC, saved for reference only
- Signed difference using:

```text
Total Cash Sale Today = Total cash in drawer - Balance of Yesterday
Calculated Total = Total Cash Sale Today + SSC + Debit/Credit Card + UPI
Difference = Calculated Total - Total Sale today in System
```

Every calculation entry is required before saving. Data is saved in Supabase. Use the History panel to load and edit any saved date.

After saving any entry, the form moves to the day after the latest saved entry and clears the new day for entry. `Balance of Yesterday` is filled from the previous saved day's `Total cash in drawer`.
