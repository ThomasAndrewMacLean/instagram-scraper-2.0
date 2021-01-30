
FROM node:12
RUN apt-get update \
&& apt-get install -y \
   libnss3 \
   && apt install libnss3-dev libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev
WORKDIR /usr/app/src
COPY package*.json ./
RUN npm install --production
COPY dist .
CMD ["node", "server.js"]

EXPOSE 8080