import { createSignal } from 'solid-js';
import { Howl, HowlCallback } from 'howler';
import { Api } from './api';
import {
    PlayerType,
    currentSeek,
    playing,
    playlist,
    playlistPosition,
    setCurrentSeek,
    setCurrentTrackLength,
    playbackQuality,
    playerState,
} from './player';
import * as player from './player';
import { orderedEntries } from './util';

export type TrackListenerCallback = (
    track: Api.Track,
    position: number,
) => void;

export const [sound, setSound] = createSignal<Howl>();

export function createPlayer(id: number): PlayerType {
    let howlPlaying = false;

    let seekHandle: NodeJS.Timeout;
    let endHandle: HowlCallback;
    let loadHandle: HowlCallback;

    function getTrackUrl(track: Api.Track): string {
        const query = new URLSearchParams({
            trackId: track.trackId.toString(),
        });

        const clientId = Api.clientId();
        const signatureToken = Api.signatureToken();

        if (clientId && signatureToken) {
            query.set('clientId', clientId);
            query.set('signature', signatureToken);
        }

        if (playbackQuality().format !== Api.AudioFormat.SOURCE) {
            query.set('format', playbackQuality().format);
        }

        return `${Api.apiUrl()}/track?${query}`;
    }

    function refreshCurrentSeek() {
        const seek = sound()?.seek();
        if (typeof seek === 'number') {
            const roundedSeek = Math.round(seek);
            if (currentSeek() !== roundedSeek) {
                console.debug(`Setting currentSeek to ${roundedSeek}`);
                setCurrentSeek(roundedSeek);
            }
        }
    }

    function setTrack(): boolean {
        if (!sound()) {
            if (typeof playlistPosition() === 'undefined') {
                console.debug('No track to play');
                return false;
            }
            const track = playlist()![playlistPosition()!];
            console.debug('Setting track to', track);

            let format: string | undefined;

            switch (track.format) {
                case Api.AudioFormat.AAC:
                    format = 'm4a';
                    break;
                case Api.AudioFormat.FLAC:
                    format = 'flac';
                    break;
                case Api.AudioFormat.MP3:
                    format = 'mp3';
                    break;
            }

            const howl = new Howl({
                src: [getTrackUrl(track)],
                format,
                html5: true,
            });
            howl.volume(playerState.currentPlaybackSession?.volume ?? 1);
            howl.pannerAttr({ panningModel: 'equalpower' });
            setSound(howl);
            const duration = Math.round(track.duration);
            if (!isNaN(duration) && isFinite(duration)) {
                setCurrentTrackLength(duration);
            }
        }
        return true;
    }

    let ended: boolean = true;
    let loaded = false;

    function play(): boolean {
        const initialSeek = !sound() ? currentSeek() : undefined;

        if (!sound() || ended) {
            if (!setTrack()) return false;

            sound()!.on(
                'end',
                (endHandle = (id: number) => {
                    if (ended) {
                        console.debug(
                            'End called after track already ended',
                            id,
                            sound(),
                            sound()?.duration(),
                        );
                        return;
                    }
                    console.debug(
                        'Track ended',
                        id,
                        sound(),
                        sound()?.duration(),
                    );
                    ended = true;
                    loaded = false;
                    stop();
                    player.nextTrack();
                }),
            );
            sound()!.on(
                'load',
                (loadHandle = (...args) => {
                    ended = false;
                    loaded = true;
                    console.debug(
                        'Track loaded',
                        sound(),
                        sound()!.duration(),
                        ...args,
                    );
                    const duration = Math.round(sound()!.duration());
                    if (!isNaN(duration) && isFinite(duration)) {
                        setCurrentTrackLength(duration);
                    }
                    if (typeof initialSeek === 'number') {
                        console.debug(`Setting initial seek to ${initialSeek}`);
                        sound()!.seek(initialSeek);
                    }
                }),
            );
        }

        sound()!.play();

        seekHandle = setInterval(() => {
            if (!loaded) return;
            refreshCurrentSeek();
        }, 200);

        if (loaded && typeof initialSeek === 'number') {
            console.debug(`Setting initial seek to ${initialSeek}`);
            sound()!.seek(initialSeek);
        }

        console.debug('Playing', sound());

        return true;
    }

    function seek(seek: number): boolean {
        console.debug('Track seeked', seek);
        sound()?.seek(seek);
        return true;
    }

    function pause(): boolean {
        sound()?.pause();
        clearInterval(seekHandle);
        console.debug('Paused');
        return true;
    }

    function stopHowl() {
        howlPlaying = false;
        sound()?.off('end', endHandle);
        sound()?.off('load', loadHandle);
        if (!ended) {
            sound()?.stop();
        }
        loaded = false;
        sound()?.unload();
        setSound(undefined);
    }

    function stop(): boolean {
        stopHowl();
        clearInterval(seekHandle);
        console.debug('Track stopped');
        console.trace();
        return true;
    }

    const onBeforeUnload = () => {
        if (player.isMasterPlayer() && playing()) {
            player.pause();
        }
    };

    const self = {
        id,
        updatePlayback(update: player.PlaybackUpdate) {
            const updates = orderedEntries(update, [
                'stop',
                'volume',
                'seek',
                'play',
                'tracks',
                'position',
                'playing',
                'quality',
            ]);

            for (const [key, value] of updates) {
                if (typeof value === 'undefined') continue;

                switch (key) {
                    case 'stop':
                        stop();
                        break;
                    case 'volume':
                        sound()?.volume(value);
                        break;
                    case 'seek':
                        seek(value);
                        break;
                    case 'playing':
                        if (value) {
                            if (!howlPlaying && !update.play) {
                                play();
                                howlPlaying = true;
                            }
                        } else if (howlPlaying) {
                            pause();
                            howlPlaying = false;
                        }
                        break;
                    case 'play':
                        if (
                            Object.keys(update).every((k) =>
                                [
                                    'sessionId',
                                    'play',
                                    'playing',
                                    'seek',
                                ].includes(k),
                            ) &&
                            typeof update.seek === 'number' &&
                            sound()
                        ) {
                            if (!howlPlaying) {
                                sound()!.play();
                            }
                            return;
                        }

                        if (sound()) {
                            stop();
                        }
                        play();
                        howlPlaying = true;
                        break;
                    case 'quality':
                    case 'tracks':
                    case 'position':
                    case 'sessionId':
                        break;
                    default:
                        key satisfies never;
                }
            }
        },
        activate() {
            window.addEventListener('beforeunload', onBeforeUnload);
            import.meta.hot?.on('vite:beforeUpdate', onBeforeUnload);
        },
        deactivate() {
            window.removeEventListener('beforeunload', onBeforeUnload);
            import.meta.hot?.dispose(onBeforeUnload);

            if (sound()) {
                console.debug('stopping howl');
                stopHowl();
            }
        },
    };

    return self;
}
