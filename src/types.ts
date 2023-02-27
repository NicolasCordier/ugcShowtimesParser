export interface ApiResult {
    id: string;
    url: string;
    name: string;
    movies: {
        id: string;
        url: string;
        thumbnailUrl: string | null;
        name: string;
        genders: string;
        label: string;
        directors: string;
        actors: string;
        description: string;
        screeningHours: {
            id: string;
            url: string;
            start: Date;
            end: Date;
            lang: string;
        }[];
    }[];
}

export type ParsedCinemas = Record<string, {
    name: string;
    movies: Record<string, {
        name: string;
        genders: string;
        label: string;
        screeningHours: {
            id: string;
            start: Date;
            end: Date;
            lang: string;
        }[];
    }>;
}>;

export type ParsedMovieDetails = Record<string, {
    directors: string;
    actors: string;
    description: string;
    thumbnailUrl: string | null;
}>;