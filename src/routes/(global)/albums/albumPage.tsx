import {
    createComputed,
    createSignal,
    For,
    onCleanup,
    onMount,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { useParams } from 'solid-start';
import { A } from '@solidjs/router';
import Album from '~/components/Album';
import { toTime } from '~/services/formatting';
import { currentTrack, playAlbum, playPlaylist } from '~/services/player';
import { Api, api } from '~/services/api';

export default function albumPage() {
    const params = useParams();
    const [album, setAlbum] = createSignal<Api.Album>();
    const [tracks, setTracks] = createSignal<Api.Track[]>();

    (async () => {
        if (isServer) return;
        setAlbum(await api.getAlbum(parseInt(params.albumId)));
        setTracks(await api.getAlbumTracks(parseInt(params.albumId)));
    })();

    async function playAlbumFrom(track: Api.Track) {
        const playlist = tracks()!.slice(tracks()!.indexOf(track));

        await playPlaylist(playlist);
    }

    function albumDuration(): number {
        let duration = 0;

        tracks()!.forEach((track) => (duration += track.duration));

        return duration;
    }

    const [showingArtwork, setShowingArtwork] = createSignal(false);
    const [blurringArtwork, setBlurringArtwork] = createSignal<boolean>();

    createComputed(() => {
        setBlurringArtwork(album()?.blur);
    });

    function toggleBlurringArtwork() {
        setBlurringArtwork(!blurringArtwork());
    }

    function showArtwork(): void {
        setShowingArtwork(true);
        window.addEventListener('click', handleClick);
    }

    function hideArtwork(): void {
        setShowingArtwork(false);
        window.removeEventListener('click', handleClick);
    }

    let albumArtworkPreviewerIcon: HTMLImageElement | undefined;

    const handleClick = (event: MouseEvent) => {
        if (!albumArtworkPreviewerIcon?.contains(event.target as Node)) {
            hideArtwork();
        }
    };

    onMount(() => {
        if (isServer) return;
    });

    onCleanup(() => {
        if (isServer) return;
        window.removeEventListener('click', handleClick);
    });

    function albumArtworkPreviewer() {
        return (
            <div class="album-page-artwork-previewer">
                <div class="album-page-artwork-previewer-content">
                    <img
                        ref={albumArtworkPreviewerIcon}
                        src={api.getAlbumArtwork(album())}
                        style={{
                            filter: blurringArtwork()
                                ? `blur(${window.innerHeight / 30}px)`
                                : undefined,
                            cursor: album()?.blur ? 'pointer' : 'initial',
                        }}
                        onClick={() => album()?.blur && toggleBlurringArtwork()}
                    />
                    {blurringArtwork() && (
                        <div class="album-page-artwork-previewer-content-blur-notice">
                            Click to unblur
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <A href="#" onClick={() => history.back()}>
                Back
            </A>
            <div class="album-page-container">
                <div class="album-page">
                    <div class="album-page-header">
                        <div class="album-page-album-info">
                            <div class="album-page-album-info-artwork">
                                {album() && (
                                    <Album
                                        album={album()!}
                                        artist={false}
                                        title={false}
                                        size={300}
                                        route={false}
                                        onClick={showArtwork}
                                    />
                                )}
                            </div>
                            <div class="album-page-album-info-details">
                                <div class="album-page-album-info-details-album-title">
                                    {album()?.title}
                                </div>
                                <div class="album-page-album-info-details-album-artist">
                                    {album()?.artist}
                                </div>
                                <div class="album-page-album-info-details-tracks">
                                    {tracks() && (
                                        <>
                                            {tracks()?.length} tracks (
                                            {toTime(
                                                Math.round(albumDuration()),
                                            )}
                                            )
                                        </>
                                    )}
                                </div>
                                <div class="album-page-album-info-details-release-date">
                                    {album()?.dateReleased}
                                </div>
                            </div>
                        </div>
                        <div class="album-page-album-controls">
                            <div class="album-page-album-controls-playback">
                                <button
                                    class="album-page-album-controls-playback-play-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        playAlbum(album()!);
                                        return false;
                                    }}
                                >
                                    <img
                                        src="/img/play-button.svg"
                                        alt="Play"
                                    />{' '}
                                    Play
                                </button>
                            </div>
                            <div class="album-page-album-controls-options"></div>
                        </div>
                    </div>
                    <table class="album-page-tracks">
                        <thead>
                            <tr>
                                <th class="album-page-tracks-track-no-header">
                                    #
                                </th>
                                <th>Title</th>
                                <th>Artist</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tracks() && (
                                <For each={tracks()}>
                                    {(track) => (
                                        <tr
                                            class={`album-page-tracks-track${
                                                currentTrack()?.trackId ===
                                                track.trackId
                                                    ? ' playing'
                                                    : ''
                                            }`}
                                        >
                                            <td
                                                class="album-page-tracks-track-no"
                                                onClick={() =>
                                                    playAlbumFrom(track)
                                                }
                                            >
                                                <div class="album-page-tracks-track-no-container">
                                                    {currentTrack()?.trackId ===
                                                    track.trackId ? (
                                                        <img
                                                            class="audio-icon"
                                                            src="/img/audio-white.svg"
                                                            alt="Playing"
                                                        />
                                                    ) : (
                                                        <span class="track-no-text">
                                                            {track.number}
                                                        </span>
                                                    )}
                                                    <img
                                                        class="play-button"
                                                        src="/img/play-button-white.svg"
                                                        alt="Play"
                                                    />
                                                </div>
                                            </td>
                                            <td class="album-page-tracks-track-title">
                                                {track.title}
                                            </td>
                                            <td class="album-page-tracks-track-artist">
                                                {track.artist}
                                            </td>
                                            <td class="album-page-tracks-track-time">
                                                {toTime(
                                                    Math.round(track.duration),
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {showingArtwork() && albumArtworkPreviewer()}
        </>
    );
}