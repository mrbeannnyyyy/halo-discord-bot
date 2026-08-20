FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npx prisma generate

CMD ["npm", "run", "bot"]
