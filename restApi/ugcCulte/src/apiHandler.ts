import { ApiResult } from './types';
import { getMovies, getMovieShowings } from './ugcApi';

export default async function apiHandler(cinemaIds: number[]) {
    const movies = await getMovies(cinemaIds);

    const moviePromises = Object.values(movies).map<Promise<ApiResult>>(async (movie) => ({
        ...movie,
        showings: await getMovieShowings(movie.id, cinemaIds), // TODO: filter out movies without any showings
    }))
    const result = await Promise.all(moviePromises); // allSettled instead? So we can skip errors

    return result;
}