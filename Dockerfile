# -----------------------------
# Stage 1: Build Frontend
# -----------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build the frontend application
RUN npm run build

# -----------------------------
# Stage 2: Build Backend
# -----------------------------
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Build the backend application
RUN npm run build

# -----------------------------
# Stage 3: Setup Nginx for Frontend
# -----------------------------
FROM nginx:alpine AS frontend

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend files from the frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# -----------------------------
# Stage 4: Setup Backend
# -----------------------------
FROM node:20-alpine AS backend

# Install cron and other necessary utilities
RUN apk add --no-cache \
    dcron \
    tzdata \
    bash \
    sqlite \
    curl

# Create app directory
WORKDIR /app

# Copy backend package files and install production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy built backend files from the backend-builder stage
COPY --from=backend-builder /app/backend/dist ./dist

# Create necessary directories for cron jobs and logs
RUN mkdir -p /etc/cron.d /var/log/crontabs /app/data
RUN chmod 0644 /etc/cron.d
RUN chmod 0755 /var/log/crontabs

# Create a script to start both cron and the API server
RUN echo '#!/bin/sh\n\
    # Start cron daemon\n\
    crond -b -l 8\n\
    \n\
    # Start the API server\n\
    node dist/index.js\n\
    ' > /app/start.sh

# Make the start script executable
RUN chmod +x /app/start.sh

# Expose the API port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production \
    DATABASE_PATH=/app/data/crontabs.db

# Define volumes for persistent data
VOLUME ["/app/data", "/etc/cron.d", "/var/log/crontabs"]

# Start both cron and the API server
CMD ["/app/start.sh"]

# -----------------------------
# Stage 5: Final Image with Docker Compose
# -----------------------------
FROM alpine:latest

# Install Docker Compose
RUN apk add --no-cache docker-compose

# Copy Docker Compose file
COPY docker/docker-compose.yml /app/docker-compose.yml

WORKDIR /app

# Define a script to start the services
RUN echo '#!/bin/sh\n\
    docker-compose up -d\n\
    \n\
    # Follow logs\n\
    docker-compose logs -f\n\
    ' > /app/start.sh

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]