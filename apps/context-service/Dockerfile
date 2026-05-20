FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY apps/context-service/package*.json ./apps/context-service/
COPY tsconfig.json ./
RUN npm install --workspace=@personal-api/context-service

COPY apps/context-service ./apps/context-service

RUN npm run build --workspace=@personal-api/context-service

FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/context-service/dist ./dist
COPY --from=base /app/apps/context-service/package.json ./

ENV NODE_ENV=production

EXPOSE 3003

CMD ["node", "dist/index.js"]