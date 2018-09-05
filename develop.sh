# Create the DB
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT postgres postgres -c "CREATE DATABASE \"ncnt-test\""

# Update hostname in config file
cd server
sed -i 's/localhost/ncent-postgres/g' config/config.js

# Init the db
../node_modules/.bin/sequelize db:migrate
cd ../

# Start server
npm run start:dev

