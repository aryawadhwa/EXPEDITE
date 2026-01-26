# Installing Galgo Condensed Font - Step by Step

## Step 1: Download the Font

1. Download the trial font from: https://www.giuliaboggio.xyz/TRIALS/galgo%20condensed/Galgo_TRIAL.zip
2. Extract the ZIP file
3. You should see font files like:
   - GalgoCondensed-Light.woff2
   - GalgoCondensed-Regular.woff2
   - GalgoCondensed-Bold.woff2
   (or .woff, .ttf, .otf formats)

## Step 2: Create Fonts Folder

Run this command in your terminal:
```bash
mkdir -p "/Users/aryawadhwa/Desktop/outbound ai/frontend/public/fonts"
```

## Step 3: Copy Font Files

Copy all the font files from the downloaded folder to:
```
/Users/aryawadhwa/Desktop/outbound ai/frontend/public/fonts/
```

## Step 4: Update index.css

Replace the first line of `/Users/aryawadhwa/Desktop/outbound ai/frontend/src/index.css`:

**REMOVE THIS LINE (line 1):**
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
```

**ADD THESE LINES AT THE TOP (before @tailwind):**
```css
/* Galgo Condensed - Brutalist Condensed Font */
@font-face {
  font-family: 'Galgo Condensed';
  src: url('/fonts/GalgoCondensed-Light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Galgo Condensed';
  src: url('/fonts/GalgoCondensed-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Galgo Condensed';
  src: url('/fonts/GalgoCondensed-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

## Step 5: Update Font Family

Find this line (around line 82):
```css
font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
```

**REPLACE WITH:**
```css
font-family: 'Galgo Condensed', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
letter-spacing: -0.02em; /* Tighter spacing for condensed font */
```

## Step 6: Save and Refresh

1. Save the `index.css` file
2. The Vite dev server should auto-reload
3. Refresh your browser at http://localhost:8081
4. You should see the Galgo Condensed font!

---

## Troubleshooting:

**If the font doesn't load:**

1. Check the browser console (F12) for errors
2. Verify the font files are in `/public/fonts/`
3. Make sure the file names match exactly (case-sensitive!)
4. Try using `.woff` instead of `.woff2` if you have that format
5. Clear browser cache and hard refresh (Cmd+Shift+R on Mac)

**Font file name variations:**
- If your files are named differently (e.g., `galgo-condensed-light.woff2`), update the `src:` URLs to match
- Example: `url('/fonts/galgo-condensed-light.woff2')`

---

## Alternative: Use a CDN (if available)

If Galgo Condensed has a CDN link, you can use:
```css
@import url('CDN_LINK_HERE');
```

But for this font, self-hosting is the recommended approach.
