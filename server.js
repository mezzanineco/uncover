const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Supported image extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (pathname === '/api/images' && req.method === 'GET') {
    try {
      // Read the images directory
      const files = fs.readdirSync(IMAGES_DIR);
      
      // Filter for image files only
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
      });

      // Return file information
      const images = imageFiles.map(filename => {
        const filePath = path.join(IMAGES_DIR, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          path: `/images/${filename}`,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ images }));
    } catch (error) {
      console.error('Error reading images directory:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read images directory' }));
    }
  } else if (pathname === '/api/upload-image' && req.method === 'POST') {
    // Basic upload endpoint - in a real implementation, you'd use a library like 'formidable'
    // For WebContainer environment, we'll provide instructions for manual file placement
    res.writeHead(501, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Direct upload not implemented in WebContainer environment',
      message: 'Please drag and drop files into the public/images directory and click refresh'
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Image API server running on http://localhost:${PORT}`);
  console.log(`Images directory: ${IMAGES_DIR}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down image API server...');
  server.close(() => {
    process.exit(0);
  });
});