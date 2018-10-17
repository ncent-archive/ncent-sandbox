'use strict';
module.exports = (sequelize, DataTypes) => {
  const Challenge = sequelize.define('Challenge', {
    uuid: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expiration: {
      type: DataTypes.DATE,
      allowNull: false
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
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {});
  Challenge.associate = function(models) {
      Challenge.belongsTo(models.TokenType, {
        foreignKey: 'tokenTypeUuid',
        onDelete: 'CASCADE'
      });
      Challenge.hasMany(models.Transaction, {
        foreignKey: 'challengeUuid',
        as: 'transactions'
      });
  };
  return Challenge;
};