# ---- build ----
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/contact-api/package.json apps/contact-api/
RUN pnpm install --frozen-lockfile --filter contact-api
COPY apps/contact-api apps/contact-api
RUN pnpm --filter contact-api build \
 && pnpm --filter contact-api --prod deploy --legacy /out

# ---- run ----
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./
COPY --from=build /repo/apps/contact-api/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz >/dev/null || exit 1
CMD ["node", "dist/server.js"]
