'use strict';
module.exports = {
  up: (queryInterface, DataTypes) => {
	return queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
	.then(() => {
    return queryInterface.createTable('Transactions', {
			uuid:{
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					autoIncrement: false,
			},
			amount: {
					type: DataTypes.INTEGER,
					allowNull: false,
			},
			parentTransaction: {
				type: DataTypes.UUID,
				allowNull: true
			},
			fromAddress:{
				type: DataTypes.STRING,  
				allowNull: false,
			},
			toAddress:{
				type: DataTypes.STRING,
				allowNull:false,
			},
			createdAt: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			updatedAt: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			tokenTypeUuid: {
	 		 	type: DataTypes.UUID,
				allowNull: false,
				foreignKey: true,
				onDelete: 'CASCADE',
				references: {
					model: 'TokenTypes',
					key: 'uuid',
					as: 'tokenTypeUuid',	
				},	
			},
		});
	});
  },
  down: (queryInterface) => queryInterface.dropTable('Transactions'),
};
