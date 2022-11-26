import type { Request } from 'express';

export const getParam = (query?: Request['query'][string]) => {
    const result = Array.isArray(query) ? query[0] : query;

    return result ? String(result) : undefined;
}

export const getRandomCode = (length: number) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
