# PrintMate — Digital Printing Guide Notebook

> **Tagline:** Your Simple Printing Guide Notebook

PrintMate is a clean, warm pastel digital instruction notebook designed for printing shops. It serves two specific users:
- **Administrator (You):** Writes, edits, reorders, and organizes printing guides on a laptop with secure Supabase Authentication and Row Level Security.
- **Shop Staff (Your Father):** Opens the notebook on his mobile phone from the Vercel link, searches or taps a category, follows step-by-step instructions, and ticks off completed tasks with large, comfortable touch controls—no login required.

---

## 🎨 Visual Design Palette (Light Pastel Notebook)

The interface follows a warm, calm, distraction-free paper notebook aesthetic:

- **Main background:** Warm Cream (`#FFF8EF`)
- **Main cards:** Pure White (`#FFFFFF`)
- **Secondary background:** Pale Cream (`#FFFDF8`)
- **Primary accent:** Light Lavender (`#EDE5FF`)
- **Secondary accent:** Soft Purple (`#DCCEFF`)
- **Button accent:** Muted Lavender (`#D8C5FF`)
- **Main text:** Muted Deep Purple (`#493D61`)
- **Secondary text:** Dusty Lilac (`#81758F`)
- **Borders:** Thin Lavender Hairline (`#E9DFF5`)
- **Completed steps:** Pale Sage Green (`#E0F2E5`)

---

## 🚀 Step-by-Step Setup Guide

### 1. Database Setup in Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open your project dashboard and click on **SQL Editor** in the left sidebar.
3. Click **New Query**, open the file `supabase/schema.sql` in this repository, paste its entire contents into the SQL Editor, and click **Run**.
   - This creates the `categories`, `guides`, `guide_steps`, and `app_admins` tables.
   - It enables Row Level Security (RLS) policies on all tables so visitors have read-only access to published guides, and only verified admins can edit data.
   - It seeds the 5 default categories: *WhatsApp*, *Cards & IDs*, *Xerox*, *Colour Print*, and *Email & PDF*.
4. **Create your Administrator User:**
   - In Supabase, go to **Authentication** → **Users** → **Add User** → **Create User**.
   - Enter your administrator email and a strong password. Click **Create User**.
5. **Authorize your Admin Account:**
   - Go back to **SQL Editor** and run:
     ```sql
     INSERT INTO public.app_admins (user_id)
     SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com'
     ON CONFLICT (user_id) DO NOTHING;
     ```
   - (Replace `'your-admin-email@example.com'` with the exact email you registered).
   - This records your user ID in the `app_admins` table so the RLS policies allow you to write and modify guides.

---

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Retrieve your keys from Supabase:
   - Go to **Project Settings** (gear icon) → **API**.
   - Copy **Project URL** and set it as `VITE_SUPABASE_URL`.
   - Copy **anon public key** and set it as `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Your `.env` will look like:
   ```env
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```

---

### 3. Run Locally

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

### 4. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit of PrintMate Digital Notebook"
git branch -M main
git remote add origin https://github.com/your-username/printmate.git
git push -u origin main
```

---

### 5. Deploy to Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your `printmate` GitHub repository.
4. Under **Environment Variables**, add the two variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon public key.
5. Click **Deploy**.
6. Once deployed, Vercel gives you a public link (e.g. `https://printmate.vercel.app`).
7. Single-page routing is already configured in `vercel.json` so direct visits to guide URLs (e.g. `https://printmate.vercel.app/#guide/123`) work properly without 404 errors.

---

## 📱 How to Use PrintMate

### For Your Father (On Mobile Phone)
1. Send him the Vercel URL on WhatsApp.
2. He taps the link to open PrintMate on his phone browser.
3. He sees all guides with clear icons and categories.
4. He can search or tap a category pill (e.g., *WhatsApp*).
5. He taps any guide to view step-by-step instructions.
6. He taps each step number or checkbox as he completes it:
   - The step turns a subtle, soothing sage green (`#E0F2E5`).
   - The top progress bar fills up.
   - Progress is stored in his phone's browser so it doesn't interfere with your laptop.
7. Tapping **Reset Checklist** clears the checkboxes ready for the next print job without touching the database.

### For You (Administrator)
1. Click **Admin Log In** in the top navigation or **Administrator Login** in the footer.
2. Log in with your Supabase email and password.
3. In the **Admin Notebook Dashboard**, you can:
   - Click **Create Guide** to write a new step-by-step tutorial.
   - Add as many steps as you need.
   - Add optional tips, descriptions, and paper/printer warnings.
   - Reorder steps up and down using the arrow buttons.
   - Edit any existing guide.
   - Manage categories (create, rename, or delete).
   - All guides and changes are saved directly to Supabase PostgreSQL and synced immediately to your father's phone!

---

## 🛡️ Security & Row Level Security (RLS)

- **Read Access:** Anyone can view published guides, steps, and categories.
- **Write Access:** Only authenticated users whose `auth.uid()` exists in the `public.app_admins` allowlist table can create, update, or delete guides, steps, or categories.
- Ordinary users who register cannot edit guides unless manually added to `app_admins`.
- No sensitive keys or passwords are baked into the frontend bundle.
