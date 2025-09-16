#!/usr/bin/env node

/**
 * IconBoard - Add Icons Script
 * Simple folder-based icon addition to existing chunked system
 * 
 * Usage:
 * 1. Create new-icons/ folder with subfolders for each category
 * 2. Drop SVG files in appropriate category folders
 * 3. Run: npm run add-icons
 */

const fs = require('fs');
const path = require('path');

class IconAdder {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.newIconsDir = path.join(this.projectRoot, 'new-icons');
    this.publicDir = path.join(this.projectRoot, 'public');
    this.chunksDir = path.join(this.publicDir, 'chunks');
    
    // Current data
    this.chunksIndex = null;
    this.categories = [];
    this.categoryChunks = {};
    this.nextChunkNumber = 1;
    this.iconsPerChunk = 50;
  }

  async run() {
    console.log('🚀 IconBoard - Adding New Icons...\n');
    
    try {
      // Check if new-icons folder exists
      if (!fs.existsSync(this.newIconsDir)) {
        this.createExampleStructure();
        return;
      }

      // Load current data
      await this.loadCurrentData();
      
      // Process new icons
      const newIcons = await this.processNewIcons();
      
      if (newIcons.length === 0) {
        console.log('📭 No new icons found in new-icons/ folder');
        console.log('💡 Drop SVG files in category folders and run again');
        return;
      }

      // Add icons to chunks
      const iconsAdded = await this.addIconsToChunks(newIcons);
      
      // Only update metadata and cleanup if icons were actually added
      if (iconsAdded > 0) {
        // Update metadata
        await this.updateMetadata(newIcons);
        
        // Clean up
        this.cleanup();
        
        console.log(`\n✅ Successfully added ${iconsAdded} icons!`);
        console.log('🎯 Your app is ready with the new icons');
      }
      
    } catch (error) {
      console.error('❌ Error adding icons:', error.message);
      process.exit(1);
    }
  }

  createExampleStructure() {
    console.log('📁 Creating new-icons/ folder structure...\n');
    
    // Create main folder
    fs.mkdirSync(this.newIconsDir, { recursive: true });
    
    // Create example category folders
    const exampleCategories = ['gaming', 'social', 'business', 'arrows'];
    
    exampleCategories.forEach(category => {
      const categoryDir = path.join(this.newIconsDir, category);
      fs.mkdirSync(categoryDir, { recursive: true });
      
      // Create a README in each folder
      const readmeContent = `# ${category.charAt(0).toUpperCase() + category.slice(1)} Icons

Drop your SVG files here. Files should be:
- Valid SVG format
- Descriptive filenames (e.g., ${category === 'gaming' ? 'controller.svg, joystick.svg' : category === 'social' ? 'facebook.svg, twitter.svg' : 'document.svg, chart.svg'})
- Optimized for web use

Then run: npm run add-icons
`;
      fs.writeFileSync(path.join(categoryDir, 'README.md'), readmeContent);
    });
    
    console.log('✅ Created folder structure:');
    console.log(`📂 new-icons/`);
    exampleCategories.forEach(cat => {
      console.log(`   📂 ${cat}/  (drop ${cat} SVG files here)`);
    });
    
    console.log('\n🎯 Next steps:');
    console.log('1. Drop your SVG files in the appropriate category folders');
    console.log('2. Run: npm run add-icons');
    console.log('3. Your icons will be added to the app automatically!\n');
  }

  async loadCurrentData() {
    console.log('📊 Loading current data...');
    
    // Load chunks index
    const chunksIndexPath = path.join(this.publicDir, 'chunks-index.json');
    if (fs.existsSync(chunksIndexPath)) {
      this.chunksIndex = JSON.parse(fs.readFileSync(chunksIndexPath, 'utf8'));
      this.nextChunkNumber = this.chunksIndex.total_chunks + 1;
      console.log(`   📦 Current chunks: ${this.chunksIndex.total_chunks}`);
      console.log(`   🎯 Total icons: ${this.chunksIndex.total_icons}`);
    } else {
      throw new Error('chunks-index.json not found. Run the main build process first.');
    }
    
    // Load categories
    const categoriesPath = path.join(this.publicDir, 'categories.json');
    if (fs.existsSync(categoriesPath)) {
      this.categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
      console.log(`   📂 Current categories: ${this.categories.length}`);
    }
    
    // Load category chunks mapping
    const categoryChunksPath = path.join(this.publicDir, 'category-chunks.json');
    if (fs.existsSync(categoryChunksPath)) {
      this.categoryChunks = JSON.parse(fs.readFileSync(categoryChunksPath, 'utf8'));
    }
  }

  async processNewIcons() {
    console.log('\n🔍 Processing new icons...');
    
    const newIcons = [];
    const categoryFolders = fs.readdirSync(this.newIconsDir)
      .filter(item => {
        const itemPath = path.join(this.newIconsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
    
    console.log(`   📂 Found ${categoryFolders.length} category folders`);
    
    for (const categoryFolder of categoryFolders) {
      const categoryPath = path.join(this.newIconsDir, categoryFolder);
      const svgFiles = fs.readdirSync(categoryPath)
        .filter(file => file.toLowerCase().endsWith('.svg'));
      
      if (svgFiles.length > 0) {
        console.log(`   📁 ${categoryFolder}: ${svgFiles.length} SVG files`);
        
        for (const svgFile of svgFiles) {
          const iconData = this.createIconData(categoryFolder, svgFile, categoryPath);
          if (iconData) {
            newIcons.push(iconData);
          }
        }
      }
    }
    
    console.log(`\n📈 Total new icons to add: ${newIcons.length}`);
    return newIcons;
  }

  createIconData(category, filename, categoryPath) {
    try {
      const svgPath = path.join(categoryPath, filename);
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      const iconName = path.basename(filename, '.svg');
      
      // Validate SVG
      if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
        console.log(`   ⚠️  Skipping ${filename}: Invalid SVG format`);
        return null;
      }
      
      // Clean SVG content - remove potential XSS
      const cleanSvgContent = svgContent
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
      
      return {
        id: `${category}_${iconName}`,
        name: iconName,
        category: category.toLowerCase(),
        filename: filename,
        svgContent: cleanSvgContent,
        tags: [category.toLowerCase(), iconName.replace(/-/g, ' ').replace(/_/g, ' ')],
        downloads: 0,
        featured: false
      };
    } catch (error) {
      console.log(`   ❌ Error processing ${filename}:`, error.message);
      return null;
    }
  }

  async addIconsToChunks(newIcons) {
    console.log('\n📦 Adding icons to chunks...');
    
    // Check for ID collisions
    const existingIds = await this.getAllExistingIds();
    const duplicates = newIcons.filter(icon => existingIds.has(icon.id));
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  Found duplicate icon IDs:');
      duplicates.forEach(icon => console.log(`   - ${icon.id}`));
      console.log('\n💡 Rename these files and try again\n');
      return 0; // Return 0 icons added
    }
    
    let currentChunk = [];
    let currentChunkNumber = this.nextChunkNumber;
    let iconsAdded = 0;
    
    // Try to fill the last existing chunk first if it's not full
    const lastChunkInfo = this.chunksIndex.chunks[this.chunksIndex.chunks.length - 1];
    if (lastChunkInfo && lastChunkInfo.count < this.iconsPerChunk) {
      console.log(`   📄 Filling last chunk ${lastChunkInfo.chunk_number} (${lastChunkInfo.count}/${this.iconsPerChunk})`);
      
      // Load existing chunk
      const lastChunkPath = path.join(this.chunksDir, `icons-${lastChunkInfo.chunk_number}.json`);
      const existingIcons = JSON.parse(fs.readFileSync(lastChunkPath, 'utf8'));
      
      // Add icons to fill the chunk
      const spaceAvailable = this.iconsPerChunk - lastChunkInfo.count;
      const iconsToAdd = newIcons.splice(0, spaceAvailable);
      const updatedChunk = [...existingIcons, ...iconsToAdd];
      
      // Save updated chunk
      fs.writeFileSync(lastChunkPath, JSON.stringify(updatedChunk, null, 2));
      
      // Update chunk info
      lastChunkInfo.count = updatedChunk.length;
      lastChunkInfo.size_kb = Math.round(JSON.stringify(updatedChunk).length / 1024 * 100) / 100;
      
      iconsAdded += iconsToAdd.length;
      console.log(`   ✅ Added ${iconsToAdd.length} icons to chunk ${lastChunkInfo.chunk_number}`);
    }
    
    // Create new chunks for remaining icons
    while (newIcons.length > 0) {
      const iconsForThisChunk = newIcons.splice(0, this.iconsPerChunk);
      
      // Save chunk
      const chunkPath = path.join(this.chunksDir, `icons-${currentChunkNumber}.json`);
      fs.writeFileSync(chunkPath, JSON.stringify(iconsForThisChunk, null, 2));
      
      // Add chunk info
      const chunkInfo = {
        chunk_number: currentChunkNumber,
        filename: `chunks/icons-${currentChunkNumber}.json`,
        start_index: this.chunksIndex.total_icons + iconsAdded,
        count: iconsForThisChunk.length,
        size_kb: Math.round(JSON.stringify(iconsForThisChunk).length / 1024 * 100) / 100
      };
      
      this.chunksIndex.chunks.push(chunkInfo);
      iconsAdded += iconsForThisChunk.length;
      
      console.log(`   ✅ Created chunk ${currentChunkNumber} with ${iconsForThisChunk.length} icons`);
      currentChunkNumber++;
    }
    
    // Update totals
    this.chunksIndex.total_icons += iconsAdded;
    this.chunksIndex.total_chunks = this.chunksIndex.chunks.length;
    
    console.log(`   📊 Updated totals: ${this.chunksIndex.total_icons} icons in ${this.chunksIndex.total_chunks} chunks`);
    
    return iconsAdded; // Return number of icons actually added
  }

  async updateMetadata(newIcons) {
    console.log('\n📝 Updating metadata...');
    
    // Count icons by category
    const categoryIconCounts = {};
    newIcons.forEach(icon => {
      categoryIconCounts[icon.category] = (categoryIconCounts[icon.category] || 0) + 1;
    });
    
    // Update category counts and add new categories
    for (const [categoryId, newCount] of Object.entries(categoryIconCounts)) {
      const existingCategory = this.categories.find(cat => cat.id === categoryId);
      
      if (existingCategory) {
        existingCategory.count += newCount;
        console.log(`   📂 Updated "${categoryId}": +${newCount} icons (total: ${existingCategory.count})`);
      } else {
        // Add new category
        const newCategory = {
          id: categoryId,
          name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          count: newCount
        };
        this.categories.push(newCategory);
        console.log(`   📂 Added new category "${categoryId}": ${newCount} icons`);
      }
    }
    
    // Update "All Icons" count
    const allCategory = this.categories.find(cat => cat.id === 'all');
    if (allCategory) {
      allCategory.count = this.chunksIndex.total_icons;
    }
    
    // Update category chunks mapping
    // For simplicity, we'll rebuild the mapping for updated categories
    for (const categoryId of Object.keys(categoryIconCounts)) {
      const chunksWithThisCategory = [];
      
      for (const chunkInfo of this.chunksIndex.chunks) {
        const chunkPath = path.join(this.chunksDir, `icons-${chunkInfo.chunk_number}.json`);
        const chunkIcons = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
        
        if (chunkIcons.some(icon => icon.category === categoryId)) {
          chunksWithThisCategory.push(chunkInfo.chunk_number);
        }
      }
      
      this.categoryChunks[categoryId] = chunksWithThisCategory;
    }
    
    // Save updated files
    fs.writeFileSync(
      path.join(this.publicDir, 'chunks-index.json'),
      JSON.stringify(this.chunksIndex, null, 2)
    );
    
    fs.writeFileSync(
      path.join(this.publicDir, 'categories.json'),
      JSON.stringify(this.categories, null, 2)
    );
    
    fs.writeFileSync(
      path.join(this.publicDir, 'category-chunks.json'),
      JSON.stringify(this.categoryChunks, null, 2)
    );
    
    console.log('   ✅ Updated all metadata files');
  }

  async getAllExistingIds() {
    const existingIds = new Set();
    
    for (const chunkInfo of this.chunksIndex.chunks) {
      const chunkPath = path.join(this.chunksDir, `icons-${chunkInfo.chunk_number}.json`);
      try {
        const chunkIcons = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
        chunkIcons.forEach(icon => existingIds.add(icon.id));
      } catch (error) {
        console.log(`   ⚠️  Warning: Could not read chunk ${chunkInfo.chunk_number}`);
      }
    }
    
    return existingIds;
  }

  cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    // Remove processed SVG files but keep folder structure
    const categoryFolders = fs.readdirSync(this.newIconsDir)
      .filter(item => {
        const itemPath = path.join(this.newIconsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
    
    for (const categoryFolder of categoryFolders) {
      const categoryPath = path.join(this.newIconsDir, categoryFolder);
      const files = fs.readdirSync(categoryPath);
      
      for (const file of files) {
        if (file.toLowerCase().endsWith('.svg')) {
          fs.unlinkSync(path.join(categoryPath, file));
        }
      }
    }
    
    console.log('   ✅ Cleaned up processed SVG files');
    console.log('   📁 Kept folder structure for future use');
  }
}

// Run the script
if (require.main === module) {
  const adder = new IconAdder();
  adder.run();
}

module.exports = IconAdder;