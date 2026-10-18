FROM node:24-bookworm-slim
WORKDIR /app
COPY . .
RUN npm ci
RUN mkdir -p /app/.local && chown node:node /app/.local
USER node
CMD ["npm", "run", "dev"]
