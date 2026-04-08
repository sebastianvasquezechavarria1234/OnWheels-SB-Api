FROM node:20-alpine

# Update system packages to fix vulnerabilities like libpng and zlib
RUN apk update && apk upgrade --no-cache

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["npm", "start"]