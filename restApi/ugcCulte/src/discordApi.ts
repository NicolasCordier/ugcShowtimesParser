import { discordToken } from "./params";
import { DiscordMessage, PostDiscordMessage } from "./types";
import { getResponseJson, validateValue, waitFor } from "./utils";

const discordBaseUrl = "https://discordapp.com";

const headers = {
    'Authorization': `Bot ${discordToken}`,
}

const postHeaders = {
    ...headers,
    'Content-Type': 'application/json',
}

async function performDiscordRequest(...params: Parameters<typeof fetch>) {
    while (true) {
        const httpResponse = await fetch(...params);
        if (httpResponse.status === 429) {
            const response = await httpResponse.json();

            const retryAfter = validateValue(response?.retry_after, 'number', 'discord api rate limit "retry_after"', false);
            await waitFor(retryAfter * 1000);
        }
        else {
            return getResponseJson(httpResponse);
        }
    }
}

export async function getDiscordMessageContent(channelId: string, messageId: string) {
    const endpoint = new URL(`/api/channels/${channelId}/messages/${messageId}`, discordBaseUrl);
    const response = await performDiscordRequest(endpoint, { headers: headers });

    const message = validateValue(response?.content, 'string', 'discord message "content"', false);

    return message;
}

export async function getDiscordChannelMessages(channelId: string): Promise<DiscordMessage[]> {
    const endpoint = new URL(`/api/channels/${channelId}/messages?limit=100`, discordBaseUrl);
    const response = await performDiscordRequest(endpoint, { headers: headers });

    return response;
}

export async function updateDiscordMessage(channelId: string, messageId: string, message: Partial<PostDiscordMessage>): Promise<DiscordMessage> {
    const endpoint = new URL(`/api/channels/${channelId}/messages/${messageId}`, discordBaseUrl);
    const response = await performDiscordRequest(endpoint, {
        headers: postHeaders,
        method: 'PATCH',
        body: JSON.stringify(message),
    });
    return response;
}

export async function sendDiscordMessage(channelId: string, message: PostDiscordMessage): Promise<DiscordMessage> {
    console.log('sending discord message', JSON.stringify(message, undefined, 2));
    const endpoint = new URL(`/api/channels/${channelId}/messages`, discordBaseUrl);
    const response = await performDiscordRequest(endpoint, {
        headers: postHeaders,
        method: 'POST',
        body: JSON.stringify(message),
    });
    return response;
}

export async function deleteDiscordMessage(channelId: string, messageId: string) {
    const endpoint = new URL(`/api/channels/${channelId}/messages/${messageId}`, discordBaseUrl);
    const response = await performDiscordRequest(endpoint, {
        headers: headers,
        method: 'DELETE',
    });
}