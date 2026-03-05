const EventLog = require('../models/EventLog');
const DailyObligation = require('../models/DailyObligation');
const User = require('../models/User');
const { getDateRange, getTodayDate } = require('../utils/dates');
const dayjs = require('dayjs');

const getHistory = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        const today = getTodayDate(user?.timezone);

        const from = req.query.from || dayjs(today).subtract(30, 'day').format('YYYY-MM-DD');
        const to = req.query.to || today;

        const obligations = await DailyObligation.find({
            userId: req.userId,
            date: { $gte: from, $lte: to },
        }).sort({ date: -1 });

        const eventLogs = await EventLog.find({
            userId: req.userId,
            date: { $gte: from, $lte: to },
            type: { $in: ['QADA_DONE', 'CONVERT_MISSED'] },
        });

        const dates = getDateRange(from, to);
        const history = dates.map(date => {
            const obligation = obligations.find(o => o.date === date);
            const dayEvents = eventLogs.filter(e => e.date === date);

            const presentCount = obligation
                ? Object.values(obligation.presentDone).filter(v => v).length
                : 0;

            const qadaDoneCount = dayEvents
                .filter(e => e.type === 'QADA_DONE')
                .reduce((sum, e) => sum + e.count, 0);

            const conversionsCount = dayEvents
                .filter(e => e.type === 'CONVERT_MISSED')
                .reduce((sum, e) => sum + e.count, 0);

            return {
                date,
                presentCompleted: presentCount,
                qadaDone: qadaDoneCount,
                conversionsAdded: conversionsCount,
                presentDone: obligation?.presentDone || null,
                converted: obligation?.convertedToQada || false,
            };
        }).reverse();

        res.json({ history });
    } catch (error) {
        next(error);
    }
};


const getStats = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        const today = getTodayDate(user?.timezone);
        const fourteenDaysAgo = dayjs(today).subtract(14, 'day').format('YYYY-MM-DD');

        // Get qada done in last 14 days
        const recentQada = await EventLog.find({
            userId: req.userId,
            date: { $gte: fourteenDaysAgo, $lte: today },
            type: 'QADA_DONE',
        });

        const totalQadaLast14 = recentQada.reduce((sum, e) => sum + e.count, 0);
        const avgPerDay = totalQadaLast14 / 14;

        const dates = getDateRange(fourteenDaysAgo, today);
        const dailyQada = dates.map(date => {
            const dayTotal = recentQada
                .filter(e => e.date === date)
                .reduce((sum, e) => sum + e.count, 0);
            return { date, count: dayTotal };
        });

        res.json({
            totalQadaLast14Days: totalQadaLast14,
            avgPerDay: Math.round(avgPerDay * 100) / 100,
            dailyBreakdown: dailyQada,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getHistory, getStats };
