const API_URL = "http://127.0.0.1:8000";

export interface ConnectionResponse {
    clientId: string;
    players: string[];
}

export async function connect(): Promise<ConnectionResponse> {
    const response = await fetch(`${API_URL}/connect`, {
        method: "POST",
        credentials: "include",
    });

    return await response.json();
}

export async function stopPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${API_URL}/playback/stop-player?playerId=${playerId}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function startPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${API_URL}/playback/start-player?playerId=${playerId}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function restartPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${API_URL}/playback/restart-player?playerId=${playerId}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function play(playerId: string): Promise<any> {
    const response = await fetch(
        `${API_URL}/playback/play?playerId=${playerId}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function pause(playerId: string): Promise<any> {
    const response = await fetch(
        `${API_URL}/playback/pause?playerId=${playerId}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}
