import { onMount } from 'solid-js';
import { Outlet } from 'solid-start';
import { initConnection } from '~/services/api';
import Player from '~/components/Player';
import './(home)/home.css';

export default function Home() {
    onMount(initConnection);
    return (
        <div id="root" class="dark">
            <main>
                <header>
                    <h1>MoosicBox</h1>
                </header>
                <Outlet />
            </main>
            <footer>
                <div class="footer-player-container">
                    <div class="footer-player">
                        <Player />
                    </div>
                </div>
            </footer>
        </div>
    );
}
