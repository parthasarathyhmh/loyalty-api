FROM node:20-alpine As dev

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm ci
COPY . .

RUN npm run build

FROM node:20-alpine as prod

RUN addgroup ertm && \
  adduser \
  --disabled-password \
  --gecos "" \
  --no-create-home \
  -G ertm \
  ertm

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY --from=dev /usr/src/app/dist/ ./dist

USER ertm

CMD ["node", "dist/src/main"] 
