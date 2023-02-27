import apiHandler from './apiHandler';
import getTranslatedSearchPeriod from './getTranslatedSearchPeriod';
import sendDiscordMessage from './sendDiscordMessage';

// const cinemaIds = ['17', '49'];
const cinemaIds = ['7', '10', '20']
const searchStart = new Date('2023-03-01T18:30:00');
const searchEnd = new Date('2023-03-01T19:30:00');

(async () => {
    const result = await apiHandler(cinemaIds, searchStart, searchEnd);
    // console.log(JSON.stringify(result));

    const frenchPeriod = getTranslatedSearchPeriod(searchStart, searchEnd);
    sendDiscordMessage(result, frenchPeriod);
})();