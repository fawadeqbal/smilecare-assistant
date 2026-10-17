# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -f apps/api/Dockerfile .
# One image runs the API (default), the worker (`node dist/worker.js`) and migrations.

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/widget/package.json apps/widget/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @smilecare/api... --filter @smilecare/widget...
COPY packages/shared packages/shared
COPY apps/widget apps/widget
COPY apps/api apps/api
RUN pnpm --filter @smilecare/shared build \
 && pnpm --filter @smilecare/widget build \
 && pnpm --filter @smilecare/api build \
 && pnpm --filter @smilecare/api deploy --prod --legacy /out

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    WIDGET_BUNDLE_PATH=./public/widget.js
WORKDIR /app
COPY --from=build --chown=node:node /out/package.json ./package.json
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
COPY --from=build --chown=node:node /repo/apps/widget/dist/widget.js ./public/widget.js
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health/live || exit 1
CMD ["node", "dist/main.js"]
