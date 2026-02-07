import MenuAnalyzer from './components/MenuAnalyzer';

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="pt-16 pb-10 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#fb7185] flex items-center justify-center shadow-lg shadow-orange-500/25">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold mb-5 tracking-tight">
            <span className="gradient-text">Menu Analyzer</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-[#a39e93] max-w-2xl mx-auto leading-relaxed">
            Upload a restaurant menu and receive{' '}
            <span className="text-[#f5f0e8] font-medium">AI-powered recommendations</span>{' '}
            perfectly tailored to your health goals
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {['Smart OCR', 'Nutritional Analysis', 'Goal-Based Recommendations'].map((feature, i) => (
              <span 
                key={feature}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-[#a39e93]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 pb-20">
        <MenuAnalyzer />
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f97316] to-[#fb7185] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#a39e93]">Menu Analyzer</span>
          </div>
          
          <p className="text-sm text-[#a39e93]/60">
            Powered by AI • Built with ❤️ by AR
          </p>
        </div>
      </footer>
    </div>
  );
}
