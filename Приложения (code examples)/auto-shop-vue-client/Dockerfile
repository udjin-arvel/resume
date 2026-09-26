# syntax=docker/dockerfile:1

ARG HUB_MIRROR=docker.m.daocloud.io/library/

FROM ${HUB_MIRROR}node:22.16-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG ENVIRONMENT_NAME=staging
ENV ENVIRONMENT_NAME=$ENVIRONMENT_NAME
ENV NODE_ENV=production

RUN npm run build:ci

FROM ${HUB_MIRROR}node:22.16-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output ./.output

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
