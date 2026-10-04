FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json apps/api/
RUN npm install
COPY apps/api apps/api
RUN npm run build --workspace=@sentinelos/api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json apps/api/
RUN npm install --omit=dev
COPY --from=build /app/apps/api/dist apps/api/dist
USER node
EXPOSE 3001
CMD ["npm", "run", "start", "--workspace=@sentinelos/api"]
