// Quick script to create placeholder PNG icons
const fs = require("fs");
const path = require("path");

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Minimal valid PNG files (1x1 pixels, but Chrome will scale them)
// These are base64 encoded minimal PNG images in dark color
const iconSizes = {
  16: "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAEklEQVR42mNgGAWjYBSMglEAAAQaAAHybnV1AAAAAElFTkSuQmCC",
  48: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==",
  128: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==",
};

// Create better looking icons (dark squares)
// This is a simple 16x16 dark gray square
const createSimpleIcon = (size) => {
  // PNG header and minimal data for a dark square
  const darkSquare = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // IHDR chunk
    0x00,
    0x00,
    0x00,
    size,
    0x00,
    0x00,
    0x00,
    size, // width and height
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x8b,
    0x6f,
    0x26,
    0x7c, // bit depth, color type, etc.
    0x00,
    0x00,
    0x00,
    0x0c,
    0x49,
    0x44,
    0x41,
    0x54, // IDAT chunk
    0x08,
    0x99,
    0x63,
    0x60,
    0x60,
    0x60,
    0x00,
    0x00,
    0x00,
    0x04,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e,
    0x44,
    0xae,
    0x42,
    0x60,
    0x82, // IEND
  ]);
  return darkSquare;
};

// For a quick solution, let's create solid color PNGs
Object.keys(iconSizes).forEach((size) => {
  const iconPath = path.join(iconsDir, `icon-${size}.png`);

  // Decode base64 and write
  const buffer = Buffer.from(iconSizes[size], "base64");
  fs.writeFileSync(iconPath, buffer);

  console.log(`✓ Created ${iconPath}`);
});

console.log("\n✅ Placeholder icons created successfully!");
console.log(
  "Note: These are minimal placeholders. For production, create proper icons.",
);
