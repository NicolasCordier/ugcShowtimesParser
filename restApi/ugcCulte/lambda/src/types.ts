export type MoviesApiResult = {
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
        startDate: Date;
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

export type ApiResult = {
    cinemaId: number;
    cinemaName: string;

    movies: {
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
    }[];
}[];

export type EmbedMessage = {
    title: string;
    url: string;
    description: string;
    fields: EmbedMessageField[];
    thumbnail?: {
        url: string;
    };
}

export type EmbedMessageField = {
    name: string;
    value: string;
    inline?: boolean;
}


export type DiscordMessage = {
    id: string;
    content: string;
    embeds: EmbedMessage[];
    timestamp: string;
}

export type PostDiscordMessage = {
    username: string;
} & ({
    content: string;
} | {
    embeds: EmbedMessage[];
})