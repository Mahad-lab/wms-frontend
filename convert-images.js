const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = process.argv[2] || './public';
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('_300.png'));

async function convert() {
  for (const file of files) {
    const basePath = path.join(publicDir, file.replace('_300.png', ''));
    
    // Convert to WebP
    await sharp(path.join(publicDir, file))
      .webp({ quality: 80 })
      .toFile(`${basePath}_300.webp`);
    
    // Convert to AVIF
    await sharp(path.join(publicDir, file))
      .avif({ quality: 60 })
      .toFile(`${basePath}_300.avif`);
    
    console.log(`Converted: ${file}`);
  }
}

convert().then(() => console.log('Done!'));
