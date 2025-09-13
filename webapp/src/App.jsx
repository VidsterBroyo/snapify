import { useState } from 'react'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (prompt.trim()) {
      console.log('Submitted prompt:', prompt)
      // Handle prompt submission here
      setPrompt('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-neutral-900 to-neutral-800 [background-image:radial-gradient(circle_at_top_left,#1e1e1e,transparent_40%)]">
      <div className="max-w-3xl w-full flex flex-col items-center gap-12">
        <div className="text-center">
          <h1 className="text-7xl font-semibold mb-2 bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#93C5FD] bg-clip-text text-transparent">
            Snapify
          </h1>
          <p className="mt-4 text-2xl text-chat-placeholder font-normal">
            How can I help you today?
          </p>
        </div>
        
        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end bg-chat-input border border-chat-border rounded-3xl p-3 transition-all duration-200 focus-within:border-chat-primary focus-within:shadow-[0_0_0_2px_rgba(16,163,127,0.1)]">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What vibe are you feeling ?"
                className="flex-1 bg-transparent border-none outline-none text-chat-text text-base leading-6 resize-none min-h-32 max-h-48 font-inherit placeholder-chat-placeholder"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <button 
                type="submit" 
                className={`ml-2 w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 ${
                  prompt.trim() 
                    ? 'bg-chat-primary hover:bg-chat-primary-hover cursor-pointer' 
                    : 'bg-chat-border cursor-not-allowed'
                }`}
                disabled={!prompt.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
