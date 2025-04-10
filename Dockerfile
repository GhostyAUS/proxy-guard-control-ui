
FROM node:18-alpine

# Install Docker CLI for container management
RUN apk add --no-cache docker-cli

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with specific version of lucide-react
RUN npm ci
# Force reinstall lucide-react with specific version
RUN npm uninstall lucide-react && npm install lucide-react@0.461.0

# Add dockerode package
RUN npm install dockerode @types/dockerode

# Copy source files
COPY . .

# Build the React application first
RUN npm run build

# Ensure server files are compiled to JavaScript
RUN npx tsc --outDir dist/server src/server/index.ts

# Verify the server file exists
RUN ls -la dist/server && cat dist/server/index.js

# Install production dependencies for the server
RUN npm ci --production

# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "dist/server/index.js"]
