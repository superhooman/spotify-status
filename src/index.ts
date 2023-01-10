import express from 'express';
import { env } from './env';
import debug from 'debug';
import { getLastSong, getToken, saveLastSong, setToken } from './services/db';
import { Spotify } from './services/spotify';
import { getParam } from './utils';
import { CurrentlyPlayingResponse } from './services/spotify/types';

const log = debug('server');

const spotify = new Spotify();

const app = express();

app.get('/', (_req, res) => {
    return res.json({
        alive: true,
    });
});

app.get('/login', (_req, res) => {
    const url = spotify.getAuthUrl();
    log('redirecting to', url);

    return res.redirect(url);
});

app.get('/callback', async (req, res) => {
    log('got callback');
    const spotify = new Spotify();

    const code = getParam(req.query.code);

    if (!code) {
        return res.status(400).json({
            error: 'Invalid request',
        });
    }

    const data = await spotify.getAccessToken(code);

    if ('error' in data) {
        return res.status(400).json({
            error: data.error,
        });
    }

    await setToken('access_token', data.access_token);
    await setToken('refresh_token', data.refresh_token);

    return res.json(data);
});

app.get('/api/current', async (req, res) => {
    const resultSong = async (data: CurrentlyPlayingResponse) => {
        if (!data.success) {
            res.status(500);
            return {
                error: 'Failed to get currently playing',
            };
        }

        if (!data.empty) {
            await saveLastSong(data.song);
            return response;
        }

        const song = await getLastSong();

        return {
            success: true,
            empty: !song,
            song: song ?? undefined,
        };
    }

    const accessToken = await getToken('access_token');
    if (!accessToken) {
        return res.status(500).json({
            error: 'No token was found',
        });
    }

    const response = await spotify.getCurrentlyPlaying(accessToken);

    if (!response.success) {
        const refreshToken = await getToken('refresh_token');

        if (!refreshToken) {
            return res.status(500).json({
                error: 'No token was found',
            });
        }

        const data = await spotify.refreshToken(refreshToken);

        if ('error' in data) {
            return res.status(500).json({
                error: data.error,
            });
        }

        await setToken('access_token', data.access_token);

        const response = await spotify.getCurrentlyPlaying(data.access_token);

        return res.json(await resultSong(response));
    }

    return res.json(await resultSong(response));
});

app.listen(env.PORT, () => {
    console.log(`Listening on port ${env.PORT}`);
});
