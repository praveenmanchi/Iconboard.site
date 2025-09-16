import { useEffect } from 'react';

const DynamicOGMeta = ({ title, category, iconCount }) => {
  useEffect(() => {
    // Get the backend URL from environment
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    
    // Build OG image URL with parameters
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (category && category !== 'all') params.append('category', category.toUpperCase());
    if (iconCount) params.append('icon_count', iconCount);
    
    const ogImageUrl = `${backendUrl}/api/og-image?${params.toString()}`;
    
    // Update existing OG image meta tags
    const ogImageMeta = document.querySelector('meta[property="og:image"]');
    const twitterImageMeta = document.querySelector('meta[name="twitter:image"]');
    
    if (ogImageMeta) {
      ogImageMeta.setAttribute('content', ogImageUrl);
    }
    
    if (twitterImageMeta) {
      twitterImageMeta.setAttribute('content', ogImageUrl);
    }
    
    // Update title if provided
    if (title) {
      const ogTitleMeta = document.querySelector('meta[property="og:title"]');
      const twitterTitleMeta = document.querySelector('meta[name="twitter:title"]');
      
      if (ogTitleMeta) {
        ogTitleMeta.setAttribute('content', title);
      }
      
      if (twitterTitleMeta) {
        twitterTitleMeta.setAttribute('content', title);
      }
      
      // Update page title
      document.title = title;
    }
    
    // Update description based on category
    if (category && category !== 'all') {
      const categoryDescription = `Discover free ${category} icons for your projects. Download and copy SVG icons instantly from IconBoard.`;
      
      const ogDescMeta = document.querySelector('meta[property="og:description"]');
      const twitterDescMeta = document.querySelector('meta[name="twitter:description"]');
      const descMeta = document.querySelector('meta[name="description"]');
      
      if (ogDescMeta) {
        ogDescMeta.setAttribute('content', categoryDescription);
      }
      
      if (twitterDescMeta) {
        twitterDescMeta.setAttribute('content', categoryDescription);
      }
      
      if (descMeta) {
        descMeta.setAttribute('content', categoryDescription);
      }
    }
    
  }, [title, category, iconCount]);

  return null; // This component doesn't render anything
};

export default DynamicOGMeta;