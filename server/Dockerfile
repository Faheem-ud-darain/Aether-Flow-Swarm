FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5000
ENV PORT=5000
CMD ["sh", "-c", "npx prisma db push && npm start"]
