FROM node:8

ENV DB_PORT $DB_PORT
ENV DB_USERNAME $DB_USERNAME
ENV DB_PASSWORD $DB_PASSWORD
ENV DB_PORT $DB_PORT
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8010

CMD ["sh", "execute.sh"]
