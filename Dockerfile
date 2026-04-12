# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# Ensure we copy the FOLDER content
COPY --from=build /app/dist /usr/share/nginx/html/spa
# Note: we put the files inside a 'spa' subfolder so the alias works
COPY nginx.conf /etc/nginx/conf.d/default.conf

