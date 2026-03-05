const DailyObligation = require('../models/DailyObligation');
const QadaBalance = require('../models/QadaBalance');
const EventLog = require('../models/EventLog');
const { PRAYER_KEYS } = require('../utils/constants');
const { nowISO } = require('../utils/dates');


const closeDayForUser = async (userId, date) => {
    const obligation = await DailyObligation.findOne({ userId, date });

    
    if (!obligation) {
        const newObligation = await DailyObligation.create({
            userId,
            date,
            presentDone: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
            convertedToQada: false,
        });
        return await performConversion(userId, newObligation);
    }

    if (obligation.convertedToQada) {
        return { conversions: 0, alreadyClosed: true };
    }

    return await performConversion(userId, obligation);
};


const performConversion = async (userId, obligation) => {
    let conversions = 0;
    const eventLogs = [];

    for (const key of PRAYER_KEYS) {
        if (!obligation.presentDone[key]) {
            conversions++;
            eventLogs.push({
                userId,
                ts: nowISO(),
                date: obligation.date,
                prayer: key.toUpperCase(),
                type: 'CONVERT_MISSED',
                count: 1,
                meta: {},
            });
        }
    }

    if (conversions > 0) {
        
        await QadaBalance.findOneAndUpdate(
            { userId },
            { $inc: { totalRemaining: conversions } },
            { upsert: true, new: true }
        );

        
        await EventLog.insertMany(eventLogs);
    }

    
    obligation.convertedToQada = true;
    await obligation.save();

    return { conversions, alreadyClosed: false };
};


const closeAllMissedDays = async (userId, dates) => {
    let totalConversions = 0;
    const results = [];

    for (const date of dates) {
        const result = await closeDayForUser(userId, date);
        totalConversions += result.conversions;
        results.push({ date, ...result });
    }

    return { totalConversions, results };
};

module.exports = {
    closeDayForUser,
    closeAllMissedDays,
};
