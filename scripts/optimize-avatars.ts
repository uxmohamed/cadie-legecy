import * as fs from "fs";
import * as path from "path";

/**
 * Optimizes avatar images by converting PNG to WebP and resizing to 256x256px
 * This script requires sharp to be installed: npm install --save-dev sharp
 */
async function optimizeAvatars() {
  try {
    // Dynamic import of sharp (may not be installed yet)
    const sharp = await import("sharp");
    
    const assetsDir = path.join(process.cwd(), "assets");
    const outputDir = path.join(process.cwd(), "public", "avatars");
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Process all avatar files
    const avatarFiles = Array.from({ length: 12 }, (_, i) => 
      `avatar-pic-${String(i + 1).padStart(2, "0")}.png`
    );
    
    console.log("Optimizing avatar images...");
    
    for (const file of avatarFiles) {
      const inputPath = path.join(assetsDir, file);
      const outputFile = file.replace(".png", ".webp");
      const outputPath = path.join(outputDir, outputFile);
      
      if (!fs.existsSync(inputPath)) {
        console.warn(`Warning: ${file} not found, skipping...`);
        continue;
      }
      
      await sharp.default(inputPath)
        .resize(256, 256, {
          fit: "cover",
          position: "center",
          kernel: "lanczos3", // Higher quality resampling
        })
        .webp({ 
          quality: 100, // Maximum quality (near-lossless)
          effort: 6, // Higher compression effort for better quality
          nearLossless: true, // Enable near-lossless compression
        })
        .toFile(outputPath);
      
      console.log(`✓ Optimized ${file} -> ${outputFile}`);
    }
    
    console.log("\n✅ All avatars optimized successfully!");
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cannot find module")) {
      console.error("\n❌ Error: 'sharp' package not found.");
      console.error("Please install it first: npm install --save-dev sharp");
      console.error("Or: bun add -d sharp");
      process.exit(1);
    }
    console.error("Error optimizing avatars:", error);
    process.exit(1);
  }
}

optimizeAvatars();
