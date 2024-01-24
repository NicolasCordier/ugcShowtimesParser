import { Filters, Period } from './types';
import { cinemaList } from './constants'

function getNextWeekday(date: Date, dayOfWeek: number) {
    date = new Date(date);
    date.setDate(date.getDate() + (dayOfWeek + 7 - date.getDay()) % 7);
    date.setHours(0, 0, 0, 0);
    return date;
}

const getNextWednesday = () => getNextWeekday(new Date(), 3);

function getCinemaIds(userInputCinemaIds?: number[], cinemaNames?: string): number[] {
    let cinemaIds: number[];
    if (Array.isArray(userInputCinemaIds)) {
        if (userInputCinemaIds.find((cinemaId) => typeof cinemaId !== 'number')) {
            throw new Error("cinemaIds must be an array of number");
        }
        cinemaIds = userInputCinemaIds;
    } else if (typeof cinemaNames === 'string') {
        cinemaIds = cinemaNames.toLocaleLowerCase()
            .split(',').reduce((foundCinemaIds: number[], cinemaName) => {
                const cinema = cinemaList.find((c) => {
                    return c.name.toLocaleLowerCase().includes(cinemaName);
                });
                if (cinema) {
                    foundCinemaIds.push(cinema.id);
                }
                return foundCinemaIds;
            }, []);

        if (cinemaIds.length === 0) {
            throw new Error("Couldn't find any cinema. cinemasName should look like 'les halles,la defense'");
        }
    } else {
        throw new Error("Missing cinema list. cinemaIds (number[]) or cinemaNames (string)");
    }
    return [...(new Set(cinemaIds)).values()];
}

function checkDateIsNotInPast(date: Date) {
    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date. Must be ISO8601");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
        throw new Error("Date shouldn't be in past");
    }
}

function getPeriod(searchStartInput?: string, searchEndInput?: string, shortcut?: string): Period {
    const searchStart = new Date(searchStartInput || '');
    const searchEnd = new Date(searchEndInput || '');
    let period: Period;

    if (searchStartInput) checkDateIsNotInPast(searchStart);
    if (searchEndInput) checkDateIsNotInPast(searchEnd);

    if (shortcut) {
        let shortcutDay: Date;
        switch (shortcut) {
            case 'today':
                shortcutDay = new Date();
                break;
            case 'wednesday':
                shortcutDay = getNextWednesday();
                break;

            default:
                throw new Error(`Invalid shortcut ${shortcut}`);
        }

        const start = new Date(shortcutDay);
        if (searchStartInput) {
            start.setHours(searchStart.getHours(), searchStart.getMinutes(), 0, 0);
        } else {
            start.setHours(0, 0, 0, 0);
        }

        const end = new Date(shortcutDay);
        if (searchEndInput) {
            start.setHours(searchEnd.getHours(), searchEnd.getMinutes(), 0, 0);
        } else {
            start.setHours(0, 0, 0, 0);
        }

        period = {
            start: start,
            end: end,
        }
    } else if (!searchStartInput || !searchEndInput) {
        throw new Error(`Missing search period.
periodShortcut: (today or wednesday) optionnal
searchStart: (ISO8601 datestring) mandatory if periodShortcut not set
searchEnd: (ISO8601 datestring) mandatory if periodShortcut not set`);
    } else {
        period = {
            start: searchStart,
            end: searchEnd,
        }
    }

    if (period.start >= period.end) {
        throw new Error("Invalid period: searchStart must be before searchEnd");
    }

    return period;
}

export default function getFilters(strBody: string): Filters {
    const body = JSON.parse(strBody);

    return {
        cinemaIds: getCinemaIds(body.cinemaIds, body.cinemaNames),
        period: getPeriod(body.searchStart, body.searchEnd, body.periodShortcut),
    }
}
