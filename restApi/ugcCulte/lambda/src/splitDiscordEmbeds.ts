import { EmbedMessage, EmbedMessageField } from "./types";
import { computeSum } from "./utils";

const MAX_DISCORD_EMBEDS_PER_MSG = 10;
const MAX_EMBEDS_CHARS_PER_MSG = 6000;

function calculateFieldSize(field: EmbedMessageField) {
    return field.name.length + field.value.length;
}

function calculateEmbedSize(embed: EmbedMessage) {
    return embed.title.length +
        embed.description.length +
        computeSum(embed.fields.map(calculateFieldSize));
}

type SplitedEmbeds = {
    length: number;
    embeds: EmbedMessage[];
}

export function splitDiscordEmbeds(embeds: EmbedMessage[]) {
    const splitResult = embeds.reduce((res, embed) => {
        const lastSplit = res.at(-1);
        const embedSize = calculateEmbedSize(embed);

        if (lastSplit
            && lastSplit.length + embedSize <= MAX_EMBEDS_CHARS_PER_MSG
            && lastSplit.embeds.length < MAX_DISCORD_EMBEDS_PER_MSG
        ) {
            lastSplit.embeds.push(embed);
            lastSplit.length += embedSize;
            res[res.length - 1] = lastSplit;
        }
        else {
            res.push({
                embeds: [embed],
                length: embedSize,
            });
        }

        return res;
    }, [] as SplitedEmbeds[]);

    return splitResult.map((s) => s.embeds);
}