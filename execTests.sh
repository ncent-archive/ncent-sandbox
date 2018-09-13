# dropdb ncent-db > /dev/null
# createdb ncent-db > /dev/null
# ../node_modules/.bin/sequelize db:migrate
cd server
cd ..
npm run test
