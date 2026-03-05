const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);


const getTodayDate = (tz = 'Asia/Riyadh') => {
    return dayjs().tz(tz).format('YYYY-MM-DD');
};


const getYesterdayDate = (tz = 'Asia/Riyadh') => {
    return dayjs().tz(tz).subtract(1, 'day').format('YYYY-MM-DD');
};


const nowISO = () => {
    return dayjs().toISOString();
};


const getDateRange = (from, to) => {
    const dates = [];
    let current = dayjs(from);
    const end = dayjs(to);
    while (current.isBefore(end) || current.isSame(end, 'day')) {
        dates.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
    }
    return dates;
};

module.exports = {
    getTodayDate,
    getYesterdayDate,
    nowISO,
    getDateRange,
};
