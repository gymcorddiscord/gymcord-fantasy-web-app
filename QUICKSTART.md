# Quickstart — see Gymcord Fantasy on your computer

This is the fastest way to look at what's been built so far. About **5 minutes**, plus a few extra minutes if you also want sign-in to actually work.

You'll be able to see the landing page and click through to Login/Register. Without a Supabase project configured (see the README's "Set up Supabase" section), clicking "Continue with Discord" won't complete sign-in yet — but you'll see the design and click through the pages.

---

## Step 1 — Install Node.js (if you don't already have it)

Node.js is what runs the app on your computer.

1. Go to https://nodejs.org
2. Download the **"LTS"** version (recommended for most users)
3. Run the installer, accept the defaults

**Check it worked.** Open Terminal (macOS — find it in Spotlight) or PowerShell (Windows — find it in Start menu). Type:

```
node --version
```

You should see something like `v22.11.0`. If you get an error, restart Terminal/PowerShell and try again.

---

## Step 2 — Get to the project folder

In Terminal/PowerShell, you need to "be in" the `gymcord-fantasy-web-app` folder.

**Easy way on macOS:**
1. Type `cd ` (the letters c-d followed by a space — don't press Enter)
2. Open Finder, find the `gymcord-fantasy-web-app` folder
3. Drag the folder onto the Terminal window — it pastes the path automatically
4. Press Enter

**Easy way on Windows:**
1. Open File Explorer and navigate into the `gymcord-fantasy-web-app` folder
2. Click in the address bar, type `powershell`, press Enter
3. A PowerShell window opens already in the right place

**Confirm you're in the right place.** Type:
```
ls
```
(That's a lowercase L, then S.) You should see folders like `frontend`, `db`, plus files like `README.md`.

---

## Step 3 — Install the frontend's dependencies

The frontend uses some pre-built JavaScript libraries. We need to download them once.

```
cd frontend
npm install
```

This takes 30–60 seconds. You'll see a lot of text scrolling. When it stops and you see your prompt again, it's done. You might see a few yellow "warning" messages — those are fine, ignore them. Red "error" messages would be a real problem.

---

## Step 4 — Start the app

Still in the `frontend` folder:

```
npm run dev
```

After a couple of seconds you'll see something like:

```
  VITE v5.4.x  ready in 312 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

**Open http://localhost:5173/ in your browser.** That's the app.

---

## What you'll see

- **Landing page** — hero text, "Sign up" / "Log in" buttons, feature cards
- **Light / Dark mode toggle** in the top right — try it
- **Login / Register pages** — a "Continue with Discord" button. It'll error until Supabase is configured (see the README) — that's expected at this stage.
- **The floating "Feedback" button** — bottom-right on every page, works right now even without Supabase configured for auth (it still needs Supabase for storage, though).

---

## Stopping the app

Go back to the Terminal window where it's running. Press `Ctrl + C` (Windows and macOS both — yes, even on Mac, it's `Ctrl` not `Cmd`).

---

## Running it again later

You only need to do Step 3 (`npm install`) once. After that:

```
cd "path/to/gymcord-fantasy-web-app/frontend"
npm run dev
```

Open http://localhost:5173/ — same as before.

---

## Troubleshooting

**"command not found: npm"** — Node.js isn't installed, or you need to restart Terminal after installing it.

**"cd: no such file or directory"** — the path you used in Step 2 isn't right. Re-do the drag-and-drop trick.

**Port 5173 is already in use** — Something else is using that port. Press `Ctrl+C` to stop the current run, then start it again — Vite will pick the next free port (5174, etc.) and tell you in the output.

**Anything else** — copy-paste the error into our next chat and I'll fix it.
