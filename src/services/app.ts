import { isServer } from 'solid-js/web';
import { Api, api, connection } from './api';
import { createSignal } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { clientAtom } from './util';
import {
    currentAudioZoneId,
    setCurrentAudioZoneId,
    setPlayerState,
} from './player';

export const navigationBarExpanded = clientAtom<boolean>(
    true,
    'navigationBarExpanded',
);
export const showAudioZones = clientAtom(false);
export const showPlaybackSessions = clientAtom(false);
export const showPlaybackQuality = clientAtom(false);

type StartupCallback = () => void | Promise<void>;

declare global {
    interface Window {
        startupCallbacks: StartupCallback[];
        startedUp: boolean;
    }

    var startupCallbacks: StartupCallback[];
    // eslint-disable-next-line no-var
    var startedUp: boolean;
}

if (isServer) global.startupCallbacks = global.startupCallbacks ?? [];
else window.startupCallbacks = window.startupCallbacks ?? [];

function getStartupCallbacks(): StartupCallback[] {
    if (isServer) {
        const x = globalThis.startupCallbacks;
        if (!x) globalThis.startupCallbacks = [];
        return globalThis.startupCallbacks;
    } else {
        const x = window.startupCallbacks;
        if (!x) window.startupCallbacks = [];
        return window.startupCallbacks;
    }
}

if (isServer) global.startedUp = global.startedUp ?? false;
else window.startedUp = window.startedUp ?? false;

function isStartedUp(): boolean {
    return (isServer ? globalThis.startedUp : window.startedUp) === true;
}

function setStartedUp(value: boolean) {
    if (isServer) {
        globalThis.startedUp = value;
    } else {
        window.startedUp = value;
    }
}

export function onStartupFirst(func: StartupCallback) {
    if (isStartedUp()) {
        func();
        return;
    }
    getStartupCallbacks().unshift(func);
}

export async function onStartup(func: StartupCallback) {
    if (isStartedUp()) {
        try {
            await func();
        } catch (e) {
            console.error('Startup error:', e);
        }
        return;
    }
    getStartupCallbacks().push(func);
}

export async function triggerStartup() {
    if (isStartedUp()) return;
    setStartedUp(true);

    for (const func of getStartupCallbacks()) {
        try {
            await func();
        } catch (e) {
            console.error('Startup error:', e);
        }
    }
}

interface AppState {
    connections: Api.Connection[];
}

export const [appState, setAppState] = createStore<AppState>({
    connections: [],
});

export const [currentArtistSearch, setCurrentArtistSearch] = createSignal<{
    query: string;
    results: Api.LibraryArtist[];
}>();

export const [currentAlbumSearch, setCurrentAlbumSearch] = createSignal<{
    query: string;
    results: Api.LibraryAlbum[];
}>();

connection.listen((con, prev) => {
    if (!con) return;
    if (con.token !== prev?.token || con.clientId !== prev?.clientId) {
        api.refetchSignatureToken();
    }
});
onStartup(async () => {
    const con = connection.get();

    if (con && con.token && con.clientId) {
        try {
            await api.validateSignatureToken();
        } catch (e) {
            console.debug('Failed to validateSignatureToken:', e);
        }
    }
});
onStartup(async () => {
    const zones = await api.getAudioZones();

    setPlayerState(
        produce((state) => {
            state.audioZones = zones.items;

            const current = currentAudioZoneId();

            if (typeof current === 'number') {
                const existing = state.audioZones.find((x) => x.id === current);

                if (existing) {
                    state.currentAudioZone = existing;
                }
            }

            if (!state.currentAudioZone) {
                state.currentAudioZone = state.audioZones[0];
                if (state.currentAudioZone) {
                    setCurrentAudioZoneId(state.currentAudioZone.id);
                }
            }
        }),
    );
});
