# Use Node.js as base image
FROM mcr.microsoft.com/playwright:v1.57.0-jammy



# Create a folder inside the container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Build TypeScript
RUN npm run build

# Install Playwright browsers for the specified version
RUN npx playwright install

# Create directories for results
RUN mkdir -p /app/test-results /app/test-logs

# Default command: run smoke tests
CMD ["npx", "playwright@1.57.0", "test"]

