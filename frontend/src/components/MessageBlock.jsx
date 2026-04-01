import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const styles = {
  msg: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: '4px',
  },
  userWrap: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 16px',
    background: '#0d1117',
    borderLeft: '2px solid #3b9eff',
  },
  userPrefix: {
    color: '#3b9eff',
    fontWeight: 700,
    flexShrink: 0,
    fontSize: 12,
    marginTop: 2,
  },
  userText: {
    color: '#c8d3e0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  assistantWrap: {
    padding: '10px 16px',
    color: '#c8d3e0',
    borderLeft: '2px solid #161c24',
  },
  toolCallWrap: {
    margin: '6px 16px',
    borderRadius: 6,
    background: '#0d1a0d',
    border: '1px solid #166534',
    overflow: 'hidden',
  },
  toolCallHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    background: '#0a140a',
    borderBottom: '1px solid #166534',
    cursor: 'pointer',
    userSelect: 'none',
  },
  toolIcon: { fontSize: 13 },
  toolName: { color: '#4ade80', fontWeight: 700, fontSize: 12 },
  toolArgs: {
    padding: '8px 12px',
    fontSize: 11,
    color: '#86efac',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  toolResultWrap: {
    margin: '2px 16px 6px',
    borderRadius: 6,
    background: '#0d1117',
    border: '1px solid #1e2733',
    overflow: 'hidden',
  },
  toolResultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 12px',
    background: '#090c10',
    borderBottom: '1px solid #1e2733',
    cursor: 'pointer',
    userSelect: 'none',
  },
  toolResultLabel: { color: '#5a6a7e', fontSize: 11 },
  toolResultBody: {
    padding: '8px 12px',
    fontSize: 11,
    color: '#7a8a9e',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: 300,
    overflowY: 'auto',
  },
  statusLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 16px',
    fontSize: 11,
    color: '#5a6a7e',
  },
  dot: { width: 6, height: 6, borderRadius: '50%' },
  errorWrap: {
    margin: '4px 16px',
    padding: '8px 12px',
    borderRadius: 6,
    background: '#1a0a0a',
    border: '1px solid #7f1d1d',
    color: '#f87171',
    fontSize: 12,
  },
  streamingWrap: {
    padding: '10px 16px',
    color: '#c8d3e0',
    borderLeft: '2px solid #1e2733',
  },
  cursor: {
    display: 'inline-block',
    width: 8,
    height: 14,
    background: '#3b9eff',
    animation: 'blink 1s step-end infinite',
    verticalAlign: 'middle',
    marginLeft: 2,
  },
}

function ToolCall({ tool, args }) {
  const [open, setOpen] = useState(true)
  const argStr = typeof args === 'object'
    ? JSON.stringify(args, null, 2)
    : String(args)

  const icons = {
    read_file: '📖', write_file: '✏️', patch_file: '🔧',
    run_command: '⚡', search_code: '🔍', find_files: '📁',
    list_dir: '📂', delete_file: '🗑️', create_dir: '📁', file_info: 'ℹ️',
  }

  return (
    <div style={styles.toolCallWrap}>
      <div style={styles.toolCallHeader} onClick={() => setOpen(o => !o)}>
        <span style={styles.toolIcon}>{icons[tool] || '🔧'}</span>
        <span style={styles.toolName}>{tool}</span>
        <span style={{ color: '#5a6a7e', fontSize: 11, marginLeft: 'auto' }}>
          {open ? '▾' : '▸'}
        </span>
      </div>
      {open && (
        <pre style={styles.toolArgs}>{argStr}</pre>
      )}
    </div>
  )
}

function ToolResult({ tool, result }) {
  const [open, setOpen] = useState(false)
  const lines = result?.split('\n').length || 0
  return (
    <div style={styles.toolResultWrap}>
      <div style={styles.toolResultHeader} onClick={() => setOpen(o => !o)}>
        <span style={{ color: '#4ade80', fontSize: 11 }}>✓</span>
        <span style={styles.toolResultLabel}>
          {tool} returned {lines} line{lines !== 1 ? 's' : ''}
        </span>
        <span style={{ color: '#5a6a7e', fontSize: 11, marginLeft: 'auto' }}>
          {open ? '▾' : '▸'} {open ? 'hide' : 'show'}
        </span>
      </div>
      {open && (
        <pre style={styles.toolResultBody}>{result}</pre>
      )}
    </div>
  )
}

function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          if (inline) {
            return (
              <code style={{
                background: '#161c24',
                padding: '1px 5px',
                borderRadius: 3,
                color: '#22d3ee',
                fontSize: '0.9em',
              }} {...props}>
                {children}
              </code>
            )
          }
          return (
            <pre style={{
              background: '#0d1117',
              border: '1px solid #1e2733',
              borderRadius: 6,
              padding: '10px 14px',
              margin: '8px 0',
              overflowX: 'auto',
              fontSize: 12,
            }}>
              <code style={{ color: '#c8d3e0' }} {...props}>{children}</code>
            </pre>
          )
        },
        p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
        ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '4px 0' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '4px 0' }}>{children}</ol>,
        li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
        h1: ({ children }) => <h1 style={{ color: '#e8f0f8', fontSize: 16, margin: '8px 0 4px', fontFamily: 'var(--font-ui)' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ color: '#e8f0f8', fontSize: 14, margin: '8px 0 4px', fontFamily: 'var(--font-ui)' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ color: '#a0b0c0', fontSize: 13, margin: '6px 0 3px' }}>{children}</h3>,
        strong: ({ children }) => <strong style={{ color: '#e8f0f8' }}>{children}</strong>,
        em: ({ children }) => <em style={{ color: '#a78bfa' }}>{children}</em>,
        blockquote: ({ children }) => (
          <blockquote style={{
            borderLeft: '3px solid #253040',
            paddingLeft: 12,
            margin: '6px 0',
            color: '#5a6a7e',
          }}>{children}</blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export function MessageBlock({ message }) {
  const { role, content, events } = message

  if (role === 'user') {
    return (
      <div style={styles.userWrap}>
        <span style={styles.userPrefix}>▶ you</span>
        <span style={styles.userText}>{content}</span>
      </div>
    )
  }

  // App.jsx uses role '_streaming'; keep 'streaming' for compatibility
  if (role === 'streaming' || role === '_streaming') {
    return (
      <div>
        {events?.map((ev, i) => {
          if (ev.type === 'tool_call') {
            return <ToolCall key={i} tool={ev.tool} args={ev.args} />
          }
          if (ev.type === 'tool_result') {
            return <ToolResult key={i} tool={ev.tool} result={ev.result} />
          }
          if (ev.type === 'text') {
            return (
              <div key={i} style={styles.assistantWrap}>
                <MarkdownContent content={ev.content} />
              </div>
            )
          }
          return null
        })}
        <div style={styles.streamingWrap}>
          <MarkdownContent content={content || ''} />
          <span style={styles.cursor} />
        </div>
      </div>
    )
  }

  if (role === 'assistant') {
    return (
      <div>
        {events && events.map((ev, i) => {
          if (ev.type === 'tool_call') {
            return <ToolCall key={i} tool={ev.tool} args={ev.args} />
          }
          if (ev.type === 'tool_result') {
            return <ToolResult key={i} tool={ev.tool} result={ev.result} />
          }
          if (ev.type === 'text') {
            return (
              <div key={i} style={styles.assistantWrap}>
                <MarkdownContent content={ev.content} />
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }

  if (role === 'status') {
    const colors = { info: '#3b9eff', success: '#4ade80', warn: '#fbbf24', error: '#f87171' }
    const c = colors[message.variant] || colors.info
    return (
      <div style={styles.statusLine}>
        <span style={{ ...styles.dot, background: c }} />
        <span style={{ color: c }}>{content}</span>
      </div>
    )
  }

  if (role === 'error') {
    return (
      <div style={styles.errorWrap}>
        ✗ {content}
      </div>
    )
  }

  return null
}
