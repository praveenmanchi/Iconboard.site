#!/bin/bash
cd "/Users/charan/Desktop/icon final"
echo "Checking git status..."
git status
echo "Adding all changes..."
git add .
echo "Committing changes..."
git commit -m "Update IconBoard project with latest changes"
echo "Pushing to remote..."
git push origin main
echo "Push completed!"
