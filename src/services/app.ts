import { isServer } from 'solid-js/web';
import { Api, api, clientId, token } from './api';
import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { clientAtom } from './util';

export const navigationBarExpanded = clientAtom<boolean>(
    true,
    'navigationBarExpanded',
);
export const showPlaybackSessions = clientAtom(false);
export const showPlaybackQuality = clientAtom(false);

type StartupCallback = () => void | Promise<void>;

declare global {
    interface Window {
        startupCallbacks: StartupCallback[];
    }

    var startupCallbacks: StartupCallback[];
}

if (isServer) global.startupCallbacks = global.startupCallbacks ?? [];
else window.startupCallbacks = window.startupCallbacks ?? [];

const startupCallbacks: StartupCallback[] = isServer
    ? globalThis.startupCallbacks
    : window.startupCallbacks;
let startedUp = false;

export function onStartupFirst(func: StartupCallback) {
    if (startedUp) {
        func();
        return;
    }
    startupCallbacks.unshift(func);
}

export function onStartup(func: StartupCallback) {
    if (startedUp) {
        func();
        return;
    }
    startupCallbacks.push(func);
}

export async function triggerStartup() {
    if (startedUp) return;
    console.trace();
    startedUp = true;

    for (const func of startupCallbacks) {
        try {
            await func();
        } catch (e) {
            console.error(e);
        }
    }
}

interface AppState {
    connections: Api.Connection[];
}

export const [appState, setAppState] = createStore<AppState>({
    connections: [],
});

export const [currentArtistSearch, setCurrentArtistSearch] =
    createSignal<Api.Artist[]>();

export const [currentAlbumSearch, setCurrentAlbumSearch] =
    createSignal<Api.Album[]>();

token.listen(() => {
    api.refetchSignatureToken();
});
clientId.listen(() => {
    api.refetchSignatureToken();
});
onStartup(async () => {
    if (token.get() && clientId.get()) {
        await api.validateSignatureToken();
    }
});
