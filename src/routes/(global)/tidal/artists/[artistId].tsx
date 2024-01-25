import './artist-page.css';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import { A, useParams } from 'solid-start';
import Album from '~/components/Album';
import Artist from '~/components/Artist';
import { Api, api } from '~/services/api';

export default function albumPage() {
    const params = useParams();
    const [artist, setArtist] = createSignal<Api.TidalArtist>();
    const [albums, setAlbums] = createSignal<Api.TidalAlbum[]>();
    const [compilations, setCompilations] = createSignal<Api.TidalAlbum[]>();

    createEffect(async () => {
        if (isServer) return;
        await Promise.all([
            (async () => {
                const artist = await api.getTidalArtist(
                    parseInt(params.artistId),
                );
                setArtist(artist);
                return artist;
            })(),
            api.getAllTidalArtistAlbums(parseInt(params.artistId), setAlbums, [
                'LP',
                'EPS_AND_SINGLES',
            ]),
            api.getAllTidalArtistAlbums(
                parseInt(params.artistId),
                setCompilations,
                ['COMPILATIONS'],
            ),
        ]);
    });

    return (
        <>
            <div class="artist-page-container">
                <div class="artist-page">
                    <div class="artist-page-breadcrumbs">
                        <A
                            class="back-button"
                            href="#"
                            onClick={() => history.back()}
                        >
                            Back
                        </A>
                    </div>
                    <div class="artist-page-header">
                        <div class="artist-page-artist-info">
                            <div class="artist-page-artist-info-cover">
                                <Show when={artist()}>
                                    {(artist) => (
                                        <Artist
                                            artist={artist()}
                                            route={false}
                                            size={400}
                                        />
                                    )}
                                </Show>
                            </div>
                            <div class="artist-page-artist-info-details">
                                <h1 class="artist-page-artist-info-details-artist-title">
                                    {artist()?.title}
                                </h1>
                            </div>
                        </div>
                    </div>
                    <h1 class="artist-page-albums-header">Albums on Tidal</h1>
                    <div class="artist-page-albums">
                        <For each={albums()}>
                            {(album) => (
                                <Album
                                    album={album}
                                    artist={true}
                                    title={true}
                                    controls={true}
                                    versionQualities={true}
                                    size={200}
                                />
                            )}
                        </For>
                    </div>
                    <Show when={(compilations()?.length ?? 0) > 0}>
                        <h1 class="artist-page-albums-header">
                            Compilations on Tidal
                        </h1>
                        <div class="artist-page-albums">
                            <For each={compilations()}>
                                {(album) => (
                                    <Album
                                        album={album}
                                        artist={true}
                                        title={true}
                                        controls={true}
                                        versionQualities={true}
                                        size={200}
                                    />
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
            </div>
        </>
    );
}
