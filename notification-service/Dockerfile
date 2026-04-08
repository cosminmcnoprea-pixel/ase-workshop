FROM node:20-alpine

# Install PostgreSQL client dependencies
RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
