import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './User.js';

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    psychologistId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Psychologists',
            key: 'id'
        }
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'in-progress', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    },
    messages: {
        type: DataTypes.JSONB,
        defaultValue: [],
        get() {
            const messages = this.getDataValue('messages');
            return messages || [];
        }
    },
    lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['psychologistId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['startTime']
        }
    ]
});

// Instance methods
Session.prototype.addMessage = async function(senderId, content) {
    const message = {
        id: crypto.randomUUID(),
        senderId,
        content,
        timestamp: new Date(),
        isRead: false
    };

    const messages = this.messages;
    messages.push(message);

    this.messages = messages;
    this.lastMessageAt = message.timestamp;
    await this.save();

    return message;
};

Session.prototype.markMessagesAsRead = async function(userId) {
    const messages = this.messages;
    let updated = false;

    messages.forEach(message => {
        if (message.senderId !== userId && !message.isRead) {
            message.isRead = true;
            updated = true;
        }
    });

    if (updated) {
        this.messages = messages;
        await this.save();
    }

    return updated;
};

// Class methods
Session.findActiveSessionsForUser = async function(userId) {
    return Session.findAll({
        where: {
            [sequelize.Op.or]: [
                { userId },
                { psychologistId: userId }
            ],
            status: {
                [sequelize.Op.in]: ['scheduled', 'in-progress']
            }
        },
        order: [['startTime', 'ASC']]
    });
};

Session.findSessionWithMessages = async function(sessionId, userId) {
    const session = await Session.findOne({
        where: {
            id: sessionId,
            [sequelize.Op.or]: [
                { userId },
                { psychologistId: userId }
            ]
        }
    });

    if (!session) {
        throw new Error('Session not found or unauthorized');
    }

    return session;
};

export default Session;