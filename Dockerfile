# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# This puts your files at /usr/share/nginx/html/spa/index.html etc.
COPY --from=build /app/dist /usr/share/nginx/html/spa
COPY nginx.conf /etc/nginx/conf.d/default.conf

