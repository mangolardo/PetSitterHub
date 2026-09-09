FROM node:20-alpine
WORKDIR /backend
COPY package*.json ./
RUN npm ci --only=production
COPY . .

CMD ["node", "app.js"]