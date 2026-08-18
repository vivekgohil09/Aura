# ── Stage 1: Build the Vite React Frontend ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies cleanly
RUN npm install

# Copy entire frontend source code
COPY . .

# Build production bundle with Vite
RUN npm run build

# ── Stage 2: Serve with Ultra-Lightweight Nginx ──
FROM nginx:alpine

# Copy custom Nginx configuration with SPA routing and WebSocket proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]