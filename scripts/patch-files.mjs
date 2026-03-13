// Patch script to directly update data.ts and articleContent.ts
import fs from 'fs';

const dataEntries = fs.readFileSync('scripts/data-entries.txt', 'utf-8');
const contentEntries = fs.readFileSync('scripts/content-entries.txt', 'utf-8');

// Patch data.ts - insert before the closing ];
const dataPath = 'src/lib/data.ts';
let dataContent = fs.readFileSync(dataPath, 'utf-8');

// Find the last article entry closing and insert new entries before ];
const insertPoint = dataContent.lastIndexOf('];');
if (insertPoint === -1) {
  console.error('Could not find ]; in data.ts');
  process.exit(1);
}

// Insert the new entries
dataContent = dataContent.substring(0, insertPoint) + dataEntries + '];\n' + dataContent.substring(insertPoint + 2);
fs.writeFileSync(dataPath, dataContent);
console.log('Patched data.ts');

// Patch articleContent.ts - insert before the closing };
const contentPath = 'src/lib/articleContent.ts';
let contentContent = fs.readFileSync(contentPath, 'utf-8');

// Find the last }; that closes the articleContent record
const contentInsertPoint = contentContent.lastIndexOf('};');
if (contentInsertPoint === -1) {
  console.error('Could not find }; in articleContent.ts');
  process.exit(1);
}

contentContent = contentContent.substring(0, contentInsertPoint) + contentEntries + '};\n';
fs.writeFileSync(contentPath, contentContent);
console.log('Patched articleContent.ts');

console.log('Done!');
