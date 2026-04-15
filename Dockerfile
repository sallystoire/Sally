FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY tsconfig.base.json tsconfig.json ./

COPY lib/api-spec/package.json lib/api-spec/openapi.yaml lib/api-spec/orval.config.ts ./lib/api-spec/
COPY lib/api-zod/package.json lib/api-zod/tsconfig.json ./lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/tsconfig.json ./lib/api-client-react/
COPY lib/db/package.json lib/db/tsconfig.json lib/db/drizzle.config.ts ./lib/db/

COPY artifacts/api-server/package.json artifacts/api-server/tsconfig.json artifacts/api-server/build.mjs ./artifacts/api-server/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY lib/ ./lib/
COPY artifacts/api-server/src/ ./artifacts/api-server/src/

RUN pnpm --filter @workspace/api-server run build

FROM node:24-slim AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable pnpm

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY tsconfig.base.json tsconfig.json ./

COPY lib/api-spec/package.json lib/api-spec/openapi.yaml lib/api-spec/orval.config.ts ./lib/api-spec/
COPY lib/api-zod/package.json lib/api-zod/tsconfig.json ./lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/tsconfig.json ./lib/api-client-react/
COPY lib/db/package.json lib/db/tsconfig.json lib/db/drizzle.config.ts ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod

COPY --from=base /app/artifacts/api-server/dist ./artifacts/api-server/dist

EXPOSE 3000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
