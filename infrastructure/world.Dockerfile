FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build -w @pixelspace/world-server
RUN npm prune --omit=dev
ENV NODE_ENV=production HOST=0.0.0.0 WORLD_PORT=2567
USER node
EXPOSE 2567
CMD ["node","apps/world-server/dist/index.js"]
