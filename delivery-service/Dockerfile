FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY task-router-service/package*.json ./task-router-service/

# Install dependencies
RUN npm install --production
RUN cd delivery-service && npm install --production

# Copy source code
COPY ./services ./services
COPY delivery-service ./task-router-service

# Set working directory to the service folder
WORKDIR /app/delivery-service

# Expose port
EXPOSE 3000

# Start the service
CMD ["node", "src/index.js"]