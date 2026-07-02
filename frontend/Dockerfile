# Stage 1: Build the React application
FROM node:20-slim AS build

WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./

# Install dependencies (using npm install for compatibility with the lockfile)
RUN npm install --no-audit --no-fund

# Copy the rest of the frontend source
COPY . .

# Set Vite build arguments (e.g. backend URL)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:5000/api}

# Build the project
RUN npm run build

# Stage 2: Serve the build directory with Nginx
FROM nginx:alpine

# Copy nginx config file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from step 1
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
