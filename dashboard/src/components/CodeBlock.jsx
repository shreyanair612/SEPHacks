import React from 'react'
import { Copy } from 'lucide-react'

export default function CodeBlock({ code }){
  async function copy(){
    await navigator.clipboard.writeText(code)
  }
  return (
    <div className="relative mt-1">
      <pre className="code-block">{code}</pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md"
        style={{background:'rgba(152,193,217,0.15)', color:'#98C1D9', fontFamily:'"JetBrains Mono", "SF Mono", ui-monospace, monospace'}}
      >
        <Copy className="w-3 h-3" />
        Copy
      </button>
    </div>
  )
}
