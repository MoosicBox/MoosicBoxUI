import { appState } from '~/services/app';
import { registerPlayer } from '~/services/player';
import {
    InboundMessageType,
    connectionId,
    connectionName,
    onConnect,
    onConnectionNameChanged,
    onMessage,
    registerConnection,
} from '~/services/ws';
import { Api } from '~/services/api';
import { createPlayer as createHowlerPlayer } from '~/services/howler-player';

function updatePlayer() {
    const connection = appState.connections.find(
        (c) => c.connectionId === connectionId(),
    );

    connection?.players
        .filter((player) => player.type === Api.PlayerType.HOWLER)
        .forEach((player) => {
            switch (player.type) {
                case Api.PlayerType.HOWLER:
                    registerPlayer(createHowlerPlayer(player.playerId));
                    break;
            }
        });
}

onMessage((data) => {
    if (data.type === InboundMessageType.CONNECTIONS) {
        updatePlayer();
    }
});

function updateConnection(connectionId: string, name: string) {
    registerConnection({
        connectionId,
        name,
        players: [
            {
                type: Api.PlayerType.HOWLER,
                name: 'Web Player',
            },
        ],
    });
}

onConnect(() => {
    updateConnection(connectionId()!, connectionName());
});
onConnectionNameChanged((name) => {
    updateConnection(connectionId()!, name);
});