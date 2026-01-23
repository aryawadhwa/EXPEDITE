# How to Import Custom Fonts in Your Web App

## Method 1: Google Fonts (Current Method)

This is what we're currently using for Space Grotesk:

```css
/* In index.css */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

html {
  font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
```

### To Change to a Different Google Font:

1. **Visit Google Fonts**: https://fonts.google.com/
2. **Select a font** (e.g., "Archivo Black" for brutalist, "Bebas Neue" for bold)
3. **Click "Get font"** then "Get embed code"
4. **Copy the @import URL**
5. **Replace line 1 in `index.css`** with your new import
6. **Update the font-family** on line 82

Example with Bebas Neue (very brutalist):
```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

html {
  font-family: 'Bebas Neue', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
```

---

## Method 2: Custom Font Files (Self-Hosted)

For fonts not on Google Fonts:

### Step 1: Add font files to your project
```
frontend/
  public/
    fonts/
      YourFont-Regular.woff2
      YourFont-Bold.woff2
```

### Step 2: Define @font-face in index.css
```css
@font-face {
  font-family: 'YourFont';
  src: url('/fonts/YourFont-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'YourFont';
  src: url('/fonts/YourFont-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

html {
  font-family: 'YourFont', sans-serif;
}
```

---

## Method 3: Adobe Fonts / Typekit

```html
<!-- In index.html <head> -->
<link rel="stylesheet" href="https://use.typekit.net/YOUR_KIT_ID.css">
```

```css
/* In index.css */
html {
  font-family: 'your-adobe-font', sans-serif;
}
```

---

## Method 4: Fonts from CDN (fonts.com, etc.)

```html
<!-- In index.html <head> -->
<link rel="stylesheet" href="https://fast.fonts.net/cssapi/YOUR_PROJECT_ID.css">
```

---

## Popular Brutalist Fonts for Your Design:

### Free (Google Fonts):
- **Bebas Neue** - Very bold, condensed, brutalist
- **Archivo Black** - Heavy, geometric
- **Oswald** - Bold, condensed
- **Anton** - Extra bold display
- **Barlow Condensed** - Geometric, strong

### Premium Options:
- **Druk** - Classic brutalist
- **Neue Haas Grotesk** - Swiss brutalism
- **Suisse Int'l** - Modern brutalist
- **Monument Grotesk** - Geometric brutalist

---

## Quick Font Change Guide:

1. **Find your font** on Google Fonts or download it
2. **Copy the import URL** or add files to `/public/fonts/`
3. **Update `index.css` line 1** with the new @import
4. **Update `index.css` line 82** with the new font-family name
5. **Save and refresh** - Vite will hot-reload automatically!

---

## Current Font Stack:
```css
font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
```

The fallback fonts ensure the site works even if the custom font fails to load.
