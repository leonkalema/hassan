interface HeroProps {
  t: (key: string) => string;
}

export default function Hero({ t }: HeroProps) {
  return (
    <section className="relative h-screen overflow-hidden">
      {/* Hero Image */}
      <div className="absolute inset-0">
        <img 
          src="https://cdn.midjourney.com/7ad5007a-da50-4aee-9dfb-5346dfb74737/0_0.png" 
          alt="Beautiful travel destination"
          className="w-full h-full object-cover scale-105"
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
      
      {/* Hero Content - Positioned at bottom left */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-8 md:p-12">
        <div className="max-w-2xl">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight drop-shadow-lg">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed font-light drop-shadow-md max-w-xl">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="group bg-white text-gray-900 px-8 py-3 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
                <span className="group-hover:text-rose-600 transition-colors">
                  {t('home.hero.cta')}
                </span>
              </button>
              <button className="border-2 border-white/80 text-white px-8 py-3 rounded-full font-medium hover:bg-white hover:text-gray-900 transition-all duration-300 backdrop-blur-sm">
                {t('home.hero.learnMore')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
