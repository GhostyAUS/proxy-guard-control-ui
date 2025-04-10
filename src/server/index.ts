
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import Docker from 'dockerode';

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request body
app.use(express.json());

// Docker client setup
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Define API routes first
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes for Docker operations
app.get('/api/docker/containers/json', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    res.json(containers);
  } catch (error) {
    console.error('Docker API error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to list containers',
      statusCode: 500
    });
  }
});

app.post('/api/docker/containers/:id/restart', async (req, res) => {
  const { id } = req.params;
  
  try {
    const container = docker.getContainer(id);
    await container.restart();
    res.json({ success: true });
  } catch (error) {
    console.error('Docker restart error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : `Failed to restart container: ${id}`,
      statusCode: 500
    });
  }
});

// API routes for file operations
app.get('/api/files/permissions', async (req, res) => {
  const { path: filePath } = req.query;
  
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ 
      message: 'File path is required',
      statusCode: 400
    });
  }
  
  try {
    // Use stat to get file info
    const execAsync = promisify(exec);
    const { stdout } = await execAsync(`stat -c '%a %U %G' "${filePath}"`);
    const [permissions, owner, group] = stdout.trim().split(' ');
    
    res.json({
      path: filePath,
      permissions,
      owner,
      group
    });
  } catch (error) {
    console.error('File permission check error:', error);
    res.status(404).json({ 
      message: `Failed to check permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      statusCode: 404
    });
  }
});

app.post('/api/files/permissions', async (req, res) => {
  const { path: filePath, permissions, owner, group } = req.body;
  
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ 
      message: 'File path is required',
      statusCode: 400
    });
  }
  
  try {
    const execAsync = promisify(exec);
    
    // Change permissions
    if (permissions) {
      await execAsync(`chmod ${permissions} "${filePath}"`);
    }
    
    // Change owner:group if provided
    if (owner && group) {
      await execAsync(`chown ${owner}:${group} "${filePath}"`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Change permissions error:', error);
    res.status(500).json({ 
      message: `Failed to change permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      statusCode: 500
    });
  }
});

app.post('/api/files/write', async (req, res) => {
  const { path: filePath, content } = req.body;
  
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ 
      message: 'File path is required',
      statusCode: 400
    });
  }
  
  try {
    const writeFileAsync = promisify(fs.writeFile);
    await writeFileAsync(filePath, content, 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('File write error:', error);
    res.status(500).json({ 
      message: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      statusCode: 500
    });
  }
});

app.get('/api/files/read', async (req, res) => {
  const { path: filePath } = req.query;
  
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ 
      message: 'File path is required',
      statusCode: 400
    });
  }
  
  try {
    const readFileAsync = promisify(fs.readFile);
    const content = await readFileAsync(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    console.error('File read error:', error);
    res.status(404).json({ 
      message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      statusCode: 404
    });
  }
});

// Check if running in production mode
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode, serving static files');
  
  // Calculate the correct path to the static files
  const distPath = path.resolve(__dirname, '../../dist');
  
  // Log the static path for debugging
  console.log(`Serving static files from: ${distPath}`);
  
  // Serve static files
  app.use(express.static(distPath));
  
  // All other GET requests not handled before will return the React app
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      console.log(`Serving index.html for path: ${req.path}`);
      res.sendFile(path.resolve(distPath, 'index.html'));
    }
  });
} else {
  console.log('Running in development mode');
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
