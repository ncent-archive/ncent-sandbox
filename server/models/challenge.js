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
        description: {
            type: DataTypes.STRING
        },
        company: {
            type: DataTypes.STRING
        },
        imageUrl: {
            type: DataTypes.STRING
        },
        participationUrl: {
            type: DataTypes.STRING
        },
        expiration: {
            type: DataTypes.DATE,
            allowNull: false
        },
        rewardAmount: {
            allowNull: false,
            type: DataTypes.INTEGER,
            validate: {
                min: 1
            }
        },
        rewardType: {
            type: DataTypes.STRING,
            defaultValue: "NCNT"
        },
        sponsorWalletAddress: {
            allowNull: false,
            type: DataTypes.STRING
        },
        maxShares: {
            type: DataTypes.INTEGER,
            validate: {
                min: 1,
                max: 1000000
            }
        },
        maxRedemptions: {
            type: DataTypes.INTEGER,
            validate: {
                min: 1
            },
            defaultValue: 1
        },
        isComplete: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {});
    Challenge.associate = function (models) {
        Challenge.belongsTo(models.TokenType, {
            foreignKey: 'tokenTypeUuid',
            onDelete: 'CASCADE'
        });
        Challenge.hasMany(models.Transaction, {
            foreignKey: 'challengeUuid',
            as: 'transactions'
        });
    };
    sequelize.sync();
    return Challenge;
};