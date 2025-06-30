# Stage 1
FROM node:alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./

RUN \
    if [ -f package-lock.json ]; then npm ci; \
    else echo "No lock file found. Installing dependencies normally."; npm install; \
    fi

COPY . .

RUN npm run build

# Stage 2
FROM node:alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]