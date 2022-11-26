import { PrismaClient } from "@prisma/client";
import debug from "debug";
import type { Song } from '../spotify/types';

const log = debug('db');

type Token = 'access_token' | 'refresh_token';

const prisma = new PrismaClient();

export const getToken = async (token: Token) => {
    log('getting token', token);
    const data = await prisma.token.findUnique({
        where: {
            token,
        },
    });

    return data?.value;
}

export const setToken = async (token: Token, value: string) => {
    if (!value) {
        return;
    }
    log('setting token', token);
    await prisma.token.upsert({
        where: {
            token,
        },
        update: {
            value,
        },
        create: {
            token,
            value,
        }
    });
}

export const saveLastSong = async (song: Song) => {
    log('saving last song');
    await prisma.song.upsert({
        where: {
            id: 'last',
        },
        update: {
            name: song.name,
            artist: song.artist,
            album: song.album,
            image: song.image,
            url: song.url,
        },
        create: {
            id: 'last',
            name: song.name,
            artist: song.artist,
            album: song.album,
            image: song.image,
            url: song.url,
        }
    });
}

export const getLastSong = async () => {
    log('getting last song');
    const data = await prisma.song.findUnique({
        where: {
            id: 'last',
        },
    });

    return data;
}
