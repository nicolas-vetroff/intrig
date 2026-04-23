# Image de developpement uniquement. La prod passe par Vercel.
# node:lts-alpine suit l'Active LTS (embarque npm 11) et matche le
# npm de generation du lock local : `npm ci` reste deterministe.
FROM node:lts-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev"]
