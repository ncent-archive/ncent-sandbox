'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {

    return queryInterface.changeColumn('Challenges', 'description', {
      type: DataTypes.STRING(1024)
    });
  },

  down: (queryInterface, DataTypes) => {

    return queryInterface.changeColumn('Challenges', 'description', {
      type: DataTypes.STRING
    });

  }
};
