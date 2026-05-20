FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY apps/api-gateway/package*.json ./apps/api-gateway/
COPY tsconfig.json ./
RUN npm install --workspace=@personal-api/api-gateway

# Copy source
COPY apps/api-gateway ./apps/api-gateway

# Build
RUN npm run build --workspace=@personal-api/api-gateway

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api-gateway/dist ./dist
COPY --from=base /app/apps/api-gateway/package.json ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]