import React from 'react'
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  'Real-time Drift Detection',
  'GxP Compliance Engine',
  'AI-powered Analysis',
]

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-app)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'welcomeFadeIn 600ms cubic-bezier(0.23, 1, 0.32, 1) forwards',
      }}>
        {/* Shield icon */}
        <svg width="48" height="48" viewBox="0 0 16 16" fill="none" style={{ marginBottom: 20 }}>
          <path d="M8 1L2 4v4c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4L8 1z" fill="#98C1D9" />
        </svg>

        {/* Title */}
        <h1 style={{
          fontSize: 36,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.03em',
          margin: 0,
        }}>
          Velira
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: 16,
          fontWeight: 300,
          color: 'var(--text-muted)',
          margin: '8px 0 0 0',
          letterSpacing: '-0.01em',
        }}>
          Infrastructure compliance, continuously verified
        </p>

        {/* Feature pills */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginTop: 28,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {FEATURES.map(f => (
            <span
              key={f}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                background: 'rgba(83, 58, 123, 0.4)',
                border: '1px solid var(--border-default)',
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Enter button */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginTop: 36,
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 600,
            color: '#FFFFFF',
            background: 'var(--accent-secondary)',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '-0.01em',
            transition: 'var(--transition-smooth)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#533A7B'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-glow)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--accent-secondary)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Enter Dashboard &rarr;
        </button>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 32,
        fontSize: 12,
        fontWeight: 300,
        color: 'var(--text-muted)',
        letterSpacing: '0.01em',
      }}>
        Monitoring gxp-prod-eastus &middot; 173 policies tracked
      </div>
    </div>
  )
}
