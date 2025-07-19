#!/bin/bash
# Build script for CAD Analysis Pro

echo "Building CAD Analysis Pro..."
npx vite build

echo "Build complete! Files are in the dist/ directory"
echo "To serve locally: npx vite preview"
echo "To deploy: Upload the dist/ folder to your hosting provider"

# Create a simple server for testing
cat > dist/server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`CAD Analysis Pro running on port ${port}`);
});
EOF

echo "Express server created in dist/server.js"