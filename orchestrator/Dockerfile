FROM node:20-alpine

RUN apk add --no-cache curl bash

# Install Helm
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src ./src

RUN npm run build && \
    rm -rf src tsconfig.json

# Copy helm charts
COPY helm-charts ./helm-charts

RUN chown -R nodejs:nodejs /app

USER nodejs

CMD ["node", "dist/index.js"]
