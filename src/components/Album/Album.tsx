import './album.css';
import { Album, Api, Track, api } from '~/services/api';
import { addAlbumToQueue, playAlbum } from '~/services/player';
import { createComputed, createSignal } from 'solid-js';
import { A } from 'solid-start';
import { displayAlbumVersionQualities } from '~/services/formatting';
import { artistRoute } from '../Artist/Artist';

function albumControls(album: Album | Track) {
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
    album: Album | Track,
    showArtist = true,
    showTitle = true,
    showYear = true,
    showVersionQualities = true,
    route = true,
) {
    return (
        <div class="album-details">
            {showTitle && (
                <div class="album-title">
                    {route ? (
                        <A href={albumRoute(album)} class="album-title-text">
                            {album.title}
                        </A>
                    ) : (
                        <span class="album-title-text">{album.title}</span>
                    )}
                </div>
            )}
            {showArtist && (
                <div class="album-artist">
                    <A href={artistRoute(album)} class="album-artist-text">
                        {album.artist}
                    </A>
                </div>
            )}
            {showYear && 'dateReleased' in album && (
                <div class="album-year">
                    <span class="album-year-text">
                        {album.dateReleased?.substring(0, 4)}
                    </span>
                </div>
            )}
            {'versions' in album && showVersionQualities && (
                <div class="album-version-qualities">
                    <span class="album-version-qualities-text">
                        {album.versions.length > 0 &&
                            displayAlbumVersionQualities(album.versions)}
                    </span>
                </div>
            )}
        </div>
    );
}

export function albumRoute(album: Album | Track): string {
    const albumType = album.type;

    switch (albumType) {
        case 'LIBRARY':
            if ('number' in album) {
                return `/albums/${(album as Api.Track).albumId}`;
            } else {
                return `/albums/${(album as Api.Album).albumId}`;
            }
        case 'TIDAL':
            if ('number' in album) {
                return `/tidal/albums/${(album as Api.TidalTrack).albumId}`;
            } else {
                return `/tidal/albums/${(album as Api.TidalAlbum).id}`;
            }
        default:
            albumType satisfies never;
            throw new Error(`Invalid albumType: ${albumType}`);
    }
}

function albumImage(props: AlbumProps, blur: boolean) {
    return (
        <img
            class="album-icon"
            style={{
                width: `${props.size}px`,
                height: `${props.size}px`,
                'image-rendering': blur ? 'pixelated' : undefined,
                cursor: props.onClick ? `pointer` : undefined,
            }}
            src={api.getAlbumArtwork(
                props.album,
                blur ? 16 : props.imageRequestSize,
                blur ? 16 : props.imageRequestSize,
            )}
            alt={`${props.album.title} by ${props.album.artist}`}
            title={`${props.album.title} by ${props.album.artist}`}
            loading="lazy"
            onClick={props.onClick}
        />
    );
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type AlbumProps = {
    album: Album | Track;
    controls?: boolean;
    size: number;
    imageRequestSize: number;
    artist: boolean;
    year: boolean;
    title: boolean;
    versionQualities: boolean;
    blur: boolean;
    route: boolean;
    onClick?: (e: MouseEvent) => void;
};

export default function album(
    props: PartialBy<
        AlbumProps,
        | 'size'
        | 'imageRequestSize'
        | 'artist'
        | 'title'
        | 'blur'
        | 'route'
        | 'year'
        | 'versionQualities'
    >,
) {
    props.size = props.size ?? 200;
    props.imageRequestSize =
        props.imageRequestSize ?? Math.round(Math.max(200, props.size) * 1.33);
    props.artist = props.artist ?? false;
    props.title = props.title ?? false;
    props.route = props.route ?? true;
    props.versionQualities = props.versionQualities ?? false;

    const [blur, setBlur] = createSignal(false);

    createComputed(() => {
        setBlur(
            typeof props.blur === 'boolean'
                ? props.blur
                : 'blur' in props.album && props.album.blur,
        );
    });

    return (
        <div class="album">
            <div
                class="album-icon-container"
                style={{ width: `${props.size}px`, height: `${props.size}px` }}
            >
                {props.route ? (
                    <A href={albumRoute(props.album)}>
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
                albumDetails(
                    props.album,
                    props.artist,
                    props.title,
                    props.year,
                    props.versionQualities,
                    props.route,
                )}
        </div>
    );
}
