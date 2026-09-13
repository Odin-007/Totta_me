import { useState } from 'react'

/**
 * <img> that swaps to a gradient placeholder (instead of the browser's
 * broken-image icon) when the src is missing or fails to load - e.g. a
 * signed photo URL that expired.
 */
export default function SafeImage({ src, alt, className, placeholderClassName }) {
  const [failed, setFailed] = useState(false)
  const [trackedSrc, setTrackedSrc] = useState(src)

  if (src !== trackedSrc) {
    setTrackedSrc(src)
    setFailed(false)
  }

  if (!src || failed) {
    return (
      <div
        className={
          placeholderClassName ||
          `${className} flex items-center justify-center bg-gradient-to-br from-pink-100 via-cream to-earthy-100`
        }
      >
        <span className="line-clamp-2 px-2 text-center text-xs font-semibold text-pink-700">
          {alt}
        </span>
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}
