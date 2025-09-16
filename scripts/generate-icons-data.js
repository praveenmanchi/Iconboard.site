#!/usr/bin/env node
/**
 * Generate static icons data for Vercel deployment (Node.js version)
 */
const fs = require('fs');
const path = require('path');

function generateIconsData() {
    console.log('🚀 Generating icons data...');
    
    const iconsDir = path.join(__dirname, '..', 'backend', 'icons');
    const publicDir = path.join(__dirname, '..', 'public');
    
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    
    if (!fs.existsSync(iconsDir)) {
        console.error(`❌ Icons directory not found: ${iconsDir}`);
        return false;
    }
    
    console.log(`📁 Loading icons from: ${iconsDir}`);
    
    const icons = [];
    const categories = {};
    
    // Get all SVG files recursively
    function getAllSvgFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                files.push(...getAllSvgFiles(fullPath));
            } else if (item.endsWith('.svg')) {
                files.push(fullPath);
            }
        }
        return files;
    }
    
    const svgFiles = getAllSvgFiles(iconsDir);
    console.log(`📄 Found ${svgFiles.length} SVG files`);
    
    for (const svgFile of svgFiles) {
        try {
            // Get category from parent directory
            const category = path.basename(path.dirname(svgFile)).toLowerCase();
            
            // Skip if in root icons directory
            if (category === 'icons') {
                continue;
            }
            
            // Read SVG content
            const svgContent = fs.readFileSync(svgFile, 'utf-8');
            const fileName = path.basename(svgFile);
            const iconName = path.basename(svgFile, '.svg');
            
            // Create icon object
            const icon = {
                id: `${category}_${iconName}`,
                name: iconName,
                category: category,
                filename: fileName,
                svgContent: svgContent,
                tags: [category, iconName.replace(/-/g, ' ').replace(/_/g, ' ')],
                downloads: 0,
                featured: false
            };
            
            icons.push(icon);
            
            // Count category
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category]++;
            
        } catch (error) {
            console.error(`❌ Error processing ${svgFile}:`, error.message);
            continue;
        }
    }
    
    // Create categories list
    const categoriesList = [{ id: "all", name: "All Icons", count: icons.length }];
    for (const [cat, count] of Object.entries(categories).sort()) {
        categoriesList.push({
            id: cat,
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            count: count
        });
    }
    
    // Save icons data
    const iconsPath = path.join(publicDir, 'icons.json');
    fs.writeFileSync(iconsPath, JSON.stringify(icons, null, 0));
    
    // Save categories data
    const categoriesPath = path.join(publicDir, 'categories.json');
    fs.writeFileSync(categoriesPath, JSON.stringify(categoriesList, null, 2));
    
    console.log(`✅ Generated ${iconsPath} (${icons.length} icons)`);
    console.log(`✅ Generated ${categoriesPath} (${categoriesList.length} categories)`);
    
    return { icons, categories: categoriesList };
}

function createChunkedData() {
    console.log('🔄 Creating chunked data...');
    
    const publicDir = path.join(__dirname, '..', 'public');
    const iconsPath = path.join(publicDir, 'icons.json');
    
    if (!fs.existsSync(iconsPath)) {
        console.error('❌ Icons file not found. Run generateIconsData first.');
        return false;
    }
    
    const allIcons = JSON.parse(fs.readFileSync(iconsPath, 'utf-8'));
    console.log(`📊 Total icons to process: ${allIcons.length}`);
    
    // Create chunks directory
    const chunksDir = path.join(publicDir, 'chunks');
    if (!fs.existsSync(chunksDir)) {
        fs.mkdirSync(chunksDir, { recursive: true });
    }
    
    // Split into chunks of 50 icons each
    const chunkSize = 50;
    const chunksInfo = [];
    
    for (let i = 0; i < allIcons.length; i += chunkSize) {
        const chunkNumber = Math.floor(i / chunkSize) + 1;
        const chunk = allIcons.slice(i, i + chunkSize);
        const chunkFileName = `icons-${chunkNumber}.json`;
        const chunkPath = path.join(chunksDir, chunkFileName);
        
        // Save chunk
        fs.writeFileSync(chunkPath, JSON.stringify(chunk, null, 0));
        
        const stats = fs.statSync(chunkPath);
        chunksInfo.push({
            chunk_number: chunkNumber,
            filename: `chunks/${chunkFileName}`,
            start_index: i,
            count: chunk.length,
            size_kb: Math.round(stats.size / 1024 * 100) / 100
        });
        
        if (chunkNumber <= 10 || chunkNumber % 50 === 0) {
            console.log(`✅ Created chunk ${chunkNumber}: ${chunk.length} icons (${chunksInfo[chunksInfo.length - 1].size_kb} KB)`);
        }
    }
    
    // Save chunks index
    const chunksIndex = {
        total_icons: allIcons.length,
        chunk_size: chunkSize,
        total_chunks: chunksInfo.length,
        chunks: chunksInfo,
        created_at: new Date().toISOString()
    };
    
    const chunksIndexPath = path.join(publicDir, 'chunks-index.json');
    fs.writeFileSync(chunksIndexPath, JSON.stringify(chunksIndex, null, 2));
    
    // Create category mapping
    const categoryMapping = {};
    
    for (const chunkInfo of chunksInfo) {
        const chunkPath = path.join(publicDir, chunkInfo.filename);
        const chunkIcons = JSON.parse(fs.readFileSync(chunkPath, 'utf-8'));
        
        for (const icon of chunkIcons) {
            const category = icon.category;
            if (!categoryMapping[category]) {
                categoryMapping[category] = [];
            }
            
            if (!categoryMapping[category].includes(chunkInfo.chunk_number)) {
                categoryMapping[category].push(chunkInfo.chunk_number);
            }
        }
    }
    
    // Save category mapping
    const categoryChunksPath = path.join(publicDir, 'category-chunks.json');
    fs.writeFileSync(categoryChunksPath, JSON.stringify(categoryMapping, null, 2));
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`   Total icons: ${allIcons.length}`);
    console.log(`   Total chunks: ${chunksInfo.length}`);
    console.log(`   Chunk size: ${chunkSize} icons each`);
    console.log(`   Average chunk size: ${(chunksInfo.reduce((sum, c) => sum + c.size_kb, 0) / chunksInfo.length).toFixed(1)} KB`);
    console.log(`   Chunks index: chunks-index.json`);
    console.log(`   Category mapping: category-chunks.json`);
    
    return true;
}

function main() {
    console.log('🚀 Starting icon data generation...');
    
    // Step 1: Generate icon data
    const result = generateIconsData();
    if (!result) {
        console.error('❌ Failed to generate icons data');
        process.exit(1);
    }
    
    // Step 2: Create chunked data
    if (createChunkedData()) {
        console.log('\n🎯 All data generated successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Build frontend with generated data');
        console.log('   2. Deploy to Vercel');
    } else {
        console.error('❌ Failed to create chunked data');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { generateIconsData, createChunkedData };