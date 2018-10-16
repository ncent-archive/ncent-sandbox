'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Challenges', {
      uuid: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      expiration: {
        allowNull: false,
        type: Sequelize.DATE
      },
      tokenTypeUuid: {
          allowNull: false,
          type: Sequelize.UUID,
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
        type: Sequelize.INTEGER
      },
      sponsorWalletAddress: {
        allowNull: false,
        type: Sequelize.STRING
      },
      isRedeemed: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Challenges');
  }
};