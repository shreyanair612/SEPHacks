import React, { useState } from 'react'
import { Copy } from 'lucide-react'

export default function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ position: 'relative' }}>
      <pre style={{
        background: 'var(--bg-deep)',
        color: 'var(--accent-primary)',
        padding: 16,
        borderRadius: 6,
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        overflowX: 'auto',
        border: '1px solid var(--border-default)',
        margin: 0,
      }}>
        {code}
      </pre>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(152, 193, 217, 0.15)',
          color: 'var(--accent-primary)',
          border: 'none',
          borderRadius: 4,
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Copy size={12} />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
