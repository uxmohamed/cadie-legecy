# Extension Icons

This folder should contain the extension icons in the following sizes:

- `icon-16.png` - 16x16 pixels (toolbar icon, small)
- `icon-48.png` - 48x48 pixels (extension management page)
- `icon-128.png` - 128x128 pixels (Chrome Web Store, installation)

## Creating Icons

You can use any image editor to create these icons. Here are some recommendations:

### Design Guidelines
- Use a simple, recognizable design
- Ensure icons look good at small sizes
- Use transparency (PNG format with alpha channel)
- Follow Chrome's [icon design guidelines](https://developer.chrome.com/docs/webstore/images/)

### Color Scheme
Match your Vault branding:
- Primary color: `#171717` (dark)
- Accent color: Based on your app theme
- Background: Transparent or white

### Tools
- **Figma** - Professional design tool
- **Canva** - Easy online tool
- **GIMP** - Free desktop editor
- **ImageMagick** - Command-line resizing

### Quick Setup (Temporary)

For development, you can use a simple colored square:

```bash
# Using ImageMagick (install via: brew install imagemagick)
convert -size 16x16 xc:#171717 icon-16.png
convert -size 48x48 xc:#171717 icon-48.png
convert -size 128x128 xc:#171717 icon-128.png
```

Or create simple icons with text:

```bash
convert -size 128x128 xc:#171717 -font Arial -pointsize 72 -fill white -gravity center -annotate +0+0 "V" icon-128.png
convert icon-128.png -resize 48x48 icon-48.png
convert icon-128.png -resize 16x16 icon-16.png
```

## For Production

Before publishing to Chrome Web Store, ensure you have:
1. High-quality icons at all sizes
2. Consistent design across sizes
3. Professional appearance
4. Proper transparency
5. Retina-ready (2x versions optional but recommended)

## Additional Images Needed for Chrome Web Store

When submitting to Chrome Web Store, you'll also need:

- **Promotional Images:**
  - Small tile: 440x280 pixels
  - Large tile: 920x680 pixels (optional)
  - Marquee: 1400x560 pixels (optional)

- **Screenshots:**
  - At least 1, maximum 5
  - Size: 1280x800 or 640x400 pixels
  - Show the extension in action

