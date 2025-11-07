FROM node:18-alpine

WORKDIR /app

# Set environment
ENV NODE_ENV=production \
    PORT=3000

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies (use npm install since no package-lock.json)
RUN npm install --production && npm cache clean --force

# Copy backend source code
COPY backend/src ./src

# Create health check script
RUN echo '#!/bin/sh\nwget --quiet --tries=1 --spider http://localhost:3000/ || exit 1' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD /healthcheck.sh

# Start the server
CMD ["node", "src/index.js"]
