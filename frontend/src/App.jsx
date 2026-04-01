import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAgentSocket } from './hooks/useAgentSocket'
import { MessageBlock } from './components/MessageBlock'

const S = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--bg)',
    overflow: 'hidden',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 16px',
    height: 44,
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  logo: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: 15,
    color: '#3b9eff',
    letterSpacing: '0.05em',
  },
  logoSub: {
    fontSize: 10,
    color: 'var(--text-dim)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  sep: { flex: 1 },
  connBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
  },
  connDot: { width: 6, height: 6, borderRadius: '50%' },
  modelBadge: {
    padding: '3px 8px',
    borderRadius: 4,
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    fontSize: 11,
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
  },
  cwdBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 16px',
    background: '#0d1017',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    fontSize: 11,
    color: 'var(--text-dim)',
  },
  cwdInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#4ade80',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 0',
  },
  welcome: {
    padding: '40px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  welcomeLogo: {
    fontSize: 48,
    letterSpacing: '-2px',
    color: '#3b9eff',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
  },
  welcomeSub: {
    color: 'var(--text-dim)',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 1.7,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    maxWidth: 540,
    marginTop: 8,
  },
  chip: {
    padding: '6px 12px',
    background: 'var(--bg3)',
    border: '1px solid var(--border2)',
    borderRadius: 6,
    fontSize: 11,
    color: 'var(--text)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'var(--font-mono)',
  },
  inputArea: {
    flexShrink: 0,
    borderTop: '1px solid var(--border)',
    background: 'var(--bg2)',
    padding: '10px 16px',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 10,
    background: 'var(--bg3)',
    border: '1px solid var(--border2)',
    borderRadius: 8,
    padding: '8px 12px',
    transition: 'border-color 0.15s',
  },
  inputRowFocused: {
    borderColor: '#3b9eff44',
  },
  prompt: {
    color: '#3b9eff',
    fontWeight: 700,
    fontSize: 13,
    paddingBottom: 2,
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    color: 'var(--text-bright)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    lineHeight: 1.6,
    maxHeight: 160,
    minHeight: 22,
  },
  sendBtn: {
    flexShrink: 0,
    padding: '4px 12px',
    background: '#3b9eff',
    border: 'none',
    borderRadius: 5,
    color: '#000',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    transition: 'opacity 0.15s',
  },
  stopBtn: {
    flexShrink: 0,
    padding: '4px 12px',
    background: '#f87171',
    border: 'none',
    borderRadius: 5,
    color: '#000',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
  },
  inputHint: {
    display: 'flex',
    gap: 16,
    padding: '4px 0 0 2px',
    fontSize: 10,
    color: 'var(--text-dim)',
  },
  kbd: {
    padding: '1px 4px',
    background: 'var(--bg)',
    border: '1px solid var(--border2)',
    borderRadius: 3,
    fontSize: 10,
    color: 'var(--text-dim)',
  },
  toolsPanel: {
    width: 220,
    background: 'var(--bg2)',
    borderLeft: '1px solid var(--border)',
    overflowY: 'auto',
    flexShrink: 0,
    padding: '12px 0',
  },
  toolsPanelTitle: {
    padding: '0 12px 8px',
    fontSize: 10,
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    borderBottom: '1px solid var(--border)',
    marginBottom: 8,
  },
  toolItem: {
    padding: '5px 12px',
    fontSize: 11,
    color: 'var(--text-dim)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  mainRow: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  clearBtn: {
    padding: '2px 8px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 4,
    color: 'var(--text-dim)',
    fontSize: 10,
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
  },
}

const TOOL_ICONS = {
  read_file: '📖', write_file: '✏️', patch_file: '🔧',
  run_command: '⚡', search_code: '🔍', find_files: '📁',
  list_dir: '📂', delete_file: '🗑️', create_dir: '📁', file_info: 'ℹ️',
}

const EXAMPLE_PROMPTS = [
  'List all Python files in this project',
  'Read the main entry file and explain what it does',
  'Find all TODO comments in the codebase',
  'Create a new file called hello.py with a hello world function',
  'Run the tests and show me what fails',
  'Search for all usages of "import React"',
  'What is the folder structure of this project?',
  'Refactor the main function to be cleaner',
]

function generateSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function App() {
  const [sessionId] = useState(generateSessionId)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('C:\\Users\\YourName\\projects')
  const [cwdEditing, setCwdEditing] = useState(false)
  const [running, setRunning] = useState(false)
  const [model, setModel] = useState(null)
  const [ollamaOk, setOllamaOk] = useState(null)
  const [tools, setTools] = useState([])
  const [inputFocused, setInputFocused] = useState(false)
  const [showTools, setShowTools] = useState(true)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const streamingRef = useRef({ content: '', events: [] })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Check Ollama & load tools on mount
  useEffect(() => {
    fetch('/api/ollama/status')
      .then(r => r.json())
      .then(d => {
        setOllamaOk(d.running)
        if (d.models?.length) setModel(d.models[0])
      })
      .catch(() => setOllamaOk(false))

    fetch('/api/tools')
      .then(r => r.json())
      .then(d => setTools(d.tools || []))
      .catch(() => {})
  }, [])

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }])
  }, [])

  const updateLastStreaming = useCallback((content, newEvent) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (!last || last.role !== '_streaming') {
        return [...prev, {
          id: 'streaming',
          role: '_streaming',
          content,
          events: newEvent ? [newEvent] : [],
        }]
      }
      const updated = { ...last }
      if (newEvent) {
        updated.events = [...(updated.events || []), newEvent]
      } else {
        updated.content = content
      }
      return [...prev.slice(0, -1), updated]
    })
  }, [])

  const finalizeStreaming = useCallback(() => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (!last || last.role !== '_streaming') return prev
      // Convert streaming block to assistant block
      const textContent = last.content?.trim()
      const events = [...(last.events || [])]
      if (textContent) {
        events.push({ type: 'text', content: textContent })
      }
      if (events.length === 0) return prev.slice(0, -1)
      return [
        ...prev.slice(0, -1),
        { id: last.id, role: 'assistant', events }
      ]
    })
  }, [])

  const handleEvent = useCallback((ev) => {
    switch (ev.type) {
      case 'agent_start':
        setRunning(true)
        streamingRef.current = { content: '', events: [] }
        // Show the typing cursor immediately (tokens append to this block)
        updateLastStreaming('', null)
        break

      case 'model_info':
        setModel(ev.model)
        break

      case 'llm_start':
        // New LLM iteration — if we had streaming content, flush it as a text event
        if (streamingRef.current.content.trim()) {
          updateLastStreaming(null, { type: 'text', content: streamingRef.current.content.trim() })
          streamingRef.current.content = ''
        }
        break

      case 'token':
        streamingRef.current.content += ev.content
        updateLastStreaming(streamingRef.current.content, null)
        scrollToBottom()
        break

      case 'tool_call':
        // Flush any text before tool call
        if (streamingRef.current.content.trim()) {
          updateLastStreaming(null, { type: 'text', content: streamingRef.current.content.trim() })
          streamingRef.current.content = ''
        }
        updateLastStreaming('', { type: 'tool_call', tool: ev.tool, args: ev.args })
        scrollToBottom()
        break

      case 'tool_result':
        updateLastStreaming('', { type: 'tool_result', tool: ev.tool, result: ev.result })
        scrollToBottom()
        break

      case 'agent_done':
      case 'interrupted':
        finalizeStreaming()
        setRunning(false)
        streamingRef.current = { content: '', events: [] }
        scrollToBottom()
        break

      case 'error':
        finalizeStreaming()
        setRunning(false)
        addMessage({ role: 'error', content: ev.message })
        scrollToBottom()
        break

      case 'pong':
        break

      default:
        break
    }
  }, [updateLastStreaming, finalizeStreaming, addMessage, scrollToBottom])

  const { connected, send, interrupt } = useAgentSocket(sessionId, handleEvent)

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || running) return

    addMessage({ role: 'user', content: text })
    setInput('')
    setTimeout(scrollToBottom, 50)

    send('user_message', { content: text, cwd })
  }, [input, running, addMessage, send, cwd, scrollToBottom])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaInput = (e) => {
    setInput(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const handleClear = () => {
    setMessages([])
    streamingRef.current = { content: '', events: [] }
  }

  const handleChip = (text) => {
    setInput(text)
    textareaRef.current?.focus()
  }

  const showWelcome = messages.length === 0

  return (
    <div style={S.root}>
      {/* Top bar */}
      <div style={S.topbar}>
        <div>
          <div style={S.logo}>CLAWD</div>
          <div style={S.logoSub}>Local AI Coding Agent</div>
        </div>
        <div style={S.sep} />
        {model && (
          <div style={S.modelBadge}>
            ◆ {model}
          </div>
        )}
        <div style={{
          ...S.connBadge,
          background: connected ? '#0a1a0a' : '#1a0a0a',
          border: `1px solid ${connected ? '#166534' : '#7f1d1d'}`,
        }}>
          <div style={{
            ...S.connDot,
            background: connected ? '#4ade80' : '#f87171',
          }} />
          <span style={{ color: connected ? '#4ade80' : '#f87171' }}>
            {connected ? 'connected' : 'connecting...'}
          </span>
        </div>
        {!ollamaOk && ollamaOk !== null && (
          <div style={{
            ...S.connBadge,
            background: '#1a0f0a',
            border: '1px solid #92400e',
          }}>
            <span style={{ color: '#fbbf24' }}>⚠ ollama offline</span>
          </div>
        )}
        <button style={S.clearBtn} onClick={handleClear}>clear</button>
        <button
          style={{ ...S.clearBtn, borderColor: showTools ? '#3b9eff44' : 'var(--border)' }}
          onClick={() => setShowTools(s => !s)}
        >
          tools
        </button>
      </div>

      {/* CWD bar */}
      <div style={S.cwdBar}>
        <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>cwd:</span>
        {cwdEditing ? (
          <input
            style={S.cwdInput}
            value={cwd}
            onChange={e => setCwd(e.target.value)}
            onBlur={() => setCwdEditing(false)}
            onKeyDown={e => e.key === 'Enter' && setCwdEditing(false)}
            autoFocus
          />
        ) : (
          <span
            style={{ color: '#4ade80', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}
            onClick={() => setCwdEditing(true)}
            title="Click to change working directory"
          >
            {cwd}
          </span>
        )}
        <span style={{ color: 'var(--text-dim)', fontSize: 10, marginLeft: 4 }}>(click to edit)</span>
      </div>

      {/* Main area */}
      <div style={S.mainRow}>
        <div style={S.main}>
          {/* Messages */}
          <div style={S.messages}>
            {showWelcome ? (
              <div style={S.welcome}>
                <div style={S.welcomeLogo}>CLAWD</div>
                <div style={S.welcomeSub}>
                  Your local AI coding agent. Powered by Ollama running on your machine.
                  Reads, writes, searches and executes — all inside your codebase.
                  <br /><br />
                  Set your project directory above, then tell me what to build.
                </div>
                {ollamaOk === false && (
                  <div style={{
                    padding: '10px 16px',
                    background: '#1a0f0a',
                    border: '1px solid #92400e',
                    borderRadius: 8,
                    color: '#fbbf24',
                    fontSize: 11,
                    maxWidth: 480,
                    lineHeight: 1.8,
                  }}>
                    ⚠ Ollama not detected. To start:<br />
                    1. Install from <strong>ollama.com</strong><br />
                    2. Run: <code style={{ color: '#4ade80' }}>ollama serve</code><br />
                    3. Pull a model: <code style={{ color: '#4ade80' }}>ollama pull qwen2.5-coder:7b</code>
                  </div>
                )}
                <div style={S.chips}>
                  {EXAMPLE_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      style={S.chip}
                      onClick={() => handleChip(p)}
                      onMouseEnter={e => {
                        e.target.style.borderColor = '#3b9eff44'
                        e.target.style.color = 'var(--text-bright)'
                      }}
                      onMouseLeave={e => {
                        e.target.style.borderColor = 'var(--border2)'
                        e.target.style.color = 'var(--text)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBlock key={msg.id} message={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={S.inputArea}>
            <div style={{
              ...S.inputRow,
              ...(inputFocused ? S.inputRowFocused : {}),
            }}>
              <span style={S.prompt}>▶</span>
              <textarea
                ref={textareaRef}
                style={S.textarea}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={running ? 'Agent is working...' : 'Ask CLAWD to read, write, search, or run anything...'}
                disabled={running}
                rows={1}
              />
              {running ? (
                <button style={S.stopBtn} onClick={interrupt}>■ stop</button>
              ) : (
                <button
                  style={{ ...S.sendBtn, opacity: (!input.trim() || !connected) ? 0.4 : 1 }}
                  onClick={handleSend}
                  disabled={!input.trim() || !connected}
                >
                  send ↵
                </button>
              )}
            </div>
            <div style={S.inputHint}>
              <span><kbd style={S.kbd}>Enter</kbd> send</span>
              <span><kbd style={S.kbd}>Shift+Enter</kbd> newline</span>
              <span><kbd style={S.kbd}>■ stop</kbd> interrupt agent</span>
            </div>
          </div>
        </div>

        {/* Tools panel */}
        {showTools && (
          <div style={S.toolsPanel}>
            <div style={S.toolsPanelTitle}>Tools ({tools.length})</div>
            {tools.map(t => (
              <div key={t.name} style={S.toolItem}>
                <span>{TOOL_ICONS[t.name] || '🔧'}</span>
                <span>{t.name}</span>
              </div>
            ))}
            {tools.length === 0 && (
              <div style={{ padding: '0 12px', fontSize: 11, color: 'var(--text-dim)' }}>
                Loading tools...
              </div>
            )}
            <div style={{
              marginTop: 16,
              padding: '12px',
              borderTop: '1px solid var(--border)',
              fontSize: 10,
              color: 'var(--text-dim)',
              lineHeight: 1.8,
            }}>
              <div style={{ color: 'var(--text)', marginBottom: 4 }}>Recommended models:</div>
              <div>qwen2.5-coder:7b</div>
              <div>deepseek-coder-v2:16b</div>
              <div>codellama:13b</div>
              <div>llama3:8b</div>
              <div style={{ marginTop: 8, color: '#4ade80' }}>
                All run locally on your CPU
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        textarea::placeholder { color: #3a4a5e; }
        textarea:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
