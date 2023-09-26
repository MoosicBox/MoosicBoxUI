import { A } from '@solidjs/router';
import './album.css';
import * as api from '~/services/api';
import { addAlbumToQueue, playAlbum } from '~/services/player';
import { createComputed, createSignal } from 'solid-js';

function albumControls(album: api.Album | api.Track) {
    return (
        <div class="album-controls">
            <button
                class="media-button play-button button"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    playAlbum(album);
                    return false;
                }}
            >
                <img src="/img/play-button.svg" alt="Play" />
            </button>
            <button
                class="media-button options-button button"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    addAlbumToQueue(album);
                    return false;
                }}
            >
                <img src="/img/more-options.svg" alt="Play" />
            </button>
        </div>
    );
}

function albumDetails(
    album: api.Album | api.Track,
    showArtist = true,
    showTitle = true,
) {
    return (
        <div class="album-details">
            {showTitle && (
                <div class="album-title">
                    <span class="album-title-text">{album.title}</span>
                </div>
            )}
            {showArtist && (
                <div class="album-artist">
                    <span class="album-artist-text">{album.artist}</span>
                </div>
            )}
        </div>
    );
}

function albumImage(props: AlbumProps, blur: boolean) {
    return (
        <img
            class="album-icon"
            style={{
                width: `${props.size}px`,
                height: `${props.size}px`,
                filter: blur ? `blur(${props.size / 20}px)` : undefined,
                cursor: props.onClick ? `pointer` : undefined,
            }}
            src={api.getAlbumArtwork(props.album)}
            alt={`${props.album.title} by ${props.album.artist}`}
            loading="lazy"
            onClick={props.onClick}
        />
    );
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type AlbumProps = {
    album: api.Album | api.Track;
    controls?: boolean;
    size: number;
    artist: boolean;
    title: boolean;
    blur: boolean;
    route: boolean;
    onClick?: (e: MouseEvent) => void;
};

export default function album(
    props: PartialBy<
        AlbumProps,
        'size' | 'artist' | 'title' | 'blur' | 'route'
    >,
) {
    props.size = props.size ?? 200;
    props.artist = props.artist ?? false;
    props.title = props.title ?? false;
    props.route = props.route ?? true;

    const [blur, setBlur] = createSignal(false);

    createComputed(() => {
        setBlur(
            typeof props.blur === 'boolean' ? props.blur : props.album.blur,
        );
    });

    return (
        <div class="album">
            <div
                class="album-icon-container"
                style={{ width: `${props.size}px`, height: `${props.size}px` }}
            >
                {props.route ? (
                    <A href={`/albums/${props.album.albumId}`}>
                        {albumImage(props as AlbumProps, blur())}
                        {props.controls && albumControls(props.album)}
                    </A>
                ) : (
                    <>
                        {albumImage(props as AlbumProps, blur())}
                        {props.controls && albumControls(props.album)}
                    </>
                )}
            </div>
            {(props.artist || props.title) &&
                albumDetails(props.album, props.artist, props.title)}
        </div>
    );
}