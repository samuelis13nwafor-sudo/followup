import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");
const svgPath = resolve(publicDir, "icon-source.svg");
const svgBuffer = readFileSync(svgPath);

const icons = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
];

for (const { file, size } of icons) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, file));
  console.log(`✓ ${file}`);
}

// Maskable: source SVG already has full-bleed background, it IS maskable.
// Copy 512 as maskable variant.
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(resolve(publicDir, "icon-maskable-512.png"));
console.log("✓ icon-maskable-512.png");

// Also update favicon.svg to use FollowUp green
const newFavicon = readFileSync(svgPath).toString()
  .replace('width="512" height="512" viewBox="0 0 512 512"', 'width="180" height="180" viewBox="0 0 512 512"');
import { writeFileSync } from "fs";
writeFileSync(resolve(publicDir, "favicon.svg"), newFavicon);
console.log("✓ favicon.svg updated");

console.log("All icons generated.");
