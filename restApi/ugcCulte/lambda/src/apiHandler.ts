import { MoviesApiResult, Movie, Showing, ApiResult } from './types';
import { getMovies, getMovieShowings } from './ugcApi';
import { getFrenchStartDate, getFrenchEndDate } from './utils';

export type ApiResultRecord = {
    cinemaId: number;
    cinemaName: string;

    movies: Record<number, {
        id: number;
        thumbnailUrl: URL | null;
        name: string;
        genders: string | null;
        directors: string | null;
        actors: string | null;
        description: string | null;
        releaseDateFR: string | null;
        durationFR: string | null;
    
        showings: {
            id: number;
            startDate: Date;
            startDateFR: string;
            endDateFR: string;
            lang: string | null;
    
            bookingUrl: string;
        }[];
    }>;
}

export default async function apiHandler(cinemaIds: number[]): Promise<ApiResult> {
    const movies = await getMovies(cinemaIds);

    const moviePromises = Object.values(movies).map<Promise<[Movie, Showing[]]>>(async (movie) => {
        return [movie, await getMovieShowings(movie.id, cinemaIds)];
    })
    const promiseResults = await Promise.allSettled(moviePromises);

    const movieCinemaShowings = promiseResults.reduce((resolved, promiseResult) => {
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
                        startDate: showing.start,
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
    }, [] as MoviesApiResult);

    const cinemaMoviesMap = movieCinemaShowings.reduce((cinemas, movie) => {
        movie.showings.forEach((showing) => {
            const cinemaMovies = (cinemas[showing.cinemaId] ?? {}).movies ?? {};
            const currentMovie: ApiResultRecord["movies"][0] = cinemaMovies[movie.id] ?? {
                id: movie.id,
                thumbnailUrl: movie.thumbnailUrl,
                name: movie.name,
                genders: movie.genders,
                directors: movie.directors,
                actors: movie.actors,
                description: movie.description,
                releaseDateFR: movie.releaseDateFR,
                durationFR: movie.durationFR,
                showings: [],
            };

            currentMovie.showings.push({
                id: showing.id,
                startDate: showing.startDate,
                startDateFR: showing.startDateFR,
                endDateFR: showing.endDateFR,
                lang: showing.lang,
                bookingUrl: showing.bookingUrl,
            });
            currentMovie.showings = currentMovie.showings.sort((a, b) => a.startDate > b.startDate ? 1 : -1);
            cinemaMovies[movie.id] = currentMovie;

            cinemas[showing.cinemaId] = {
                cinemaId: showing.cinemaId,
                cinemaName: showing.cinemaName,
                movies: cinemaMovies,
            }
        });

        return cinemas;
    }, {} as Record<number, ApiResultRecord>);

    return Object.values(cinemaMoviesMap).map((cinema) => ({
        cinemaId: cinema.cinemaId,
        cinemaName: cinema.cinemaName,
        movies: Object.values(cinema.movies),
    }));
}