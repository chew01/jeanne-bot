const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  storage: 'database.sqlite',
});

const Ticket = sequelize.define('ticket', {
  userID: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  numbers: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
  },
});

const Draw = sequelize.define('draw', {
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    unique: true,
  },
  results: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
  },
});

sequelize.sync();

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

module.exports = { Ticket, Draw };
