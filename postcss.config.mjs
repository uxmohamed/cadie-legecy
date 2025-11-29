import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: path.resolve(__dirname, "tailwind.config.js"),
    },
  },
};

export default config;
