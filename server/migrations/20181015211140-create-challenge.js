'use strict';
module.exports = {
  up: (queryInterface, DataTypes) => {
      return queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
      .then(() => {
      return queryInterface.createTable('Challenges', {
        uuid: {
          allowNull: false,
          primaryKey: true,
          type: DataTypes.UUID
        },
        name: {
          allowNull: false,
          type: DataTypes.STRING
        },
        expiration: {
          allowNull: false,
          type: DataTypes.DATE
        },
        tokenTypeUuid: {
            allowNull: false,
            type: DataTypes.UUID,
            foreignKey: true,
            onDelete: 'CASCADE',
            references: {
                model: 'TokenTypes',
                key: 'uuid',
                as: 'tokenTypeUuid'
            }
        },
        rewardAmount: {
          allowNull: false,
          type: DataTypes.INTEGER
        },
        sponsorWalletAddress: {
          allowNull: false,
          type: DataTypes.STRING
        },
        isRedeemed: {
          type: DataTypes.BOOLEAN
        },
        createdAt: {
          allowNull: false,
          type: DataTypes.DATE
        },
        updatedAt: {
          allowNull: false,
          type: DataTypes.DATE
        }
      });
    });
  },
  down: (queryInterface) =>  queryInterface.dropTable('Challenges')
};