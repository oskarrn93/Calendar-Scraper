# syntax=docker/dockerfile:1
FROM node:14.18.1-alpine3.12

WORKDIR /app

ENV NODE_ENV=development
COPY ./tsconfig.json ./tsconfig.json
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
COPY ./src ./src

RUN yarn install
ENTRYPOINT ["yarn", "scraper:football"]

