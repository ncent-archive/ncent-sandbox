'use strict';

const uuidv4 = require('uuid/v4');
const TOKEN_GRAVEYARD_ADDRESS = process.env.TOKEN_GRAVEYARD_ADDRESS;

module.exports = {
    up: (queryInterface, Sequelize) => {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.bulkInsert('Person', [{
            name: 'John Doe',
            isBetaMember: false
          }], {});
        */
        return queryInterface.bulkInsert('TokenTypes', [{
            name: 'NCNT',
            uuid: uuidv4(),
            expiryDate: '2020-10-17',
            sponsorUuid: TOKEN_GRAVEYARD_ADDRESS,
            totalTokens: 100000000000000000,
            createdAt: new Date(),
            updatedAt: new Date()
        }], {});
    },

    down: (queryInterface, Sequelize) => {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.bulkDelete('Person', null, {});
        */
        return queryInterface.bulkDelete('TokenTypes', null, {});
    }
};
