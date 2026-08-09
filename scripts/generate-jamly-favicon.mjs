import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicDir = resolve(root, "public");
const sourcePath = resolve(publicDir, "brand/jamly-logo-20260730.png");
const source = await readFile(sourcePath);

// Crop the existing logo's internal padding, then restore an opaque black canvas.
// Safari renders transparent favicon corners on a light plate in some tab contexts.
const croppedMark = await sharp(source)
  .extract({ left: 145, top: 72, width: 735, height: 864 })
  .resize(512, 512, { fit: "contain", background: "#050608" })
  .png()
  .toBuffer();

const master = await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: "#050608"
  }
})
  .composite([{ input: croppedMark }])
  .png()
  .toBuffer();

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#050608"/><image href="data:image/png;base64,${master.toString("base64")}" width="512" height="512"/></svg>`;

await Promise.all([
  writeFile(resolve(publicDir, "favicon-v10.svg"), faviconSvg),
  writeFile(resolve(publicDir, "favicon.svg"), faviconSvg),
  writeFile(resolve(publicDir, "favicon-v10.png"), master),
  writeFile(resolve(publicDir, "icon-512-v10.png"), master),
  writeFile(resolve(publicDir, "icon-512.png"), master),
  writeFile(resolve(publicDir, "icon.png"), master),
  sharp(master).resize(192, 192).png().toFile(resolve(publicDir, "icon-192-v10.png")),
  sharp(master).resize(192, 192).png().toFile(resolve(publicDir, "icon-192.png")),
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
  writeFile(resolve(publicDir, "favicon-v10.ico"), ico),
  writeFile(resolve(publicDir, "favicon.ico"), ico)
]);

console.log("Generated Jamly v10 favicon assets.");

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
