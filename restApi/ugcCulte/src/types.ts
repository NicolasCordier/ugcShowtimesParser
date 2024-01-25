export type ApiResult = {
    id: number;
    thumbnailUrl: URL | null;
    name: string;
    genders: string | null;
    directors: string | null;
    actors: string | null;
    description: string | null;
    releaseDateFR: string | null;
    durationFR: string | null;

    movieUrl: string;

    showings: {
        id: number;
        startDateFR: string;
        endDateFR: string;
        lang: string | null;
        cinemaId: number;
        cinemaName: string;

        bookingUrl: string;
    }[];
}[];

export type Movie = {
    id: number;
    thumbnailUrl: URL | null;
    name: string;
    genders: string | null;
    directors: string | null;
    actors: string | null;
    description: string | null;
    releaseDateFR: string | null;
    durationFR: string | null;
};

export type Movies = Record<number, Movie>

export type Showing = {
    id: number;
    start: Date;
    end: Date;
    lang: string | null;
    cinema: {
        id: number;
        name: string;
    }
}