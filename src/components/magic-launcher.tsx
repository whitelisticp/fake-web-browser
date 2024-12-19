"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Command, Maximize2, X, ExternalLink, MousePointerClick, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-[#000000] flex items-center justify-center z-50 animate-fadeOut">
      <div className="relative">
        <div className="w-16 h-16 relative animate-scaleUp">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-purple-500/40 rounded-xl blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-xl bg-[#0A0A0A] border border-purple-900/20 flex items-center justify-center">
            <Command className="h-6 w-6 text-purple-400 animate-pulse" />
          </div>
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-sm text-purple-300/70 animate-pulse">
            Loading DamonicOS
          </p>
        </div>
      </div>
    </div>
  );
};
const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#030303]">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

const MinimizedTabs = ({ tabs, onRestore }: { tabs: MinimizedTab[]; onRestore: (tab: MinimizedTab) => void; }) => {
  const sortedTabs = useMemo(() => 
    [...tabs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
    [tabs]
  );

  useEffect(() => {
    if (tabs.length > 0) {
      const tabsContainer = document.querySelector('.minimized-tabs-container');
      const preventDefault = (e: Event) => {
        e.preventDefault();
      };

      tabsContainer?.addEventListener('touchmove', preventDefault, { passive: false });
      return () => {
        tabsContainer?.removeEventListener('touchmove', preventDefault);
      };
    }
  }, [tabs.length]);

  return (
    <div className="fixed bottom-14 left-0 right-0 bg-[#030303]/95 backdrop-blur-sm border-t border-purple-900/20 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-10 flex items-center gap-2 overflow-x-auto scrollbar-hide minimized-tabs-container">
          <div className="flex flex-nowrap gap-2 px-2">
            {sortedTabs.map((tab) => (
              <div
                key={`minimized-${tab.id}`}
                onClick={() => onRestore(tab)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A0A0A] border border-purple-900/20 
                         hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300 group
                         animate-slideIn whitespace-nowrap cursor-pointer"
                style={{ animationDelay: '100ms' }}
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
    if (!currentSite || tabs.some(tab => tab.id === currentSite.id)) {
      return tabs;
    }
    return tabs;
  }, [tabs, currentSite]);

  useEffect(() => {
    const tabsContainer = document.querySelector('.browser-tabs-container');
    const preventDefault = (e: TouchEvent) => {
      e.preventDefault();
    };

    tabsContainer?.addEventListener('touchmove', preventDefault as EventListener, { passive: false });
    return () => {
      tabsContainer?.removeEventListener('touchmove', preventDefault as EventListener);
    };
  }, []);

  return (
    <div className="flex-1 overflow-x-auto scrollbar-hide browser-tabs-container">
      <div className="flex items-center gap-1 min-w-max px-1 bg-[#030303]">
        {allTabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const uniqueKey = `browser-tab-${tab.id}-${isActive ? 'active' : 'inactive'}`;
          
          return (
            <div
              key={uniqueKey}
              className={cn(
                "flex items-center gap-2 px-2 py-1 min-w-[100px] max-w-[160px] h-7 border-r border-l border-t rounded-t-md border-purple-900/20",
                "hover:bg-purple-500/5 transition-all duration-300 group relative select-none",
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
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;

    if (expanded || (isHovered && !isLoaded)) {
      setIsLoading(true);
      setIsLoaded(true);
    }
  }, [expanded, isHovered, isLoaded]);

  const handleIframeLoad = useCallback(() => {
    if (!mountedRef.current) return;
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (expanded) {
      const preventDefault = (e: Event) => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        
        const touchY = (e as TouchEvent).touches[0].clientY;
        const isAtTop = iframe.scrollTop <= 0;
        const isAtBottom = iframe.scrollTop + iframe.clientHeight >= iframe.scrollHeight;
        
        if ((isAtTop && touchY > 0) || (isAtBottom && touchY < 0)) {
          e.preventDefault();
        }
      };

      document.body.style.overscrollBehavior = 'none';
      document.addEventListener('touchmove', preventDefault, { passive: false });
      
      return () => {
        document.body.style.overscrollBehavior = 'auto';
        document.removeEventListener('touchmove', preventDefault);
      };
    }
  }, [expanded]);

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

  const handleWindowClose = useCallback(() => {
    if (minimizedTabs.length > 0) {
      const otherTabs = minimizedTabs.filter(tab => tab.id !== id);
      if (otherTabs.length > 0) {
        const mostRecentTab = otherTabs.reduce((prev, current) => 
          (current.timestamp || 0) > (prev.timestamp || 0) ? current : prev
        );
        onTabClick(mostRecentTab);
        onTabClose(id);
      } else {
        onTabClose(id);
        onFullClose();
      }
    } else {
      onClose();
      onFullClose();
    }
  }, [minimizedTabs, id, onTabClick, onTabClose, onClose, onFullClose]);

  const currentSite = useMemo(() => ({
    id,
    title,
    description,
    url
  }), [id, title, description, url]);

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
        className={cn(
          "max-w-[100vw] w-[100vw] h-[100dvh] p-0 bg-[#030303] border-0 rounded-none",
          "transform transition-all duration-300",
          "data-[state=open]:animate-dialogSlideIn",
          "data-[state=closed]:animate-dialogSlideOut"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex flex-col h-full">
          <div className="sticky top-0 flex items-center justify-between h-8 bg-[#030303] border-b border-purple-900/20 z-50">
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
            <div className="absolute inset-0 bg-[#030303] z-0" />
            {isLoading && <LoadingSpinner />}
            {isVisible && (
              <iframe 
                ref={iframeRef}
                src={url} 
                className={cn(
                  "absolute inset-0 w-full h-full border-0 z-10",
                  isLoading && "opacity-0"
                )}
                allow="fullscreen"
                onLoad={handleIframeLoad}
                title={title}
                style={{
                  WebkitOverflowScrolling: 'touch'
                }}
              />
            )}
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
          href="https://damonicwelleams.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-purple-300/70 hover:text-purple-300 transition-colors duration-300 flex items-center gap-2 text-sm font-medium"
        >
          Team Damonic
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
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const preventReload = (e: BeforeUnloadEvent) => {
      if (minimizedTabs.length > 0 || expandedSite !== null) {
        e.preventDefault();
        return (e.returnValue = '');
      }
    };

    window.addEventListener('beforeunload', preventReload);
    
    return () => {
      window.removeEventListener('beforeunload', preventReload);
    };
  }, [minimizedTabs.length, expandedSite]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      try {
        const savedTabs = localStorage.getItem('damonicOS-tabs');
        const savedExpandedSite = localStorage.getItem('damonicOS-expandedSite');
        
        if (savedTabs) {
          const parsedTabs = JSON.parse(savedTabs);
          const hydratedTabs = parsedTabs.map((tab: any) => ({
            ...tab,
            iframeRef: React.createRef(),
            timestamp: Date.now()
          }));
          setMinimizedTabs(hydratedTabs);
        }
        
        if (savedExpandedSite) {
          setExpandedSite(Number(savedExpandedSite));
        }
      } catch (error) {
        console.error('Error restoring tabs:', error);
      }
    }
  }, []);

  useEffect(() => {
    const saveState = () => {
      try {
        const tabsToSave = minimizedTabs.map(({ id, title, url, description, timestamp }) => 
          ({ id, title, url, description, timestamp })
        );
        localStorage.setItem('damonicOS-tabs', JSON.stringify(tabsToSave));
        
        if (expandedSite) {
          localStorage.setItem('damonicOS-expandedSite', expandedSite.toString());
        } else {
          localStorage.removeItem('damonicOS-expandedSite');
        }
      } catch (error) {
        console.error('Error saving tabs:', error);
      }
    };

    const timeoutId = setTimeout(saveState, 1000);
    return () => clearTimeout(timeoutId);
  }, [minimizedTabs, expandedSite]);

  const sites = useMemo(() => [
    {
      id: 1,
      title: "Uniswap",
      description: "The biggest dex on the Ethereum network.",
      url: "https://app.uniswap.org/swap?chain=mainnet&inputCurrency=NATIVE"
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
              id: t.id,
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
  }, [expandedSite]);

  const filteredSites = useMemo(() => 
    sites.filter(site => 
      site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [sites, searchQuery]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className={cn(
        "min-h-screen bg-[#000000] relative pb-14",
        isLoading ? 'opacity-0' : 'animate-scaleIn'
      )}>
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f05_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f05_1px,transparent_1px)] bg-[size:14px_24px]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/[0.02] via-transparent to-purple-900/[0.02]" />
        </div>

        <div className="relative min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:h-14 gap-4 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#0A0A0A] border border-purple-900/20 flex items-center justify-center group">
                  {/* <Command className="h-4 w-4 text-purple-400 group-hover:text-purple-300 transition-colors" /> */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 331.37 427.26" className="w-full h-full"><defs><style>.cls-1 {
        fill: #dbcd6a;
      }
  
      .cls-2 {
        fill: #f3cc2b;
      }
  
      .cls-3 {
        fill: #fcfbf1;
      }
  
      .cls-4 {
        fill: #fbf7c3;
      }
  
      .cls-5 {
        fill: #fbc912;
      }
  
      .cls-6 {
        fill: #f8f8f8;
      }
  
      .cls-7 {
        fill: #fbfbfb;
      }
  
      .cls-8 {
        fill: #e5cb4a;
      }
  
      .cls-9 {
        fill: #040404;
      }
  
      .cls-10 {
        fill: #fcf7bb;
      }
  
      .cls-11 {
        fill: #545454;
      }
  
      .cls-12 {
        fill: #fcfadf;
      }
  
      .cls-13 {
        fill: #dcd588;
      }
  
      .cls-14 {
        fill: #f1f1f1;
      }
  
      .cls-15 {
        fill: #e1cd5a;
      }
  
      .cls-16 {
        fill: #070707;
      }
  
      .cls-17 {
        fill: #f7f7f7;
      }
  
      .cls-18 {
        fill: #030303;
      }
  
      .cls-19 {
        fill: #fcf9ce;
      }
  
      .cls-20 {
        fill: #fbe5ca;
      }
  
      .cls-21 {
        fill: #ebc945;
      }
  
      .cls-22 {
        fill: #060606;
      }
  
      .cls-23 {
        fill: #f9f9f9;
      }
  
      .cls-24 {
        fill: #fcfcfc;
      }
  
      .cls-25 {
        fill: #707070;
      }
  
      .cls-26 {
        fill: #fcfae6;
      }
  
      .cls-27 {
        fill: #f4f4f4;
      }
  
      .cls-28 {
        fill: #dbce74;
      }
  
      .cls-29 {
        fill: #9e9e9e;
      }
  
      .cls-30 {
        fill: #fbf6a9;
      }
  
      .cls-31 {
        fill: #fefefe;
      }
  
      .cls-32 {
        fill: #ca1b0c;
      }
  
      .cls-33 {
        fill: #0a0a0a;
      }
  
      .cls-34 {
        fill: #050505;
      }
  
      .cls-35 {
        fill: #0c0c0c;
      }
  
      .cls-36 {
        fill: #c13536;
      }
  
      .cls-37 {
        fill: #757575;
      }
  
      .cls-38 {
        fill: #676767;
      }
  
      .cls-39 {
        fill: #fafafa;
      }
  
      .cls-40 {
        fill: #ffce1b;
      }
  
      .cls-41 {
        fill: #fce5ce;
      }
  
      .cls-42 {
        fill: #ffe4cf;
      }
  
      .cls-43 {
        fill: #0b0b0b;
      }
  
      .cls-44 {
        fill: #f5f5f5;
      }
  
      .cls-45 {
        fill: #080808;
      }
    </style></defs><g id="DAMONIC"><g id="FACE"><path id="FACESKIN" class="cls-42" d="M38.29,64.71c1.81-8.19,10.8-12.21,18.5-15.52,19.4-8.33,37.45-19.77,53.27-33.75,5.49-4.86,10.96-10.16,17.93-12.45,18.13-3.77,37.21,2.02,55.57,2.64,4.18.06,7.63,1.77,10.6,4.56,9.46,4.94,20.62,5.65,30.47,9.69,13.03,4.02,21.08,14.14,26.46,26,9.52,10.26,18.33,20.93,24.09,33.93,6.88,13.29,13.77,26.57,20.65,39.86,5.16,9.97,5.02,24.14,6,35.32,1.02,11.62,2.73,19.32,3.07,30.98.33,11.55,33.41,6.11,24.35,23.09s1.7,19.98.02,35.02c-.53,30.32-25.93,27.22-35.58,51.84-7.84,16.15-13.51,33.35-16.8,50.99-1.31,7.01-2.36,14.37-6.49,20.17-5.01,5.27-8.65,11.15-10.9,18.08-4.46,8.98-15.57,15.9-13.76,25.77-24.62-1.03-26.47,15.98-39.93,16.33-33.5-.98-71.64-16.63-98.64-36.34-23.22-2.29-27.55-23.5-43.59-37.17,4.35-14.7-5.05-28.21-13.24-39.53-5.88-11.04-3.09-24.43-3.37-36.93.05-15.99-14.8-4.42-22.51-22.87-2.77-5.73-4.25-12.01-7.12-17.69-5.63-11.11-16.67-20.39-16.64-32.85,7.84-1.67,15.93-2.18,23.92-1.52,4.86-23.36-10.41-46.83-11.24-70.67-1.04-14.35,11.58-57.15,25.34-62.94-1.28-.85-.77-2.54-.44-4.03Z"></path><path id="HAIR" class="cls-40" d="M315.25,198.12c.1,4.97-3.16,19.86-8.24,20.66-4-.69-3.87-7.09-9.49-7.44-8.56-3.07-4.44-17.87-10.91-23.79-3.65-3.63-1.98-9.03-3.9-13.42-3.18-9.16-5.09-18.41-4.77-28.25,1.98-10.23-5.84-20.12-1.99-29.58,1.71-6.16,1.54-15.05-5.91-17.32-9.24-6.29-19.08-11.16-27.8-18.44-10.66-7.59-20.07-16.83-31.92-22.55-7.13-10.56-22.13-13.35-32.5-6.15-6.43,4.87-13.5,6.04-21.59,4.84-10.05-1.49-20.21-.99-30.3,1.01-7.8.94-8.18,9.2-12.62,13.94-5.65,5.54-12.45,9.11-19.97,11.54-9.61,3.78-17.07,11.33-26.17,16.22-6.91,5.29-16.75,13.68-18.28,22.81-.04.83-.85,2.07-1.58,2.33-4.41,2.03-4.1,8.4-6.27,12.34-4.63,15.05,4.7,28.89,9.56,42.61,2.2,6.95-9.28,3.38-5.76,13.04,1.99,7.68-.35,10.97-8.21,11.43-3.9.23-7.83,2.23-11.71-.11,1.33-9.61-4.28-19.23-5.78-28.79.15-2.75,1.2-5.44-.15-8.11l.09.15c-8.6-26.01-5.51-57.04,6.99-81.24l-.09.11c1.38-1.49,1.91-3.49,3.08-5.11l-.08.1c1.03-1.37,2.24-2.6,3.09-4.1l-.08.11c6.18-6.04,1.12-7.34,7.12-11.12l-.12.08c.94-.45,1.63-1.14,2.08-2.08l-.08.11c.42-.32.79-.69,1.11-1.11l-.12.1c4.46-8.85,14.87-11.95,22.12-18.1l-.1.12c.41-.33.78-.7,1.11-1.12l-.11.12c.41-.33.78-.7,1.11-1.12l-.11.07c3.69-2.4,8.48-.49,12.12-3.08l-.12.07c1.95-1.48,4.11-2.65,6.1-4.08l-.1.08c.94-.45,1.63-1.14,2.08-2.08l-.08.11c1.22-1.82,3.04-3.15,4.07-5.11l-.07.1c2.29-3.34,6.31-4.45,9.13-7.1l-.12.08c.87-.89,2.33-.03,3.14-1.08l-.14.07c3.25-2.75,7.67-3.73,10.61-6.96,3.43-2.53,4.88-6.85,8.91-8.82,2.7-2.91,6.77-.04,9.63-2.29l-.14.07c1.54-1.19,3.64.29,5.15-1.07l-.14.07c4.68-1.38,9.68.7,14.18-1.92.55.57,1.44.4,2.01.92l-.14-.08c12.72,7.03,27.79.62,40.15,8.08l-.11-.08c6.65,3.51,13.41,6.69,21.11,7.06l-.11-.05c1.96.92,4.21.98,6.12,2.07l-.1-.07c7.22,3.71,13.78,8.56,21.11,12.07l-.07-.06c1.31,2.43,4.77,1.65,6.08,4.07l-.12-.08c5.6,3.27,3.09,7.19,7.11,11.12l-.1-.11c.31.42.68.79,1.1,1.1l-.11-.1c5.32,3.27,6.22,9.76,10.2,14,6.52,8.59,9.93,19.52,16.92,28.12l-.08-.1c7.22,9.55,10,21.47,15.09,32.11l-.09-.1c.9,1.61.17,3.9,2.1,5.09l-.08-.09c3.61,10.46,3.9,21.73,7.09,32.15l-.09-.15c2.07,6.32,1.82,12.76,1,19.23l.08-.13c-1.61.95-.66,11.09,1.21,9.86.56,2.62,1.12,5.24,1.68,7.86.28.28.4,1.25.97.22l-.07.08c1.54-.55,5.16,2.32,5.15,4.12Z"></path><g id="BEARD"><path class="cls-19" d="M255.23,385.98c-5.28,5.64-10.57,11.29-15.86,16.93-3.54-2.42,10.1-23.13,11.88-28.92v.02c.33-.8,2.56-1.48.96-2.04-.33-1.92-.11-3.94.09-5.87,2.04-1.77.13-4.99,1.51-7.29,1.06-2.29,1.6.18,2.4.17.18.44.28.91.43,1.36,1.3-2.42,3.21-5.97,6.45-5.28.03,4.61-2.11,8.32-4.84,11.8-.25.32-2.39.06-.43,1.18,4.83,1.66-9.35,14.08-2.6,14.95.25,1,.08,2,0,3.01Z"></path><path class="cls-3" d="M269.81,371.25c-.16-.85-.44-.97-1.17-.51.16.85.44.98,1.17.51Z"></path><path class="cls-19" d="M280.19,338.94c2.78,5.64,1.44,12.54-3.14,16.14-1.3.67-1.24,4.23-3.97,1.87.35-5.08-.11-15.76,3.96-19.08.7.08,1.41.15,2.11.23.35.31.71.63,1.06.94l-.02-.1Z"></path><path class="cls-10" d="M98.45,376.01c-4.02-.72.31-6.78-3.58-7.47-3.71-.18-1.09,8.81-6.28,4.42-.17-3.57.01-7.13-.15-10.71,1.28.18,3.76,3.96,3.28-1.1,3.4-1.24,2.73-4.32,3.13-6.92,5.55,3.2-3.29,8.6,4.56,14.74-1.22,2.23-.6,4.7-.96,7.05Z"></path><path class="cls-3" d="M76.63,364.99c-1.28,2.29-3.19,1.38-5,1-1.3-3.7,5.13-2.46,2.01-5.99,0-1.99,0-3.98.01-5.97.42-.17.85-.35,1.27-.52-.43-.17-.86-.34-1.28-.51h-.02c0-1.98.02-3.97.03-5.96,1.64-.32,3.27-.65,4.91-.97.16,1.34-.36,2.82.83,3.95.11,1.6.23,3.2.34,4.8-1.82,3.16-.88,7.15-3.1,10.18Z"></path><path class="cls-12" d="M67.56,337.08c-2.73-.56-5.08-2.48-8.07-2.14-5.26-2.82-.33-16.72-.83-21.84.61,0,1.22,0,1.83,0-.12,3.34-1.54,6.57-.81,9.98-.63,3.76,3.78,5.42,3.73,8.93.13-.29.26-.58.39-.88.24-.01.48-.02.72-.04.41.69.8.67,1.17-.03.98,0,1.96,0,2.94,0-.36,2-.71,4.01-1.07,6.01Z"></path><path class="cls-19" d="M271.19,312.11c5.44,5.96,1.6,9.58,11.98,8.01.02.95.05,1.9.07,2.84-6.25,6.34-6.24-3.5-9.1,10.03-3.14-3.13,2.36-14.54-3.91-12.88-.59-2.78-.29-5.45.96-8Z"></path><path class="cls-28" d="M265.34,358.08c-2.01,6.97-4.02,13.94-6.03,20.92-1.89.97-3.45,1.89-4.08,3.98-6.75-.84,7.43-13.34,2.6-14.94-1.96-1.12.18-.85.43-1.18,2.73-3.48,4.87-7.19,4.84-11.8,2.09.01,1.79,1.8,2.24,3.03Z"></path><path class="cls-26" d="M60.49,313.1c-4.56.96-3.97-5.31-7.67-6.33,0-.65,0-1.31,0-1.96.93.32,1.87.59,2.77.96.94.39,1.87,1.88,2.79.18.37-4.75-7.24-5.79,1.19-9.84.24,1.35-.38,2.92.95,4.01.4,4.31.17,8.66-.04,12.98Z"></path><path class="cls-19" d="M67.56,337.08c.36-2,.71-4.01,1.07-6.01,0,0,0,0,0,0,1.97-.82-.58,5.18,2.98,1.98-.49,5.01,1.3,10.21-1.14,15-.61,0-1.22-.01-1.83-.02-5.85-4.96-.76-5.36-1.08-10.94Z"></path><path class="cls-13" d="M279.15,338.09c-.7-.08-1.41-.15-2.11-.23.05-.94.1-1.87.15-2.81,4.18-1.46,5.06-5.48,6.82-8.81.3-.01.61-.05.91-.1-.03,2.85-.08,5.7-.09,8.54-.01,3.11-4.04,1.79-4.64,4.25,0,0,.02.1.02.1-.35-.31-.71-.63-1.06-.94Z"></path><path class="cls-12" d="M68.64,348.02c.61,0,1.22.01,1.83.02.04,1.17,0,16.41,2.25,11.98.3,0,.61-.01.91-.02,3.15,3.2-2.91,2.69-2.01,4.98-4.28-.49-.09-6.61-4.82-7.98-.09-.64-.18-1.28-.26-1.93,2.44-1.83,2.06-4.51,2.11-7.06Z"></path><path class="cls-28" d="M273.08,356.95c2.73,2.36,2.67-1.21,3.97-1.87-.09,2.36.62,4.81-.87,6.99-1.17.05-2.08.41-2.18,1.77,0,0-.13-.07-.13-.08-3.76.58-4.93-1.47-4.87-4.77,2.56.7,1.51-3.44,4.08-2.04Z"></path><path class="cls-12" d="M87.6,361.99c-3.15.52-4.01,4.16-6.89,5.04,1.24-3.75,1.39-8.36,5-10.73,1.11,1.73,1.97,3.55,1.89,5.68Z"></path><path class="cls-12" d="M76.63,364.99c2.21-3.03,1.28-7.02,3.1-10.18,3.21,3.92-2.15,8.53-1.03,13.11-2.12.03-2.07-1.47-2.07-2.93Z"></path><path class="cls-28" d="M87.6,361.99c.08-2.13-.78-3.95-1.89-5.68.33-1.16.66-2.33.99-3.49.45.01.9.03,1.34.04-.61,3.36-1.14,6.68,3.31,7.92.12.12.24.25.36.37.46,5.47-2.36.69-4.13.84Z"></path><path class="cls-28" d="M78.7,367.92c-.26-3.18.67-6.08,2.09-8.87.62.32,1.24.65,1.87.97-.65,2.34-1.3,4.67-1.94,7.01,0,0-.07.04-.07.04-.36.29-.72.59-1.08.88-.29,0-.57,0-.86-.04Z"></path><path class="cls-3" d="M264.01,383.25c.07.97-.48,1.5-1.31,1.83-3.36.7-.23-5.57,1.31-1.83Z"></path><path class="cls-3" d="M255.23,382.97c.7-1.29,1.1-2.87,2.88-3.19.15,2.09.52,4.32-2.72,4.21-.05-.34-.11-.68-.16-1.03Z"></path><path class="cls-19" d="M284.92,326.15c-.3.05-.6.09-.91.1-.36-.95-.72-1.91-1.09-2.86.1-.14.21-.28.31-.42,3.14-.3.99,2.19,1.68,3.18Z"></path><path class="cls-3" d="M88.56,366.98c-.02,1.01-.04,2.01-.07,3.02-2.3.01-2.23-3.13.07-3.02Z"></path><path class="cls-3" d="M274.01,363.84c.1-1.37,1.01-1.73,2.18-1.77-.1,1.36-.81,1.97-2.18,1.77Z"></path><path class="cls-3" d="M71.61,366.45c-.11.28-.23.55-.35.83-.52-.64-.2-.92.37-1.29,0,.15-.02.31-.02.47Z"></path><path class="cls-12" d="M79.56,367.96c.36-.29.72-.59,1.08-.88-.36.29-.72.59-1.08.88Z"></path><path class="cls-15" d="M261.14,354.98c-1.78.94-2.73,2.66-3.94,4.14-.31-.06-.63-.09-.95-.1,0,0-.03-.05-.03-.05-.99-2.99,1.8-6-.02-8.99-.35-5.72-.73-6.03-4.83-3.9-.16-1.5-.07-3.08-2.35-2.94,1.38-1.3,3.38-2.78,1.66-4.7-1.8-2.02-1.39,2.62-3.29,1.55-3.49-.79-2.4,3.02-4.06,4.06h-2c1.51-3.49,2.36-7.05,1.57-11.15-1.28,1.69.42,3.95-1.66,5.03.03-1.95.4-4.15-2.74-3.84.83-2.23.55-4.58.66-6.92,2.67-3.99,8.35-4.1,10.03-9.05,2.4,2.08,4.15.29,5.98-1.01.46,4.66-.22,9.17-1.57,13.63-.8,4.49,2.4,6.73,3.72,1.56,3.87-3.83,1.72-11.12,6.89-13.52,1.34,1.88-2.02,5.26,2,6.28.38.81,1.11.98,1.9,1.03.07.31.11.63.12.94.33.34.66.69.99,1.03-1.1,4.21-3.6,7.9-5.08,11.98-.72-.43-1.44-.87-2.16-1.3-.33-2.13,3.03-4.98.32-6.03-2.44-.95-2.33,3.23-3.88,4.72-2.44,2.28.58,4.55,2.78,2.57.05,3.32-3.28,7.75,2.99,9.01-.87,2.05-3.49,3.21-3.03,5.95Z"></path><path class="cls-28" d="M121.69,278.19c.17-2.28,1.39-3.55,3.65-3.84.47,2.27.43,5.08,4.15,3.83-.59,5.76-7.5,9.22-6.03,15.76-1,.36-2.01.72-3.01,1.08-.5-1.53.82-5.99-.83-6.27-1.31-.13-1.5,1.43-1.94,2.44-.44,1.27.25,2.86-1.06,3.89.32-5.01-1.97-3.16-3.03.07-.65,3.91-1.34,7.81-4.01,10.99-4.69.2-4.13-3.05-3.98-6.04,1.56-1.8,6.69-10.49,5-12.07.56-1.94-.42-5.52,4-2.84,1.12.68,3.22-3.2,5.95-2.8.31,7.51,8.65-4.07,1.14-4.19Z"></path><path class="cls-12" d="M86.58,306.08c.92-2.14,2.41-1.91,4.06-.95,1,6.05-2.89,11.95.25,17.86-.08,4.86,5.46,1.4,8.72,4.07.06,3.33.13,6.66-.05,9.99-4.36.03.3-6.51-3.68-6.53-2.42.15-.83,3.73-1.41,5.44-.93.73-1.89.69-2.85.07.61-5.32-6.64-5.78-6.09-10.87.04-2.02.84-4.29-.92-6.08-1.6-1.51-1.81-.26-2.01,1.01-.67.01-1.34.05-2.01.03,0-3.92-3.19-6.99-2.93-10.98.35,0,.69-.02,1.04-.03,1.88,2.54,2.65,5.8,6.32,7.11,2.76.99,3.52-.88,3.13-2.02-.92-2.68.5-5.75-1.56-8.12Z"></path><path class="cls-8" d="M235.66,308.14c-.42,5.14-1.73,10.09-3.24,14.99-1.43.1-3.04-.57-4.14.95-2.09-2.3-.69-6.35-4.02-8.02-.41-1.84,1.11-3.2,1.23-4.91,4.19-2.4-.41-5.52.67-8.18,1.43-1.93,1.14-4.32,1.38-6.58,2.52,1.8,1.16-2.46,2.94-1.87,2.15.71,1.78,2.55,1.74,4.09-.09,3.66,3.73,5.84,3.46,9.52ZM232.06,309.05c.83,2.75-7.52,3.86-4.27,7.68,1.49,2.01,2.79-.14,3.58-.9,7.58-7.53-1.86-15.11.69-6.78Z"></path><path class="cls-15" d="M123.46,293.93c-1.47-6.54,5.44-9.99,6.03-15.76.95-.84,2.11,1.13,3.03-.22,3.23-.26.64,4.1,3.78,4.32.43,3.34.46,6.64-.93,9.81-1.1.73-.84,1.85-.81,2.89l-2.83-.02-1.21-1.03v-10.54c-.43,4.27-4.52,7.22-4.1,11.58-.98-.35-1.97-.7-2.95-1.04Z"></path><path class="cls-4" d="M78.69,309.11c-7.63-1.69.6,3.16-4.19,5.07-2.73,4.68,2.24,10-.75,14.93-.37-.02-.74-.03-1.11-.05-.24-4.2,1.06-8.78-2.88-12.1,2.2-.91.7-14.83-.18-17.78,1.8-1.33.78-3.29,1.11-4.94.3-.05.61-.08.92-.11.56,5.42,1.64,10.57,7.22,13.25-.05.57-.1,1.15-.14,1.73Z"></path><path class="cls-19" d="M110.6,288.02c1.69,1.58-3.42,10.25-5,12.07-3.26-3.28-2.7,1.18-3.97,1.96.27,2.61-1.64,3.48-3.51,4.37-.22-.1-.45-.19-.69-.27-.08-2.23-.02-4.47,0-6.7,4.23-4.1,9.9-6.24,13.17-11.44Z"></path><path class="cls-10" d="M264.2,318.79c1.61-2.77,3.37-5.46,4.01-8.68,1.45-.02,2.89-.01,2.98,2-3.32,4.71,1.85,11.15-2.97,14.94-.12-1.07-.35-3.24-2.02-1.98-4.02-1.03-.66-4.4-2-6.28Z"></path><path class="cls-8" d="M97.38,304.18c.02.66.03,1.31.05,1.97-1.36,1.49-2.67,2.89-2.92,4.95-1.83-.02-1.38,1-.92,2.03-.42,3.18,3.96,11.7-2.7,9.85-2.82-4.91-.04-9.89-.16-14.83,1.41-.03,2.82-.06,2.84-2.03.67-.67,1.35-1.34,2.02-2.01.59.02,1.19.05,1.78.07Z"></path><path class="cls-28" d="M226.15,302.98c-1.08,2.66,3.52,5.77-.67,8.18-.37-3.24-4.76-1.13-5.38-4.04-.23-3.35,1.39-6.91-1.19-9.97.14-.99.27-1.98.41-2.97.66-.01,1.31-.02,1.97-.03.3,2.36-.97,6.41.64,6.69,2.06.36,2.28-3.22,2.51-5.45,1.98,2.21-.23,5.37,1.72,7.59Z"></path><path class="cls-1" d="M145.76,281.39s.48-.02.48-.02c.46,2.51.15,5.13.3,7.68-.42.07-.83.13-1.25.2-2.24,3.25-1.96,6.95-1.89,10.62-.29.08-.58.08-.88-.02,0-2.53,0-5.06,0-7.59-.23-.06-.46-.11-.69-.17-.47,1.28-.94,2.55-1.4,3.83-1.88-2.37-1.01-5.92-.92-8.76,2.52.6,2.64-3.32,3.83-1.14,2.51,4.54,2.28-3.18,2.42-4.63Z"></path><path class="cls-21" d="M55.69,270.28c.98-.1,1.96-.19,2.94-.29-.16,2.25,2.51,2.43,3.03,4.17-2.49,2.46.12,4.07.99,5.97-3.53.45-4.97-3.2-7.87-4,.03-.98.06-1.96.09-2.95.96-.78.77-1.88.81-2.92Z"></path><path class="cls-28" d="M61.66,274.16c-.52-1.74-3.2-1.93-3.03-4.17,3.29-.68,5.34,3.86,8.88,2.11.38.04.75.07,1.13.11q-2.12,5.77-6.98,1.96Z"></path><path class="cls-19" d="M145.76,281.39c-.14,1.44.08,9.19-2.42,4.63-1.1-2.15-1.51,1.35-2.73,1.05-.06-2.3-.11-4.6-.17-6.9,2.25-1.71,3.82-.41,5.32,1.21Z"></path><path class="cls-10" d="M242.4,316.03c1.62.62-.16,4.04,2.44,3.4,1.97-.48,1.19-2.78,1.37-4.36,1.34.68,2.39,1.63,2.96,3.05-1.24,3.85-4.98,4.76-7.84,6.72.36-2.94.71-5.88,1.07-8.82Z"></path><path class="cls-19" d="M224.43,295.39c-.22,2.23-.44,5.8-2.51,5.45-1.67-.37-.29-5.37-.61-7.67,1.66-.14,2.96.24,3.12,2.22Z"></path><path class="cls-13" d="M68.64,272.2c-.38-.03-.75-.07-1.13-.11,8.3-8.17,4.32,7.75,5.06,12.01-.3.04-.61.08-.91.1,0,0-.09-.07-.09-.07.01-3.55.14-7.11,0-10.65-.11-2.83-1.19-.24-1.81-.22-.37-.35-.74-.71-1.12-1.06Z"></path><path class="cls-15" d="M121.69,278.19c7.51.13-.83,11.7-1.14,4.19,1.27-1.16.65-2.82,1.14-4.19Z"></path><path class="cls-28" d="M140.44,280.18c.06,2.3.11,4.6.17,6.9-.37.03-.73.06-1.1.09-.13-.95-.27-1.9-.4-2.85-1.23.73-.35,1.91-.58,2.86-.15.63-.08,1.32-.11,1.98-.3.01-.6.01-.9,0,.01-2.3.03-4.6.04-6.91,0,0-.02-.02-.02-.02.87-.91,1.46-2.2,2.9-2.05Z"></path><path class="cls-3" d="M146.43,282.25c-.84-2.81,2.06-3.27,3.94-3.18.47.46.94.92,1.41,1.38-.1.59-.19,1.19-.29,1.78-1.69,0-3.38.01-5.07.02Z"></path><path class="cls-30" d="M137.55,282.24c-.71,2.83,1.83,9.4-2.19,9.85,1.4-3.17,1.36-6.47.93-9.81.42-.01.84-.03,1.26-.04Z"></path><path class="cls-1" d="M93.58,306.13c-.02,1.97-1.44,2-2.84,2.03-.03-1.01-.06-2.02-.1-3.03.85-.45,1.7-.89,2.55-1.34.13.78.26,1.56.39,2.34Z"></path><path class="cls-28" d="M55.69,270.28c-.04,1.04.15,2.14-.81,2.92-1.05-1.56-2.71-.88-4.12-1.11,0,0,.01.04.01.04,0-.31-.05-.62-.16-.91.07-.31.12-.61.14-.93,1.65,0,3.29,0,4.93-.01Z"></path><path class="cls-13" d="M71.61,294.13c-.31.03-.61.07-.92.11.2-3.37-1.15-6.97.88-10.11,0,0,.09.07.09.07.04,3.31.21,6.63-.05,9.93Z"></path><path class="cls-1" d="M97.38,304.18c-.59-.02-1.19-.05-1.78-.07-.18-1.87.23-3.5,1.83-4.66-.02,1.58-.03,3.15-.05,4.73Z"></path><path class="cls-4" d="M71.74,288.16c-.03-1.32-.05-2.64-.08-3.96.31-.02.61-.06.91-.1.35,1.48,1.73,3.18-.83,4.06Z"></path><path class="cls-12" d="M168.47,279.31s-.05.02-.05.02c-1.11-.07-2.23-.13-2.99-1.13,1.47-.86,2.48-.48,3.04,1.11Z"></path><path class="cls-4" d="M221.31,293.17c0,.32-.02.65-.03.97-.66.01-1.31.02-1.97.03-.03-.67-.05-1.33-.08-2,.86-.02,1.62.16,2.07,1Z"></path><path class="cls-4" d="M71.75,292.11c-.06-.31-.06-.62,0-.93.16.38.55.68,0,.93Z"></path><path class="cls-30" d="M138.44,281.22c-.3.33-.61.67-.91,1,.3-.33.61-.67.91-1Z"></path><path class="cls-15" d="M252.04,370.99c.19.64.16,1.3.18,1.96,0,0-.02.03-.02.03-.32.34-.63.68-.95,1.03,0,0,.01-.02.01-.02-1.52,6.07-15.06,24.82-11.88,28.92-.68.91-1.36,1.82-2.05,2.73-1.17-6.02-7.29,2.37-3.93,5.28-.1.29-.16.58-.19.88-.37.32-.73.64-1.1.97-2.06-4.68-5.57-2.77-8.84-1.95-.54-5.21,5.01-5.66,6.98-8.91-.59-2.71,7.26-8.93,2-10.11.08-.37.16-.74.23-1.12,5.26-.69,5.85-8.03,10.67-9.73,3.7-1.71,4.38-2.56,3.22-6.88-.4-.03-.81-.05-1.21-.08-1.07-1,.48-1.96.04-2.95.01-1.35.02-2.7.04-4.05h0c3.78-.74,1.17-6.92,1.91-9.77.55-2.3,1.43-4.56,1.07-7,.35-.39.7-.78,1.06-1.18,1.54.9.32,3.15,1.96,4-2.9,3.52-2.91,6.76-.02,7.94-.08,1.8.07,3.54,1.09,5.1-.02.3-.07.6-.14.89-3.67,1.22-1.68,2.62-.13,4Z"></path><path class="cls-19" d="M161.63,413.79c-4.13.16-5.98-5.74-10.96-3.13-1.09.43-2.7,1.35-3.53-.27-2.24-4.35-6.39-7.51-7.69-12.42-.23-.86.39-2.26-1.03-2.35-1.02-.07-.66,1.31-1.1,1.87-1.07,1.37-2.19,3.86-3.78.36,4.69-1.19-.96-6.9,1.58-9.79,1.67-2.75.74-4.42-1.57-5.92-.03-.37-.06-.74-.09-1.11,9.5-.85,5.38-11.8,7.85-11.92,3.53,7.47-2.52,15.88,1.06,22.72.74,2.32-1.47,5.48,1.69,7.01,4.31,2.37,3.7,11.59,10.35,5.07,9.3-8.46,2.13,7.82,11.01,7,.33,3.07-2.91,1.42-3.8,2.87Z"></path><path class="cls-1" d="M220.45,414.95c-5.13,4.21-11.11,3.71-15.09-1.26-.04-.64-.08-1.28-.12-1.92.82-1.15,1.11-2.45,1.13-3.83,2.51,1.08,1.87-.81,1.93-2.05,5.84-3.75,9.43-10.6,16.82-12.21,1.05,1.38.3,2.82.15,4.24-3.28,4.48-8.67,7.74-11.52,12.14.12,4.66,1.69,5.79,6.7,4.89Z"></path><path class="cls-21" d="M161.63,413.79c.89-1.46,4.13.2,3.8-2.87,1.71-4.51,4.87-8.71,2.94-13.99,3.33-1.05,7.14-1.44,8.1-5.81,1.51,1.59-.98,3.2.01,4.79-1.46,1.83-1.99,9.87-.02,10.94,0,0,.01-.02.01-.02-.45,2.39-2.72,3.73-2.87,6.13-.16,1.09-.78,1.95-1.34,2.88-1-.16-1.97.85-2.98.07-.12-.46-.24-.92-.36-1.38-.22.41-.44.83-.66,1.24-.2-.06-.4-.08-.6-.07-.16-1.25-.32-2.5-.48-3.76-.94.88-1.89,1.76-2.83,2.64-.9-.26-1.81-.53-2.71-.79Z"></path><path class="cls-13" d="M175.33,409.64c.39-.94.77-1.88,1.16-2.82,9.07-2.43,12.35,10.34,18.46,1.76,1.83-2.26,3.02-5.23,6.4-5.76,2.55,2.62-1.36,9.63,3.9,8.95.04.64.08,1.28.13,1.92-1.28-.77-3.47.41-4.03-1.96-.27-1.13.39-3.54-1.1-3.06-1.57.51-3.62.8-4.87,2.73-3.71,5.71-6.16,6.15-11.63,2.38-1.31-.9-2.03-.41-3,.29-5.29,3.47-1.56-4.16-5.41-4.42Z"></path><path class="cls-12" d="M117.49,384.9c1.14,4.05-5.65,3.71-4.73.11,1.92-5.81-1.2-7.1-6.02-7.02-.6-1.26-.1-2.61-.02-3.94.88-.4,1.75-.8,2.63-1.2.62,3.34,3.38.54.06-.06-.04-6.21,7.05,3.28,3.14-8.83,6.49-7.44,5.18,4.72,5.99,9.06-2.11,1.15.98,6.41-4.11,5.21.33,2.44-1.28,9.72,3.07,6.68ZM113.52,373.67c-1.13.31-.81,1.19-.36,1.78,1.32.57,1.02-1.16.36-1.78Z"></path><path class="cls-21" d="M220.45,414.95c-5.02.9-6.58-.23-6.7-4.89,2.85-4.41,8.24-7.67,11.52-12.14,2.72,0,1.87,4.47,4.97,3.99-1.96,3.25-7.51,3.7-6.98,8.91-.64,1.58-1.3,3.15-2.82,4.13Z"></path><path class="cls-15" d="M106.4,376.9c.73,2.65-.67,5.54-.84,8.27-.66-.06-1.33-.11-1.99-.16,0,0-.05-.08-.05-.08-.04-1.26-.09-2.51-.13-3.77-1.36,1.56-2.52,3.27-3.83,4.86-2.36-4.92-1.27-11.77-.15-17.05.59-2.3-.75-4.91,1.14-7,.27,1.64-.64,3.96,1.02,5.02.17,3.86-1.35,10.95,4.83,9.91Z"></path><path class="cls-13" d="M133.56,382.14c5.36,2.8-.75,7.03,1.47,11.51.34,1.27,1.41,3.68-1.48,4.19-.3-1.26.41-4.66-.76-5.07-6.21,2.81-3.17-2.99-4.47-4.7.1-3.02-.1-6.07.21-9.08,4.14-.54.23,4.58,3.11,5.57,1.8.72,1.72-1.23,1.92-2.42Z"></path><path class="cls-10" d="M128.4,380c-.03,2.69-.05,5.38-.08,8.07-5.81-.2-3.9,3.86-6.33,7.03-.56.72-.7,2.24-1.89,1.87-1.34-.81-.3-3.59-.6-5.05,3.69-.41.81-4.86,2.94-6.91.02-1.02.04-2.04.06-3.07,3.37,3.58,4.02-1.03,5.9-1.95Z"></path><path class="cls-28" d="M117.49,384.9c-4.35,3.04-2.74-4.23-3.07-6.68,5.1,1.2,2-4.06,4.11-5.21,1.35.51.61,2.53,2.12,2.92-1.31,2.94-3.39,5.62-3.16,8.97Z"></path><path class="cls-4" d="M233.4,410.92c-3.35-2.92,2.76-11.3,3.93-5.28-.73,2.19-.16,5.36-3.93,5.28Z"></path><path class="cls-19" d="M117.67,382c.99-2.02,1.99-4.05,2.98-6.07.61-.33,1.23-.65,1.84-.98.03.82.19,1.58.98,2.03.01.32.01.64,0,.95-2.7.77-2.35,2.27-.97,4.02-.02,1.02-.04,2.04-.06,3.07-2.24.02-1.92-4-4.77-3.02Z"></path><path class="cls-19" d="M175.33,409.64c1.94.34,2.24,1.64,1.91,3.3-1.21,0-2.42,0-3.62,0-.06-1.43.83-2.36,1.72-3.3Z"></path><path class="cls-19" d="M164.34,414.58c.94-.88,1.89-1.76,2.83-2.64.16,1.25.32,2.5.48,3.76-1.29.17-2.59.39-3.31-1.12Z"></path><path class="cls-10" d="M100.5,384.9c.8-1.35,1.93-2.49,2.88-3.74.04,1.26.09,2.51.13,3.77-1.01-.01-2.01-.02-3.02-.03Z"></path><path class="cls-10" d="M98.36,383.94c.4.69.79,1.38,1.19,2.08-.19.77.44,2.59-.87,2.01-1.7-.74-1.49-2.6-.32-4.09Z"></path><path class="cls-19" d="M121.46,388.89c.08,1.49.11,2.94-1.96,3.04-.03-1.46,0-2.87,1.96-3.04Z"></path><path class="cls-10" d="M98.4,377.95c-.03,1.34-.06,2.69-.09,4.03-1.05-1.37-1.19-2.71.09-4.03Z"></path><path class="cls-10" d="M103.57,385.01c.66.05,1.33.11,1.99.16.06,1.87-2.28,1.63-1.99-.16Z"></path><path class="cls-19" d="M168.26,415.77c.22-.41.44-.83.66-1.24.12.46.24.92.36,1.38-.34-.04-.69-.09-1.03-.13Z"></path><path class="cls-19" d="M172.27,415.83c.38-.64.76-1.28,1.14-1.92,0,.87-.2,1.61-1.14,1.92Z"></path><path class="cls-4" d="M232.11,412.77c.37-.32.73-.64,1.1-.97-.37.32-.73.64-1.1.97Z"></path><path class="cls-30" d="M261.14,354.98c-.46-2.73,2.16-3.89,3.03-5.95,1.1-1.96,3.27-.47,4.84-.05.14,3.32.29,6.64.43,9.95,0,0-.43.05-.44.05-.93-1.45-1.52-4.3-3.66-.91-.29-2.68-1.41-3.3-4.2-3.1Z"></path><path class="cls-30" d="M256.19,349.98c1.82,2.99-.97,5.99.02,8.99-.79.02-1.34-2.46-2.4-.17-.79,1.71-.47,3.46-.61,5.2-1.49-1.03-.75-2.66-1.05-4.01,1.35-3.34,2.69-6.68,4.04-10.02Z"></path><path class="cls-28" d="M252.16,360c.3,1.35-.44,2.97,1.05,4.01.04.84-.07,1.62-.9,2.08-1.02-1.56-1.18-3.3-1.09-5.1.31-.33.63-.66.94-.99Z"></path><path class="cls-28" d="M252.04,370.99c-1.55-1.38-3.54-2.78.13-4-.04,1.33-.08,2.67-.13,4Z"></path><path class="cls-30" d="M256.24,359.02c.32,0,.64.04.95.1-.18.4-.36.81-.55,1.21-.13-.44-.27-.87-.4-1.31Z"></path><path class="cls-28" d="M251.24,374c.32-.34.63-.68.95-1.03-.32.34-.63.68-.95,1.03Z"></path><path class="cls-28" d="M252.22,372.95c-.02-.33-.02-.65,0-.98.8.33.84.66,0,.98Z"></path><path class="cls-28" d="M250.32,375.15c.31-.39.63-.78.94-1.17-.31.39-.63.78-.94,1.17Z"></path><path class="cls-31" d="M269.81,371.25c-.74.46-1.01.34-1.17-.52.74-.46,1.01-.34,1.17.52Z"></path><path class="cls-21" d="M269.44,358.94c-.14-3.32-.29-6.64-.43-9.95,3.98-3.41.76-8.75,3.03-12.9,1.72-.34,3.44-.68,5.16-1.03-.05.94-.1,1.87-.15,2.81-4.05,3.27-3.62,14.03-3.96,19.08-2.39-1.5-1.7,2.66-3.64,1.99Z"></path><path class="cls-31" d="M279.15,338.09c.35.31.71.63,1.06.94-.35-.31-.71-.63-1.06-.94Z"></path><path class="cls-28" d="M97.49,366.9c-4.58-4.58,2.83-10.01-3.17-13.08.09-.59.19-1.17.28-1.76,1.2-.75.88-1.94.89-3.04,1.8-.19-.28-3.42,2.33-2.98-.24,7.01.19,13.99-.33,20.85Z"></path><path class="cls-30" d="M97.49,366.9c-.6-2.98,1.46-5.91.13-8.9,1.55.17,1.89-1.5,3.01-1.99,2.25,2.02-.14,4-.04,6l-.04-.05c-1.88,2.09-.55,4.7-1.13,7-.64-.69-1.28-1.38-1.92-2.06Z"></path><path class="cls-28" d="M94.85,354.23c-.4,2.6.27,5.68-3.13,6.92-.12-.12-.24-.25-.36-.37.21-2.65,1.6-4.79,2.96-6.95.17.14.35.27.53.4Z"></path><path class="cls-28" d="M80.67,355.99c-.31-.39-.63-.79-.94-1.18-.11-1.6-.23-3.2-.34-4.8.75-1.01,2.32-1.4,2.33-2.99,1.32-.06,2.7.15,3.99-.05.32.35.64.69.95,1.04l-.07,2.01c-3.77.09-4.2.39-3.81.95,2.1,2.96-1.44,3.36-2.1,5.02Z"></path><path class="cls-19" d="M81.71,347.03c-.01,1.59-1.58,1.97-2.33,2.99-1.56-1.96-.53-4.61-.82-6.9,2.41-.48,1.82,2.85,3.15,3.91Z"></path><path class="cls-12" d="M78.56,343.12c0,.98,0,1.97,0,2.95-1.64.32-3.27.65-4.91.97-.01-1-.02-2-.03-3.01.73-.04,1.46-.08,2.18-.12.3-.3.6-.59.9-.89.62.03,1.24.06,1.87.09Z"></path><path class="cls-4" d="M73.61,344.04c.04,2.66.03,5.32,0,7.98-.27-.03-.54,0-.8.06-.04-2.68-.08-5.37-.12-8.05.23,0,.68,0,.91,0Z"></path><path class="cls-4" d="M73.63,360c-.3,0-.61.01-.91.02.02-2.35.05-4.7.07-7.05.21.03.64.07.84.04.02,2.33,0,4.66,0,7Z"></path><path class="cls-12" d="M73.65,354.03c0-.34,0-.68-.01-1.02.43.17.86.34,1.28.51-.42.17-.85.35-1.27.52Z"></path><path class="cls-12" d="M73.62,353.02c-.21.01-.62-.01-.83-.04-.07-.3-.06-.59.03-.89.26-.07.53-.09.8-.06,0,.33,0,.66,0,.99Z"></path><path class="cls-8" d="M60.49,313.1c.09-1.94.18-3.89.27-5.83.94-.42,1.89-.84,2.83-1.27.13,5.02.07,10.04-.02,15.07-1.12,1-1.15,4.11-3.88,2.01-.74-3.41.68-6.64.81-9.98Z"></path><path class="cls-1" d="M59.69,323.08c2.73,2.1,2.76-1.01,3.88-2.01-.2,3.6.78,7.51-.16,10.95.05-3.52-4.36-5.18-3.73-8.93Z"></path><path class="cls-30" d="M63.81,331.14c-.19-6.25-.27-12.5-.12-18.76.3.25.6.5.9.75.1,5.99.04,11.98-.07,17.97-.24.02-.48.03-.72.04Z"></path><path class="cls-28" d="M64.52,331.1c.05-3.33.09-6.67.14-10,.36.01.71.02,1.07.04-.38,1.47,1.21,12.1-1.21,9.97Z"></path><path class="cls-19" d="M65.69,331.07c.03-1,.07-2.01.1-3.01,1.86.14,2.12,1.79,2.83,3.01,0,0,0,0,0,0-.98,0-1.96,0-2.94,0Z"></path><path class="cls-15" d="M277.19,335.06c-1.72.34-3.44.68-5.16,1.03-.3-.32-.6-.64-.89-.97,1-.71,2-1.42,3-2.13,3.04-13.33,2.3-4.06,8.79-9.61.36.96.72,1.91,1.08,2.86-1.76,3.33-2.64,7.35-6.82,8.81Z"></path><path class="cls-28" d="M274.14,332.99c-7.47,3.94-3.17,5.74-6.8,10.12-.29-.85-.31-2.17-1.76-1.47-2.4,1.15-.95-1.07-1.44-1.57.36-.66.72-1.31,1.09-1.97,3.73-1.02,6.34-7.42,3.01-11.05,2.75-1.71,2.06-4.42,2.01-6.94,6.28-1.66.77,9.75,3.91,12.88Z"></path><path class="cls-10" d="M63.59,306c-.94.42-1.89.84-2.83,1.27-.48-4.51.39-8.7,1.95-12.92,4.62.34.26,8.52.88,11.66Z"></path><path class="cls-28" d="M62.71,294.34c-.68,2.26-1.36,4.51-2.05,6.77-.29-3.63.07-7.3.03-10.95,3.22.16.47,3.21,2.02,4.18Z"></path><path class="cls-10" d="M60.69,290.16c-.05,3.32-.1,6.63-.16,9.95-1.34-1.09-.71-2.66-.95-4.01.4-2.14-1.27-3.76-.93-5.89.64-.31,1.28-.62,1.92-.93.03.29.07.59.12.88Z"></path><path class="cls-12" d="M68.63,331.06c-.71-1.22-.97-2.87-2.83-3.01-.02-2.31-.04-4.62-.07-6.92.67-1,1.35-2.01,2.02-3.01.29-.01.58-.03.87-.05.69,3.99-2.09,10.23,3.01,12,0,.99.02,1.98-.02,2.98-3.56,3.2-1.01-2.8-2.98-1.98Z"></path><path class="cls-13" d="M72.82,352.08c-.48,1.27.89,9.97-1.1,8.63-1.74-4.08-.87-8.44-1.25-12.67,2.36-4.13.64-8.63,1.18-12.92,2.5,3.19.4,12.42,1.17,16.96Z"></path><path class="cls-4" d="M72.73,338.03c-.21-1.03.24-2.3-1.08-2.91-.02-1.02-.06-2.03-.02-3.05.63,0,1.27-.01,1.9-.02.31,1.36.61,2.71.92,4.07-.57.63-1.15,1.27-1.72,1.9Z"></path><path class="cls-31" d="M52.83,284.17c.17.39.55.72,0,.98,0-.32,0-.65,0-.98Z"></path><path class="cls-26" d="M50.61,271.21c.11.29.16.6.16.91-.17-.2-.35-.4-.53-.6.12-.1.24-.2.37-.31Z"></path><path class="cls-1" d="M80.67,355.99c.66-1.66,4.2-2.06,2.1-5.02-.39-.55.04-.86,3.81-.95.32,2.19-.18,4.22-.87,6.28-1.38.95-2.32,2.25-3.06,3.72-.62-.32-1.24-.65-1.86-.97-.04-1.02-.08-2.04-.12-3.06Z"></path><path class="cls-12" d="M94.32,353.83c-1.36,2.16-2.75,4.3-2.96,6.95-4.46-1.24-3.92-4.56-3.32-7.92,1.09-1.25,3.64-1.52,3.28-3.65-.53-2.4-3.08,2.22-3.76-1.2.14-2.11,2.87-2.69,3.03-4.93,3.19-.6,4.49.96,3.76,3.78-2.34.22-2.2,3.51.22,2.16h0c.02,1.61.11,3.22-.25,4.8Z"></path><path class="cls-4" d="M87.56,348.01c.69,3.42,3.23-1.2,3.76,1.2.36,2.13-2.19,2.4-3.28,3.65-.44-.02-.89-.03-1.34-.04-.08-1.6-.15-3.2-.05-4.8.23,0,.68,0,.91,0Z"></path><path class="cls-8" d="M248.22,350.23c.36,2.44-.51,4.7-1.07,7-2.77.4-1.98,3.68-3.87,4.79-2.01-.14-2.2,4.47-5.12,1.96.33-2.32.67-4.64,1-6.95-1.36-2.17.97-5.31-1.86-7.09-.48-1.74-3.49-11.45-4.15-4.91-.61,0-1.21,0-1.82,0,0-.67,0-1.34,0-2.01,1.17-.98,1.2-1.96,0-2.93-.43-2.6-.41-5.22-.42-7.85,2.58-1.72.75-5.09,1.51-7.42,1.55,1.22.83,3.5,1.03,5.21-1.56,4.18,3.6,6.16,3.38,9.98.55-1.97,1.1-3.94,1.64-5.91,3.14-.31,2.77,1.89,2.74,3.84-1.53,1.24-3.05,11.29.09,6.11.67,0,1.34,0,2,0,.13,3.25.59,6.24,4.9,6.17Z"></path><path class="cls-8" d="M252.16,360c-.31.33-.63.66-.94.99-2.89-1.19-2.88-4.43.02-7.94.76-.37,2.66.75,1.99-1.46-.56-1.86-1.24-3.68-1.87-5.51,9.03-5.11,2.58,10.27.79,13.92Z"></path><path class="cls-2" d="M264.13,340.06c.49.51-.96,2.73,1.44,1.57,1.46-.7,1.47.62,1.76,1.47-.43,1.62-.85,3.25-1.28,4.87-.79.06-1.48.3-1.89,1.05-6.26-1.25-2.94-5.69-2.99-9.01h0c.29-.36.57-.73.86-1.09l-.08-.17c.72.43,1.44.87,2.16,1.3Z"></path><path class="cls-19" d="M248.22,350.23c-4.31.07-4.77-2.92-4.9-6.17,1.66-1.05.57-4.85,4.06-4.06-.17,1.46-.48,2.98,1.73,3.18.06,1.96.11,3.92.17,5.87-.35.39-.7.78-1.06,1.18Z"></path><path class="cls-10" d="M261.18,340.02c-2.2,1.98-5.22-.29-2.78-2.57,1.55-1.49,1.44-5.66,3.88-4.72,2.7,1.05-.65,3.9-.32,6.03,0,0,.08.17.08.17-.29.37-.57.73-.86,1.1h0Z"></path><path class="cls-30" d="M238.49,334.1c-.55,1.97-1.1,3.94-1.64,5.91.22-3.82-4.94-5.8-3.38-9.98,1.22,2.55,3.71,1.36,5.61,1.92-.2.72-.39,1.43-.59,2.15Z"></path><path class="cls-28" d="M249.28,349.05c-.06-1.96-.11-3.92-.17-5.87,2.26-.2,2.06,1.5,2.25,2.9.63,1.84,1.31,3.65,1.87,5.51.66,2.21-1.24,1.09-1.99,1.46-1.64-.85-.42-3.1-1.96-4Z"></path><path class="cls-13" d="M242.4,316.03c-.36,2.94-.71,5.88-1.07,8.82-.73.78-1.46,1.55-2.19,2.33-.3-.05-.61-.08-.91-.1.74-1.32,3.4-18.36,4.17-11.05Z"></path><path class="cls-30" d="M241.32,344.05c-3.13,5.18-1.62-4.86-.09-6.11,2.08-1.08.38-3.34,1.66-5.03.78,4.1-.06,7.66-1.57,11.14Z"></path><path class="cls-30" d="M269.21,328.08c1.35,4.54-.34,8.77-3.99,10.02.37-3.72,3.58-6.31,3.99-10.02Z"></path><path class="cls-28" d="M249.01,343.14c-2.18-.2-1.75-1.75-1.63-3.15,1.9,1.07,1.49-3.58,3.29-1.55,1.71,1.92-.28,3.4-1.66,4.7Z"></path><path class="cls-30" d="M238.24,327.08c.31.01.61.04.91.1-.02.99-.05,1.99-.07,2.98-4.11.02-.08-2.19-.84-3.08Z"></path><path class="cls-28" d="M266.2,325.07c1.37-1.02,1.57.13,1.9,1.03-.79-.05-1.52-.22-1.9-1.03Z"></path><path class="cls-15" d="M204.37,295.3c.24-.41.49-.81.72-1.23.5-.9-.46-2.2.8-2.89.5.97,1,1.94,1.5,2.9-1.45,2.75,2.67,5.44.07,8.2-.05,2.21-.1,4.42-.15,6.62-2.64,1.77-6.94,3.53-9.64,1.19-.09-.29-.15-.58-.17-.88,1.45.04,1.96-.78,1.88-2.1.61-1.04,1.22-2.08,1.84-3.12,3.93-1.86,2.95-5.49,3.15-8.7Z"></path><path class="cls-4" d="M207.31,308.92c.05-2.21.1-4.42.15-6.63,1.33-.7,3.04,4.87,4.19-.29.22-.99,1.3-.44,2.06-.04,2.86,1.52,1.15-1.32,1.8-1.91,2.15.23,1.39-2.97,3.4-2.91,2.58,3.06.96,6.63,1.19,9.97-3.36-2.88-7.95-2.02-9.83,1.84-1.01.13-2.01.46-2.97-.04Z"></path><path class="cls-1" d="M192.25,292.15c1.57-1.99-.1-5.41,2.96-6.75.08,3.24.16,6.47.24,9.71-.92,2.12.98,2.78,2.01,3.89-.04.46-.08.92-.12,1.39-2.08,1.4-1.99,3.6-2.12,5.72-1.32.05-2.63-.09-3.95-.14.33-4.6.65-9.21.98-13.81Z"></path><path class="cls-13" d="M197.34,300.39c.04-.46.08-.92.12-1.38,1.56.82,3.6,2.28,3.75-.95.13-2.95.99-6.11-.86-8.91.42-.68.79-1.9,1.28-1.95,1.23-.12.39,1.3.88,1.78,1.78,1.79-1.16,4.94,1.87,6.32-.2,3.21.78,6.84-3.15,8.7.25-2.86-2.59-2.41-3.88-3.61Z"></path><path class="cls-13" d="M215.51,300.05c-.65.59,1.06,3.44-1.8,1.91-.76-.4-1.84-.95-2.06.04-1.15,5.16-2.86-.41-4.19.29,2.6-2.76-1.52-5.45-.07-8.2,1.01.67,2.02,1.34,3.02,2.01-.17,5.88,2.76-1.59,5.11,3.03-.05.3-.06.61-.02.91Z"></path><path class="cls-4" d="M200.35,289.14c1.85,2.81.99,5.96.86,8.91-.15,3.23-2.19,1.77-3.75.95-1.03-1.11-2.93-1.77-2.01-3.89,2.56-1.23,5.43-2.21,4.9-5.97Z"></path><path class="cls-4" d="M215.53,299.14c-2.35-4.62-5.28,2.85-5.11-3.03,1.82.82,6.47-3.14,5.11,3.03Z"></path><path class="cls-8" d="M101.63,302.05c1.26-.77.7-5.24,3.96-1.96-.15,2.99-.71,6.24,3.98,6.04-.55,4.35,1.17,8.85-.87,13.1-6.33-2.6.21,9.23-3.1,11.82-1.49-.62-.57-3.12-1.66-3.12-2.71.12-1.34,5.07-4.24,5.15-.03-2.01-.06-4.02-.09-6.03,0,0-.04.04-.04.04,2.61-1.38,5.81-8.01,4.8-10.57-1.03-2.61-1.78.08-2.66.36-1.82-4.84,4.83-13.29-.09-14.84Z"></path><path class="cls-19" d="M108.7,319.23c2.04-4.25.32-8.75.87-13.1,2.67-3.18,3.36-7.08,4.01-10.99,1.01-.02,2.02-.04,3.03-.07,1.31-1.04.62-2.62,1.06-3.89.88,0,1.76,0,2.64.01-.17,1.22.58,3.11-.17,3.99-1.56,1.07-.29,5.07-1.73,4.11-2.55-1.69-1.74-.42-1.91,1.03-.15,1.27-.6,2.51-.92,3.77-8.74,2.39-.14,14.86-6.43,19.85-1.26.11-.29-3.75-.44-4.71Z"></path><path class="cls-10" d="M116.61,295.07c-1.01.02-2.02.04-3.03.07,1.07-3.23,3.35-5.07,3.03-.07Z"></path><path class="cls-10" d="M120.31,291.19c-.88,0-1.76,0-2.64-.01.51-2.93,3.44-3.58,2.64.01Z"></path><path class="cls-8" d="M157.49,291.31c1.24-2.04,4.9-1.07,5.26-4.22.58.04.58.62.76,1.05-.61,5.91,1.43,11.85-.14,17.75-1.85.5-3.35-.78-5.07-1-.76-1.01-1.85-.74-2.87-.75l.06-.06c.06-.61.12-1.23.18-1.84,2.79-3.28,1.47-7.24,1.81-10.93Z"></path><path class="cls-28" d="M175.52,294.02c3.19-.68.42-4.63,4.3-4.83,3.03-.13,2.5,2.54,3.58,3.94.02,3.09-.45,6.22.77,9.21-.73.63-1.46,1.25-2.2,1.88-4.08-5.64-2.92,1.84-4.73,1.89.47-2.3.31-4.18-2.75-4.13-.04-.94-.08-1.87-.11-2.81,2.49-1.24,1.82-3.19,1.15-5.14Z"></path><path class="cls-21" d="M184.17,302.33c-1.22-2.99-.75-6.12-.77-9.21,5.66-5.71,5.23,4.28,5.87,7.98-.99,1.95-2.13,3.67-4.76,2.96-.11-.58-.23-1.16-.34-1.74Z"></path><path class="cls-28" d="M165.36,288.13c.26-1.53-.94-5.04,1.47-4.96,1.15.06.71,2.31.59,3.52-.43,7.32,2.83,2.22,5.97,4.54-.63.92-1.71.75-2.59,1.08-2.44.94-.7,3.95-2.49,5.27.73.23,1.47.46,2.2.69-.05.96-.11,1.93-.16,2.89-3.85-.39-3.09,2.93-3.96,4.93-.34-.05-.68-.1-1.02-.15.6-5.92,2.42-12,0-17.81Z"></path><path class="cls-30" d="M165.36,288.13c2.43,5.81.61,11.9,0,17.81-.67-.02-1.33-.03-2-.05,1.57-5.9-.47-11.84.14-17.75.62,0,1.23,0,1.85,0Z"></path><path class="cls-8" d="M170.51,298.27c-.73-.23-1.47-.46-2.2-.69,1.8-1.31.06-4.32,2.49-5.27.88-.34,1.95-.16,2.59-1.08,2.52.31,4.06,7.02.98,7.93-.37-.83.5-2.9-.45-3.04-.72,0-.39,1.31-.3,2.08-.17,1.07-.02,2.27-1.16,2.96-.34-.01-.68-.02-1.03-.03-.46-.9.64-2.31-.92-2.86Z"></path><path class="cls-28" d="M157.49,291.31c-.34,3.69.98,7.65-1.81,10.93-.75-2.64.71-5.61-1.2-8.08-2.53-2.89,1.11-5.86-.12-8.76.37-.33.75-.67,1.12-1,.27-.04.54-.08.8-.12.62,2.31-.77,4.96,1.21,7.04Z"></path><path class="cls-30" d="M189.27,301.11c-.33-2.64-.66-5.28-.98-7.91,1.5.32,3.29,1.75,3.97-1.04-.33,4.6-.65,9.21-.98,13.81-.29.1-.59.15-.9.15-.37-1.67-.74-3.34-1.1-5.01Z"></path><path class="cls-10" d="M78.56,343.12c-.62-.03-1.24-.06-1.87-.09,0-1.16-.51-2.88.06-3.39,5.27-4.7,1.02-10.34.62-14.99-.26-2.95-1.13-7.19-2.87-10.46,4.28-1.11-2.37-7.13,3.15-5.05-.26,3.99,2.94,7.06,2.93,10.98-1.87,3.94,1.01,6.84,2.19,10.12-.97,4.32-2.95,8.37-3.3,12.85-.3,0-.61,0-.91.04Z"></path><path class="cls-4" d="M82.78,330.23c-1.19-3.27-4.06-6.18-2.19-10.12.34,0,.68,0,1.02,0,.15,5.65,4.59,10.04,6.97,14.93-.3,2.92-.97,5.94,2.02,8.04-.21,1.87-1.98,2.63-2.86,4.03-.73.01-1.52-.24-2.22-.06.8-5.89-2.24-11.15-2.74-16.82Z"></path><path class="cls-5" d="M99.7,333.09c2.91-.09,1.53-5.03,4.24-5.15,1.09,0,.17,2.5,1.66,3.12-.62,2.01.86,2.95,2.04,4.05-.08.99-.16,1.97-.25,2.96-1.84,1.11.49,4.72-2.85,4.88-2.76.13-1.35-3-2.87-3.87l-2.11-2.01c.04-1.32.09-2.64.13-3.96Z"></path><path class="cls-1" d="M90.89,322.99c1.44.61,2.69.44,3.63-.92.23.34.45.69.68,1.03,1.9-4.83,1.24-10.65,1.35-15.86.29-.36.59-.72.88-1.09.23.08.46.17.69.26-.37,5.2-.58,10.38.95,15.48.86-.75.05-2.39,1.5-2.82.57,2.79-1.1,5.3-.99,8.03,0,0,.04-.04.04-.04-3.28-2.68-8.79.8-8.72-4.07Z"></path><path class="cls-30" d="M99.57,337.05c.7.67,1.41,1.34,2.11,2.01-.13.35-.26.71-.38,1.06-.74,0-1.38.21-1.71.95-1.04-.02-2.09-.03-3.13-.05-.55-1.52-.51-3.59-3.19-2.91-2.85.7.06,2.92-.7,4.9-.66.03-1.31.05-1.97.08-2.99-2.1-2.32-5.11-2.02-8.03,3.43,1.6,5.53,1.43,8.97.02.04,1.31.74,1.93,2.02,1.98Z"></path><path class="cls-10" d="M91.62,336.03c-1.01-.32-2.03-.65-3.04-.97-2.38-4.89-6.82-9.28-6.97-14.93,1.13.11,2.02-.59,3-1.04,1.76,1.79.96,4.06.92,6.08-.55,5.08,6.7,5.55,6.09,10.87Z"></path><path class="cls-10" d="M97.55,335.07c-1.02.3-2.05.59-3.08.89.57-1.71-1.01-5.28,1.41-5.44,2.91-.07,1.19,2.94,1.67,4.55Z"></path><path class="cls-4" d="M84.61,319.08c-.67.34-1.34.67-2.01,1.01.2-1.27.42-2.52,2.01-1.01Z"></path><path class="cls-4" d="M89.55,331.06c-.32-.33-.64-.65-.96-.98.32.33.64.65.96.98Z"></path><path class="cls-2" d="M232.43,324.82c-.69,2.36.84,5.07-1.13,7.24-1.8-2.36-2.89-4.98-3.02-7.97,1.1-1.52,2.71-.85,4.14-.95,0,.56,0,1.12.01,1.68Z"></path><path class="cls-30" d="M233.44,328.12c-.01-.36-.02-.73-.03-1.09.17.41.55.78.03,1.09Z"></path><path class="cls-1" d="M228.28,324.08c.13,2.99,1.23,5.61,3.02,7.97,0,0-.38.18-.38.18-3.2.87-2.07,4.5-3.7,6.74-4.15-.25,1.05-6.99-1.73-10.16-1.49-1.26-3.96.21-5.17-1.85,1.25-3.19,3.52-6.09,2.91-9.83.34-.35.68-.71,1.02-1.06,3.34,1.67,1.94,5.72,4.02,8.02Z"></path><path class="cls-2" d="M232.06,309.05c-2.54-8.34,6.89-.72-.69,6.78-.79.76-2.09,2.91-3.58.9-3.25-3.83,5.09-4.94,4.27-7.68Z"></path><path class="cls-30" d="M130.51,293.94c-1.37.35-2.73.69-4.1,1.04-.42-4.36,3.67-7.31,4.1-11.58v10.54Z"></path><path class="cls-28" d="M74.51,314.18c1.74,3.27,2.62,7.51,2.87,10.46.4,4.66,4.65,10.29-.62,14.99-.57.51-.07,2.23-.06,3.39-.3.3-.6.59-.9.89.68-5.16-2.88-9.62-2.03-14.8,2.99-4.93-1.98-10.25.75-14.93Z"></path><path class="cls-2" d="M63.59,306c0-.3.05-.6.14-.89,2.3-1.66,1.33-6.75,5.86-5.93.3,2.9-2.89,4.9-1.89,8.01-.53,1.81-1.99,3.14-.27,4.87.02.67.04,1.33.05,2-2.02,2.96-1.82-.97-2.9-.94-.3-.25-.6-.5-.9-.75-.03-2.12-.07-4.25-.1-6.38Z"></path><path class="cls-26" d="M71.63,330.07c-5.1-1.76-2.32-8.01-3.01-12,.37-.37.73-.75,1.1-1.12,4.02,3.24,2.68,7.92,2.94,12.11-.34.33-.68.67-1.03,1Z"></path><path class="cls-28" d="M69.59,299.19c-.34,0-.69,0-1.03,0-.04-1.96.64-4.36-.25-5.79-3.27-5.23,1.11-9.54,1.14-14.3.87,4.57-.85,9.36,1.12,13.84-.13,2.09.94,4.59-.98,6.26Z"></path><path class="cls-28" d="M67.7,307.2c-.89-2.79,1.55-4.68,1.91-7.14,1.2,2.09,2.07,16.78.16,16.9,0,0-.05-.02-.05-.02-.49-2.49,1.49-9.75-2.02-9.75Z"></path><path class="cls-19" d="M71.63,330.07c.34-.33.68-.67,1.03-1,.37.02.74.03,1.11.05-.07.98-.15,1.96-.22,2.94-.63,0-1.27.01-1.9.02,0-.67,0-1.33,0-2Z"></path><path class="cls-8" d="M154.35,285.39c1.23,2.9-2.4,5.88.12,8.76-.07,1.39-.71,2.4-1.95,3.04-1.55-.95-3.26-1.19-5.04-1.05-.29-.62-.59-1.24-.88-1.86-.3-.09-.6-.17-.91-.22-.14-1.6-.28-3.21-.42-4.81.42-.07.83-.13,1.25-.2,0,0-.01,0-.01,0,.47,1.59,1.99,2.75,3.12,2.26,1.34-.59-.55-2.11-.25-3.3.82-2.52,2.09-4.92,2.4-7.57.24.22.43.48.58.77-.08,1.74.89,2.99,1.98,4.17Z"></path><path class="cls-12" d="M154.35,285.39c-1.1-1.18-2.06-2.43-1.98-4.17,2.12,0,3,1.2,3.1,3.17-.37.33-.75.67-1.12,1Z"></path><path class="cls-10" d="M100.57,319.08c-1.45.43-.64,2.07-1.5,2.82-1.52-5.1-1.31-10.28-.95-15.48,1.87-.89,3.78-1.76,3.51-4.37,4.92,1.52-1.73,10.05.09,14.84-.7.64-1.24,1.21-1.18,2.21l.03-.03Z"></path><path class="cls-30" d="M96.54,307.24c-.12,5.2.55,11.03-1.35,15.86-.23-.34-.45-.69-.68-1.03.87-3.1-1.38-5.88-.92-8.94,1.74-1.47.63-4.54,2.95-5.89Z"></path><path class="cls-1" d="M94.51,311.11c.06.84-.1,1.58-.92,2.03-.46-1.02-.92-2.04.92-2.03Z"></path><path class="cls-30" d="M145.28,289.25c.75,3.34-.43,5.95.93,9.35.16-1.74.28-3.03.4-4.31,1.34,2,.76,4.37.84,6.64-1.35-.35-2.71-.7-4.06-1.06-.07-3.66-.35-7.37,1.89-10.62Z"></path><path class="cls-19" d="M151.5,282.23c-.7,1.93-1.41,3.86-2.11,5.79-1.47-1.06-2.04.33-2.87,1.04,0-2.25-.07-4.55-.09-6.81,1.69,0,3.38-.01,5.07-.02Z"></path><path class="cls-30" d="M140.5,298.96c-.37-2.45.38-4.64,1.32-6.87.23.06.46.11.69.17,0,2.53,0,5.06,0,7.59-.67-.3-1.34-.59-2.01-.89Z"></path><path class="cls-30" d="M139.27,289.27c-.29-.05-.57-.09-.86-.12.03-.66-.04-1.35.11-1.98.23-.95-.65-2.13.58-2.86.28,1.66.5,3.29.17,4.96Z"></path><path class="cls-30" d="M139.31,292.21c-.17-.43-.57-.8-.04-1.14.01.38.03.76.04,1.14Z"></path><path class="cls-8" d="M69.45,279.09c-.04,4.76-4.41,9.08-1.14,14.3.89,1.42.21,3.83.25,5.79-3.89.12-2.5,4.54-4.84,5.93-.85-2.99,3.75-10.14-1.02-10.77-1.55-.97,1.2-4.01-2.02-4.18-.07-3.41-.64-7.17,1.96-10.03-.86-1.9-3.48-3.52-.99-5.97q4.86,3.8,6.98-1.96c.37.35.74.71,1.11,1.06-.1,1.94-.2,3.89-.3,5.83Z"></path><path class="cls-28" d="M62.65,280.14c-2.54,2.63-1.85,5.99-2.09,9.15-.64.31-1.28.62-1.92.93-1.27-4.7-5.21-8.66-3.86-14.08,2.9.8,4.34,4.45,7.87,4Z"></path><path class="cls-10" d="M69.45,279.09c.1-1.94.2-3.89.3-5.83.63-.02,1.7-2.61,1.82.22.14,3.55.01,7.1,0,10.65-2.01,2.74-.56,5.88-1,8.8-1.97-4.49-.25-9.27-1.12-13.84Z"></path><path class="cls-8" d="M230.25,401.91c-3.11.48-2.26-3.98-4.97-3.99.15-1.42.89-2.86-.15-4.24,1.1-5.4,7.67-8.15,5.24-14.59,1.58-4.05,5.48-7.14,4.95-12.05,2.2-.76,4.12.59,5.71,1.89.03.7.05,1.39.08,2.09-2.11,2.42-2.32,5.86-2.85,8.89-1.89,3.99-4.66,7.7-6.01,11.89-4.55,2.65-2.72,6.12-2,10.11Z"></path><path class="cls-30" d="M232.49,390.69c1.92-3.59,3.85-7.18,5.77-10.77,5.61-.42,2.77-7.25,6.95-8.87.44.99-1.11,1.95-.04,2.95.53,1.13-1.55,2.79-.11,3.13,1.2.28,1.16-1.84,1.32-3.05,1.16,4.32.48,5.17-3.22,6.88-4.82,1.71-5.41,9.04-10.67,9.73Z"></path><path class="cls-10" d="M241.1,371.03c-.03-.7-.05-1.39-.08-2.09,2.26-1.82.89-4.81,2.26-6.92,1.89-1.11,1.1-4.39,3.87-4.79,0,2.56,0,5.11-.01,7.67-.63.7-1.26,1.41-1.9,2.11-2.34.83-2.2,3.68-4.01,4.95,0-.31-.05-.62-.13-.92Z"></path><path class="cls-28" d="M241.24,371.95c1.81-1.27,1.67-4.11,4.01-4.95-.01,1.35-.02,2.7-.04,4.05-4.18,1.62-1.34,8.45-6.95,8.87.37-2.73.83-5.44,2.05-7.95.31,0,.62-.01.93-.02Z"></path><path class="cls-10" d="M230.24,400.69c-1.72-3.5-1.61-6.59,2.01-8.89,4.59.67-1.05,6.91-2.01,8.89Z"></path><path class="cls-28" d="M246.38,374.08c-.16,1.21-.12,3.33-1.32,3.05-1.44-.34.64-1.99.11-3.13.4.03.81.05,1.21.08Z"></path><path class="cls-28" d="M245.25,367c.63-.7,1.26-1.4,1.89-2.11.09,1.35-.53,2.06-1.89,2.11Z"></path><path class="cls-12" d="M168.38,396.92c1.92,5.27-1.23,9.48-2.94,13.99-8.88.82-1.71-15.47-11.01-7-4.66-2.53-1.85-6.54-1.98-9.97.27,0,.55.01.82.03.24,1.01.47,2.02.71,3.02,1.6-.94,3.99-.66,4.68-3.01,2.26.31,4.52.63,6.78.94.56,1.29,1.51,2.01,2.95,2.01Z"></path><path class="cls-3" d="M130.67,379.92c-1.7-2.03-2.75.35-5.12-2.99-.27-3.68.55-7.29.94-10.94,1.34,0,2.69,0,4.03,0,1.71,1.73.66,5.31,3.98,5.97,1.62,3.48,3.43,1.16,5.97-.04.13,5.3-3.89,11.34-9.8,8Z"></path><path class="cls-10" d="M134.5,371.96c-3.32-.66-2.27-4.24-3.98-5.97,3.26.67,3.63-2.23,4.92-3.99.25.32.49.64.74.96.68-1.02-.41-3.11.92-3.55,4.38-1.52,3.12-5.17,3.45-8.24,8.85-.77,2.29,4.58,1.86,9.7l-2.22-.62c.14,2.97-2.64,6.03.31,8.9,0,.92-.01,1.83-.02,2.75-.67.33-1.34.66-2,.99-.61-1.45-1.01-3.97-1.88-4.14-1.79-.36-.48,2.62-2.09,3.2Z"></path><path class="cls-28" d="M142.38,391.82c-3.58-6.84,2.46-15.25-1.07-22.72.69-.05,1.37-.11,2.06-.16,2.4,3.29,3.76,6.87,3.08,11.02-5.82,2.03-3.12,7.58-4.04,11.93l-.03-.07Z"></path><path class="cls-8" d="M143.38,368.94c-.95.12-1.94.08-2.89.22-2.95-2.87-.17-5.94-.31-8.9.74.21,1.48.41,2.22.62,1.89,2.37.96,5.44.98,8.06Z"></path><path class="cls-4" d="M130.67,379.92c.93.37,1.87.74,2.8,1.11.07,1.31.32,4.34-1.83,3.53-2.06-.82-.83-3.03-.97-4.65Z"></path><path class="cls-26" d="M226.04,390.88c-.31.93-.61,1.86-.92,2.79-7.39,1.62-10.98,8.46-16.82,12.21-1.94-2.52-.37-5.47-1-8.12-.38-1.61,1.41-3.72-1.06-4.85-.97.35-1.94.69-2.91,1.04-1.8-1.55-1.55-6.87,1.51-5.64,6.97,2.85,13.4,3.25,18.52-3.63.83-1.11,2.52-1.12,3.64-.18,1.62,1.36-.62,1.81-.91,2.75-.38,1.26-1.33,2.38-.05,3.63Z"></path><path class="cls-4" d="M203.33,393.96c.97-.35,1.94-.69,2.91-1.04-1.9,6.2,2.35,13-1,18.84-5.25.68-1.35-6.32-3.9-8.95,1.34-2.79,2.25-5.69,1.98-8.86Z"></path><path class="cls-13" d="M206.38,407.94c.8-5.01-1.68-10-.14-15.01,2.47,1.13.68,3.24,1.06,4.85.63,2.65-.94,5.6,1,8.12-.05,1.24.59,3.12-1.93,2.05Z"></path><path class="cls-26" d="M176.49,395.9c9.58-6.32,3.15,25.43,26.84-.98.23,2.85-.86,5.37-1.98,7.89-3.38.53-4.57,3.5-6.4,5.76-6.1,8.58-9.41-4.19-18.46-1.76,0,0-.01.02-.01.02-1.63-3.24-1.83-7.58.02-10.94Z"></path><path class="cls-4" d="M166.24,384.85c5.86-1.72,6.07-1.6,10.23,6.26-.53,4.17-9.18,8.18-11.04,3.8.89-2.73,4.03-5.1,2.6-8.05-2.52-1.59-2.75,2.49-2.66,4.07-.31,0-.62,0-.92,0,.3-2.04-1.2-5.6,1.8-6.07Z"></path><path class="cls-13" d="M175.49,404.9c.33.65.65,1.3.98,1.94-.95-.34-1.09-1.08-.98-1.94Z"></path><path class="cls-28" d="M108.03,359.16c.46,1.36.93,2.72,1.39,4.09.43,1.28-.65,3.44.79,3.78,1.7.4.82-2.53,2.34-3.08,3.91,12.13-3.18,2.62-3.14,8.83-.85.48-1.8.82-2.68,1.26-2.27-2.4-.61-5.4-1.24-8.05.85-2.28,1.7-4.55,2.55-6.83ZM108.09,365.67c-.46.58-.48,1-.07,1.59.47-.55.46-.98.07-1.59Z"></path><path class="cls-2" d="M105.48,365.99c.63,2.65-1.02,5.65,1.24,8.05-.11.95-.22,1.91-.33,2.86-6.18,1.04-4.66-6.05-4.83-9.91,1.52-1.55.26-1.78-.97-2.02.03-.93-.12-2.22-.01-2.95,3.57-1.06,2.19,3.98,4.9,3.98Z"></path><path class="cls-3" d="M113.52,373.67c.67.62.96,2.35-.36,1.78-.45-.59-.77-1.47.36-1.78Z"></path><path class="cls-3" d="M109.41,372.79c3.33.6.56,3.4-.06.06,0,0,.06-.06.06-.06Z"></path><path class="cls-21" d="M100.59,364.97c1.23.24,2.49.46.97,2.02-.82-.43-.98-1.19-.97-2.02Z"></path><path class="cls-4" d="M125.55,376.92c.98.71,1.42,2.19,2.98,2.07-.04.33-.09.67-.13,1-1.87.93-2.53,5.54-5.9,1.95-1.39-1.75-1.73-3.25.97-4.02.41,2.95,2.51,1.2,2.03-.97l.05-.05Z"></path><path class="cls-4" d="M122.49,374.95c.72-1.14,1.89-.94,2.98-.99.03.99.05,1.98.08,2.97,0,0-.05.05-.05.05-.68,0-1.35,0-2.03.01-.79-.46-.94-1.21-.98-2.03Z"></path><path class="cls-10" d="M123.47,376.98c.68,0,1.35,0,2.03-.01.44,3.32-2.4,3.29-2.03.01Z"></path><path class="cls-4" d="M266.06,347.98c.43-1.62.85-3.25,1.28-4.87,2.81-1.93.43-6.33,3.81-7.99.3.32.6.65.89.97-2.27,4.14.95,9.49-3.03,12.9-.98-.34-1.97-.67-2.95-1Z"></path><path class="cls-19" d="M99.58,341.07c.34-.74.97-.94,1.71-.95.02.98.03,1.97.05,2.95-1.7,2.03,3.69,4.68-.72,12.94-1.12.49-1.46,2.16-3.01,1.99.07-3.98.14-7.97.2-11.95,2.85-.86,1.34-3.26,1.76-4.98Z"></path><path class="cls-10" d="M99.58,341.07c-.42,1.72,1.1,4.12-1.76,4.98-2.83-.35-.14,3.7-3.25,2.98-.81-2.18,1.43-5.43-2.01-6.02.02-.67.03-1.34.05-2.01,2.32,0,4.65.02,6.97.07Z"></path><path class="cls-4" d="M94.57,349.03c.31,0,.62,0,.92,0-.02,1.1.31,2.29-.89,3.04-.01-1.01-.02-2.02-.03-3.04Z"></path><path class="cls-21" d="M101.34,343.07c.04-1.35-.29-2.76.34-4.01,1.53.88.12,4.01,2.88,3.87,3.34-.16,1.01-3.76,2.85-4.88,0,3.35-.02,6.69-.02,10.04-1.14,1.89-1.75,3.69.81,4.98,1.06,4.56-1.2,8.75-2.71,12.92-2.71,0-1.33-5.04-4.9-3.98-.1-2,2.29-3.98.04-6,2.5-4.28,1.51-8.36.72-12.94Z"></path><path class="cls-1" d="M82.78,330.23c.5,5.67,3.55,10.93,2.74,16.82-1.27,0-2.54-.02-3.81-.03-1.21-1.05-.72-3.07-2.24-3.95.36-4.47,2.34-8.53,3.3-12.85Z"></path><path class="cls-30" d="M85.7,346.97c.68.05,1.36.09,2.04.14-.08.3-.14.6-.18.9-.23,0-.68.01-.91,0-.32-.35-.64-.69-.95-1.04Z"></path><path class="cls-19" d="M74.46,336.12c2.01,2.33.87,5.2,1.34,7.79-1.02.05-2.07.14-3.09.12.01-2,.02-4.01.03-6.01.57-.63,1.15-1.27,1.72-1.9Z"></path><path class="cls-8" d="M64.59,313.13c1.08-.03.87,3.89,2.9.94.09,1.35.17,2.7.26,4.05-.67,1-1.35,2.01-2.02,3.01-.36-.01-.71-.02-1.07-.04-.02-2.65-.05-5.31-.07-7.96Z"></path><path class="cls-4" d="M67.75,318.12c-.17-3.62-.65-7.33-.05-10.92,3.53.04,1.52,7.25,2.02,9.75-.37.37-.73.75-1.1,1.12-.29.02-.58.03-.87.05Z"></path><path class="cls-4" d="M94.35,346.87c.07.72.15,1.44.22,2.16-2.42,1.35-2.55-1.95-.22-2.16Z"></path><path class="cls-26" d="M230.28,352.02c-2.22,2.98-5.55-2.03-3.42-3.76,3.57-3.08,2.28-6.12.36-9.29.41-.95.82-1.89,1.23-2.84.84.31,1.68.63,2.52.94.12,1,.25,2.01.37,3.01,0,0-.29-.09-.29-.09-.79.69-.84,1.38.02,2.06.67,2.24.03,4.66-.02,6.96-.93.83-.75,1.94-.77,3Z"></path><path class="cls-1" d="M243.29,362.01c-1.37,2.11,0,5.1-2.26,6.92-1.46-1.15-2.92-2.3-4.96-2.08.03-.32,0-.63-.09-.94.15-.28.25-.57.31-.88l1.88-1.06c2.92,2.51,3.11-2.1,5.12-1.96Z"></path><path class="cls-10" d="M233.2,357c-.31-.34-.62-.68-.94-1.01,0-.65,0-1.31,0-1.97,0,0,0-.01,0-.01,1.03-.3,3.37.71,1.99-1.99.04-.66.08-1.33.12-1.99.9-.32,1.81-.63,2.71-.95.43,2.58-.66,5.31-.83,7.93-1.02,0-2.04,0-3.06,0Z"></path><path class="cls-15" d="M234.38,350.02c-.04.66-.08,1.33-.12,1.99-.8.08-1.6.16-1.99,1.04-.39-.34-.78-.68-1.17-1.02-.11-2.34.04-4.67.24-7,.61,0,1.21,0,1.82,0,.41,1.66.81,3.33,1.22,4.99Z"></path><path class="cls-30" d="M234.38,350.02c-2.62-8.66.03-10.08,2.71-.95-.9.32-1.81.64-2.71.95Z"></path><path class="cls-10" d="M238.17,363.98c-.63.35-1.25.7-1.88,1.06.28-2.65.57-5.29.85-7.94l2.03-.07c-.33,2.32-.67,4.64-1,6.95Z"></path><path class="cls-30" d="M239.17,357.02c-.97.02-1.94.14-2.9-.02.35-2.36.7-4.71,1.04-7.07,2.83,1.78.51,4.92,1.86,7.09Z"></path><path class="cls-10" d="M230.97,337.08c-.84-.32-1.68-.63-2.52-.94.03-1.8.44-3.37,2.47-3.9.01,1.61.03,3.23.05,4.84Z"></path><path class="cls-15" d="M231.35,343.02c-.38-.97-.27-2-.29-3.02,1.45.63,1.55,2.07.29,3.02Z"></path><path class="cls-15" d="M261.18,340.03c.29-.37.58-.73.86-1.1-.29.37-.58.73-.86,1.1Z"></path><path class="cls-4" d="M197.34,300.39c4.14,1.87,5.06,2.41,2.04,6.73-1.35-.02-2.7-.04-4.05-.05-.09-2.38-.3-5.07,2.01-6.68Z"></path><path class="cls-28" d="M192.53,309.99c1.14-1.04,2.46-1.99,1.8-3.86.3,0,.6-.01.9-.02.25,1.31.05,2.69.14,4.03l-2.83-.14Z"></path><path class="cls-28" d="M110.4,322.18c-.02,4.5.21,9.05-2.76,12.92-1.18-1.1-2.66-2.04-2.04-4.05,3.31-2.58-3.23-14.42,3.1-11.82-.12,1.87-.78,7.57,1.7,2.94Z"></path><path class="cls-30" d="M99.57,327.1c-.11-2.73,1.56-5.24.99-8.03,0,0-.03.03-.03.03,1.09-.4.69-1.49,1.18-2.21.88-.28,1.64-2.96,2.66-.36,1.01,2.55-2.2,9.19-4.8,10.57Z"></path><path class="cls-10" d="M119.53,304.14c-1.32-.01-2.65-.03-3.97-.04.32-1.26.77-2.49.92-3.77.17-1.45-.64-2.71,1.91-1.03,1.45.96.18-3.05,1.73-4.11.42,2.36-.7,4.92.93,7.13,0,0,.06.01.06.01-.24.6-.47,1.21-.71,1.81-.3,0-.59,0-.89,0Z"></path><path class="cls-4" d="M155.5,304.08c-2.43.09-6.03.67-6.17-2.9,1.03-1.36,3.3-1.73,3.19-4,1.24-.63,1.89-1.65,1.95-3.04,1.82,3.03.85,6.66,1.02,9.93Z"></path><path class="cls-28" d="M158.31,304.89c-1.06.15-2.12.3-2.87-.75,1.02,0,2.11-.26,2.87.75Z"></path><path class="cls-26" d="M177.24,306.1c-.28.25-.55.51-.83.76-1.47.15-2.94-.61-3.94-1.66,0-.36,0-.72,0-1.08.67-.72,1.34-1.44,2.02-2.15,3.06-.05,3.22,1.83,2.75,4.13Z"></path><path class="cls-30" d="M174.48,301.97c-.67.72-1.34,1.44-2.02,2.16,0-.99,0-1.98-.01-2.96,1.14-.69.99-1.89,1.16-2.96.16-.01.49,0,.65,0,.14,1.25.17,2.5.22,3.76Z"></path><path class="cls-1" d="M186.25,307.24c-1.24-.69-2-1.65-1.75-3.17,2.64.71,3.78-1.01,4.77-2.96.37,1.67.73,3.34,1.1,5.01-.39.98-.78,1.96-1.16,2.94-.17.04-.34.06-.52.04-.28-1.31-.04-3.33-2.44-1.86Z"></path><path class="cls-30" d="M171.25,302.2c-.3-.35-.6-.69-.9-1.04.05-.96.11-1.93.16-2.89,1.56.55.46,1.96.92,2.86-.06.36-.12.71-.18,1.07Z"></path><path class="cls-28" d="M171.25,302.2c.06-.36.12-.71.18-1.07.34.01.68.02,1.03.03.09,1.91-.17,3.85.12,5.74-.42.02-.83.03-1.25.05-.02-1.58-.05-3.16-.07-4.75Z"></path><path class="cls-28" d="M174.26,298.21c-.16-.02-.49-.02-.65,0-.71-2.75,1.28-2.75.65,0Z"></path><path class="cls-12" d="M96.45,341.02c-1.28,0-2.56-.01-3.84-.02-.33-1.08-1.66-2.3.66-2.89,2.68-.68,2.64,1.38,3.19,2.91Z"></path><path class="cls-1" d="M152.52,297.19c.11,2.27-2.16,2.64-3.19,4-.63-.09-1.26-.17-1.88-.26.01-1.59.03-3.19.04-4.78,1.78-.14,3.48.1,5.04,1.05Z"></path><path class="cls-8" d="M67.48,308.13c-.02,1.31-.03,2.63-.05,3.94-1.13-1.33-1.13-2.64.05-3.94Z"></path><path class="cls-1" d="M146.52,289.06c.82-.71,1.4-2.1,2.87-1.04-.3,1.19,1.59,2.71.25,3.3-1.13.49-2.65-.67-3.12-2.26Z"></path><path class="cls-1" d="M146.61,294.28c-.12,1.29-.24,2.57-.4,4.31-1.04-1.78-.58-3.17-.51-4.54.31.05.61.13.91.22Z"></path><path class="cls-1" d="M101.54,317.14c-.13.76-.1,1.59-1,1.96.03-.81.2-1.54,1-1.96Z"></path><path class="cls-10" d="M230.36,379.09c-1.31-3.7.78-6.76,1.9-10.01.94-.77,1.88-1.54,2.81-2.31l.23.27c.53,4.91-3.37,8-4.95,12.05Z"></path><path class="cls-1" d="M241.24,371.95c-.31.01-.62.02-.93.02.27-.32.53-.63.79-.95.08.3.12.61.13.92Z"></path><path class="cls-10" d="M235.98,365.91c.09.31.12.62.09.94-.25.07-.5.13-.76.19,0,0-.23-.27-.23-.27.3-.29.6-.57.9-.86Z"></path><path class="cls-28" d="M153.14,392.89c.15-.95.31-1.89.46-2.84,2.96-.12,6.15-.11,5.79-4.11.74-.09,1.46.05,2.19.14-1.28,4.45-2.34,10.11-7.61,10.91-.29-1.36-.72-2.7-.83-4.1Z"></path><path class="cls-19" d="M158.65,393.97c1.56-2.42,2.09-5.21,2.93-7.9.6-.01,1.21-.02,1.81-.03.02.78.1,1.52,1.01,1.82,0,.36,0,.73,0,1.09-3.37-.13-2.54,4.99.04,1.97.99,0,1.98.02,2.97.02-.66,1.32-1.32,2.65-1.98,3.97-2.26-.31-4.52-.63-6.78-.94Z"></path><path class="cls-19" d="M153.14,392.89c.04.36.08.72.12,1.07-.27-.02-.55-.03-.82-.03.23-.35.47-.7.7-1.05Z"></path><path class="cls-12" d="M154.42,389.93c-.27.09-.54.13-.83.11-2.59-2.91-5.29-1.14-7.92-.12-1.18.46-1.67,2.14-3.27,1.97-.42-3.35,2.11-7.32,5.38-5.47,2.19,1.16,6.65-1.64,6.63,3.51Z"></path><path class="cls-19" d="M126.49,365.99c-2.21-2.62-.44-5.21.04-7.82.07-1.37-.41-2.8.58-4.43.53,1.95-.53,5.49,2.01,5.61,1.72-.16,1.24-2.31,1.41-3.73.31-2.72-2.46-4.65-1.86-7.43.91-.03,1.82-.05,2.73-.08,3.53,3.37,2.42,9.45,4.04,13.9-2.07,4.93-4.06,4.03-8.94,3.99Z"></path><path class="cls-19" d="M134.5,371.96c1.61-.58.3-3.56,2.09-3.2.87.18,1.27,2.69,1.88,4.14-1.88,2.01-2.96.71-3.97-.94Z"></path><path class="cls-8" d="M131.39,348.11c-.91.03-1.82.05-2.73.08l-.19-.2c2.02-1.35,4.04-2.69,6.06-4.04,2.34.09,4.72.42,6.9-.85l.02-.05c1.19,4.19,4.11,5.05,7.95,4.14,1.82,2.23,5.49,1.09,7.02,3.85h0c.34.24.69.49,1.03.73.99.05,1.99.01,2.93.36.33,1.22.65,2.43.98,3.65-1.63-.31-3.27-.62-4.9-.93-.21-3.44-6.27-2.21-2.85.24-.1.96-.21,1.92-.31,2.89-3.45-3.24-5.11-.47-6.84,2.05h.01c-3.1-.66-1.65-3.15-1.98-4.93,2.29-4.94-1.57-3.68-3.95-3.92-2.05-4-4.89-5.65-9.15-3.07Z"></path><path class="cls-1" d="M131.39,348.11c4.26-2.58,7.1-.93,9.15,3.07-.33,3.07.93,6.72-3.45,8.24-1.33.44-.23,2.53-.92,3.55-2.99-4.24-.75-11.27-4.78-14.86Z"></path><path class="cls-1" d="M144.49,355.1c.33,1.77-1.12,4.26,1.98,4.92-2.92,2-1.06,5.72-2.91,8.1-.5-2.39.82-5.08-1.16-7.24.75-1.91.55-4.16,2.09-5.78Z"></path><path class="cls-12" d="M143.56,368.12c1.85-2.38,0-6.1,2.91-8.1,0,0-.01,0-.01,0,1.37.07,3.07-.35,2.91,1.98-2.29,0-3.79.74-2.1,3.15,2.51,2.38-.71,7.04,2.39,7.63,1.31.25,2.24-.52,2.64-1.71,1.36-4.1,2.77-2.28,4.55-.24,2.96,5.02,1.24,11.53,2.38,17.13-.95,1.44-2.03,2.5-3.75,1.75-.86-1.67,1.91-5.33-2.2-5.05-9.92.73-4.62-10.94-9.91-15.72.09-.27.15-.55.19-.83Z"></path><path class="cls-19" d="M146.45,379.96c1.07,3.32,2.92,4.98,6.84,4.71,4.11-.28,1.34,3.38,2.2,5.05-.35.07-.71.15-1.06.22.02-5.15-4.44-2.35-6.63-3.51-1.82-.96-4.34-.28-5.13,2.46,0-3.52-.84-7.39,3.8-8.93Z"></path><path class="cls-12" d="M191.32,368.99c-1.43.75-2.54,2.16-4.43,1.99-7.3-.64-14.39.32-21.24,2.96-.06-1.99-.12-3.99-.18-5.98,2.08-1.92,4.92,1.34,6.93-1.02,3.27-.53,9.65,2.09,9.91-2.98.08-1.96,2.32-1.68,3.06-2.96h0c1.66-.3,2.7-3.72,4.97-.97-.24,2.6-.92,5.82.87,7.95.04.34.08.68.12,1.01Z"></path><path class="cls-21" d="M165.47,367.96c.78,4.24-.91,7.9-1.09,12.03-1.7,1.79-.59,4.05-.99,6.05-1.04.03-2.06.05-3.09-.14.06-.65.13-1.3.19-1.96.6-.25.19-.58.03-1-1.11-1.95.01-3.94-.13-5.91-1.14-4.17,3.25-6.44,3.48-10.13.53.35,1.06.7,1.59,1.05Z"></path><path class="cls-3" d="M235.98,365.91c-1.15,1.15-2.47,2.12-3.71,3.17.06-4.05-.39-8.13.94-12.08,1.31.02,2.63-.07,3.94.09-.47,2.91-.33,6-1.16,8.82Z"></path><path class="cls-13" d="M190.31,360.97c-.06-.32-.05-.63.02-.95,3.46-1.89,6.96-4.98,8.01-9.08.07-.5.07-1.65.88-.38,1.06,4.46,0,8.75-3.92,11.43-1.32-2-3.29-.84-4.99-1.02Z"></path><path class="cls-28" d="M190.31,360.97c1.7.18,3.67-.98,4.99,1.02-2.09,1.9-.74,5.75-3.98,7-.04-.34-.08-.68-.12-1.01-.27-.35-.54-.69-.81-1.04-.21-1.99-.74-3.97-.08-5.97Z"></path><path class="cls-28" d="M163.39,386.05c.4-2.01-.71-4.26.99-6.05,0,0,.39-.07.38-.07-.16,1.39-.74,3.03,1.7,2.9-.07.68-.14,1.35-.21,2.03-2,.16-1.74,1.7-1.85,3.01-.9-.29-.99-1.04-1.01-1.82Z"></path><path class="cls-4" d="M166.46,382.82c-2.44.13-1.86-1.51-1.7-2.9,1.73.29,1.65,1.63,1.7,2.9Z"></path><path class="cls-30" d="M232.27,353.05c.39-.87,1.18-.96,1.99-1.04,1.38,2.7-.96,1.7-1.99,1.99,0-.32,0-.64,0-.96Z"></path><path class="cls-10" d="M231.05,349.02c.02,1.01.03,2.01.05,3.02-.27,0-.55-.01-.82-.01.02-1.06-.16-2.18.77-3Z"></path><path class="cls-30" d="M232.26,354.02c0,.66,0,1.31,0,1.97-1.05-.65-1.02-1.31,0-1.97Z"></path><path class="cls-12" d="M167.41,390.94c-.68,0-1.36,0-2.04-.01-.73-6.95,5.52-4.71,2.04.01Z"></path><path class="cls-12" d="M164.45,390.92c-2.59,3.02-3.42-2.1-.04-1.97.01.66.03,1.31.04,1.97Z"></path><path class="cls-30" d="M128.48,337.05c3.48,4.3,10.8-.42,12.95,6.05-2.18,1.26-4.55.94-6.9.85-1.55-1.12-2.46-3.29-4.89-2.97-.76-.93-1.5-1.11-2.24.02-.3.02-.6.03-.9.03.66-1.32,1.32-2.65,1.98-3.97Z"></path><path class="cls-8" d="M128.67,348.19c-.6,2.78,2.17,4.71,1.86,7.43-.16,1.42.32,3.57-1.41,3.73-2.54-.12-1.48-3.66-2.01-5.61-.99,1.64-.52,3.06-.58,4.43-1.41-5.1-1.72-10.22-.14-15.35.67,1.73-1.22,4.5,2.08,5.17l.19.2Z"></path><path class="cls-21" d="M128.47,347.99c-3.37-.67-1.61-4.77-1.97-6.96,3.61-.49,5.79.21,8.03,2.92-2.02,1.35-4.04,2.69-6.06,4.04Z"></path><path class="cls-28" d="M108.19,353.07c-2.56-1.29-1.95-3.09-.81-4.98.34,1.65,1.61,3.15.81,4.98Z"></path><path class="cls-20" d="M108.09,365.67c.4.62.41,1.04-.07,1.59-.41-.59-.39-1.01.07-1.59Z"></path><path class="cls-10" d="M101.34,343.07c.01.65.03,1.29.04,1.94-.86-.63-.89-1.28-.04-1.94Z"></path><path class="cls-10" d="M231.05,340c0,.69.01,1.37.02,2.06-.86-.68-.81-1.36-.02-2.06Z"></path><path class="cls-13" d="M188.5,310.01c-.06-.33,0-.64.19-.92.18.01.35,0,.52-.04.72.21,1.71-.12,2,.97-.9,0-1.81,0-2.71-.01Z"></path><path class="cls-20" d="M172.57,306.9c-.06-.27-.09-.55-.1-.83,1.05-.14,1.94.45,2.88.82-.93,0-1.86,0-2.79,0Z"></path><path class="cls-30" d="M173.38,306.06c-.23.02-.68.03-.91.01-.08-.29-.08-.58-.01-.87.31.29.62.57.92.86Z"></path><path class="cls-4" d="M183.41,351.99c1.35.62,4.34-2.03,3.98,2,.69,2.74-1.59,4.62-2.03,7.03,0,0,0-.01,0-.01-5.46-.26-1.35-5.76-2.11-8.86l.16-.16Z"></path><path class="cls-28" d="M185.36,361.01c.44-2.41,2.71-4.29,2.03-7.03,3.99-.7,4.41,2.28,5.13,4.96-.73.36-1.46.72-2.18,1.08-2.27-2.75-3.31.67-4.97.99Z"></path><path class="cls-28" d="M178.32,348.17c2.74-.03,5.59-.9,8.08,1.04-2.18,1.72-5.42.46-8.03.81-.01-.62-.03-1.23-.04-1.85Z"></path><path class="cls-4" d="M178.36,350.02c1.67,0,3.34.01,5,.02.01.65.03,1.29.04,1.94,0,0-.16.15-.15.15-1.69-.55-4.31.98-4.87-2.15l-.03.04Z"></path><path class="cls-19" d="M160.49,383.95c-.06.65-.12,1.3-.19,1.96-.31,0-.61,0-.92.03-1.05-2.98-1.07-6.05-.83-9.14.61.08,1.22.17,1.84.25.14,1.97-.99,3.96.12,5.91,0,.33-.02.66-.03,1Z"></path><path class="cls-19" d="M158.43,388.94c.27-.32.54-.65.8-.97-.27.32-.53.65-.8.97Z"></path><path class="cls-1" d="M160.4,377.05c-.61-.08-1.22-.17-1.84-.25.68-2.89-4.08-12.54-6.26-5.72-.44,2.63-5.41,2.12-3.87-.81,4.95-2.23,2.39-5.31.93-8.26.17-2.33-1.54-1.91-2.91-1.98,1.73-2.52,3.39-5.28,6.84-2.05,1.42,8.6,10.23,4.74,15.96,5.04-.08,1.05.84,3.17,1.36,1.3.6-2.1,2.68-3.78,1.82-6.29,2.88-.43,1.1-2.43-.98-2.08.43-2.22,6.14.96,3.99-3.91.63-.05,1.26-.09,1.9-.14,1.3,2.63-1.05,7.82,4.99,7.12.66,1.2,1.52,2.08,3.03,1.98-.74,1.28-2.98,1-3.05,2.96-1.21-2.29-3.07-1.36-4.82-.98-2.82-5.04-5.86.3-5.09,3.96-2.01,2.36-4.85-.9-6.93,1.02-.53-.35-1.06-.7-1.59-1.05-.23,3.7-4.62,5.96-3.48,10.13Z"></path><path class="cls-28" d="M169.26,363.02c-2.7-.3-5.3.26-7.87.95-.01-2.73,5.45-5.48-.03-8.19-.33-1.22-.65-2.43-.98-3.65,1.14-.46,3.31.55,3.37-1.02-.02-2-2.87-.74-4.18-1.25,3.28-1.94,6.16-.52,9.02,1.08-2.63,2.3.59,4.7-.13,7.03-.29,1.77.04,3.44.79,5.05Z"></path><path class="cls-4" d="M159.57,349.86c1.31.51,4.16-.75,4.18,1.25-.07,1.57-2.23.56-3.37,1.02-.33-.09-.66-.18-1-.27.06-.67.12-1.33.19-2Z"></path><path class="cls-1" d="M156.46,354.85c-.95.08-1.9.16-2.85.24-3.42-2.45,2.65-3.68,2.85-.24Z"></path><path class="cls-4" d="M156.42,351.03c.34.25.69.5,1.03.74-.34-.25-.69-.5-1.03-.74Z"></path><path class="cls-26" d="M149.37,362c1.46,2.95,4.02,6.03-.93,8.26,1.14-3.18-5.1-8.47.93-8.26Z"></path><path class="cls-28" d="M177.49,362.98c5.8-2.46,8.79,5.88-5.09,3.96.02-.36.04-.73.07-1.09,2.28.09,5.16,1.24,5.03-2.88Z"></path><path class="cls-41" d="M190.39,366.94c.27.35.54.69.81,1.04-.27-.35-.54-.69-.81-1.04Z"></path><path class="cls-28" d="M160.49,383.95c0-.33.02-.66.03-1,.17.41.57.75-.03,1Z"></path><path class="cls-28" d="M182.34,359.02c-6.04.7-3.69-4.49-4.99-7.12.06-.79.14-1.58,1.04-1.91.56,3.13,3.17,1.6,4.87,2.15.63,2.42-1.05,4.53-.92,6.88Z"></path><path class="cls-30" d="M168.46,357.97c.72-2.33-2.5-4.73.13-7.03,1.89,2.84,4.32,2.3,6.86,1.1,2.14,4.86-3.52,1.7-3.99,3.89-1,.68-2,1.36-3,2.04Z"></path><path class="cls-36" d="M172.17,347.2c.4.24.8.47,1.2.71-.62.13-1.05-.04-1.2-.71Z"></path><path class="cls-36" d="M171.5,346.01c.24.41.48.83.72,1.24-.24-.41-.48-.83-.72-1.24Z"></path><path class="cls-8" d="M129.64,340.98c-.75,0-1.49.01-2.24.02.74-1.13,1.49-.95,2.24-.02Z"></path><path class="cls-4" d="M168.46,357.97c.99-.65,2.05-1.43,3-2.02-.03.86.14,1.63.98,2.08.86,2.52-1.22,4.19-1.82,6.29-1.08,3.1-2.63-5.4-2.15-6.35Z"></path><path class="cls-19" d="M177.49,362.98c.13,4.12-2.75,2.97-5.03,2.88-.88-3.62,2.98-7.24,5.03-2.88Z"></path><path class="cls-30" d="M172.44,358.02c-.84-.45-1.01-1.21-.98-2.08,2.08-.35,3.85,1.65.98,2.08Z"></path></g><g id="FACE_OUTLINE"><path class="cls-35" d="M297.18,285.88c-.65,1.22-1.84,2.43-1.86,3.66.16,8.83-5.43,16.29-8.15,24.45-1.15,6.29-8.48,14.61-5.74,20.39.07.02.19.15.26.16-5.25-.33-5.6,11.7-7.56,15.47-.52,1.48-.45,2.79.71,3.75-1.79,2.31-5.04,6.76-4.18,9.72-2.4.64-4.19,3.4-5.14,5.6-1.67,3.25-5.43,5.59-4.45,9.99-3.53-.39-3.88,7.19-.82,6.04,1.4-5.31,5.55-8.83,8.58-13.19,6.04-11.38,10.43-22.89,14.02-35.44,1.68-.28,2.73-2.05,2.43-4.75-.62-5.68.63-11.15,1.94-16.61,6.11-7.47,12.07-16.6,10.09-26.9.52-.81.51-1.6-.12-2.35Z"></path><path class="cls-35" d="M277.9,83.87c9.11,10.35,10.66,24.83,18.39,36.12-.43-7.79-5.98-14.18-8.25-21.6-1.72-3.85-2.62-8.24-6.81-10.49-4.44-8.46-9.3-16.7-14.01-25.01-.5,8.2,6.65,14.49,10.67,20.98Z"></path><path class="cls-35" d="M331.24,245.53c-1.52-11.97-1.73-24.27-1.99-36.48,3.23-2.3,2.28-7.22-1.08-8.91.19-2.18-1.61-2.45-2.99-3.12-1.44.42-2.66-.51-3.98-.99-.09,2.26,1.75,1.61,2.92,1.98,0,.03.01.06.02.09,0,0,0,0,0,0l.12-.04c.75,1.74,1.38,3.66,3.95,2.94.66.64,1.32,1.29,1.98,1.93-.02.05-.03.1-.05.15.03,0,.05,0,.08.01-.06,2.04-.72,4.02-1.04,6.03.01-.01.03-.03.04-.04-3.23,13.83-.15,27.96.83,41.83-4.27,6.49-6.78,13.89-11.9,20.08-4.64,3.53-12.49,4.77-13.97,11.12-1.47-.18-2.08.52-1.98,1.94-.7.06-1.39.13-2.09.19.04,2.25,2.2.72,2.97,1.67,5.19-2.84,1.4-5.99,7.93-8.76,7.25-3.83,15.42-7.83,16.3-16.97,2.25-4.7,4.61-9.31,3.92-14.67Z"></path><path class="cls-35" d="M303.18,148.83c0,.07-.02.14-.02.21h.08c.01,2.8-.68,5.79,1.99,7.92.33,6.36.66,12.72.99,19.09-3.78,3.42.27,9.42.55,14.02.3-1.68.52-2.95.75-4.22-2.06-2.96-1.16-6.47-1.21-9.86-.02.01-.03.02-.04.03,2.09-4.66,1.6-14.19-.98-19,.01,0,.02.02.03.03-2.04-10.81-2.24-21.96-7.06-32.07.02,0,.03,0,.05,0-.7-1.7-1.4-3.39-2.1-5.09.5,1.76-1.41,4.52,2.02,5.07.55,8.05,2.43,16.23,4.96,23.87Z"></path><path class="cls-35" d="M264.36,59.87c-2.89-5.16-4.28-11.45-10.2-14.01,3.23,4.8,6.16,9.82,10.2,14.01Z"></path><path class="cls-35" d="M253.39,395.9c.08.14.18.25.28.36-1.92.74-1.52,2.04-.73,3.45-2.42-1.71-4.61-.51-5.99,1.74-11.66,14.97-35.06,22.46-54.36,21.6-29.55-3.12-57.73-13.44-82.7-29.39-2.87-1.82-7.11-4-10.75-2.4-.12-3.27-.89-3.77-4.11-2.63-1.32-8.29-14.08-10.25-17.93-18.38-.9-1.5-2.3-3.56-4.46-2.81.44-.72.21-1.89-.7-2.22-.32.64-.64,1.28-.97,1.92,7.09,15.23,23.67,22.77,37.66,30.1,1.4,3.03,4.67,2.92,6.77,4.68.67.56,2.28.16,2.77.76,4.53,5.55,12.2,4.86,17.59,9.13,3.45,2.74,8.75,2.65,13.01,5.07,34.57,15.36,84.31,15.93,106.4-19.75,1.66,1.73,3.16-8.39,4.14-9.9-4.46-1.65-6.11,5.36-5.93,8.67Z"></path><path class="cls-35" d="M19,167c.07,2.28.14,4.57.22,6.85,1.65-2.3,1.38-4.55-.13-6.75-5.23-18.16-2.27-37.43-3.32-56.13,3.41-2.77,4.23-6.9,5.16-10.76.75-5.22,3.94-9.43,5.15-14.35-.24.46-.48.91-.72,1.37,0-.01-.01-.02-.02-.03-12.19,17.43-16.19,61.16-6.34,79.79Z"></path><path class="cls-35" d="M182.73,5.98c.93.06,2.14.26,2.7.87,1.92,2.1,4.31,2.18,6.82,2.08-.01-.01-.02-.02-.04-.03,2.06,1.27,3.99,2.85,6.2,3.72,4.74,1.87,9.46,4.13,14.83,3.29-.22-.24-.42-.67-.66-.69-6.13-.61-11.84-2.45-17.16-5.58-.92-.54-2.17-.54-3.27-.78-3.66-3.34-7.65-5.67-12.94-4.99-2.44.31-4.96-.01-7.45.06-5.27.15-10.47.17-15.38-2.31-1.24-.63-2.86-.53-4.3-.76,4.54,2.86,9.33,4.49,14.85,4.33,5.25-.15,10.52.44,15.78.8Z"></path><path class="cls-35" d="M113.96,13.84c11.71-14.77,8.27-5.63,17.22-10.99-6.87-2.09-14.18,1.47-17.27,7.27-3.02,5.35-8.12,6.6-11.88,10.81,4.53-1.44,8.84-3.23,11.93-7.08Z"></path><path class="cls-35" d="M57.77,50.92c3-.98,4.58-3.67,6.36-6.06-5.85,1.62-21.59,11.91-22.12,18.1,4.5-5.08,9.69-9.04,15.76-12.04Z"></path><path class="cls-35" d="M222.42,20.69c6.22,2.65,11.18,7.2,17.79,9.2.99,2.82,3.85,2.84,5.96,3.98,2.11,3.88,3.9,7.95,7.1,11.09-2.61-4.07-1.34-10-7.01-11.08-.79-3.19-4.13-2.56-6.07-4.03,0,0,0,.02.01.03-6.77-4.45-13.27-9.36-21.05-12.03,1.08.98,2,2.39,3.27,2.84Z"></path><path class="cls-35" d="M99.15,21.85c-3.44,1.57-7.89,3.13-9.13,7.1,2.52-3.04,7.53-2.88,9.13-7.1Z"></path><path class="cls-35" d="M35.67,72.73c.26-2.95,2-4.74,3.45-6.86-1.21.74-3.45,1.46-3.47,2.23-.1,3.52-2.67,5.85-3.65,8.88,1.29-1.41,3.54-2.74,3.67-4.26Z"></path><path class="cls-35" d="M78.14,39.86c-4.21.51-8.45.68-12.12,3.08,4.23-.47,8.47-.6,12.12-3.08Z"></path><path class="cls-35" d="M145.88,1.84c.74-.03,1.46-.68,2.19-1.05-2.16.04-4.33-.04-6.48.15-1.86.17-3.69.64-5.54.98,3.28-.01,6.56.04,9.84-.08Z"></path><path class="cls-35" d="M319.23,196.93c.25.11.5.23.75.34.07-.41.15-.83.22-1.24-1.91.64-4.01-.1-5.99-.09-.54.85-1.09,1.7-1.63,2.55,2.3-.18,4.47-.88,6.65-1.56Z"></path><path class="cls-35" d="M66.71,353.05c.14-.03.42-.02.56,0-.8-2.96.37-7.21-4.79-7.31-.01.01-.03.03-.04.04.44-1.02.58-1.92-.2-2.46,1.56-2.96.74-5.59-2.72-6.52-.14.05-.25.11-.34.18,0-.02,0-.04,0-.06,1.45-1.59,1.27-3.4-.79-4.25.67-1.3-.49-3.34-2.15-2.63,1.52-.76,1.31-2.74,1.22-4.16-2.14-3.86,1.14-14.08-5.62-13.23,4.15-10.17.97-25.55.65-36.69-.48-4.67-5.81-8.53-10.11-8.12-.71-2.16-3.27-3.86-5.37-4.76-9.38-4.54-15.34-14.03-18.33-23.7C12.83,227.72-.05,216.67,2.63,202.63c1.64-.21,3.07-.39,4.5-.58,4.74,4.59,22.62,5.36,19.68-4.12-3.66-6.11-3.44-19.21-7.67-22.85-.62,8.47,3.92,16.12,4.82,24.37,1.77,8.81-12.3,2.44-16.97,2.5.02.01.03.02.05.03-10.09-5.16-6.9,8.52-5.15,13.53,1.96,4.36,6.24,7.54,7.5,12.33,3.21,6.51,9.8,11.32,9.74,19.47,4.66,11.13,14.18,17.27,23.08,24.29,7.44,4.52,5.25,13.72,5.44,21.23.15-.03.31-.06.46-.1.42,15.71,5.88,30.69,10.99,45.36-.86,3.35,1.58,5.36,2.82,8.17.01-.01.03-.02.04-.04-.01.01-.03.03-.04.04,2.65,5.07,6.07,10.05,7.29,15.67.24-.61.49-1.21.73-1.82h0c-1.07-2.36-2.15-4.72-3.22-7.08Z"></path><path class="cls-35" d="M314.2,195.94c.37,0-3.31-1.92-2.93-1.91-.25-.24-.5-.48-.75-.72-.12.2-3.07-6.68-4.03-6.1s.32,1.71,0,1.64c.21.51,3.12,5.88,3.33,6.38.11-.41,4.27,1.12,4.38.72Z"></path></g></g><g id="NOSE"><path class="cls-14" d="M177.3,224.05c1.02-.52,2.04-1.04,3.04-1.55,4.81,5.99,4.96,8.75.42,12.65.79.56,1.49,1.06,2.59,1.84-3,6.89,2.31,3.68-1.33,8.11-4.21-.89-5.08-17.19-4.71-21.05Z"></path><path class="cls-9" d="M177.3,224.05c.55,8.46,1.73,16.62,5.8,24.12,8.36,1.16,6.5,3.38,10.93,8.14,4.91.09,5.69,5.18,8.94,7.25.8.51.79,2.3,1.15,3.5l.11-.13c-2.37-2.72-4.64-5.79-7.08-8.36-5.51.27-7.23-5.96-12.35-6.99-8.78-4.13-10.14-34.26-7.5-42.98v15.43Z"></path><path class="cls-44" d="M155.3,216.05c4.79,3.89,7.67,10.68-.92,12.96-2.69-3.47-.13-7.42.71-11.09-.5-.69-.59-1.32.2-1.87Z"></path><path class="cls-17" d="M136.12,243.21c-.41,4.24-2.78,10.24-7.82,9.82-1.19-3.46.08-6.03,2.92-8.04l-.15.11c.83-.99,2.31-.13,3.15-1.11l-.13.12c.57-.54.83-1.79,2.04-.91Z"></path><path class="cls-9" d="M131.21,245c-5.33,7.67-3.97,19.3,1.04,27.02-.34.97-.69,1.93-1.03,2.9-.11-1.13.21-2.87-.39-3.3-2.73-1.93-2.24-5.16-3.56-7.62,1.25-4.33-1.76-18.98,3.94-19.01Z"></path><path class="cls-6" d="M192.11,254.19c-3.01-2.01-6.01-4.01-9.02-6.02,6.81-3.3,8.47.27,9.02,6.02Z"></path><path class="cls-33" d="M182.77,282.28c0,4.65-2.92,3.62-6.3,3.8-3.75.17-8.71-5.29-9.31-9.02,4.2,4.18,9.94,12.68,15.61,5.21Z"></path><path class="cls-9" d="M193.11,282.18c-2.27-.39-4.54-.79-6.81-1.18,6.27-1.52,12.44,2.46,17.8-2.8-.68,4.89-6.41,3.69-9.9,3.97-.36.57-.73.58-1.1,0Z"></path><path class="cls-9" d="M156.14,274.06c.23,2.25-1.89,2.09-3.01,2.96-2.2,2.09-5.18,5.49-7.94,2.16-.37,0-.73,0-1.1,0-1.72,1.49-3.36,1.31-4.94-.22.01-.27.05-.54.12-.8,7.18.82,11.44-1.12,16.86-4.1Z"></path><path class="cls-9" d="M155.3,216.05l-.2,1.87c-.57-4.78-1.51-9.27.9-13.83.18,4.01-.21,7.98-.69,11.96Z"></path><path class="cls-9" d="M149.42,250.18v-7.07c.15,0,.3,0,.45,0v7.07h-.45Z"></path><path class="cls-18" d="M136.12,243.21c-.68.3-1.36.61-2.04.91.75-3.79,3.43-1.36,5.3-1.41-1.09.17-2.18.33-3.27.5Z"></path><path class="cls-25" d="M156.14,274.06c-.28.06-.56.1-.85.13,2.28-1.78,4.58-1.64,6.9-.09-2.02-.01-4.03-.03-6.05-.04Z"></path><path class="cls-34" d="M205.25,271.99c-.34-1.68-.68-3.37-1.03-5.05l-.11.13c3.58.48,1.41,3.22,1.92,4.9-.12.24-.25.48-.37.72-.14-.23-.27-.47-.41-.7Z"></path><path class="cls-34" d="M136.97,278.16c-2.39,1.16-2.57,1.03-2.82-2,.94.67,1.88,1.34,2.82,2Z"></path><path class="cls-37" d="M151.28,232.68v-2.3l.49-.04c.09.83.18,1.65.27,2.48-.25-.05-.51-.09-.76-.14Z"></path><path class="cls-38" d="M205.25,271.99c.26.06.52.05.78-.02,0,1,.01,2,.02,3,0,0,.04-.05.04-.05l-.83-2.93Z"></path></g><g id="MOUTH"><path id="TEETH-BG" class="cls-24" d="M129.16,309.82c-3.99,6.55,3.62,17.62,12.77,22.76,4.64,2.61,10.69,3.35,22.59,4.72,16.03,1.85,24.04,2.77,31.91.22,62.84-27-54.43-47.54-67.26-27.71Z"></path><g id="TEETH"><path class="cls-16" d="M200.25,313.21c.15,7.45,1.34,14.68,2.96,21.94-10.45-1.29-4.04-16.24-7.05-23.07,2.31-2.34,2.81-2.21,4.09,1.13Z"></path><path class="cls-16" d="M187.28,312.1c1.05,8.25,3.64,16.35,2.69,24.74-.34.17-.69.33-1.03.5-4.56-7.42-.66-18.05-6.76-25.31,1.74-3.01,3.41-.87,5.1.07Z"></path><path class="cls-45" d="M145.18,326.17c3.91-4.09,5.74-14.2,5.81-20.07,1.73-.8,3.45-3.26,5.18,0-3.77,6.43-4.06,14.89-6.93,21.96-1.84.41-3.76,1-4.06-1.89Z"></path><path class="cls-22" d="M164.19,333.19c2.29-7.99.97-16.8,1.81-25.09,1.05,0,2.1-.02,3.15-.03.6.63.58,1.27.05,1.93-.11,7.99-.68,15.97-.96,23.96-2.34,2.41-2.82,2.32-4.05-.78Z"></path><path class="cls-43" d="M211.02,323.91c-.65-3.57-1.3-7.14-1.96-10.7,3.76-3.18,7.02,4.9,4.22,7.71.66,1.43,1.31,2.86,1.97,4.3-.18,1.29.05,2.89-2.05,2.72-.73-1.34-1.46-2.68-2.18-4.02Z"></path><path class="cls-43" d="M145.08,305.94c-3.72,3.34-2.86,20.57-6.91,18.26-.07-3.13-.13-6.26-.2-9.39.73-3.31-2.05-7.67,2.92-9.7,1-.86,2.06-1.67,3.08-2.51.37,1.12.74,2.23,1.11,3.35Z"></path></g><path class="cls-32" d="M221.15,315.5c-1.06-8.03-10.4-4.1-14.91-8.82-3.58-1.38-6.71-2.53-10.73-1.63-2.49-3.87-7.71-2.59-11.05-.82-18.09-1.22-35.6-3.55-51.25-11.31-3.68-1.9-7.27-1.37-8.21,1.07-2.61-1.74-2.97-3.2-5.88-.93,1.83,5.13-.53,16.23,5.32,18.12,1.19.35,2.91,2.48,2.7,3.45-1.02,5.13.64,9.94,1.27,14.85,11.57,8.58,28.38,4.19,38.46,15.38,1.33,1.73,3.07,3.87,5.97,3.27,3.72-.82,7.65.01,11.31-1.15,3.04.88,7.47,3.01,6.06-2.71,11-.14,15.87-5.32,20.05-11.39.57-1.38,6.26-8.17,1.1-9.58-7.43.46-4.42,9.78-11.62,12.32-5.15,1.95-12.52,1.89-15.94,4.2-3.43,2.31-13.47-2.82-13.47-2.82,0,0-4.82-4.98-6.46-5.57-9.81-3.43-15.92-3.07-27.96-6.04-1.34-4.78-4.12-16.62-2.67-20.01,0,0-1.57-3.35-3.77-5.6,7.06-1.25,7.94,7.23,15.94,8.2,3.58,1.5,7.4-2.42,10.56.39,8.92,1.06,16.07,6.67,25.26,5.8,8.81-1.86,17.91,1.65,26.72.82,2.08.03,6.23-1.23,6.53,1.81-7.23,13.19,10.03,12.13,6.64-1.3Z"></path></g><g id="RIGHT_EYE"><path class="cls-18" d="M254.34,187c1.08,3.32,2.04,5.14,3.68,9-14.74-.86-33.23,2.76-44.82-6.1.4-2.46-1.21-3.31-3.13-3.85-2.58-.72-1.33,2.47-2.85,2.85-2.45-2.2.51-4.21,2.07-5.82,1.03-4.01,3.45-5.67,7.73-5.47,10.14-.42,20.61-2.82,30.58-.58,4.69.94,3.53,4.94,4.56,7.83.65.09,1.31.18,1.96.27.63.56.64,1.19.22,1.87Z"></path><path class="cls-44" d="M252.16,184.86c-3.65-7.5-10.5-8.22-17.96-8.01,4.82-3.92,10.78-1.96,16.43-2.02,2.81.09,4.05,2.24,4.91,4.29,1.86,4.5-1.85,2.21-3.39,5.74Z"></path><path class="cls-27" d="M230.14,176.86c-5.01.74-10,1.59-15.03,2.18-2.76.33-3.55,3.19-5.82,4.04-.18-3.47,1.36-5.78,3.34-8.62,2.22.57,4.52,2.05,7.01.49.21-.13,1,.68,1.53,1.06h0c3.21-1.99,6.12-.82,8.98.84Z"></path><path class="cls-6" d="M213.2,189.9c4.59,1.52,9.23,2.87,13.91,4.11,0,0-.13-.14-.13-.14l.31,1.11c-2.27,2.36-4.62,2.66-7.31.55-2.31-1.82-6.37-1.51-6.78-5.63Z"></path><path class="cls-6" d="M207.22,185.14c0,1.25,0,2.51,0,3.76-1.85.36-3.69.72-5.34,1.04-3.07-3.62,3.67-8.83,5.34-4.8Z"></path><path class="cls-44" d="M254.34,187c-.07-.62-.15-1.25-.22-1.87.43.23.85.45,1.28.68-.35.4-.7.79-1.05,1.19Z"></path><path class="cls-24" d="M225.2,190.95q-3.9.09-14.29-6.24c2.25-6.71,14.31-4.69,20.35-6.78-4.67,3.21-9.03,7.13-6.19,13.15l.13-.13Z"></path><path class="cls-7" d="M240.01,194.83c3.94-2.14,6.38-4.91,6.31-9.41,4.82,1.12,9.12,5.34,9.56,9.41h-15.87Z"></path><path class="cls-24" d="M249.22,183.94c-1.93.11-3.51.23-4.89-1.99-1.06-1.7-3.54-2.51-5.35-4.18,4.06,1.46,9.49.82,10.11,6.3l.13-.13Z"></path><polygon class="cls-11" points="230.84 184.49 231.26 184.34 231.21 184.71 230.84 184.49"></polygon><path class="cls-23" d="M252.74,187.64c-.45-.47-.57-.78.04-1.19.49.35.1.76-.04,1.19Z"></path><path class="cls-6" d="M227.11,194.01c.56-.15,1.33-1.18,1.66-.37-.6.08-1.19.16-1.79.23l.13.14Z"></path><path class="cls-7" d="M225.07,191.08c.28.12.56.23.84.35-.24-.16-.47-.32-.71-.48l-.13.13Z"></path><path class="cls-39" d="M249.08,184.08c.28.12.56.23.83.35-.23-.16-.47-.32-.7-.48l-.13.13Z"></path></g><g id="LEFT_EYE"><path class="cls-18" d="M89.14,183.17c-1.58-2.98-4.3-1.69-6.93-3.21,1.42-3.19,4.82-2.21,6.83-.4,7.16,6.37,16.33.88,24.75,1.98,5.34.6,7.86-3.73,3.02-6.92-3.33-3.16-5.76-7.25-10.01-9.71,10.74,25.19-30.62,22.58-19.97-.09-2.46-.8-4.83,1.38-7.23.23-1.38-.7-1.59-3.33.49-3.21,9.51.57,30.26-5.78,35.97,2.82,2.14,2.47,3.83,5.33,7.4,6.1.98.21,1.54,1.2,1.56,2.32-.75,4.5.51,10.47-4.91,12.11-6.32-.3-28.23,2.69-30.96-2.01Z"></path><path class="cls-23" d="M125,173.07c-7.24-.33-10.62-6.8-13.92-11.92,3.86-8.93,7.3,10.2,13.39,5.81,2.1-.65,3.44.59,3.1,2.5-.23,1.31,1.47,4.78-2.57,3.61Z"></path><path class="cls-17" d="M89.14,183.17c10.13,3.13,20.61,1.33,30.96,2.01-10.38,2.11-20.64-1.18-30.96,3.94v-5.95Z"></path><path class="cls-17" d="M75.1,179.19c-3.38.69-6.77,1.38-10.52,2.14-.1-2.25-.2-4.5-.31-6.74,4.03-4.36,11.27-.79,10.83,4.6Z"></path><path class="cls-6" d="M80.08,161.83c-1.05,3.03-3.04,6.72-6.95,5.01v-8c2.89-.93,4.64,1.75,6.95,2.99Z"></path><path class="cls-16" d="M73.13,166.85l6.05-2.75-.12-.15c3.13,5.77-8.5,4.33-5.49,12.4-.13.2-.27.39-.4.58-4.67-.44-3.42-4.68-8.9-2.35,2.32-3.31,4.03-7.31,8.86-7.74Z"></path><path class="cls-18" d="M82.21,179.96c-2.01-.34-4.01-.68-6.02-1.01,1.82-2.32,5.38-2.87,5.88,1.14l.14-.13Z"></path><path class="cls-9" d="M75.1,179.19c-.65-.53-1.42-2.12-2.03-2.1,2.15-1.06,3.11-.33,3,2,.3-.3-.69.09-.97.11Z"></path><path class="cls-24" d="M76.06,179.08c-3.26-1.57-4.92-5.37-8.31-6.57,1.47-4.43,6.26-4.23,9.4-6.52,3.96-4.87,10.57-4.05,16.48-3.83-10.64,6.17-7.02,18.81,3.03,19.86,9.9-.96,13.6-14.03,3.06-19.57,11.97-7.48,16.61,15.72,23.67,11.5,3.59,14.89-14.71,9.07-23.2,10.04-4.01-.13-7.81-.83-11.36-3.29-3.54-1.29-8.82-.31-12.76-1.6Z"></path><polygon class="cls-29" points="100.61 172.71 100.5 172.41 100.78 172.44 100.61 172.71"></polygon></g></g></svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">DamonicOS</h1>
                  <p className="text-xs text-white/50">by Damonic</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search apps..."
                    className="h-8 w-full sm:w-48 md:w-64 bg-[#0A0A0A] border border-purple-900/20 rounded-lg px-3 text-sm text-white/70 
                             placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-0
                             hover:border-purple-500/30 transition-colors"
                    aria-label="Search applications"
                  />
                </div>
               
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
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
