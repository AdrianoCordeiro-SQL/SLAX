FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
EXPOSE 3000
CMD ["npm", "run", "dev"]
