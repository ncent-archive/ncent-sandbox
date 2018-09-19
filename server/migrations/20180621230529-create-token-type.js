'use strict';
module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    .then(() => {
      return queryInterface.createTable('TokenTypes', {
        name: {
	        type: DataTypes.STRING, 
          allowNull: false,
          unique: true
        },
        uuid: {
	        type: DataTypes.UUID,
	        primaryKey: true,
	        allowNull: false,
          autoIncrement: false,
        },
        expiryDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        sponsorUuid: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        totalTokens: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        createdAt: {
          allowNull: false,
          type: DataTypes.DATE
        },
        updatedAt: {
          allowNull: false,
          type: DataTypes.DATE
        },
      });
    });
  },
  down: (queryInterface) => queryInterface.dropTable('TokenTypes'),
};
