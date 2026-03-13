// Generate TypeScript code from the JSON output
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/articles-output.json', 'utf-8'));

// Skip the french fries article since it already exists with a different slug
const skipSlugs = new Set(['where-do-french-fries-come-from-france']);

function escapeTS(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

// Generate data.ts entries
let dataTS = '\n  // ---- Auto-generated articles below ----\n';
let id = 17; // Starting after existing 16 articles

for (const entry of data.dataEntries) {
  if (skipSlugs.has(entry.slug)) continue;
  
  dataTS += `  {
    id: ${id},
    slug: '${escapeTS(entry.slug)}',
    title: '${escapeTS(entry.title)}',
    category: '${entry.category}',
    categoryLabel: '${entry.categoryLabel}',
    date: '${escapeTS(entry.date)}',
    author: 'Libion McLear',
    excerpt: '${escapeTS(entry.excerpt)}',
    image: '${escapeTS(entry.image)}',
  },\n`;
  id++;
}

fs.writeFileSync('scripts/data-entries.txt', dataTS);
console.log(`Generated ${id - 17} data entries`);

// Generate articleContent.ts entries
let contentTS = '';

for (const entry of data.contentEntries) {
  if (skipSlugs.has(entry.slug)) continue;
  if (!entry.sections || entry.sections.length === 0) continue;
  
  contentTS += `\n  '${escapeTS(entry.slug)}': [\n`;
  
  for (const section of entry.sections) {
    switch (section.type) {
      case 'heading':
        contentTS += `    { type: 'heading', text: '${escapeTS(section.text)}' },\n`;
        break;
      case 'subheading':
        contentTS += `    { type: 'subheading', text: '${escapeTS(section.text)}' },\n`;
        break;
      case 'text':
        contentTS += `    { type: 'text', text: '${escapeTS(section.text)}' },\n`;
        break;
      case 'image':
        contentTS += `    { type: 'image', src: '${escapeTS(section.src)}', alt: '${escapeTS(section.alt)}', caption: '${escapeTS(section.caption)}' },\n`;
        break;
    }
  }
  
  contentTS += `  ],\n`;
}

fs.writeFileSync('scripts/content-entries.txt', contentTS);
console.log(`Generated content entries`);
console.log('Done! Check scripts/data-entries.txt and scripts/content-entries.txt');
