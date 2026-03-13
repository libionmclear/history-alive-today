// Script to fetch all articles from WordPress API and generate TypeScript data
import https from 'https';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

function decodeHTML(html) {
  return html
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8230;/g, '\u2026')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8220;/g, '\u201C');
}

function stripHTML(html) {
  return decodeHTML(html.replace(/<[^>]*>/g, '')).trim();
}

function parseContent(html) {
  const sections = [];
  // Split by block boundaries
  const blocks = html.split(/\n\n+/);
  
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    
    // Check for headings
    const h2Match = trimmed.match(/<h2[^>]*>(.*?)<\/h2>/s);
    if (h2Match) {
      const text = stripHTML(h2Match[1]);
      if (text) sections.push({ type: 'heading', text });
      continue;
    }
    
    const h3Match = trimmed.match(/<h3[^>]*>(.*?)<\/h3>/s);
    if (h3Match) {
      const text = stripHTML(h3Match[1]);
      if (text) sections.push({ type: 'subheading', text });
      continue;
    }
    
    const h4Match = trimmed.match(/<h4[^>]*>(.*?)<\/h4>/s);
    if (h4Match) {
      const text = stripHTML(h4Match[1]);
      if (text) sections.push({ type: 'subheading', text });
      continue;
    }
    
    // Check for images inside wp-block-image
    const imgMatch = trimmed.match(/<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>/);
    if (imgMatch && trimmed.includes('wp-block-image')) {
      let src = imgMatch[1];
      // Use the base image URL (not resized version)
      src = src.replace(/-\d+x\d+\./, '.');
      const alt = imgMatch[2] ? decodeHTML(imgMatch[2]) : '';
      const captionMatch = trimmed.match(/<figcaption[^>]*>(.*?)<\/figcaption>/s);
      const caption = captionMatch ? stripHTML(captionMatch[1]) : '';
      sections.push({ type: 'image', src, alt: alt || caption, caption });
      
      // Check if there's also text in this block after the figure
      const afterFigure = trimmed.replace(/<div[^>]*>.*?<\/div>/gs, '').trim();
      const pMatch = afterFigure.match(/<p[^>]*>(.*?)<\/p>/s);
      if (pMatch) {
        const text = stripHTML(pMatch[1]);
        if (text && text.length > 10) sections.push({ type: 'text', text });
      }
      continue;
    }
    
    // Check for paragraphs
    const pMatch = trimmed.match(/<p[^>]*>(.*?)<\/p>/s);
    if (pMatch) {
      const text = stripHTML(pMatch[1]);
      if (text && text.length > 3) sections.push({ type: 'text', text });
      continue;
    }
  }
  
  return sections;
}

function getCategoryMapping(wpCategories) {
  // WP category IDs from the API:
  // 4 = Things we do, 5 = Things we say, 6 = Things we use, 7 = Things we think
  // 2 = some parent category (Uncategorized or parent)
  // 337 = probably a tag or sub-category
  
  // Priority: pick the most specific category
  if (wpCategories.includes(4) && !wpCategories.includes(5) && !wpCategories.includes(6) && !wpCategories.includes(7)) {
    return { category: 'things-we-do', label: 'Things we do' };
  }
  if (wpCategories.includes(5)) return { category: 'things-we-say', label: 'Things we say' };
  if (wpCategories.includes(6) && !wpCategories.includes(7)) return { category: 'things-we-use', label: 'Things we use' };
  if (wpCategories.includes(7) && !wpCategories.includes(6)) return { category: 'things-we-think', label: 'Things we think' };
  if (wpCategories.includes(7) && wpCategories.includes(6)) return { category: 'things-we-use', label: 'Things we use' };
  if (wpCategories.includes(4) && wpCategories.includes(7)) return { category: 'things-we-think', label: 'Things we think' };
  
  // Default
  return { category: 'things-we-do', label: 'Things we do' };
}

async function main() {
  console.log('Fetching posts from WordPress API...');
  
  // Fetch all posts with embedded media
  const posts = await fetchJSON('https://historyalivetoday.com/wp-json/wp/v2/posts?per_page=100&_embed');
  console.log(`Fetched ${posts.length} posts`);
  
  // Fetch categories
  const categories = await fetchJSON('https://historyalivetoday.com/wp-json/wp/v2/categories?per_page=100');
  console.log('Categories:', categories.map(c => `${c.id}: ${c.name}`).join(', '));
  
  // Already existing slugs in data.ts
  const existingSlugs = new Set([
    'the-dark-origin-of-thumbs-up',
    'december-25th-birth-of-christmas',
    'the-beginning-of-military-marching',
    'the-black-cat-from-egyptian-god-to-evil-omen',
    'actors-acting-and-the-birth-of-theatre',
    'flatbreads-and-the-evolution-of-pizza',
    'why-does-it-cost-an-arm-and-a-leg',
    'origins-of-emperors-kings-kaisers-rex-and-dictators',
    'the-discovery-of-eureka',
    'measuring-the-historical-yard',
    'the-lucky-protective-powers-of-the-horseshoe',
    'ancient-medicines-lost-for-1000-years',
    'where-does-the-word-amen-come-from',
    'the-origin-and-invention-of-paper',
    'the-surprising-origin-of-jeans',
    'where-do-french-fries-come-from',
  ]);
  
  // WP slugs that map to existing data.ts slugs  
  const wpSlugToExisting = {
    'the-origin-of-thumbs-up': 'the-dark-origin-of-thumbs-up',
    'december-25th-the-birth-of-christmas': 'december-25th-birth-of-christmas',
    'origin-of-military-marching': 'the-beginning-of-military-marching',
    'history-of-the-flatbread-called-pizza': 'flatbreads-and-the-evolution-of-pizza',
    'why-does-it-costs-an-arm-and-a-leg': 'why-does-it-cost-an-arm-and-a-leg',
    'the-discovery-of-the-exclamation-eureka': 'the-discovery-of-eureka',
    'knowledge-of-ancient-medicines-lost-for-1000-years': 'ancient-medicines-lost-for-1000-years',
  };
  
  const allExistingSlugs = new Set([...existingSlugs, ...Object.keys(wpSlugToExisting)]);
  
  // Filter to only missing articles
  const missingPosts = posts.filter(p => {
    const existsDirectly = existingSlugs.has(p.slug);
    const existsAsMapped = Object.keys(wpSlugToExisting).includes(p.slug);
    return !existsDirectly && !existsAsMapped;
  });
  
  console.log(`Missing posts: ${missingPosts.length}`);
  missingPosts.forEach(p => console.log(`  - ${p.slug} (${decodeHTML(p.title.rendered)})`));
  
  // Generate data for each missing post
  const dataEntries = [];
  const contentEntries = [];
  
  for (const post of missingPosts) {
    const title = decodeHTML(post.title.rendered);
    const slug = post.slug;
    const date = new Date(post.date);
    const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const excerpt = stripHTML(post.excerpt.rendered).substring(0, 200);
    const catMap = getCategoryMapping(post.categories);
    
    // Get featured image URL
    let imageUrl = '';
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
      const media = post._embedded['wp:featuredmedia'][0];
      if (media.media_details && media.media_details.sizes) {
        // Prefer medium_large or large
        const sizes = media.media_details.sizes;
        imageUrl = (sizes.medium_large || sizes.large || sizes.full || {}).source_url || media.source_url || '';
      } else {
        imageUrl = media.source_url || '';
      }
    }
    
    dataEntries.push({ slug, title, category: catMap.category, categoryLabel: catMap.label, date: dateStr, excerpt, image: imageUrl });
    
    // Parse content
    const sections = parseContent(post.content.rendered);
    contentEntries.push({ slug, sections });
  }
  
  // Output as JSON
  const output = { dataEntries, contentEntries };
  const fs = await import('fs');
  fs.writeFileSync('scripts/articles-output.json', JSON.stringify(output, null, 2));
  console.log('Written to scripts/articles-output.json');
}

main().catch(console.error);
