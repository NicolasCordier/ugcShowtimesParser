import apiHandler from './apiHandler';
import getTranslatedSearchPeriod from './getTranslatedSearchPeriod';
import sendDiscordMessage from './sendDiscordMessage';

const cinemaIds = ['7', '10', '20'];
const searchPeriod = {
    start: { hours: 18, minutes: 30 },
    end: { hours: 19, minutes: 30 },
} as const;

function getNextWeekday(date: Date, dayOfWeek: number) {
    date = new Date(date);
    date.setDate(date.getDate() + (dayOfWeek + 7 - date.getDay()) % 7);
    return date;
}

export async function handler() {
    const nextWednesday = getNextWeekday(new Date(), 3);
    const searchStart = new Date(nextWednesday);
    searchStart.setHours(searchPeriod.start.hours, searchPeriod.start.minutes, 0, 0);
    const searchEnd = new Date(nextWednesday);
    searchEnd.setHours(searchPeriod.end.hours, searchPeriod.end.minutes, 0, 0);

    const result = await apiHandler(cinemaIds, searchStart, searchEnd);

    const frenchPeriod = getTranslatedSearchPeriod(searchStart, searchEnd);
    await sendDiscordMessage(result, frenchPeriod);

    return {
        body: result,
        statusCode: 200,
    };
}