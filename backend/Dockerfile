# Use Node.js 20 LTS (slim variant for smaller image size)
FROM node:20-slim

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install production dependencies (using npm install for compatibility with the lockfile)
RUN npm install --omit=dev --no-audit --no-fund

# Copy the rest of the application code
COPY . .

# Create the uploads directory and ensure correct permissions
RUN mkdir -p uploads && chmod 777 uploads

# Expose the port the app runs on (matching PORT in .env, default is 5000)
EXPOSE 5000

# Set environment variable defaults
ENV PORT=5000
ENV NODE_ENV=production

# Command to run the application
CMD ["npm", "start"]
