import type { JSX } from 'preact'

export type IconName =
  | 'home'
  | 'tv'
  | 'film'
  | 'series'
  | 'star'
  | 'search'
  | 'settings'
  | 'heart'
  | 'expand'
  | 'play'
  | 'pause'
  | 'close'

const paths: Record<IconName, JSX.Element> = {
  home: <path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10" />,
  tv: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M9 20h6M12 16v4" />
    </>
  ),
  film: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 5v14M16 5v14M4 10h16M4 14h16" />
    </>
  ),
  series: (
    <>
      <rect x="5" y="6" width="13" height="10" rx="2" />
      <path d="M8 3h11a2 2 0 0 1 2 2v8" />
      <path d="M9 19h6" />
    </>
  ),
  star: (
    <path d="m12 4 2.3 4.8 5.2.7-3.8 3.7.9 5.2L12 16l-4.6 2.4.9-5.2-3.8-3.7 5.2-.7L12 4Z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </>
  ),
  settings: (
    <>
      <path d="M5 7h14M5 12h14M5 17h14" />
      <path d="M9 5v4M15 10v4M11 15v4" />
    </>
  ),
  heart: (
    <path d="M20.5 8.7c0 4.8-8.5 9.8-8.5 9.8S3.5 13.5 3.5 8.7A4.5 4.5 0 0 1 12 6.6a4.5 4.5 0 0 1 8.5 2.1Z" />
  ),
  expand: (
    <>
      <path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4" />
      <path d="M4 4l6 6M20 4l-6 6M20 20l-6-6M4 20l6-6" />
    </>
  ),
  play: <path d="M9 6v12l10-6-10-6Z" />,
  pause: (
    <>
      <path d="M9 6v12" />
      <path d="M15 6v12" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
}

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block' }}
    >
      {paths[name]}
    </svg>
  )
}
