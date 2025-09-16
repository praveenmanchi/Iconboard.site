#!/bin/bash

echo "Cleaning existing git repository..."
rm -rf .git

echo "Initializing fresh git repository..."
git init

echo "Adding remote origin..."
git remote add origin https://github.com/praveenmanchi/Iconboard.site.git

echo "Adding all files..."
git add .

echo "Creating initial commit..."
git commit -m "Initial commit: IconBoard SVG icon library application

- Complete React-based icon library application
- Modern UI with dark mode support
- Real-time search functionality
- Category-based browsing
- PWA support with manifest files
- Responsive design for mobile and desktop
- Comprehensive icon collection with 1000+ icons"

echo "Pushing to GitHub..."
git branch -M main
git push -u origin main --force

echo "Repository cleaned and pushed successfully!"
