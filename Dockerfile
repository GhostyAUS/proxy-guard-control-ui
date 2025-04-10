
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

# Create a minimal tsconfig for the server
RUN echo '{"compilerOptions":{"esModuleInterop":true,"module":"CommonJS","target":"ES2020","outDir":"dist/server"},"include":["src/server/**/*"]}' > server-tsconfig.json

# Compile the server TypeScript files
RUN npx tsc -p server-tsconfig.json

# Verify the server file exists
RUN ls -la dist/server && cat dist/server/index.js

# Install production dependencies for the server
RUN npm ci --production

# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "dist/server/index.js"]
