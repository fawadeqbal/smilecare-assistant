# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -f apps/web/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
# Public values are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_WIDGET_SRC=http://localhost/widget.js
ARG NEXT_PUBLIC_WIDGET_KEY=pk_demo_smilecare
ARG NEXT_PUBLIC_API_PUBLIC_URL=http://localhost
ENV NEXT_PUBLIC_WIDGET_SRC=$NEXT_PUBLIC_WIDGET_SRC \
    NEXT_PUBLIC_WIDGET_KEY=$NEXT_PUBLIC_WIDGET_KEY \
    NEXT_PUBLIC_API_PUBLIC_URL=$NEXT_PUBLIC_API_PUBLIC_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @smilecare/web...
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @smilecare/shared build && pnpm --filter @smilecare/web build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
