FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY apps/auth-service/package*.json ./apps/auth-service/
COPY tsconfig.json ./
RUN npm install --workspace=@personal-api/auth-service

COPY apps/auth-service ./apps/auth-service

RUN npm run build --workspace=@personal-api/auth-service

FROM node:20-alpine AS production
WORKDIR /app

RUN mkdir -p /data

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/auth-service/dist ./dist
COPY --from=base /app/apps/auth-service/package.json ./

ENV NODE_ENV=production
ENV DB_PATH=/data/auth.db

EXPOSE 3004

CMD ["node", "dist/index.js"]