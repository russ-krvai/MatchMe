
# StepDownMatch — Supabase Starter

This is a static, GitHub-friendly starter that connects to **Supabase** for shared data.

## 1) Create your Supabase project (free)
- Go to https://supabase.com and create a project.
- In your project, run this SQL in **SQL Editor → New query**:

```sql
-- Table
create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  type text not null,
  city text,
  zip text,
  dialysis text,
  behavior text,
  tube text,
  iv text,
  wound_vac text,
  tpn text,
  insurances text,
  notes text
);

-- Enable Row Level Security
alter table public.facilities enable row level security;

-- Policies (demo: open read & insert)
create policy "Anyone can read facilities"
  on public.facilities for select
  using (true);

create policy "Anyone can insert facilities"
  on public.facilities for insert
  with check (true);
```

- Go to **Project Settings → API** and copy:
  - **Project URL**
  - **anon public key**

## 2) Add your keys
- Copy `config.example.js` to `config.js`
- Paste your **Project URL** and **anon** key.

```js
window.STEPDOWNMATCH = {
  SUPABASE_URL: "https://YOUR-REF.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_ANON_PUBLIC_KEY"
};
```

> For pilots, the anon key is fine in client-side code. For production, add auth and stricter RLS.

## 3) Push to GitHub
- Create a repo (e.g., `stepdownmatch`), **Add file → Upload files**:
  - `index.html`, `facility.html`, `social_worker.html`, `admin.html`
  - `style.css`, `supabase.js`, `config.example.js`, `config.js` (after you add keys)
- Commit to `main`.

## 4) Deploy
### Option A: Netlify (recommended)
- In Netlify, **New site from Git** → connect your GitHub repo.
- Build command: _none_ (static).
- Publish directory: `/` (root).
- Deploy.

### Option B: GitHub Pages
- Repo **Settings → Pages**:
  - Source: **Deploy from a branch**
  - Branch: `main` / **root**
- Open: `https://<your-user>.github.io/<repo-name>/`

## 5) Use it
- **Facility**: fills the form → writes to Supabase.
- **Social Worker**: searches across type, ZIP prefix (first 3 digits), and keywords (notes/dialysis/behavior/tube/iv).
- **Admin**: list all, seed samples, clear all.

---

### Hardening (later)
- Use auth: Facility/Staff roles.
- Tighten RLS (e.g., only authenticated inserts).
- Add structured insurance lists and hard capability filters.
- Distance: store lat/lon and use PostGIS or client-side geocoding.
