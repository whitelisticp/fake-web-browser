"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Command, Maximize2, X, ExternalLink, MousePointerClick, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// there are better ways to store this, but i am not going to fix it, nor am i going to elaborate
interface TabCache {
  id: number;
  isLoaded: boolean;
  lastAccessed: number;
}

interface MinimizedTab {
  id: number;
  title: string;
  description: string;
  url: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  timestamp?: number;
  cache?: TabCache;
}

interface ProjectCardProps {
  title: string;
  description: string;
  url: string;
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
  onMinimize: (iframeRef: React.RefObject<HTMLIFrameElement>) => void;
  onFullClose: () => void;
  index: number;
  id: number;
  minimizedTabs: MinimizedTab[];
  onTabClick: (tab: MinimizedTab) => void;
  onTabClose: (id: number) => void;
  isActiveTab: boolean;
}

interface SiteData {
  id: number;
  title: string;
  description: string;
  url: string;
}

// this sucks
const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#030303]">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

// minimizes tabs, but does not handle the stuff inside minimized tabs on its own
const MinimizedTabs = ({ 
  tabs, 
  onRestore 
}: { 
  tabs: MinimizedTab[];
  onRestore: (tab: MinimizedTab) => void;
}) => {
  const sortedTabs = useMemo(() => 
    [...tabs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
    [tabs]
  );

  return (
    <div className="fixed bottom-14 left-0 right-0 bg-[#030303]/95 backdrop-blur-sm border-t border-purple-900/20 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-10 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <div className="flex flex-nowrap gap-2 px-2">
            {sortedTabs.map((tab) => (
              <div
                key={`minimized-${tab.id}`}
                onClick={() => onRestore(tab)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A0A0A] border border-purple-900/20 
                         hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300 group
                         animate-slideUp whitespace-nowrap cursor-pointer"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500/70 group-hover:bg-purple-400 transition-colors" />
                <span className="text-sm text-purple-300/70 group-hover:text-purple-300 transition-colors">
                  {tab.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// doesn't handle minimizing, handles the tabs only because this shit was annoying as fuck in one spot
const BrowserTabs = ({ 
  activeTab, 
  tabs, 
  currentSite,
  onTabClick, 
  onTabClose 
}: { 
  activeTab: number | null;
  tabs: MinimizedTab[];
  currentSite: SiteData | null;
  onTabClick: (tab: MinimizedTab) => void;
  onTabClose: (id: number) => void;
}) => {
  const allTabs = useMemo(() => {
    // Return just tabs if no current site or if site is already in tabs
    if (!currentSite || tabs.some(tab => tab.id === currentSite.id)) {
      return tabs;
    }

    // I removed what I thought was a crucial piece of code here by accident but absolutely nothing happened
    return tabs;
  }, [tabs, currentSite]);

  return (
    <div className="flex-1 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-1 min-w-max px-1">
        {allTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const uniqueKey = `browser-tab-${tab.id}-${isActive ? 'active' : 'inactive'}`;
          
          return (
            <div
              key={uniqueKey}
              className={cn(
                "flex items-center gap-2 px-2 py-1 min-w-[100px] max-w-[160px] h-7 border-r border-l border-t rounded-t-md border-purple-900/20",
                "hover:bg-purple-500/5 transition-all duration-300 group relative",
                isActive ? "bg-[#0A0A0A] border-purple-500/20" : "bg-[#030303]"
              )}
            >
              <div 
                className="flex-1 flex items-center gap-2 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTabClick(tab);
                }}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500/70" />
                <span className="text-xs text-purple-300/70 truncate flex-1 text-left">
                  {tab.title}
                </span>
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="flex-shrink-0 p-0.5 hover:bg-purple-500/10 rounded cursor-pointer"
              >
                <X className="h-3 w-3 text-purple-300/50 hover:text-purple-300 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
const ProjectCard = ({ 
  title, 
  description, 
  url, 
  expanded, 
  onExpand, 
  onClose, 
  onMinimize,
  onFullClose,
  index,
  id,
  minimizedTabs,
  onTabClick,
  onTabClose,
  isActiveTab
}: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cacheRef = useRef<TabCache[]>([]);

  // load management with cache
  useEffect(() => {
    if (expanded || (isHovered && !isLoaded)) {
      const cachedTab = cacheRef.current.find(t => t.id === id);
      if (cachedTab) {
        setIsLoaded(true);
        setIsLoading(false);
        cachedTab.lastAccessed = Date.now();
      } else {
        setIsLoading(true);
        setIsLoaded(true);
        cacheRef.current.push({
          id,
          isLoaded: true,
          lastAccessed: Date.now()
        });

        // Limit cache size (keep last 5 accessed tabs, i tried 8 and my phone felt like it was going to explode)
        if (cacheRef.current.length > 5) {
          cacheRef.current.sort((a, b) => b.lastAccessed - a.lastAccessed);
          cacheRef.current = cacheRef.current.slice(0, 5);
        }
      }
    }
  }, [expanded, isHovered, id]);

  // cleanup cache
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      cacheRef.current = cacheRef.current.filter(
        tab => now - tab.lastAccessed < 300000 // 5 minutes
      );
    };

    const interval = setInterval(cleanup, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // load handler (for iframe)
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    const cachedTab = cacheRef.current.find(t => t.id === id);
    if (cachedTab) {
      cachedTab.lastAccessed = Date.now();
    }
  }, [id]);

  const getExternalUrl = (proxyUrl: string) => {
    if (proxyUrl.startsWith('/api/proxy/')) {
      const site = proxyUrl.split('/api/proxy/')[1];
      const siteUrls: Record<string, string> = {
        'icpswap': 'https://app.icpswap.com/swap',
        'kongswap': 'https://kongswap.io/?viewtab=swap&pool=ICP_ckUSDT'
      };
      return siteUrls[site] || proxyUrl;
    }
    return proxyUrl;
  };

  // window close handler because this shit refused to work properly for a day
  const handleWindowClose = useCallback(() => {
    if (minimizedTabs.length > 0) {
      const otherTabs = minimizedTabs.filter(tab => tab.id !== id);
      if (otherTabs.length > 0) {
        const mostRecentTab = otherTabs.reduce((prev, current) => 
          (current.timestamp || 0) > (prev.timestamp || 0) ? current : prev
        );
        // First switch to the next tab
        onTabClick(mostRecentTab);
        // Then close the current tab
        onTabClose(id);
      } else {
        // If this is the last tab, close it and go home
        onTabClose(id);
        onFullClose();
      }
    } else {
      // If no tabs at all, just close
      onClose();
      onFullClose();
    }
  }, [minimizedTabs, id, onTabClick, onTabClose, onClose, onFullClose]);

  // grab current site data with cache info
  const currentSite = useMemo(() => ({
    id,
    title,
    description,
    url,
    cache: cacheRef.current.find(t => t.id === id)
  }), [id, title, description, url]);

  // guess iframe visibility
  const isVisible = expanded || (isHovered && isLoaded);

  return expanded ? (
    <Dialog 
      open={expanded} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleWindowClose();
        }
      }}
    >
      <DialogContent 
        className="max-w-[100vw] w-[100vw] h-[100vh] p-0 bg-[#030303] border-0 rounded-none animate-dialogSlideIn"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-8 bg-[#030303] border-b border-purple-900/20">
            <BrowserTabs
              activeTab={id}
              tabs={minimizedTabs}
              currentSite={currentSite}
              onTabClick={onTabClick}
              onTabClose={onTabClose}
            />
            <div className="flex-shrink-0 flex items-center gap-1 px-2 bg-[#030303]">
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
                onClick={() => onMinimize(iframeRef)}
                className="text-purple-50/70 hover:text-purple-400 hover:bg-purple-500/10 h-6 w-6"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleWindowClose}
                className="text-purple-50/70 hover:text-purple-400 hover:bg-purple-500/10 h-6 w-6"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <main className="flex-1 bg-[#030303] relative">
            {isLoading && <LoadingSpinner />}
            <iframe 
              ref={iframeRef}
              src={url} 
              className={cn(
                "absolute inset-0 w-full h-full border-0",
                !isVisible && "hidden",
                isLoading && "opacity-0"
              )}
              allow="fullscreen"
              onLoad={handleIframeLoad}
              title={title}
            />
          </main>
        </div>
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
                <>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#030303] z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  )}
                  <iframe
                    ref={iframeRef}
                    src={url}
                    className={cn(
                      "absolute top-0 left-0 w-full h-full border-0 pointer-events-none scale-100 group-hover:scale-[1.02] transition-transform duration-700",
                      !isVisible && "hidden",
                      isLoading && "opacity-0"
                    )}
                    scrolling="no"
                    onLoad={handleIframeLoad}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-900/20 to-[#030303]">
                  <MousePointerClick className="h-8 w-8 text-purple-400/100 mb-3 animate-pulse" />
                  <span className="text-sm text-purple-400/100 font-medium">Hover to preview</span>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [minimizedTabs, setMinimizedTabs] = useState<MinimizedTab[]>([]);
  const [expandedSite, setExpandedSite] = useState<number | null>(null);
  const tabCacheRef = useRef<Map<number, TabCache>>(new Map());

  // add more sites here
  const sites = useMemo(() => [
    {
      id: 1,
      title: "Uniswap",
      description: "The biggest dex on the Ethereum network.",
      url: "https://app.uniswap.org"
    },
    {
      id: 2,
      title: "Jupiter",
      description: "The biggest aggregator on the Solana network.",
      url: "https://jup.ag"
    },
    {
      id: 3,
      title: "PancakeSwap",
      description: "The biggest dex on the Binance network.",
      url: "https://pancakeswap.finance"
    },
    {
      id: 4,
      title: "SushiSwap",
      description: "A multi-chain aggregator designed for the best rates.",
      url: "https://www.sushi.com/ethereum/swap"
    },
    {
      id: 5,
      title: "Aerodrome",
      description: "The biggest dex on the Base network.",
      url: "https://aerodrome.finance/"
    },
    {
      id: 6,
      title: "launch.bob.fun",
      description: "A pump.fun alternative on the Internet Computer.",
      url: "https://launch.bob.fun"
    },
    {
      id: 7,
      title: "ICPEx",
      description: "A memecoin dex on the Internet Computer.",
      url: "https://icpex.org/exchange"
    },
    {
      id: 8,
      title: "ICLight.io",
      description: "An orderbook dex on the Internet Computer.",
      url: "https://iclight.io/ICDex/ckBTC/ICP"
    },
    {
      id: 9,
      title: "Bitfinity Bridge",
      description: "Bridge ICP to Bitfinity and trade on multi-chain.",
      url: "https://bitfinity.omnity.network/icp"
    },
    {
      id: 10,
      title: "Bioniq",
      description: "The largest NFT marketplace on the Internet Computer.",
      url: "https://bioniq.io/home/24-hours"
    },
  ], []);

  // Tab persistence
  useEffect(() => {
    try {
      const savedTabs = localStorage.getItem('shellOS-tabs');
      const savedExpandedSite = localStorage.getItem('shellOS-expandedSite');
      
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        setMinimizedTabs(parsedTabs.map((tab: any) => ({
          ...tab,
          iframeRef: React.createRef(),
          cache: tabCacheRef.current.get(tab.id)
        })));
      }
      
      if (savedExpandedSite) {
        setExpandedSite(Number(savedExpandedSite));
      }
    } catch (error) {
      console.error('Error restoring tabs:', error);
    }
  }, []);

  // Save state
  useEffect(() => {
    try {
      const tabsToSave = minimizedTabs.map(({ id, title, url, description, timestamp }) => 
        ({ id, title, url, description, timestamp })
      );
      localStorage.setItem('shellOS-tabs', JSON.stringify(tabsToSave));
      
      if (expandedSite) {
        localStorage.setItem('shellOS-expandedSite', expandedSite.toString());
      } else {
        localStorage.removeItem('shellOS-expandedSite');
      }
    } catch (error) {
      console.error('Error saving tabs:', error);
    }
  }, [minimizedTabs, expandedSite]);

  const handleMinimize = useCallback((site: SiteData, iframeRef: React.RefObject<HTMLIFrameElement>) => {
    setMinimizedTabs(prev => {
      const existingTabIndex = prev.findIndex(tab => tab.id === site.id);
      const timestamp = Date.now();
      
      if (existingTabIndex !== -1) {
        const updatedTabs = [...prev];
        updatedTabs[existingTabIndex] = {
          ...updatedTabs[existingTabIndex],
          iframeRef,
          timestamp,
          cache: {
            id: site.id,
            isLoaded: true,
            lastAccessed: timestamp
          }
        };
        return updatedTabs;
      }
      
      const newTab: MinimizedTab = {
        id: site.id,
        title: site.title,
        url: site.url,
        description: site.description,
        iframeRef,
        timestamp,
        cache: {
          id: site.id,
          isLoaded: true,
          lastAccessed: timestamp
        }
      };
      
      return [...prev, newTab];
    });
    setExpandedSite(null);
  }, []);

  const handleRestore = useCallback((tab: MinimizedTab) => {
    const timestamp = Date.now();
  setMinimizedTabs(prev => prev.map(t => 
    t.id === tab.id 
      ? { 
          ...t, 
          timestamp,
          cache: {
            id: t.id,  // this took a straight hour to fix btw
            isLoaded: true,
            lastAccessed: timestamp
          }
        } 
      : t
  ));
  setExpandedSite(tab.id);
}, []);

const handleExpand = useCallback((siteId: number) => {
  const existingTab = minimizedTabs.find(tab => tab.id === siteId);
  const targetSite = sites.find(site => site.id === siteId);

  if (existingTab) {
    handleRestore(existingTab);
  } else if (targetSite) {
    // initialize the tab first, then expand it
    const newTab: MinimizedTab = {
      id: targetSite.id,
      title: targetSite.title,
      url: targetSite.url,
      description: targetSite.description,
      iframeRef: { current: null },
      timestamp: Date.now(),
      cache: {
        id: targetSite.id,
        isLoaded: true,
        lastAccessed: Date.now()
      }
    };
    
    setMinimizedTabs(prev => [...prev, newTab]);
    setExpandedSite(siteId);
  }
}, [minimizedTabs, sites, handleRestore]);

  const handleFullClose = useCallback(() => {
    setExpandedSite(null);
  }, []);

  const handleTabClose = useCallback((id: number) => {
    setMinimizedTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      
      if (id === expandedSite) {
        if (newTabs.length > 0) {
          const mostRecentTab = newTabs.reduce((prev, current) => 
            (current.timestamp || 0) > (prev.timestamp || 0) ? current : prev
          );
          setExpandedSite(mostRecentTab.id);
        } else {
          setExpandedSite(null);
        }
      }
      
      return newTabs;
    });
    
    // cache clean up 2
    tabCacheRef.current.delete(id);
  }, [expandedSite]);

  // filtered sites
  const filteredSites = useMemo(() => 
    sites.filter(site => 
      site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [sites, searchQuery]
  );

  // search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

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
                <h1 className="text-xl font-semibold text-white">ShellOS</h1>
                <p className="text-xs text-white/50">by MCS</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search apps..."
                  className="h-8 w-64 bg-[#0A0A0A] border border-purple-900/20 rounded-lg px-3 text-sm text-white/70 
                           placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-0
                           hover:border-purple-500/30 transition-colors"
                  aria-label="Search applications"
                />
              </div>
              <a
                href="https://github.com/MattiasICP/ShellOS"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center border border-purple-900/20 rounded-lg
                          text-white/70 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30 
                          transition-all duration-300"
                aria-label="View source on GitHub"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-4 w-4"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {filteredSites.map((site: SiteData, index: number) => (
              <ProjectCard
                key={`site-${site.id}`}
                {...site}
                id={site.id}
                index={index}
                expanded={expandedSite === site.id}
                onExpand={() => handleExpand(site.id)}
                onClose={() => setExpandedSite(null)}
                onMinimize={(iframeRef) => handleMinimize(site, iframeRef)}
                onFullClose={handleFullClose}
                minimizedTabs={minimizedTabs}
                onTabClick={handleRestore}
                onTabClose={handleTabClose}
                isActiveTab={expandedSite === site.id}
              />
            ))}
          </div>
        </div>

        {minimizedTabs.length > 0 && (
          <MinimizedTabs 
            tabs={minimizedTabs} 
            onRestore={handleRestore}
          />
        )}
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;