FROM node:20-alpine

WORKDIR /app

# Create uploads directory
RUN mkdir -p /app/uploads

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 4006

CMD ["node", "server.js"]
