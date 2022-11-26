import { PrismaClient } from "@prisma/client";
import debug from "debug";

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
