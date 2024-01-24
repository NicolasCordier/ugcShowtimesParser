import extractMovieDetails from './extractMovieDetails';
import extractScreeningHours from './extractScreeningHours';
import getApiResult from './getApiResult';
import getCinemaHtmlPage from './getCinemaHtmlPage';
import { ParsedCinemas, ParsedMovieDetails } from './types';

export default async function apiHandler(cinemaIds: (string | number)[], searchStart: Date, searchEnd: Date) {
    const cinemaPages = await Promise.all(cinemaIds.map((cinemaId) => getCinemaHtmlPage(cinemaId, searchStart)));
    const parsedCinemas = cinemaPages.reduce((parsedCinemas: ParsedCinemas, page) => {
        const parsedCinema = extractScreeningHours(page, searchStart, searchEnd);

        return {
            ...parsedCinemas,
            ...parsedCinema,
        };
    }, {});

    const parsedMovieDetails = cinemaPages.reduce((movies: ParsedMovieDetails, page) => {
        const movieDetails = extractMovieDetails(page);

        return {
            ...movieDetails,
            ...movies,
        }
    }, {});

    const result = getApiResult(parsedCinemas, parsedMovieDetails);
    return result;
}