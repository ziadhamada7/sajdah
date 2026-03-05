const DailyObligation = require('../models/DailyObligation');
const QadaBalance = require('../models/QadaBalance');
const EventLog = require('../models/EventLog');
const User = require('../models/User');
const { getTodayDate, nowISO, getYesterdayDate, getDateRange } = require('../utils/dates');
const { closeDayForUser, closeAllMissedDays } = require('../services/dailyClose.service');

const ensureToday = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        const today = getTodayDate(user?.timezone);

        let obligation = await DailyObligation.findOne({
            userId: req.userId,
            date: today,
        });

        if (!obligation) {
            obligation = await DailyObligation.create({
                userId: req.userId,
                date: today,
            });
        }

        const qadaBalance = await QadaBalance.findOne({ userId: req.userId });

        res.json({
            date: today,
            presentDone: obligation.presentDone,
            convertedToQada: obligation.convertedToQada,
            qadaRemaining: qadaBalance?.totalRemaining || 0,
        });
    } catch (error) {
        next(error);
    }
};

const markPresent = async (req, res, next) => {
    try {
        const { prayer, date } = req.validatedBody;
        const user = await User.findById(req.userId);
        const effectiveDate = date || getTodayDate(user?.timezone);
        const prayerKey = prayer.toLowerCase();

        // Find or create today's obligation
        let obligation = await DailyObligation.findOne({
            userId: req.userId,
            date: effectiveDate,
        });

        if (!obligation) {
            obligation = await DailyObligation.create({
                userId: req.userId,
                date: effectiveDate,
            });
        }

        if (obligation.convertedToQada) {
            return res.status(400).json({ error: 'Day already closed and converted to qada' });
        }

        if (obligation.presentDone[prayerKey]) {
            return res.status(400).json({ error: 'Prayer already marked as done' });
        }

        obligation.presentDone[prayerKey] = true;
        await obligation.save();

        await EventLog.create({
            userId: req.userId,
            ts: nowISO(),
            date: effectiveDate,
            prayer: prayer,
            type: 'PRESENT_DONE',
            count: 1,
        });

        res.json({
            date: effectiveDate,
            presentDone: obligation.presentDone,
            message: `${prayer} marked as done`,
        });
    } catch (error) {
        next(error);
    }
};

const addQada = async (req, res, next) => {
    try {
        const { prayer, count } = req.validatedBody;
        const user = await User.findById(req.userId);
        const today = getTodayDate(user?.timezone);

        let qadaBalance = await QadaBalance.findOne({ userId: req.userId });
        if (!qadaBalance) {
            qadaBalance = await QadaBalance.create({ userId: req.userId, totalRemaining: 0 });
        }

        const actualApplied = Math.min(count, qadaBalance.totalRemaining);
        const clamped = actualApplied < count;

        qadaBalance.totalRemaining = Math.max(0, qadaBalance.totalRemaining - count);
        await qadaBalance.save();

        const meta = clamped ? { clamped: true, actualApplied } : {};
        await EventLog.create({
            userId: req.userId,
            ts: nowISO(),
            date: today,
            prayer: prayer,
            type: 'QADA_DONE',
            count: count,
            meta,
        });

        res.json({
            qadaRemaining: qadaBalance.totalRemaining,
            applied: actualApplied,
            clamped,
            message: `${actualApplied} ${prayer} qada logged`,
        });
    } catch (error) {
        next(error);
    }
};

const undo = async (req, res, next) => {
    try {
        const lastEvent = await EventLog.findOne({
            userId: req.userId,
            type: { $ne: 'UNDO' },
        }).sort({ createdAt: -1 });

        if (!lastEvent) {
            return res.status(404).json({ error: 'No actions to undo' });
        }

        const prayerKey = lastEvent.prayer.toLowerCase();

        if (lastEvent.type === 'PRESENT_DONE') {
            await DailyObligation.findOneAndUpdate(
                { userId: req.userId, date: lastEvent.date },
                { $set: { [`presentDone.${prayerKey}`]: false } }
            );
        } else if (lastEvent.type === 'QADA_DONE') {
            const restoreCount = lastEvent.meta?.clamped
                ? lastEvent.meta.actualApplied
                : lastEvent.count;

            await QadaBalance.findOneAndUpdate(
                { userId: req.userId },
                { $inc: { totalRemaining: restoreCount } }
            );
        } else if (lastEvent.type === 'CONVERT_MISSED') {
            await QadaBalance.findOneAndUpdate(
                { userId: req.userId },
                { $inc: { totalRemaining: -lastEvent.count } }
            );
        }

        await EventLog.create({
            userId: req.userId,
            ts: nowISO(),
            date: lastEvent.date,
            prayer: lastEvent.prayer,
            type: 'UNDO',
            count: lastEvent.count,
            meta: { undoneEventId: lastEvent._id, undoneType: lastEvent.type },
        });

        await EventLog.findByIdAndDelete(lastEvent._id);

        const qadaBalance = await QadaBalance.findOne({ userId: req.userId });
        const obligation = await DailyObligation.findOne({ userId: req.userId, date: lastEvent.date });

        res.json({
            undone: lastEvent.type,
            prayer: lastEvent.prayer,
            date: lastEvent.date,
            qadaRemaining: qadaBalance?.totalRemaining || 0,
            presentDone: obligation?.presentDone,
            message: `Undid ${lastEvent.type} for ${lastEvent.prayer}`,
        });
    } catch (error) {
        next(error);
    }
};

const dailyClose = async (req, res, next) => {
    try {
        const { date } = req.validatedBody;

        const result = await closeDayForUser(req.userId, date);

        res.json({
            date,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const closeMissedDays = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        const today = getTodayDate(user?.timezone);
        const yesterday = getYesterdayDate(user?.timezone);

        const lastConverted = await DailyObligation.findOne({
            userId: req.userId,
            convertedToQada: true,
        }).sort({ date: -1 });

        let startDate;
        if (lastConverted) {
            const dayjs = require('dayjs');
            startDate = dayjs(lastConverted.date).add(1, 'day').format('YYYY-MM-DD');
        } else {
            startDate = yesterday;
        }

        if (startDate > yesterday) {
            return res.json({ totalConversions: 0, results: [], message: 'Nothing to close' });
        }

        const datesToClose = getDateRange(startDate, yesterday);
        const result = await closeAllMissedDays(req.userId, datesToClose);

        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    ensureToday,
    markPresent,
    addQada,
    undo,
    dailyClose,
    closeMissedDays,
};
