#!/bin/bash

echo "Checking git status..."
git status

echo "Adding all changes..."
git add .

echo "Committing Vercel Analytics integration..."
git commit -m "Add Vercel Analytics integration

- Import Analytics component from @vercel/analytics/react
- Add Analytics component to main App component
- Enable automatic page view tracking and performance monitoring
- Prepare for Vercel deployment analytics"

echo "Pushing to GitHub..."
git push origin main

echo "Vercel Analytics changes pushed successfully!"
