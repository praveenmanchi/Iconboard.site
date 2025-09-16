#!/bin/bash

echo "Checking git status..."
git status

echo "Adding all changes..."
git add .

echo "Checking status after adding..."
git status

echo "Committing changes..."
git commit -m "Update IconBoard project with latest changes

- Updated project files and configurations
- Enhanced UI components and functionality
- Improved performance and user experience
- Added new features and optimizations"

echo "Pushing to GitHub..."
git push origin main

echo "Push completed successfully!"
