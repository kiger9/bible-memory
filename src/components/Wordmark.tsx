import { K_VIEWBOX, K_PATH, K_CAP, K_DESC } from './kGlyph'

/**
 * The Kept wordmark: ribbon mark, a decorative initial K (Cinzel Decorative outline, inline SVG so it
 * matches the favicon exactly), and "ept" in Newsreader. Size with font-size on the parent.
 */
export default function Wordmark({ size, mark = true, className = '' }: { size?: number | string; mark?: boolean; className?: string }) {
  const style = size ? { fontSize: typeof size === 'number' ? `${size}px` : size } : undefined
  return (
    <span className={'wordmark ' + className} style={style} aria-label="Kept">
      {mark && <i className="mark" aria-hidden="true" />}
      <span className="wordmark-text" aria-hidden="true">
        <svg className="wordmark-k" viewBox={K_VIEWBOX} style={{ height: `${(K_CAP + K_DESC) / K_CAP * 0.72}em`, verticalAlign: `${-K_DESC / K_CAP * 0.72}em` }}>
          <path d={K_PATH} fill="currentColor" />
        </svg>ept
      </span>
    </span>
  )
}
