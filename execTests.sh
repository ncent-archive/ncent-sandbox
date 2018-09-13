dropdb ncent-db > /dev/null
createdb ncent-db > /dev/null
cd server
../node_modules/.bin/sequelize db:migrate
cd ..
npm run test
