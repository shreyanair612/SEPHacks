import { useEffect, useRef } from 'react'

export default function usePolling(fn, intervalMs){
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    function tick(){ fnRef.current() }
    tick()
    const handle = setInterval(tick, intervalMs)
    return () => { clearInterval(handle) }
  }, [intervalMs])
}
