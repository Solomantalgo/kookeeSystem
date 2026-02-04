import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '../product-catalog/public/images');

async function compressExistingImages() {
  try {
    const files = fs.readdirSync(imagesDir);
    const jpgFiles = files.filter(file => file.endsWith('.jpg'));

    console.log(`Found ${jpgFiles.length} JPG files to compress...`);

    for (const file of jpgFiles) {
      const inputPath = path.join(imagesDir, file);
      const outputPath = path.join(imagesDir, file.replace('.jpg', '.webp'));

      try {
        await sharp(inputPath)
          .resize(600, 600, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({
            quality: 75,
            effort: 4
          })
          .toFile(outputPath);

        console.log(`✅ Compressed: ${file} -> ${file.replace('.jpg', '.webp')}`);

        // Optionally remove old file
        // fs.unlinkSync(inputPath);

      } catch (err) {
        console.error(`❌ Failed to compress ${file}:`, err.message);
      }
    }

    console.log('Compression complete!');
  } catch (err) {
    console.error('Error:', err);
  }
}

compressExistingImages();