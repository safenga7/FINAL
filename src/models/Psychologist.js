import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Psychologist = sequelize.define('Psychologist', {
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
      isEmail: true
    }
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  languages: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['русский']
  },
  availableHours: {
    type: DataTypes.JSONB,
    defaultValue: {
      monday: ['09:00-17:00'],
      tuesday: ['09:00-17:00'],
      wednesday: ['09:00-17:00'],
      thursday: ['09:00-17:00'],
      friday: ['09:00-17:00']
    }
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profileImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  certifications: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  sessionPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  indexes: [
    // Optimize search by specialization
    { fields: ['specialization'] },
    // Optimize sorting and filtering by rating and experience
    { fields: ['rating', 'yearsOfExperience'] },
    // Optimize price-based filtering
    { fields: ['sessionPrice'] },
    // Optimize availability filtering
    { fields: ['isAvailable'] },
    // GiST index for languages array
    { fields: ['languages'], using: 'gin' },
    // Optimize email lookups
    { unique: true, fields: ['email'] }
  ],
  hooks: {
    beforeValidate: (psychologist) => {
      // Ensure languages array contains unique values
      if (psychologist.languages) {
        psychologist.languages = [...new Set(psychologist.languages)];
      }
    }
  }
});

export { Psychologist };