import apiHandler from './apiHandler';
import getTranslatedSearchPeriod from './getTranslatedSearchPeriod';
import { handle } from './lambdaHandler';
import sendDiscordMessage from './sendDiscordMessage';

// handle({
//     body: JSON.stringify({
//         shortcut: 'wednesday',
//         cinemaIds: [7, 10, 20],
//         searchStart: '2000-01-01T18:30:00',
//         searchEnd: '2000-01-01T19:30:00',
//     }),
// })

// handle({
//     body: JSON.stringify({
//         cinemaIds: [7],
//         searchStart: '2023-02-28T18:30:00',
//         searchEnd: '2023-02-28T19:30:00',
//     }),
// })

handle({
    body: JSON.stringify({
        cinemaNames: 'Maillot,les halles',
        searchStart: '2023-02-28T18:30:00',
        searchEnd: '2023-02-28T19:30:00',
    }),
})