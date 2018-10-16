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
    }
  }, {});
  Challenge.associate = function(models) {
    Challenge.belongsTo(models.Wallet, {
      foreignKey: 'sponsorWalletUuid',
      onDelete: 'CASCADE'
    });
  };
  return Challenge;
};