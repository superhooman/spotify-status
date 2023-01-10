export interface SpotifyError {
    error: string;
    error_description: string;
}

export interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface SpotifyTokenRefreshResponse extends SpotifyTokenResponse {
    refresh_token: string;
}

export interface SpotifyImage {
    height: number;
    width: number;
    url: string;
}

export interface SpotifyCurrentyPlayingResponse {
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
            images: SpotifyImage[];
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

export interface Song {
    id: string;
    name: string;
    artist: string;
    album: string;
    image: string;
    url: string;
}

export interface CurrentlyPlayingData {
    success: true,
    empty: false,
    song: Song,
}

interface CurrentlyPlayingEmpty {
    success: true,
    empty: true,
}

export type CurrentlyPlayingResponse = CurrentlyPlayingError | CurrentlyPlayingData | CurrentlyPlayingEmpty;