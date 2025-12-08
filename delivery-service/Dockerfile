FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (optional for internal service but good for documentation)
EXPOSE 3001

# Start the service
CMD ["node", "src/index.js"]