# Stage 1: Build the application
FROM node:18-alpine AS builder
# Set working directory
WORKDIR /usr/src/app
# Install dependencies
COPY package*.json ./
RUN npm install
# Copy the source code
COPY . .
RUN chmod -R a+x node_modules
# Build the Nest.js app
RUN npm run build
# Stage 2: Create production image
FROM node:18-alpine
# Set working directory
WORKDIR /usr/src/app
# Copy only necessary files from the build stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY --from=builder /usr/src/app/views ./dist/views
COPY --from=builder /usr/src/app/public ./dist/public
COPY --from=builder /usr/src/app/prompt.txt ./
COPY --from=builder /usr/src/app/o1prompt.txt ./
# Set environment variables
ENV NODE_ENV=production
RUN mkdir -p logs && chown -R node:node /usr/src/app
USER node
# Expose port
EXPOSE 5555
# Start the application
CMD ["node", "dist/main"]
