import { Psychologist } from '../models/Psychologist.js';
import Session from '../models/Session.js';
import { Op } from 'sequelize';

const registerPsychologist = async (req, res) => {
  const { name, email, password, specialization } = req.body;

  try {
    const psychologist = await Psychologist.create({ name, email, password, specialization });
    res.status(201).json({ message: 'Psychologist registered successfully', psychologist });
  } catch (err) {
    res.status(400).json({ message: 'Error registering psychologist', error: err.message });
  }
};

const getPsychologists = async (req, res) => {
    try {
        const {
            specialization,
            language,
            minExperience,
            maxPrice,
            availableDay,
            availableTime,
            page = 1,
            limit = 10,
            sortBy = 'rating',
            sortOrder = 'DESC'
        } = req.query;

        const where = { isAvailable: true };
        
        if (specialization) {
            where.specialization = specialization;
        }
        
        if (language) {
            where.languages = {
                [Op.contains]: [language]
            };
        }
        
        if (minExperience) {
            where.yearsOfExperience = {
                [Op.gte]: parseInt(minExperience)
            };
        }
        
        if (maxPrice) {
            where.sessionPrice = {
                [Op.lte]: parseFloat(maxPrice)
            };
        }

        // Handle availability filtering
        if (availableDay && availableTime) {
            where[`availableHours.${availableDay.toLowerCase()}`] = {
                [Op.contains]: [availableTime]
            };
        }

        const offset = (page - 1) * limit;
        const validSortFields = ['rating', 'yearsOfExperience', 'sessionPrice'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'rating';

        const psychologists = await Psychologist.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortField, sortOrder]],
            attributes: {
                exclude: ['email'] // Don't expose email in public queries
            }
        });

        res.json({
            psychologists: psychologists.rows,
            total: psychologists.count,
            currentPage: page,
            totalPages: Math.ceil(psychologists.count / limit)
        });
    } catch (err) {
        console.error('Get Psychologists Error:', err);
        res.status(500).json({
            message: 'Error retrieving psychologists',
            error: err.message
        });
    }
};

const getPsychologistAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                message: 'Date parameter is required'
            });
        }

        const psychologist = await Psychologist.findByPk(id);
        if (!psychologist) {
            return res.status(404).json({
                message: 'Psychologist not found'
            });
        }

        const dayOfWeek = new Date(date).toLocaleLowerCase('en-US', { weekday: 'long' });
        const availableHours = psychologist.availableHours[dayOfWeek] || [];

        // Get booked sessions for the date
        const bookedSessions = await Session.findAll({
            where: {
                psychologistId: id,
                date,
                status: ['pending', 'confirmed']
            },
            attributes: ['time', 'duration']
        });

        // Filter out booked time slots
        const availableTimeSlots = availableHours.filter(timeSlot => {
            const [start] = timeSlot.split('-');
            return !bookedSessions.some(session => {
                const sessionTime = session.time;
                return sessionTime === start;
            });
        });

        res.json({
            date,
            availableTimeSlots
        });
    } catch (err) {
        console.error('Get Availability Error:', err);
        res.status(500).json({
            message: 'Error retrieving availability',
            error: err.message
        });
    }
};

const getPsychologistById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const psychologist = await Psychologist.findByPk(id, {
            attributes: {
                exclude: ['email'] // Don't expose email in public queries
            }
        });

        if (!psychologist) {
            return res.status(404).json({
                message: 'Psychologist not found'
            });
        }

        res.json(psychologist);
    } catch (err) {
        console.error('Get Psychologist Error:', err);
        res.status(500).json({
            message: 'Error retrieving psychologist',
            error: err.message
        });
    }
};

export { registerPsychologist, getPsychologists, getPsychologistAvailability, getPsychologistById };