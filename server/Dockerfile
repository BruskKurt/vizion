FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_REMOTE_CONFIG_URL=https://ipvizion.app
ENV VITE_REMOTE_CONFIG_URL=$VITE_REMOTE_CONFIG_URL
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8789
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server/remote-config.mjs ./server/remote-config.mjs
USER node
EXPOSE 8789
CMD ["node", "server/remote-config.mjs"]
