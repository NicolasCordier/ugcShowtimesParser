import { ApiResult, Movie, Showing } from './types';
import { getMovies, getMovieShowings } from './ugcApi';

function getFrenchStartDate(date: Date) {
    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Europe/Paris',
    }).format(date);
}

function getFrenchEndDate(date: Date) {
    return new Intl.DateTimeFormat('fr-FR', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Europe/Paris',
    }).format(date);
}

export default async function apiHandler(cinemaIds: number[]) {
    const movies = await getMovies(cinemaIds);

    const moviePromises = Object.values(movies).map<Promise<[Movie, Showing[]]>>(async (movie) => {
        return [movie, await getMovieShowings(movie.id, cinemaIds)];
    })
    const promiseResults = await Promise.allSettled(moviePromises);

    const result = promiseResults.reduce((resolved, promiseResult) => {
        if (promiseResult.status === 'fulfilled') {
            const [movie, showings] = promiseResult.value;
            if (showings.length > 0)
            {
                resolved.push({
                    id: movie.id,
                    thumbnailUrl: movie.thumbnailUrl,
                    name: movie.name,
                    genders: movie.genders,
                    directors: movie.directors,
                    actors: movie.actors,
                    description: movie.description,
                    releaseDateFR: movie.releaseDateFR,
                    durationFR: movie.durationFR,
                    movieUrl: `https://www.ugc.fr/film.html?id=${movie.id}`,
                    showings: showings.map((showing) => ({
                        id: showing.id,
                        startDateFR: getFrenchStartDate(showing.start),
                        endDateFR: getFrenchEndDate(showing.end),
                        lang: showing.lang,
                        cinemaId: showing.cinema.id,
                        cinemaName: showing.cinema.name,
                        bookingUrl: `https://www.ugc.fr/reservationSeances.html?id=${showing.id}`,
                    })),
                });
            }
        }
        return resolved;
    }, [] as ApiResult);

    return result;
}