import apiHandler from './apiHandler';
import { reportMoviesToDiscord } from './discord';
import { cinemaIds } from './params';

(async () => {
    const cinemaMovies = await apiHandler(cinemaIds);
    console.log('cinemaMovies', JSON.stringify(cinemaMovies, undefined, 2));

    await reportMoviesToDiscord(cinemaMovies);
})();
