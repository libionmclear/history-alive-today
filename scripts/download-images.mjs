import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DATA_FILE = 'src/lib/data.ts';
const CONTENT_FILE = 'src/lib/articleContent.ts';
const OUTPUT_DIR = 'public/images';

// Extract all unique image URLs from both files
function extractUrls() {
  const urls = new Set();
  const regex = /https:\/\/historyalivetoday\.com\/wp-content\/uploads\/[^'"\s)]+/g;
  
  for (const file of [DATA_FILE, CONTENT_FILE]) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = regex.exec(content)) !== null) {
      urls.add(match[0]);
    }
    regex.lastIndex = 0;
  }
  return [...urls];
}

// Convert original URL to local path: /images/uploads/2022/05/filename.jpg
function urlToLocalPath(url) {
  const uploadsIdx = url.indexOf('/wp-content/uploads/');
  if (uploadsIdx === -1) return null;
  const relPath = url.substring(uploadsIdx + '/wp-content/uploads/'.length);
  return '/images/uploads/' + relPath;
}

// Download a file from URL
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    fs.mkdirSync(dir, { recursive: true });
    
    const handler = (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const mod = loc.startsWith('https') ? https : http;
        mod.get(loc, { headers: { 'User-Agent': 'Mozilla/5.0' } }, handler).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    };
    
    // Try Wayback Machine first
    const waybackUrl = `https://web.archive.org/web/2024if_/${url}`;
    https.get(waybackUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, handler).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const urls = extractUrls();
  console.log(`Found ${urls.length} unique image URLs`);
  
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  let success = 0;
  let failed = 0;
  const failures = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const localPath = urlToLocalPath(url);
    if (!localPath) { 
      console.log(`  SKIP: ${url}`);
      continue; 
    }
    
    const destPath = path.join('public', localPath);
    
    // Skip if already downloaded
    if (fs.existsSync(destPath)) {
      console.log(`  [${i+1}/${urls.length}] EXISTS: ${localPath}`);
      success++;
      continue;
    }
    
    try {
      console.log(`  [${i+1}/${urls.length}] Downloading: ${path.basename(url)}`);
      await downloadFile(url, destPath);
      success++;
      // Small delay to be polite to Wayback Machine
      await sleep(300);
    } catch (err) {
      console.log(`  [${i+1}/${urls.length}] FAILED: ${err.message}`);
      failures.push(url);
      failed++;
      await sleep(500);
    }
  }
  
  console.log(`\nDone: ${success} downloaded, ${failed} failed`);
  if (failures.length > 0) {
    console.log('Failed URLs:');
    failures.forEach(u => console.log(`  ${u}`));
  }
  
  // Now update the source files
  console.log('\nUpdating source files...');
  for (const file of [DATA_FILE, CONTENT_FILE]) {
    let content = fs.readFileSync(file, 'utf-8');
    let count = 0;
    for (const url of urls) {
      const localPath = urlToLocalPath(url);
      if (!localPath) continue;
      const destPath = path.join('public', localPath);
      if (!fs.existsSync(destPath)) continue;
      
      while (content.includes(url)) {
        content = content.replace(url, localPath);
        count++;
      }
    }
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`  ${file}: ${count} URLs replaced`);
  }
  
  console.log('\nAll done! Run "git add . && git commit && git push" to deploy.');
}

main().catch(console.error);
