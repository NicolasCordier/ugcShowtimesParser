import apiHandler from './apiHandler';
import type { APIGatewayEvent } from 'aws-lambda';
import { reportMoviesToDiscord } from './discord';
import { cinemaIds } from './params';

export async function handle(event: Partial<APIGatewayEvent>) {
    const cinemaMovies = await apiHandler(cinemaIds);

    await reportMoviesToDiscord(cinemaMovies);

    return {
        body: cinemaMovies,
        statusCode: 200,
    };
}