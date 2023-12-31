import { format, parseISO } from 'date-fns';
import { Api } from './api';

function zeroPad(num: number, places: number) {
    return String(num).padStart(places, '0');
}

export function toTime(seconds: number) {
    const minutes = ~~(seconds / 60);
    const minutesAndSeconds = `${minutes % 60}:${zeroPad(seconds % 60, 2)}`;

    if (minutes >= 60) {
        const pad = minutes % 60 < 10 ? '0' : '';
        return `${~~(minutes / 60)}:${pad}${minutesAndSeconds}`;
    }

    return minutesAndSeconds;
}

export function displayDate(date: string, dateFormat: string): string {
    if (!date) return '';
    return format(parseISO(date), dateFormat);
}

export function displayAlbumVersionQuality(
    version: Api.AlbumVersionQuality,
): string {
    let str = '';

    switch (version.source) {
        case Api.TrackSource.LOCAL:
            break;
        case Api.TrackSource.TIDAL:
            str += 'Tidal';
            break;
        default:
            version.source satisfies never;
    }

    if (version.format) {
        if (str.length > 0) {
            str += ' ';
        }
        switch (version.format) {
            case Api.AudioFormat.AAC:
                str += 'AAC';
                break;
            case Api.AudioFormat.FLAC:
                str += 'FLAC';
                break;
            case Api.AudioFormat.MP3:
                str += 'MP3';
                break;
            case Api.AudioFormat.SOURCE:
                break;
            default:
                version.format satisfies never;
        }
    }
    if (version.sampleRate) {
        if (str.length > 0) {
            str += ' ';
        }
        str += `${version.sampleRate / 1000} kHz`;
    }
    if (version.bitDepth) {
        if (str.length > 0) {
            str += ', ';
        }
        str += `${version.bitDepth}-bit`;
    }

    return str;
}

export function displayAlbumVersionQualities(
    versions: Api.AlbumVersionQuality[],
): string {
    let str = displayAlbumVersionQuality(versions[0]);

    if (versions.length > 1) {
        str += ` (+${versions.length - 1})`;
    }

    return str;
}
