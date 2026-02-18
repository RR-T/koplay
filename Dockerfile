# Stage 1: Build client
FROM node:22-alpine AS builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server/ ./server/
COPY public/ ./public/
COPY --from=builder /app/client/dist ./client/dist
EXPOSE 3000
CMD ["node", "server/index.js"]
