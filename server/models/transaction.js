'use strict';
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    uuid:{
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false,
      defaultValue: DataTypes.UUIDV4,
    },
    parentTransaction:{
      type: DataTypes.UUID,
      allowNull: true
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fromAddress:{
      type: DataTypes.STRING,
      allowNull: false
    },
    toAddress:{
      type: DataTypes.STRING,
      allowNull:false
    },
  });
  Transaction.associate = function(models) {
    Transaction.belongsTo(models.Challenge, {
	    foreignKey: 'challengeUuid',
	    onDelete: 'CASCADE',
    });
  };
  sequelize.sync();
  return Transaction;
};
