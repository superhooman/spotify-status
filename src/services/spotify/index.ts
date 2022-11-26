import { stringifyUrl, stringify } from 'query-string';
import fetch from 'node-fetch';
import { env } from '../../env';
import { getRandomCode } from '../../utils';
import debug from 'debug';

const log = debug('spotify');

interface SpotifyError {
    error: 'invalid_grant',
    error_description: 'Authorization code expired',
}

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface SpotifyTokenRefreshResponse extends SpotifyTokenResponse {
    refresh_token: string;
}

interface SpotifyCurrentyPlayingResponse {
    is_playing: true;
    item: {
        id: string;
        name: string;
        artists: {
            id: string;
            name: string;
        }[];
        album: {
            id: string;
            name: string;
            images: {
                url: string;
            }[];
        };
        external_urls: {
            spotify: string;
        }
    };
}

interface CurrentlyPlayingError {
    success: false,
    error: string,
}

interface CurrentlyPlayingData {
    success: true,
    empty: false,
    data: SpotifyCurrentyPlayingResponse,
}

interface CurrentlyPlayingEmpty {
    success: true,
    empty: true,
}

type CurrentlyPlayingResponse = CurrentlyPlayingError | CurrentlyPlayingData | CurrentlyPlayingEmpty;

const SCOPRE = 'user-read-private user-library-read user-top-read user-read-currently-playing';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_HOST = 'api.spotify.com';

export class Spotify {
    clientId: string;
    clientSecret: string;
    redirectUrl: string;
    authorization: string;

    constructor() {

        this.clientId = env.CLIENT_ID;
        this.clientSecret = env.CLIENT_SECRET;
        this.redirectUrl = env.REDIRECT_URI;

        this.authorization = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    }

    getAuthUrl() {
        log('Getting auth url');
        return stringifyUrl({
            url: SPOTIFY_AUTH_URL,
            query: {
                response_type: 'code',
                client_id: this.clientId,
                scope: SCOPRE,
                redirect_uri: this.redirectUrl,
                state: getRandomCode(16),
            }
        });
    }

    async getAccessToken(code: string) {
        log('Getting toknes');
        const response = await fetch(
            SPOTIFY_TOKEN_URL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${this.authorization}`,
                },
                body: stringify({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: this.redirectUrl,
                }),
            },
        ).then(res => res.json() as unknown as SpotifyTokenRefreshResponse | SpotifyError);

        return response;
    }

    async refreshToken(refreshToken: string) {
        log('Refreshing token');
        const response = await fetch(
            SPOTIFY_TOKEN_URL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${this.authorization}`,
                },
                body: stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
            },
        ).then(res => res.json() as unknown as SpotifyTokenResponse | SpotifyError);

        return response;
    }

    async getCurrentlyPlaying(token: string): Promise<CurrentlyPlayingResponse> {
        log('Getting currently playing');
        const response = await fetch(
            `https://${SPOTIFY_API_HOST}/v1/me/player/currently-playing`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        )
        .then(res => {
            if (res.status === 200) {
                const data = res.json() as unknown as SpotifyCurrentyPlayingResponse;
                return {
                    success: true,
                    empty: false,
                    data,
                }
            }

            if (res.status === 401 || res.status === 403) {
                return {
                    success: false,
                    error: 'bad or expired token',
                }
            }

            if (res.status === 429) {
                return {
                    success: false,
                    error: 'too many requests',
                }
            }

            return {
                success: true,
                empty: true,
            }
        }) as CurrentlyPlayingResponse;

        return response;
    }
}
