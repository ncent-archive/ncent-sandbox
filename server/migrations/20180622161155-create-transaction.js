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
			numShares: {
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
			challengeUuid: {
                type: DataTypes.UUID,
                allowNull: false,
                foreignKey: true,
                onDelete: 'CASCADE',
                references: {
                    model: 'Challenges',
                    key: 'uuid',
                    as: 'challengeUuid',
                }
            }
		});
	});
  },
  down: (queryInterface) => queryInterface.dropTable('Transactions'),
};
