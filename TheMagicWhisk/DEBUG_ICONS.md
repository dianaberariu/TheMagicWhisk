# 🔍 Vector Icons Debugging Guide

## Quick Fix - Step 1: Rebuild Everything

```bash
# Clear and rebuild
rm -rf node_modules dist .expo
npm install
npm run check-build
```

## Step 2: Check in Browser DevTools

1. **Open your deployed site** in browser
2. **Open DevTools** (F12 or Cmd+Option+I)
3. **Go to Network tab**
4. **Reload page** (Cmd+R or Ctrl+R)
5. **Search for**:
   - `fonts.css` - Should load with 200 status
   - `Ionicons.ttf` - Should load with 200 status
   - Look for any 404 errors

### Expected Network Results:
```
✅ fonts.css              200 OK
✅ Ionicons.ttf           200 OK
✅ MaterialIcons.ttf      200 OK
❌ Any 404s for fonts     FIX REQUIRED
```

## Step 3: Check Console for Errors

Look for messages like:
```
✅ Vector icon fonts CSS injected       (GOOD)
✅ All fonts loaded successfully        (GOOD)
⚠️ Failed to inject icon fonts CSS      (PROBLEM)
```

## Step 4: Verify Fonts Are in Dist

```bash
# Check if fonts folder exists
ls -la dist/fonts/ | head -10

# Check if fonts.css exists
cat dist/fonts.css | head -5

# Check file count
ls dist/fonts/ | wc -l  # Should show many .ttf files
```

## Step 5: Check Font Paths in Generated HTML

In browser DevTools:
1. Go to **Elements/Inspector** tab
2. Find `<head>` section
3. Look for:
   ```html
   <link rel="stylesheet" href="./fonts.css" />
   ```
4. Or inline `<style>` with `@font-face` declarations

## Common Issues & Fixes

### Issue: `fonts.css` returns 404
- **Cause**: File not copied to dist folder
- **Fix**:
  ```bash
  cp public/fonts.css dist/fonts.css
  ```

### Issue: Font files (*.ttf) return 404
- **Cause**: Fonts not copied to dist/fonts folder
- **Fix**:
  ```bash
  npm run copy-fonts
  ```

### Issue: Fonts show 200 but still don't render
- **Cause**: Font paths in CSS are incorrect
- **Fix**: Check font paths in dist/fonts.css:
  ```bash
  cat dist/fonts.css | grep "url("
  # Should show: url('./fonts/Ionicons.ttf')
  # NOT: url('/fonts/Ionicons.ttf')
  # NOT: url('/TheMagicWhisk/fonts/Ionicons.ttf') <- relative paths only
  ```

### Issue: Fonts load but icons still show as boxes
- **Cause**: CSS not injected, or fonts not loaded before render
- **Fix**:
  ```bash
  # 1. Hard refresh browser
  Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
  
  # 2. Clear browser cache
  # 3. Try in incognito/private window
  ```

## Step 6: Force Font Loading Test

Add this to browser console and run:

```javascript
// Check if fonts are recognized
console.log('Font families available:');
console.log(document.fonts.entries());

// Try to manually load a font
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = './fonts.css';
document.head.appendChild(link);
console.log('✅ Manually injected fonts.css');

// Wait and check
setTimeout(() => {
  console.log('Fonts loaded:', document.fonts.status);
}, 2000);
```

## Step 7: Check Expo Export Output

```bash
# Rebuild and check what's actually exported
npm run predeploy

# Look at the dist folder structure
tree dist/ -L 2
# or
ls -la dist/
ls -la dist/fonts/
ls -la dist/bundles/ | head -20
```

## Step 8: Netlify-Specific Issues

If deploying to Netlify:

1. **Check `_redirects` file** (should NOT rewrite *.ttf or *.css):
   ```
   /* /index.html 200
   ```

2. **Check Headers** in `netlify.toml`:
   ```toml
   [[headers]]
     for = "/fonts/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"
       Content-Type = "font/ttf"
   ```

3. **Deploy logs**: Check Netlify build output for warnings

## Step 9: Full Diagnostic Command

Run this to get complete diagnostic info:

```bash
npm run validate-fonts
```

Should output:
```
✅ Icon fonts in dist/
✅ fonts.css in dist/
✅ Icon fonts in node_modules/@expo/vector-icons
✅ index.html in dist/
```

## Still Not Working? Last Resort

Try this nuclear option:

```bash
# 1. Clean everything
rm -rf node_modules dist .expo package-lock.json

# 2. Reinstall
npm install

# 3. Full rebuild with verbose logging
DEBUG=* npm run predeploy 2>&1 | tee build.log

# 4. Check build.log for errors
grep -i "font\|icon\|error" build.log

# 5. Validate
npm run validate-fonts
```

## Verification Checklist

- [ ] `dist/fonts.css` exists and is 10+ KB
- [ ] `dist/fonts/` folder has 15+ .ttf files
- [ ] `dist/index.html` references fonts.css
- [ ] Browser Network tab shows fonts.css: 200
- [ ] Browser Network tab shows .ttf files: 200
- [ ] Browser Console shows "✅ Vector icon fonts CSS injected"
- [ ] Icons render as actual icons (not empty boxes)

---

## Need Help?

1. Run: `npm run validate-fonts`
2. Check browser console for errors
3. Check browser Network tab for 404s
4. Run: `npm run check-build`
