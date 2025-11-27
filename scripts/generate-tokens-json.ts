// Script to generate tokens.json for the HTML showcase
import { writeFileSync } from 'fs';
import { join } from 'path';
import { theme } from '../src/theme/tokens';

const outputPath = join(__dirname, '../internal-ui-tests/tokens.json');

const tokens = {
  light: theme.light,
  dark: theme.dark
};

writeFileSync(outputPath, JSON.stringify(tokens, null, 2));
console.log(`✅ Generated ${outputPath}`);
