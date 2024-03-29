import { createSignal } from 'solid-js';
import './settings.css';
import { api, apiUrl, clientId, token } from '~/services/api';
import { clientSignal } from '~/services/util';
import { connectionName } from '~/services/ws';

export default function settingsPage() {
    const [$apiUrl, setApiUrl] = clientSignal(apiUrl);
    const [$clientId, setClientId] = clientSignal(clientId);
    const [$token, setToken] = clientSignal(token);
    const [$connectionName, setConnectionName] = clientSignal(connectionName);

    const [status, setStatus] = createSignal<string>();
    const [loading, setLoading] = createSignal(false);

    let clientIdInput: HTMLInputElement;
    let apiUrlInput: HTMLInputElement;

    function saveApiUrl() {
        setApiUrl(apiUrlInput.value);
    }

    let connectionNameInput: HTMLInputElement;

    function saveConnectionName() {
        setConnectionName(connectionNameInput.value);
    }

    function saveClientId() {
        setClientId(clientIdInput.value);
    }

    let tokenInput: HTMLInputElement;

    function saveToken() {
        setToken(tokenInput.value);
    }

    let magicTokenInput: HTMLInputElement;

    async function saveMagicToken() {
        const resp = await api.magicToken(magicTokenInput.value);
        setLoading(false);

        if (resp) {
            clientId.set(resp.clientId);
            token.set(resp.accessToken);
            magicTokenInput.value = '';
            setStatus('Successfully set values');
        } else {
            setStatus('Failed to authenticate with magic token');
        }
    }

    return (
        <div>
            <ul>
                <li>
                    API Url:{' '}
                    <input
                        ref={apiUrlInput!}
                        type="text"
                        value={$apiUrl()}
                        onKeyUp={(e) => e.key === 'Enter' && saveApiUrl()}
                    />
                    <button onClick={saveApiUrl}>save</button>
                </li>
                <li>
                    Name:{' '}
                    <input
                        ref={connectionNameInput!}
                        type="text"
                        value={$connectionName()}
                        onKeyUp={(e) =>
                            e.key === 'Enter' && saveConnectionName()
                        }
                    />
                    <button onClick={saveConnectionName}>save</button>
                </li>
                <li>
                    Client ID:{' '}
                    <input
                        ref={clientIdInput!}
                        type="text"
                        value={$clientId()}
                        onKeyUp={(e) => e.key === 'Enter' && saveClientId()}
                    />
                    <button onClick={saveClientId}>save</button>
                </li>
                <li>
                    Token:{' '}
                    <input
                        ref={tokenInput!}
                        type="text"
                        value={$token()}
                        onKeyUp={(e) => e.key === 'Enter' && saveToken()}
                    />
                    <button onClick={saveToken}>save</button>
                </li>
                <li>
                    Magic Token:{' '}
                    <input
                        ref={magicTokenInput!}
                        type="text"
                        onKeyUp={(e) => e.key === 'Enter' && saveMagicToken()}
                    />
                    <button onClick={saveMagicToken}>save</button>
                </li>
            </ul>
            {status() && status()}
            {loading() && 'loading...'}
        </div>
    );
}
