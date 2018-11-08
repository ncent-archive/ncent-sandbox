cd server
../node_modules/.bin/sequelize db:migrate
../node_modules/.bin/sequelize db:seed:all
cd ..
npm run start:dev
