import apiHandler from './apiHandler';
import getTranslatedSearchPeriod from './getTranslatedSearchPeriod';
import sendDiscordMessage from './sendDiscordMessage';
import type { APIGatewayEvent } from 'aws-lambda';
import getFilters from './getFIlters';

export async function handle(event: Partial<APIGatewayEvent>) {
    const filters = getFilters(event.body ?? '');

    const result = await apiHandler(filters.cinemaIds, filters.period.start, filters.period.end);

    const frenchPeriod = getTranslatedSearchPeriod(filters.period.start, filters.period.end);
    await sendDiscordMessage(result, frenchPeriod);

    return {
        body: result,
        statusCode: 200,
    };
}