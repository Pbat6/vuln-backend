# ---- build ----
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build \
  && npm prune --omit=dev

# ---- runtime ----
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# ImageMagick 6 on Debian provides `convert` (see IMAGEMAGICK_CMD in compose)
RUN apt-get update \
  && apt-get install -y --no-install-recommends imagemagick ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads keys \
  && openssl genrsa -out keys/private.pem 2048 \
  && openssl rsa -in keys/private.pem -pubout -out keys/public.pem \
  && chmod 600 keys/private.pem

EXPOSE 3001

CMD ["node", "--inspect=0.0.0.0:9229", "dist/main.js"]
