import { useEffect, useRef, useCallback, useState } from 'react'

export function useAgentSocket(sessionId, onEvent) {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`ws://localhost:8000/ws/${sessionId}`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      // ping every 20s to keep alive
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 20000)
      ws._ping = ping
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onEventRef.current(data)
      } catch {}
    }

    ws.onclose = () => {
      setConnected(false)
      clearInterval(ws._ping)
      // Reconnect after 2s
      setTimeout(connect, 2000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [sessionId])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((type, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...payload }))
    }
  }, [])

  const interrupt = useCallback(() => {
    send('interrupt')
  }, [send])

  return { connected, send, interrupt }
}
