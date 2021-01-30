
FROM node:12
WORKDIR /usr/app/src
COPY package*.json ./
RUN npm install --production
COPY dist .
CMD ["node", "server.js"]

EXPOSE 8080