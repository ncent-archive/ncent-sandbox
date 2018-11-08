'use strict';
module.exports = (sequelize, DataTypes) => {
    const TokenType = sequelize.define('TokenType', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        uuid: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            autoIncrement: false,
            defaultValue: DataTypes.UUIDV4,
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
            type: DataTypes.BIGINT,
            allowNull: false,
            validate: {min: 0}
        },
    });
    TokenType.associate = (models) => {
        TokenType.hasMany(models.Challenge, {
            foreignKey: 'tokenTypeUuid',
            as: 'challenges'
        });
    };
    sequelize.sync();
    return TokenType;
};
