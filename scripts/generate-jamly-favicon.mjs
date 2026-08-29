import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicDir = resolve(root, "public");
const faviconVersion = "v13";
const sourcePath = resolve(publicDir, "brand/jamly-logo-20260730.png");
const source = await readFile(sourcePath);

const iconBackground = "#050608";

// Crop the existing logo's internal padding, strip the source plate, then place
// a slightly smaller mark on an opaque canvas so browser tab rounding never
// exposes a white plate.
const markRaw = await sharp(source)
  .extract({ left: 145, top: 72, width: 735, height: 864 })
  .resize(404, 404, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let index = 0; index < markRaw.data.length; index += 4) {
  const red = markRaw.data[index] ?? 0;
  const green = markRaw.data[index + 1] ?? 0;
  const blue = markRaw.data[index + 2] ?? 0;
  if (red + green + blue < 34) {
    markRaw.data[index + 3] = 0;
  }
}

const croppedMark = await sharp(markRaw.data, { raw: markRaw.info }).png().toBuffer();

const master = await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: iconBackground
  }
})
  .composite([{ input: croppedMark, left: 54, top: 54 }])
  .flatten({ background: iconBackground })
  .png()
  .toBuffer();

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="${iconBackground}"/><image href="data:image/png;base64,${master.toString("base64")}" width="512" height="512"/></svg>`;

await Promise.all([
  writeFile(resolve(publicDir, `favicon-${faviconVersion}.svg`), faviconSvg),
  writeFile(resolve(publicDir, "favicon-v11.svg"), faviconSvg),
  writeFile(resolve(publicDir, "favicon-v10.svg"), faviconSvg),
  writeFile(resolve(publicDir, "favicon.svg"), faviconSvg),
  writeFile(resolve(publicDir, `favicon-${faviconVersion}.png`), master),
  writeFile(resolve(publicDir, "favicon-v11.png"), master),
  writeFile(resolve(publicDir, "favicon-v10.png"), master),
  writeFile(resolve(publicDir, `icon-512-${faviconVersion}.png`), master),
  writeFile(resolve(publicDir, "icon-512-v11.png"), master),
  writeFile(resolve(publicDir, "icon-512-v10.png"), master),
  writeFile(resolve(publicDir, "icon-512.png"), master),
  writeFile(resolve(publicDir, "icon.png"), master),
  sharp(master).resize(192, 192).png().toFile(resolve(publicDir, `icon-192-${faviconVersion}.png`)),
  sharp(master).resize(192, 192).png().toFile(resolve(publicDir, "icon-192-v11.png")),
  sharp(master).resize(192, 192).png().toFile(resolve(publicDir, "icon-192-v10.png")),
  sharp(master).resize(192, 192).png().toFile(resolve(publicDir, "icon-192.png")),
  sharp(master).resize(180, 180).png().toFile(resolve(publicDir, `apple-touch-icon-${faviconVersion}.png`)),
  sharp(master).resize(180, 180).png().toFile(resolve(publicDir, "apple-touch-icon-v11.png")),
  sharp(master).resize(180, 180).png().toFile(resolve(publicDir, "apple-touch-icon-v10.png")),
  sharp(master).resize(180, 180).png().toFile(resolve(publicDir, "apple-touch-icon.png")),
  sharp(master).resize(48, 48).png().toFile(resolve(publicDir, "brand/favicon-48x48.png")),
  sharp(master).resize(32, 32).png().toFile(resolve(publicDir, "brand/favicon-32x32.png")),
  sharp(master).resize(512, 512).png().toFile(resolve(publicDir, "brand/jamly-favicon.png"))
]);

const icoImages = await Promise.all(
  [16, 24, 32, 48].map((size) => sharp(master).resize(size, size).png().toBuffer())
);
const ico = createIco(icoImages, [16, 24, 32, 48]);
await Promise.all([
  writeFile(resolve(publicDir, `favicon-${faviconVersion}.ico`), ico),
  writeFile(resolve(publicDir, "favicon-v11.ico"), ico),
  writeFile(resolve(publicDir, "favicon-v10.ico"), ico),
  writeFile(resolve(publicDir, "favicon.ico"), ico)
]);

console.log(`Generated Jamly ${faviconVersion} favicon assets.`);

function createIco(images, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map((image, index) => {
    const entry = Buffer.alloc(16);
    const size = sizes[index];
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images]);
}
