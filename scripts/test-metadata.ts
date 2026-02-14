
import { extractMetadata } from "../src/lib/metadata";

async function run() {
  const urls = [
    "https://react.dev",
    "https://linear.app",
    "https://github.com",
    "https://are.na/block/43593515"
  ];

  console.log("Starting metadata extraction test...");

  for (const url of urls) {
    console.log(`\n--- Testing ${url} ---`);
    try {
      const start = Date.now();
      const metadata = await extractMetadata(url);
      const duration = Date.now() - start;
      
      console.log(`Duration: ${duration}ms`);
      console.log("Status:", metadata.fetch_status);
      console.log("Status Code:", metadata.status_code);
      console.log("Title:", metadata.title);
      console.log("Description:", metadata.description ? metadata.description.substring(0, 50) + "..." : "N/A");
      console.log("Image:", metadata.preview_image_url || "N/A");
    } catch (error) {
      console.error("CRITICAL ERROR:", error);
    }
  }
}

run();
