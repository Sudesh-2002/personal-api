FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY apps/preference-service/package*.json ./apps/preference-service/
COPY tsconfig.json ./
RUN npm install --workspace=@personal-api/preference-service

COPY apps/preference-service ./apps/preference-service

RUN npm run build --workspace=@personal-api/preference-service

FROM node:20-alpine AS production
WORKDIR /app

RUN mkdir -p /data

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/preference-service/dist ./dist
COPY --from=base /app/apps/preference-service/package.json ./

ENV NODE_ENV=production
ENV DB_PATH=/data/preferences.db

EXPOSE 3001

CMD ["node", "dist/index.js"]