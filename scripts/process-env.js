const fs = require('fs');
const path = require('path');

// Load environment variables from .env file (if it exists)
const envPath = path.join(__dirname, '../.env');
let env = {};

if (fs.existsSync(envPath)) {
  console.log('Found .env file, loading environment variables...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Parse .env file
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
} else {
  console.log('No .env file found, using default environment variables...');
}

// Get backend URL from environment variables or use default
// For production builds, we want to serve static files (no backend needed)
const backendUrl = process.env.REACT_APP_BACKEND_URL || 
                   env.REACT_APP_BACKEND_URL || 
                   (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8001');

// Read the HTML file
const htmlPath = path.join(__dirname, '../public/index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Replace environment variables in HTML
htmlContent = htmlContent.replace(/%REACT_APP_BACKEND_URL%/g, backendUrl);

// Write back to file
fs.writeFileSync(htmlPath, htmlContent);

console.log(`Environment variables processed in index.html with backend URL: ${backendUrl}`);