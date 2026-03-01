import { useState, useEffect, useRef } from 'react'

export default function useCountUp(target, duration = 800) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(null)

  useEffect(() => {
    const num = typeof target === 'number' ? target : parseInt(target, 10)
    if (isNaN(num)) { setDisplay(target); return }
    if (num === prev.current) return
    prev.current = num

    if (num === 0) { setDisplay(0); return }

    const start = performance.now()
    let raf
    function tick(now) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(eased * num))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return display
}
