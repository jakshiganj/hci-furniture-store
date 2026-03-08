import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urls = [
  { name: 'sofa', url: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/sofa-with-blanket/model.gltf' },
  { name: 'table', url: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/table/model.gltf' },
  { name: 'plant', url: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/plant/model.gltf' },
  { name: 'bed', url: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/bed/model.gltf' },
  { name: 'shelf', url: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/bookcase-wide/model.gltf' }
];

const destDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          console.log(`Redirecting ${url} to ${response.headers.location}`);
          return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
    console.log('Starting downloads...');
    for (const item of urls) {
        const dest = path.join(destDir, `${item.name}.gltf`);
        try {
            console.log(`Downloading ${item.name}...`);
            await download(item.url, dest);
            console.log(`Successfully downloaded ${item.name}`);
        } catch (err) {
            console.error(`Failed to download ${item.name}: ${err.message}`);
        }
    }
    console.log('Done.');
}

run();
