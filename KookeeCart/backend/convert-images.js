import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '../product-catalog/public/images');

async function convertJpgToWebp() {
  try {
    const files = fs.readdirSync(imagesDir);
    const jpgFiles = files.filter(file => file.endsWith('.jpg'));

    console.log(`Found ${jpgFiles.length} JPG files to convert...`);

    for (const jpgFile of jpgFiles) {
      const jpgPath = path.join(imagesDir, jpgFile);
      const webpFile = jpgFile.replace('.jpg', '.webp');
      const webpPath = path.join(imagesDir, webpFile);

      // Skip if WebP already exists
      if (fs.existsSync(webpPath)) {
        console.log(`⏭️  Skipping ${jpgFile} (WebP exists)`);
        continue;
      }

      try {
        console.log(`🔄 Converting ${jpgFile}...`);
        await sharp(jpgPath)
          .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(webpPath);

        console.log(`✅ Converted ${jpgFile} to ${webpFile}`);
      } catch (err) {
        console.error(`❌ Failed to convert ${jpgFile}:`, err.message);
      }
    }

    console.log('🎉 Conversion complete!');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

convertJpgToWebp();