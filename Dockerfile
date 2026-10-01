FROM cgr.dev/chainguard/node:latest-dev AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
COPY prisma ./prisma
COPY app ./app
COPY src ./src
COPY public ./public
COPY next.config.ts tsconfig.json eslint.config.mjs next-env.d.ts ./
COPY README.md .
RUN npx prisma generate
RUN npm run build

FROM cgr.dev/chainguard/node:latest AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]