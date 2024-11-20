"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Command, Maximize2, X, ExternalLink, MousePointerClick } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  title: string;
  description: string;
  url: string;
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
  index: number;
}

interface SiteData {
  id: number;
  title: string;
  description: string;
  url: string;
}

const ProjectCard = ({ 
  title, 
  description, 
  url, 
  expanded, 
  onExpand, 
  onClose, 
  index 
}: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isHovered && !isLoaded) {
      setIsLoaded(true);
    }
  }, [isHovered, isLoaded]);

  useEffect(() => {
    if (!expanded && !isHovered && isLoaded) {
      setIsLoaded(false);
    }
  }, [expanded, isHovered]);
  
  const getExternalUrl = (proxyUrl: string) => {
    console.log('Input URL:', proxyUrl);
    if (proxyUrl.startsWith('/api/proxy/')) {
      const site = proxyUrl.split('/api/proxy/')[1];
      console.log('Site extracted:', site);
      const siteUrls: Record<string, string> = {
        'icpswap': 'https://icpswap.com',
        'kongswap': 'https://kongswap.io'
      };
      const result = siteUrls[site] || proxyUrl;
      console.log('Mapped URL:', result);
      return result;
    }
    return proxyUrl;
  };

  return expanded ? (
    <Dialog open={expanded} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[100vw] w-[100vw] h-[100vh] p-0 bg-[#030303] border-0 rounded-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <header className="relative flex justify-between items-center h-8 px-3 border-b border-purple-900/20 bg-[#030303]">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            <h2 className="text-sm font-medium text-purple-50/90">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(getExternalUrl(url), '_blank')}
              className="text-purple-50/70 hover:text-purple-400 hover:bg-purple-500/10 h-6 w-6"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-purple-50/70 hover:text-purple-400 hover:bg-purple-500/10 h-6 w-6"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>
        <main className="w-full h-[calc(100vh-2rem)] bg-[#030303]">
          <iframe 
            ref={iframeRef}
            src={url} 
            className="w-full h-full border-0" 
            allow="fullscreen"
          />
        </main>
      </DialogContent>
    </Dialog>
  ) : (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className={cn(
        "absolute inset-0 rounded-xl bg-purple-500/5 opacity-0 blur-2xl transition-opacity duration-500",
        isHovered && "opacity-100"
      )} />
      
      <Card className="relative bg-[#030303] border border-purple-900/20 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 group-hover:translate-y-[-2px]">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <header className="relative p-4 flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500/70" />
              <h3 className="text-base font-medium text-purple-50/90 group-hover:text-purple-50 transition-colors duration-300">
                {title}
              </h3>
            </div>
            <p className="text-sm text-purple-50/50 group-hover:text-purple-50/70 transition-colors duration-300 max-w-[90%] leading-relaxed">
              {description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            className="text-purple-50/40 hover:text-purple-400 hover:bg-purple-500/10 h-8 w-8"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </header>

        <div className="relative px-4 pb-4">
          <div 
            className="relative rounded-lg overflow-hidden bg-[#030303] border border-purple-900/20 group-hover:border-purple-500/20 cursor-pointer"
            onClick={isLoaded ? onExpand : undefined}
          >
            <div 
              className="relative w-full overflow-hidden"
              style={{ paddingBottom: '60%' }}
            >
              {isLoaded ? (
                <iframe
                  ref={iframeRef}
                  src={url}
                  className="absolute top-0 left-0 w-full h-full border-0 pointer-events-none scale-100 group-hover:scale-[1.02] transition-transform duration-700"
                  scrolling="no"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-900/20 to-[#030303]">
                  <MousePointerClick className="h-8 w-8 text-purple-400/80 mb-3 animate-pulse" />
                  <span className="text-sm text-purple-400/80 font-medium">Hover to load preview</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/80 to-transparent z-10" />
            </div>
            <div className="absolute bottom-3 left-3 z-20">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#030303] border border-purple-500/20 text-purple-300">
                {isLoaded ? 'Click to expand' : 'Live Preview'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Footer = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-[#030303]/95 backdrop-blur-sm border-t border-purple-900/20 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-14 flex items-center justify-center">
        <a 
          href="https://mcs.wtf" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-purple-300/70 hover:text-purple-300 transition-colors duration-300 flex items-center gap-2 text-sm font-medium"
        >
          Team MCS 2024
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  </div>
);



const Dashboard = () => {
  const [expandedSite, setExpandedSite] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    document.title = "Kelp Router";
  }, []);

  const sites: SiteData[] = [
    {
      id: 1,
      title: "MCSM",
      description: "Mint immutable MCSC-1 tokens.",
      url: "https://lutxv-aqaaa-aaaap-ab2xa-cai.icp0.io/"
    },
    {
      id: 2,
      title: "Launch.Bob.Fun",
      description: "A token launchpad part of the bob.fun ecosystem.",
      url: "https://launch.bob.fun"
    },
    {
      id: 3,
      title: "KongSwap (Coming Soon)",
      description: "The fastest dex on the Internet Computer.",
      url: "/api/proxy/kongswap"
    },
    {
      id: 4,
      title: "ICPSwap (Coming Soon)",
      description: "The biggest dex on the Internet Computer.",
      url: "/api/proxy/icpswap"
    },
    {
      id: 5,
      title: "ICPEx",
      description: "A memecoin dex on the Internet Computer.",
      url: "https://icpex.org/exchange"
    },
    {
      id: 6,
      title: "ICLight.io",
      description: "An orderbook dex on the Internet Computer.",
      url: "https://iclight.io/ICDex/ckBTC/ICP"
    },
    {
      id: 7,
      title: "Uniswap",
      description: "The biggest dex on ETH, now on the Internet Computer.",
      url: "https://app.uniswap.org"
    },
    {
      id: 8,
      title: "Jupiter",
      description: "The biggest dex on SOL, now on the Internet Computer.",
      url: "https://jup.ag"
    },
    {
      id: 9,
      title: "PancakeSwap",
      description: "The biggest dex on BNB, now on the Internet Computer.",
      url: "https://pancakeswap.finance"
    },
  ];

  
  const filteredSites = sites.filter(site => 
    site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#000000] relative">
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f05_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f05_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/[0.02] via-transparent to-purple-900/[0.02]" />
      </div>

      <div className="relative min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <header className="flex justify-between items-center h-14">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#0A0A0A] border border-purple-900/20 flex items-center justify-center group">
                <Command className="h-4 w-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">KelpOS</h1>
                <p className="text-xs text-white/50">by MCS</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dapps..."
                  className="h-8 w-64 bg-[#0A0A0A] border border-purple-900/20 rounded-lg px-3 text-sm text-white/70 
                           placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-0
                           hover:border-purple-500/30 transition-colors"
                />
              </div>
              <a
                href="https://github.com/MattiasICP/Kelp-Router"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center border border-purple-900/20 rounded-lg
                          text-white/70 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30 
                          transition-all duration-300"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {filteredSites.map((site, index) => (
              <ProjectCard
                key={site.id}
                {...site}
                index={index}
                expanded={expandedSite === site.id}
                onExpand={() => setExpandedSite(site.id)}
                onClose={() => setExpandedSite(null)}
              />
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;