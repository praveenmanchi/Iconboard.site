// Removed axios dependency - using fetch() instead
import LRUCache from '../utils/LRUCache';

// Detect if we're in local development or deployed
const isLocalDevelopment = process.env.NODE_ENV === 'development' && 
                          (window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1') &&
                          process.env.REACT_APP_BACKEND_URL;

// Use relative URLs by default, external URL only for true localhost development with backend
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = isLocalDevelopment ? `${BACKEND_URL}/api` : '/api';
// Support cloud storage via environment variable
const STATIC_BASE = process.env.REACT_APP_STATIC_BASE || 
                    (isLocalDevelopment ? `${BACKEND_URL}` : '');

// Create fetch wrapper for backwards compatibility
const apiClient = {
  get: async (url) => {
    const response = await fetch(`${API_BASE}${url}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { data: await response.json() };
  }
};

// Chunked data loading class with search indexing and LRU memory management
class ChunkedIconAPI {
  constructor() {
    this.chunksIndex = null;
    this.loadedChunks = new LRUCache(50); // Limit to 50 chunks in memory (~2500 icons max)
    this.categoryChunks = null;
    this.searchIndex = new Map(); // Fast search index: term -> icon IDs
    this.iconMetadata = new Map(); // icon ID -> metadata for quick lookup
    this.iconToChunk = new Map(); // FAST LOOKUP: icon ID -> chunk number for instant access
    this.isIndexed = false;
    this.isPrecomputedMappingLoaded = false;
  }

  // Build precomputed icon-to-chunk mapping for instant lookups
  async buildPrecomputedIconMapping() {
    if (this.isPrecomputedMappingLoaded) return;
    
    console.log('🏗️ Building precomputed icon-to-chunk mapping for instant lookups...');
    const startTime = Date.now();
    
    await this.loadChunksIndex();
    
    // Build mapping by loading just the first icon from each chunk to determine chunk boundaries
    const samplingPromises = [];
    const BATCH_SIZE = 20; // Load chunks in parallel batches
    
    for (let i = 0; i < this.chunksIndex.total_chunks; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, this.chunksIndex.total_chunks);
      const batchPromise = Promise.all(
        Array.from({length: batchEnd - i}, (_, idx) => this.sampleChunkForMapping(i + idx + 1))
      );
      samplingPromises.push(batchPromise);
    }
    
    // Execute all batches in parallel
    await Promise.all(samplingPromises);
    
    const endTime = Date.now();
    console.log(`✅ Precomputed mapping built: ${this.iconToChunk.size} icons mapped in ${endTime - startTime}ms`);
    this.isPrecomputedMappingLoaded = true;
  }
  
  // Sample a chunk to add its icons to the precomputed mapping
  async sampleChunkForMapping(chunkNumber) {
    try {
      const response = await fetch(`${STATIC_BASE}/chunks/icons-${chunkNumber}.json`);
      const icons = await response.json();
      
      // Add all icons from this chunk to the mapping (but don't cache the full chunk)
      icons.forEach(icon => {
        this.iconToChunk.set(icon.id, chunkNumber);
      });
      
    } catch (error) {
      console.warn(`Warning: Could not sample chunk ${chunkNumber} for mapping:`, error);
    }
  }

  async loadChunksIndex() {
    if (this.chunksIndex) return this.chunksIndex;
    
    try {
      const response = await fetch(`${STATIC_BASE}/chunks-index.json`);
      this.chunksIndex = await response.json();
      console.log(`✅ Loaded chunks index: ${this.chunksIndex.total_chunks} chunks, ${this.chunksIndex.total_icons} icons`);
      return this.chunksIndex;
    } catch (error) {
      console.error('❌ Error loading chunks index:', error);
      // Fallback to API endpoint for chunk info
      try {
        const response = await apiClient.get('/chunks-info');
        this.chunksIndex = response.data;
        return this.chunksIndex;
      } catch (apiError) {
        console.error('❌ Error loading chunks info from API:', apiError);
        throw new Error('Could not load chunks information');
      }
    }
  }

  async loadCategoryChunks(retryCount = 0) {
    if (this.categoryChunks) return this.categoryChunks;
    
    const maxRetries = 3;
    const retryDelay = 1000 * (retryCount + 1); // Exponential backoff
    
    try {
      console.log(`📡 Loading category chunks (attempt ${retryCount + 1}/${maxRetries + 1})`);
      const response = await fetch(`${STATIC_BASE}/category-chunks.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      this.categoryChunks = await response.json();
      
      // Validate the data structure
      if (!this.categoryChunks || typeof this.categoryChunks !== 'object') {
        throw new Error('Invalid category chunks data structure');
      }
      
      console.log(`✅ Loaded category chunks mapping for ${Object.keys(this.categoryChunks).length} categories`);
      return this.categoryChunks;
      
    } catch (error) {
      console.error(`❌ Error loading category chunks (attempt ${retryCount + 1}):`, error.message);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.loadCategoryChunks(retryCount + 1);
      }
      
      // Final fallback - return empty mapping to prevent total failure
      console.warn('⚠️ Using fallback empty category chunks mapping');
      this.categoryChunks = {};
      return this.categoryChunks;
    }
  }

  async loadChunk(chunkNumber) {
    const cacheKey = `chunk-${chunkNumber}`;
    if (this.loadedChunks.has(cacheKey)) {
      return this.loadedChunks.get(cacheKey);
    }

    try {
      const response = await fetch(`${STATIC_BASE}/chunks/icons-${chunkNumber}.json`);
      const chunk = await response.json();
      this.loadedChunks.set(cacheKey, chunk); // Store with LRU eviction
      
      // Index icons for search as they're loaded (with chunk number for fast lookup)
      this.indexIconsFromChunk(chunk, chunkNumber);
      
      console.log(`✅ Loaded chunk ${chunkNumber}: ${chunk.length} icons`);
      return chunk;
    } catch (error) {
      console.error(`❌ Error loading chunk ${chunkNumber}:`, error);
      return [];
    }
  }

  // Build search index from loaded icons
  indexIconsFromChunk(icons, chunkNumber) {
    icons.forEach(icon => {
      // Store icon metadata
      this.iconMetadata.set(icon.id, {
        id: icon.id,
        name: icon.name,
        category: icon.category,
        tags: icon.tags || [],
        filename: icon.filename
      });
      
      // FAST LOOKUP: Store icon -> chunk mapping for instant access
      this.iconToChunk.set(icon.id, chunkNumber);

      // Create searchable terms
      const searchTerms = [
        icon.name.toLowerCase(),
        icon.category.toLowerCase(),
        ...(icon.tags || []).map(tag => tag.toLowerCase()),
        icon.filename.toLowerCase().replace('.svg', ''),
        // Add variations with spaces and hyphens
        icon.name.toLowerCase().replace(/[-_]/g, ' '),
        icon.name.toLowerCase().replace(/[-_\s]/g, ''),
      ];

      // Index each term
      searchTerms.forEach(term => {
        if (term && term.length > 1) {
          if (!this.searchIndex.has(term)) {
            this.searchIndex.set(term, new Set());
          }
          this.searchIndex.get(term).add(icon.id);
          
          // Add partial matches for instant search
          for (let i = 2; i <= term.length; i++) {
            const partial = term.substring(0, i);
            if (!this.searchIndex.has(partial)) {
              this.searchIndex.set(partial, new Set());
            }
            this.searchIndex.get(partial).add(icon.id);
          }
        }
      });
    });
  }

  // Fast search using pre-built index with improved completeness
  async searchIcons(searchTerm, limit = 200) {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const query = searchTerm.toLowerCase().trim();
    const matchedIconIds = new Set();
    
    // Find exact and partial matches
    for (const [term, iconIds] of this.searchIndex.entries()) {
      if (term.includes(query)) {
        iconIds.forEach(id => matchedIconIds.add(id));
      }
    }

    // Get metadata results first
    const metadataResults = Array.from(matchedIconIds)
      .map(id => this.iconMetadata.get(id))
      .filter(Boolean)
      .sort((a, b) => {
        // Prioritize exact name matches
        const aNameMatch = a.name.toLowerCase().includes(query);
        const bNameMatch = b.name.toLowerCase().includes(query);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Then by name length (shorter = more relevant)
        return a.name.length - b.name.length;
      })
      .slice(0, limit);

    console.log(`🔍 Search index found ${metadataResults.length} results for "${query}" in ${this.searchIndex.size} indexed terms`);
    
    // IMPROVED: Batch load required chunks to avoid missing icons
    const requiredChunks = new Set();
    metadataResults.forEach(metadata => {
      const chunkNumber = this.iconToChunk.get(metadata.id);
      if (chunkNumber) {
        requiredChunks.add(chunkNumber);
      }
    });
    
    // Pre-load all required chunks in parallel (with concurrency limiting for production safety)
    if (requiredChunks.size > 0) {
      console.log(`📦 Pre-loading ${requiredChunks.size} chunks for search completeness`);
      
      // Load chunks in batches to prevent network overload and LRU thrash
      const chunks = Array.from(requiredChunks);
      const BATCH_SIZE = 12; // Architect recommended 10-15 for safety
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE, chunks.length);
        const batch = chunks.slice(i, batchEnd);
        await Promise.all(batch.map(chunkNum => this.loadChunk(chunkNum)));
      }
    }
    
    // Now fetch full icon data - should have high success rate
    const fullResults = [];
    for (const metadata of metadataResults) {
      const fullIcon = await this.getFullIconData(metadata.id);
      if (fullIcon) {
        fullResults.push(fullIcon);
      } else {
        console.warn(`🚨 Search completeness issue: Could not load icon ${metadata.id}`);
      }
    }
    
    console.log(`✅ Search returned ${fullResults.length}/${metadataResults.length} icons (${fullResults.length === metadataResults.length ? 'complete' : 'incomplete'})`);
    return fullResults;
  }

  // Helper method to get full icon data including SVG content
  async getFullIconData(iconId) {
    // FAST LOOKUP: Use chunk mapping for instant access
    const chunkNumber = this.iconToChunk.get(iconId);
    if (chunkNumber) {
      const chunk = await this.loadChunk(chunkNumber);
      const icon = chunk.find(icon => icon.id === iconId);
      if (!icon) {
        console.warn(`🚨 Icon ${iconId} missing from chunk ${chunkNumber}!`);
      }
      return icon;
    }
    
    // Check if we already have the full data in loaded chunks
    for (const [chunkNum, chunkData] of this.loadedChunks.entries()) {
      const icon = chunkData.find(icon => icon.id === iconId);
      if (icon) {
        return icon; // Already has full data including svgContent
      }
    }
    
    // If no chunk mapping available, this indicates a search index inconsistency
    console.warn(`⚠️ Missing chunk mapping for icon ${iconId} - search index may be stale`);
    return this.iconMetadata.get(iconId);
  }

  async getIcons(params = {}) {
    const startTime = Date.now();
    const { limit = 200, category, search } = params;
    
    try {
      console.log('🔍 ChunkedIconAPI: Fetching icons with params:', params);
      
      // Use instant search if search term is provided and we have indexed data
      if (search && this.searchIndex.size > 0) {
        let searchResults = await this.searchIcons(search, limit * 2); // Get more for filtering
        
        // Apply category filter to search results if needed
        if (category && category !== 'all') {
          searchResults = searchResults.filter(icon => 
            icon.category.toLowerCase() === category.toLowerCase()
          );
        }
        
        const result = searchResults.slice(0, limit);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log(`⚡ Search index returned ${result.length} icons in ${responseTime}ms`);
        return result;
      }
      
      await this.loadChunksIndex();
      
      let chunksToLoad = [];
      
      if (category && category !== 'all') {
        // Load category-specific chunks
        const categoryChunks = await this.loadCategoryChunks();
        chunksToLoad = categoryChunks[category.toLowerCase()] || [];
        console.log(`📁 Category '${category}' requires chunks:`, chunksToLoad);
      } else {
        // Load chunks progressively based on limit
        const chunksNeeded = Math.min(Math.ceil(limit / 50), this.chunksIndex.total_chunks);
        chunksToLoad = Array.from({length: chunksNeeded}, (_, i) => i + 1);
        console.log(`📊 Loading first ${chunksNeeded} chunks for ${limit} icons`);
      }
      
      // Load required chunks - CRITICAL FIX: Remove artificial 10-chunk limit with proper concurrency control
      console.log(`🔧 LOADING ALL ${chunksToLoad.length} REQUIRED CHUNKS (was limited to 10 before)`);
      
      // Load chunks in controlled batches to avoid overwhelming the system
      const batchSize = 15; // Controlled batch size for stability
      const chunks = [];
      
      for (let i = 0; i < chunksToLoad.length; i += batchSize) {
        const batch = chunksToLoad.slice(i, i + batchSize);
        console.log(`📦 Loading batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunksToLoad.length/batchSize)}: chunks ${batch[0]}-${batch[batch.length-1]}`);
        
        // Load this batch of chunks with proper concurrency control
        const batchPromises = batch.map(chunkNum => this.loadChunk(chunkNum));
        const batchResults = await Promise.all(batchPromises);
        chunks.push(...batchResults);
        
        // Small delay between batches to prevent overwhelming the browser
        if (i + batchSize < chunksToLoad.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Combine all icons from chunks
      let allIcons = [];
      chunks.forEach(chunk => {
        if (chunk) allIcons.push(...chunk);
      });
      
      // Apply category filter
      if (category && category !== 'all') {
        allIcons = allIcons.filter(icon => icon.category.toLowerCase() === category.toLowerCase());
      }
      
      // Apply legacy search filter (fallback for unindexed searches)
      if (search && this.searchIndex.size === 0) {
        const searchLower = search.toLowerCase();
        allIcons = allIcons.filter(icon =>
          icon.name.toLowerCase().includes(searchLower) ||
          icon.category.toLowerCase().includes(searchLower) ||
          (icon.tags && icon.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      }

      // Apply limit
      const result = allIcons.slice(0, limit);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ ChunkedIconAPI: Loaded ${result.length} icons in ${responseTime}ms from ${chunks.length} chunks`);
      
      // Log performance metrics
      if (responseTime > 1000) {
        console.warn(`🐌 Slow chunked loading: ${responseTime}ms for ${result.length} icons`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ ChunkedIconAPI: Error fetching icons:', error);
      throw error;
    }
  }

  async getIcon(iconId) {
    try {
      // FAST LOOKUP: Check if we know which chunk contains this icon
      const chunkNumber = this.iconToChunk.get(iconId);
      if (chunkNumber) {
        console.log(`🎯 Fast lookup: Icon ${iconId} is in chunk ${chunkNumber}`);
        const chunk = await this.loadChunk(chunkNumber);
        return chunk.find(icon => icon.id === iconId);
      }
      
      // Try to find in already loaded chunks first
      for (const chunk of this.loadedChunks.values()) {
        const icon = chunk.find(icon => icon.id === iconId);
        if (icon) {
          return icon;
        }
      }
      
      // If no fast mapping available, incrementally search chunks
      // This builds the mapping as we go for future fast lookups
      await this.loadChunksIndex();
      
      console.log(`🔍 Searching for icon ${iconId} across ${this.chunksIndex.total_chunks} chunks...`);
      
      for (let i = 1; i <= this.chunksIndex.total_chunks; i++) {
        const chunk = await this.loadChunk(i);
        const icon = chunk.find(icon => icon.id === iconId);
        if (icon) {
          console.log(`✅ Found icon ${iconId} in chunk ${i}`);
          return icon;
        }
      }
      
      throw new Error(`Icon '${iconId}' not found in any of ${this.chunksIndex.total_chunks} chunks`);
    } catch (error) {
      console.error('Error fetching icon:', error);
      throw error;
    }
  }

  async uploadIcon(iconData) {
    if (!isLocalDevelopment) {
      throw new Error('Upload not available in production build');
    }
    
    try {
      const response = await apiClient.post('/icons', iconData);
      return response.data;
    } catch (error) {
      console.error('Error uploading icon:', error);
      throw error;
    }
  }
}

// Create chunked API instance
const chunkedAPI = new ChunkedIconAPI();

// Icon API calls
export const iconAPI = {
  // Get all icons with optional filtering (now uses chunked loading)
  getIcons: async (params = {}) => {
    return await chunkedAPI.getIcons(params);
  },

  // Get specific icon by ID
  getIcon: async (iconId) => {
    return await chunkedAPI.getIcon(iconId);
  },

  // Upload new icon (only available in development)
  uploadIcon: async (iconData) => {
    return await chunkedAPI.uploadIcon(iconData);
  },
};

// Category API calls
export const categoryAPI = {
  // Get all categories - use static file only to avoid duplication
  getCategories: async () => {
    try {
      const response = await fetch(`${STATIC_BASE}/categories.json`);
      if (response.ok) {
        const categories = await response.json();
        console.log(`✅ Loaded ${categories.length} categories from static file`);
        return categories;
      }
      throw new Error('Categories file not found');
    } catch (error) {
      console.error('Error fetching categories from static file:', error);
      // Return minimal fallback categories to prevent app crash
      return [
        {"id": "all", "name": "All Icons", "count": 13160},
        {"id": "material", "name": "Material", "count": 7447},
        {"id": "dev", "name": "Dev", "count": 843}
      ];
    }
  },
};

// Health check
export const healthCheck = async () => {
  try {
    // In production with cloud storage, we don't have a backend to check
    if (process.env.REACT_APP_STATIC_BASE) {
      return { status: 'ok', source: 'cloud_storage' };
    }
    
    // Only check backend health in local development with backend
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    // Gracefully handle missing backend in production
    if (process.env.NODE_ENV === 'production') {
      return { status: 'ok', source: 'static_fallback' };
    }
    throw error;
  }
};

export default apiClient;