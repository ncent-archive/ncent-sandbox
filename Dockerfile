FROM node:8

ARG DB_USERNAME
ENV DB_USERNAME $DB_USERNAME

ARG DB_PASSWORD
ENV DB_PASSWORD $DB_PASSWORD

ARG DB_HOST
ENV DB_HOST $DB_HOST

ARG DB_PORT
ENV DB_PORT $DB_PORT

# Create app directory
WORKDIR /usr/src/app

# Install psql client
RUN apt-get update && apt-get install -y postgresql-client

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Expose the service port
EXPOSE 8010

CMD ["sh", "develop.sh"]
