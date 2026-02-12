FROM node:20-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build && \
    rm -rf src tsconfig.json && \
    npm prune --omit=dev

USER nodejs

EXPOSE 3001

CMD ["node", "dist/index.js"]
