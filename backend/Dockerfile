# CrypTalk - Backend API Dockerfile
# Production-ready Node.js server with WebAuthn and E2E encryption support

FROM node:18-alpine

LABEL maintainer="CrypTalk Team"
LABEL description="CrypTalk Backend API - Secure chat platform with passwordless authentication"
LABEL version="1.0.0"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["npm", "start"]
