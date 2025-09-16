#!/bin/bash

echo "Checking git status..."
git status

echo "Committing staged changes..."
git commit -m "Fix Open Graph meta tag - remove stray character from og:title

- Fixed og:title meta tag by removing stray '>' character
- Ensures proper social media sharing preview
- Improves SEO and social media appearance"

echo "Pushing to GitHub..."
git push origin main

echo "Changes pushed successfully!"
