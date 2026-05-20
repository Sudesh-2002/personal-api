FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY apps/schedule-service/package*.json ./apps/schedule-service/
COPY tsconfig.json ./
RUN npm install --workspace=@personal-api/schedule-service

COPY apps/schedule-service ./apps/schedule-service

RUN npm run build --workspace=@personal-api/schedule-service

FROM node:20-alpine AS production
WORKDIR /app

RUN mkdir -p /data

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/schedule-service/dist ./dist
COPY --from=base /app/apps/schedule-service/package.json ./

ENV NODE_ENV=production
ENV DB_PATH=/data/schedule.db

EXPOSE 3002

CMD ["node", "dist/index.js"]