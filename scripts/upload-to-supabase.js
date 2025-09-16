#!/usr/bin/env node

/**
 * Upload IconBoard data to Supabase Storage
 * This script uploads all icon chunks and metadata to Supabase Storage for production deployment
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Get Supabase configuration from environment variables
function getSupabaseConfig() {
  const projectId = process.env.SUPABASE_PROJECT_ID;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!projectId) {
    throw new Error('SUPABASE_PROJECT_ID environment variable is required');
  }
  
  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY environment variable is required');
  }
  
  const supabaseUrl = `https://${projectId}.supabase.co`;
  
  console.log(`📍 Supabase Project: ${projectId}`);
  console.log(`🌐 Supabase URL: ${supabaseUrl}`);
  
  return { supabaseUrl, projectId, anonKey };
}

// Create Supabase client
function createSupabaseClient() {
  const { supabaseUrl, anonKey } = getSupabaseConfig();
  return createClient(supabaseUrl, anonKey);
}

// Upload a file to Supabase Storage
async function uploadFile(supabase, bucketName, filePath, fileContent) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileContent, {
        contentType: 'application/json',
        cacheControl: '3600', // 1 hour cache
        upsert: true // Overwrite if exists
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Uploaded: ${filePath}`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to upload ${filePath}:`, error.message);
    throw error;
  }
}

// Check if storage bucket exists
async function ensureBucket(supabase, bucketName) {
  try {
    // Try to list files in the bucket to check if it exists
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });
    
    if (listError) {
      if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
        console.log(`❌ Bucket "${bucketName}" does not exist!`);
        console.log(`\n📋 Please create the bucket manually:`);
        console.log(`1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/${process.env.SUPABASE_PROJECT_ID}/storage/buckets`);
        console.log(`2. Click "Create a new bucket"`);
        console.log(`3. Name: "${bucketName}"`);
        console.log(`4. Make sure "Public bucket" is ENABLED`);
        console.log(`5. Click "Create bucket"`);
        console.log(`6. Run this script again`);
        process.exit(1);
      } else {
        throw listError;
      }
    } else {
      console.log(`✅ Bucket "${bucketName}" is ready for uploads`);
    }
  } catch (error) {
    console.error(`❌ Error checking bucket ${bucketName}:`, error.message);
    throw error;
  }
}

// Main upload function
async function uploadIconData() {
  console.log('🚀 Starting IconBoard data upload to Supabase Storage...\n');

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();
    const bucketName = 'icons';

    // Ensure bucket exists
    await ensureBucket(supabase, bucketName);

    // Define files to upload
    const filesToUpload = [
      {
        localPath: '../frontend/public/categories.json',
        remotePath: 'categories.json'
      },
      {
        localPath: '../frontend/public/chunks-index.json',
        remotePath: 'chunks-index.json'
      },
      {
        localPath: '../frontend/public/category-chunks.json',
        remotePath: 'category-chunks.json'
      }
    ];

    // Upload metadata files
    console.log('📄 Uploading metadata files...');
    for (const file of filesToUpload) {
      try {
        const content = await fs.readFile(file.localPath, 'utf8');
        await uploadFile(supabase, bucketName, file.remotePath, content);
      } catch (error) {
        console.error(`❌ Error reading ${file.localPath}:`, error.message);
        throw error;
      }
    }

    // Upload chunk files
    console.log('\n📦 Uploading icon chunks...');
    const chunksDir = '../frontend/public/chunks';
    
    try {
      const chunkFiles = await fs.readdir(chunksDir);
      const jsonFiles = chunkFiles.filter(file => file.endsWith('.json'));
      
      console.log(`📊 Found ${jsonFiles.length} chunk files to upload`);

      // Upload chunks in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < jsonFiles.length; i += batchSize) {
        const batch = jsonFiles.slice(i, i + batchSize);
        
        console.log(`\n📤 Uploading batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(jsonFiles.length/batchSize)} (${batch.length} files)`);
        
        const uploadPromises = batch.map(async (fileName) => {
          const localPath = path.join(chunksDir, fileName);
          const remotePath = `chunks/${fileName}`;
          const content = await fs.readFile(localPath, 'utf8');
          return uploadFile(supabase, bucketName, remotePath, content);
        });

        await Promise.all(uploadPromises);
        
        // Small delay between batches to be nice to the API
        if (i + batchSize < jsonFiles.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      console.error('❌ Error uploading chunks:', error.message);
      throw error;
    }

    // Get the final storage URL
    const { supabaseUrl } = getSupabaseConfig();
    const storageUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}`;

    console.log('\n🎉 Upload completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Set this environment variable in Vercel:');
    console.log(`   REACT_APP_STATIC_BASE=${storageUrl}`);
    console.log('\n2. Deploy your app to Vercel');
    console.log('\n3. Your IconBoard will load icons from Supabase Storage!');
    console.log(`\n🌐 Storage URL: ${storageUrl}`);

  } catch (error) {
    console.error('\n💥 Upload failed:', error.message);
    process.exit(1);
  }
}

// Run the upload
if (require.main === module) {
  uploadIconData();
}

module.exports = { uploadIconData };