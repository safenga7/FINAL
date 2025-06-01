import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'cancelled'),
    defaultValue: 'inactive',
  },
  subscriptionPlan: {
    type: DataTypes.ENUM('basic', 'standard', 'premium'),
  },
  sessionsRemaining: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  subscriptionEndDate: {
    type: DataTypes.DATE,
  }
}, {
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['subscriptionStatus', 'subscriptionPlan'] },
    { fields: ['sessionsRemaining'] },
  ],
});

export { User };