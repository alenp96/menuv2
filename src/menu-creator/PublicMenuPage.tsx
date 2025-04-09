import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getPublicMenu } from 'wasp/client/operations';
import { Menu, MenuSection as MenuSectionType, MenuItem, assertMenu, DietaryTag, Allergen, formatPrice } from './types';
import MenuSection from './components/MenuSection';
import MenuNavigation from './components/MenuNavigation';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

// Standalone public menu page without any app components
const PublicMenuPage = () => {
  const params = useParams<{ publicUrl: string }>();
  const publicUrl = params.publicUrl || '';
  
  const { data: menuData, isLoading, error } = useQuery(getPublicMenu, { publicUrl });
  const menu = menuData ? assertMenu(menuData) : null;
  
  // Add Font Awesome CSS once when component mounts
  useEffect(() => {
    if (!document.getElementById('font-awesome-css')) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.id = 'font-awesome-css';
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      document.head.appendChild(fontAwesomeLink);
    }
    
    return () => {
      // Optional cleanup when component unmounts
      const linkElement = document.getElementById('font-awesome-css');
      if (linkElement) {
        linkElement.remove();
      }
    };
  }, []);
  
  // Always use default template (the old zvezda template)
  useEffect(() => {
    if (menu) {
      // Set 'default' as the template
      menu.template = 'default';
      console.log('Using template:', menu.template);
    }
  }, [menu]);
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const modalRef = useRef<HTMLDivElement | null>(null);
  
  // New state for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [availableDietaryTags, setAvailableDietaryTags] = useState<DietaryTag[]>([]);
  const [availableAllergens, setAvailableAllergens] = useState<Allergen[]>([]);
  
  // Add state to track whether to show video or image when both are available
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  // Filter menu items based on search term and selected filters
  const getFilteredMenuSections = () => {
    if (!menu || !menu.sections) return [];
    
    return menu.sections.map(section => {
      // Filter items by search term and dietary preferences
      const filteredItems = section.items.filter(item => {
        // Search filter - check if name or description contains search term
        const matchesSearch = searchTerm === '' || 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Dietary tags filter
        const matchesDietaryTags = selectedDietaryTags.length === 0 || 
          (item.dietaryTags && selectedDietaryTags.every(tagId => 
            item.dietaryTags!.some(tag => tag.id === tagId)
          ));
        
        // Allergens filter (exclude items that contain selected allergens)
        const matchesAllergens = selectedAllergens.length === 0 || 
          !item.allergens || 
          !selectedAllergens.some(allergenId => 
            item.allergens!.some(allergen => allergen.id === allergenId)
          );
        
        return matchesSearch && matchesDietaryTags && matchesAllergens;
      });
      
      return {
        ...section,
        items: filteredItems
      };
    }).filter(section => section.items.length > 0); // Only show sections with matching items
  };
  
  // Effect to set initial active section
  useEffect(() => {
    if (menu && menu.sections && menu.sections.length > 0) {
      setActiveSection(menu.sections[0].id);
      
      // Reset tab container scroll position to ensure first tabs are visible
      const tabsScroller = document.getElementById('tabsScroller');
      if (tabsScroller) {
        tabsScroller.scrollLeft = 0; // Ensures the first tabs are visible
      }
    } else {
      setActiveSection(null);
    }
    
    // Set document title to menu name
    if (menu) {
      document.title = `${menu.name} | Menu`;
    }

    // Remove any app-specific styles or elements that might be inherited
    document.body.classList.add('public-menu-page');
    
    return () => {
      document.body.classList.remove('public-menu-page');
    };
  }, [menu]);

  // Extract all available dietary tags and allergens
  useEffect(() => {
    if (menu && menu.sections) {
      const dietaryTagsSet = new Set<string>();
      const dietaryTagsMap = new Map<string, DietaryTag>();
      const allergensSet = new Set<string>();
      const allergensMap = new Map<string, Allergen>();
      
      menu.sections.forEach(section => {
        section.items.forEach(item => {
          if (item.dietaryTags) {
            item.dietaryTags.forEach(tag => {
              dietaryTagsSet.add(tag.id);
              dietaryTagsMap.set(tag.id, tag);
            });
          }
          if (item.allergens) {
            item.allergens.forEach(allergen => {
              allergensSet.add(allergen.id);
              allergensMap.set(allergen.id, allergen);
            });
          }
        });
      });
      
      setAvailableDietaryTags(Array.from(dietaryTagsMap.values()));
      setAvailableAllergens(Array.from(allergensMap.values()));
    }
  }, [menu]);

  // Optimize the modal rendering with useEffect
  useEffect(() => {
    if (selectedItem) {
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
      
      // Add event listener to close modal when clicking outside
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setSelectedItem(null);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      
      // Add escape key listener
      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setSelectedItem(null);
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscKey);
      };
    } else {
      // Reset body overflow when modal is closed
      document.body.style.overflow = '';
    }
  }, [selectedItem]);

  // Reset showVideo state when modal is closed
  useEffect(() => {
    if (!selectedItem) {
      setShowVideo(false);
      setVideoError(false);
    }
  }, [selectedItem]);

  // Optimize filtered sections calculation with useMemo
  const filteredSections = useMemo(() => getFilteredMenuSections(), [
    menu, searchTerm, selectedDietaryTags, selectedAllergens
  ]);
  
  const hasActiveFilters = searchTerm !== '' || selectedDietaryTags.length > 0 || selectedAllergens.length > 0;
  
  // Memoize event handlers
  const toggleDietaryTag = useCallback((tagId: string) => {
    setSelectedDietaryTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }, []);

  const toggleAllergen = useCallback((allergenId: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergenId) ? prev.filter(id => id !== allergenId) : [...prev, allergenId]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedDietaryTags([]);
    setSelectedAllergens([]);
    setSearchTerm('');
  }, []);

  // Helper function to check if an element is visible in its container
  const isElementVisible = (container: Element, element: Element): boolean => {
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    return (
      elementRect.left >= containerRect.left &&
      elementRect.right <= containerRect.right
    );
  };

  // Add this function to handle tab scrolling
  const scrollTabIntoView = (sectionId: string) => {
    const activeTab = document.querySelector(`.zvezda-tab[data-section-id="${sectionId}"], .menu-nav-item[data-section-id="${sectionId}"]`);
    const tabsScroller = document.getElementById('tabsScroller');
    
    if (activeTab && tabsScroller) {
      const tabRect = activeTab.getBoundingClientRect();
      const scrollerRect = tabsScroller.getBoundingClientRect();
      
      // Check if the active tab is not fully visible
      const isTabVisible = 
        tabRect.left >= scrollerRect.left && 
        tabRect.right <= scrollerRect.right;
      
      if (!isTabVisible) {
        // Calculate the scroll position to center the active tab
        const scrollLeft = 
          tabRect.left - scrollerRect.left + tabsScroller.scrollLeft - 
          (scrollerRect.width / 2) + (tabRect.width / 2);
        
        // Scroll the tabsScroller to the calculated position
        tabsScroller.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  };

  // Update the useEffect that handles scroll position detection
  useEffect(() => {
    // Skip if no sections available
    if (!filteredSections.length) return;

    const handleScroll = () => {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        const scrollPosition = window.scrollY + 150; // Offset for header
        
        // Create an array of section positions only once per scroll event
        const sectionPositions = Object.entries(sectionRefs.current)
          .filter(([_, element]) => element !== null)
          .map(([sectionId, element]) => ({
            id: sectionId,
            top: element?.offsetTop || 0
          }))
          .sort((a, b) => a.top - b.top);
        
        // Find the current section using binary search for better performance
        let currentSectionId: string | null = null;
        for (let i = sectionPositions.length - 1; i >= 0; i--) {
          if (scrollPosition >= sectionPositions[i].top) {
            currentSectionId = sectionPositions[i].id;
            break;
          }
        }
        
        // Only update state if section changed
        if (currentSectionId && activeSection !== currentSectionId) {
          setActiveSection(currentSectionId);
          // Find index of this section in filteredSections
          const index = filteredSections.findIndex(s => s.id === currentSectionId);
          if (index !== -1) {
            setActiveSectionIndex(index);
            
            // Scroll the navigation to make the active tab visible
            setTimeout(() => {
              scrollTabIntoView(currentSectionId!);
            }, 100); // Small delay to ensure DOM updates
          }
        }
      });
    };

    // Use passive: true for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeSection, filteredSections]);

  // Update the handleSectionClick function to also scroll the tab into view
  const handleSectionClick = useCallback((sectionId: string, index: number) => {
    setActiveSection(sectionId);
    setActiveSectionIndex(index);

    // Adjust scroll offset based on header height (approx 60px for sticky nav + potential top bar)
    const headerOffset = 100; // Adjust this value as needed
    const sectionElement = document.getElementById(`section-${sectionId}`);
    if (sectionElement) {
      const elementPosition = sectionElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
      });
    }

    // Find and scroll the tab into view
    setTimeout(() => {
      scrollTabIntoView(sectionId);
    }, 100); // Delay ensures smooth scroll finishes first
  }, [scrollTabIntoView]); // Added scrollTabIntoView dependency

  const openItemModal = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setShowVideo(false); // Reset video state when opening modal
  }, []);
  
  // Helper function to determine if a URL is a YouTube, Vimeo, or other platform video
  const getVideoEmbedUrl = (url: string | null): { type: string, embedUrl: string } | null => {
    if (!url) return null;
    
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[1]) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`
      };
    }
    
    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?)([0-9]+)/i;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`
      };
    }
    
    // Direct file URL (mp4, webm, ogg)
    const fileRegex = /\.(mp4|webm|ogg)$/i;
    if (fileRegex.test(url)) {
      return {
        type: 'direct',
        embedUrl: url
      };
    }
    
    // Unknown format
    return {
      type: 'unknown',
      embedUrl: url
    };
  };
  
  // Check if we need to update active section after filtering
  useEffect(() => {
    if (filteredSections.length > 0) {
      // If current active section is not in filtered sections, update it
      if (!activeSection || !filteredSections.some(s => s.id === activeSection)) {
        setActiveSection(filteredSections[0].id);
        setActiveSectionIndex(0);
      }
    } else {
      // If no sections to display, set active section to null
      setActiveSection(null);
    }
  }, [filteredSections, activeSection]);

  // Add scroll event listener for back to top button with improved performance
  useEffect(() => {
    let backToTopVisible = false;
    
    const handleScroll = () => {
      requestAnimationFrame(() => {
        const shouldBeVisible = window.scrollY > 300;
        
        // Only update DOM if visibility changed
        if (shouldBeVisible !== backToTopVisible) {
          backToTopVisible = shouldBeVisible;
          const backToTopButton = document.querySelector('.back-to-top');
          if (backToTopButton) {
            if (shouldBeVisible) {
              backToTopButton.classList.add('visible');
            } else {
              backToTopButton.classList.remove('visible');
            }
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add a useEffect to check if scrolling is needed and show/hide indicators
  useEffect(() => {
    const checkScrollable = () => {
      const tabsWrapper = document.querySelector('.zvezda-tabs-wrapper');
      const tabs = document.querySelector('.zvezda-tabs');
      
      if (tabsWrapper && tabs) {
        const hasHorizontalScroll = tabs.scrollWidth > tabsWrapper.clientWidth;
        
        // Update scroll buttons visibility
        const leftButton = document.querySelector('.scroll-button.scroll-left');
        const rightButton = document.querySelector('.scroll-button.scroll-right');
        const indicator = document.querySelector('.scroll-indicator');
        
        if (leftButton && rightButton && indicator) {
          if (hasHorizontalScroll) {
            leftButton.classList.add('lg:flex');
            rightButton.classList.add('lg:flex');
            indicator.classList.remove('hidden');
          } else {
            leftButton.classList.remove('lg:flex');
            rightButton.classList.remove('lg:flex');
            indicator.classList.add('hidden');
          }
        }
      }
    };
    
    // Check when component mounts and when sections change
    checkScrollable();
    
    // Also check on window resize
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, [filteredSections]);

  // Remove the duplicate navigation effect at the top level
  useEffect(() => {
    if (filteredSections.length > 3) {
      const tabsWrapper = document.getElementById('tabsScroller');
      const hasScrolled = sessionStorage.getItem('hasScrolledTabs');
      
      // Only auto-scroll once per session
      if (!hasScrolled && tabsWrapper) {
        // Add a small timeout to ensure elements are rendered
        setTimeout(() => {
          // Check if there's actually overflow to scroll
          if (tabsWrapper.scrollWidth > tabsWrapper.clientWidth) {
            // Just let the CSS animation do its job via the tab-auto-scroll class
            // Mark that we've shown the hint
            sessionStorage.setItem('hasScrolledTabs', 'true');
          }
        }, 1500);
      }
      
      // Add scroll event listener to hide hint after user manually scrolls
      const handleScroll = () => {
        const scrollHint = document.querySelector('.scroll-hint');
        if (scrollHint) {
          scrollHint.classList.add('hidden');
        }
        sessionStorage.setItem('hasScrolledTabs', 'true');
        tabsWrapper?.removeEventListener('scroll', handleScroll);
      };
      
      tabsWrapper?.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        tabsWrapper?.removeEventListener('scroll', handleScroll);
      };
    }
  }, [filteredSections.length]);

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-center p-8 text-red-500 max-w-md">
        <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold mb-2">Error Loading Menu</h2>
        <p>{error.message}</p>
      </div>
    </div>
  );
  
  if (!menu) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold mb-2">Menu Not Found</h2>
        <p className="text-gray-600">The menu you're looking for doesn't exist or has been removed.</p>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen font-roboto bg-gray-100">
      {/* Add a style tag to ensure this page is completely standalone */}
      <style>{`
        body {
          color: #333;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
          overflow-x: hidden; // Prevent horizontal scroll
        }
        .public-menu-header {
          background: linear-gradient(135deg, #2a2638 0%, #3d2e2a 100%);
          color: white;
          padding: 1.5rem 1rem 2rem;
          text-align: center;
          border-radius: 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
          margin-bottom: 0;
        }
        /* Add decorative blur elements to header */
        .header-blur-element {
          position: absolute;
          border-radius: 50%;
          filter: blur(30px);
          z-index: 0;
        }
        .header-blur-1 {
          width: 200px;
          height: 200px;
          top: -60px;
          left: 20%;
          background: radial-gradient(circle, rgba(244, 162, 97, 0.4) 0%, rgba(231, 111, 81, 0.2) 70%);
          animation: float 12s ease-in-out infinite;
        }
        .header-blur-2 {
          width: 220px;
          height: 220px;
          bottom: -80px;
          right: 15%;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(251, 191, 36, 0.1) 70%);
          filter: blur(40px);
          animation: float 15s ease-in-out infinite alternate;
        }
        .header-blur-3 {
          width: 180px;
          height: 180px;
          top: 20%;
          right: 10%;
          background: radial-gradient(circle, rgba(244, 162, 97, 0.3) 0%, rgba(231, 111, 81, 0.15) 70%);
          animation: float 10s ease-in-out infinite alternate-reverse;
        }
        /* Add a decorative dotted pattern overlay */
        .header-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.3;
          z-index: 0;
        }
        @keyframes float {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-15px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 0.8; }
        }
        @media (min-width: 768px) {
          .public-menu-header {
            padding: 2rem 2rem 2.5rem;
          }
        }
        .header-content {
          position: relative;
          z-index: 1; /* Above the blur elements */
        }
        .header-logo-container {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          padding: 0.25rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          margin-right: 0.75rem;
          vertical-align: middle;
          box-shadow: 0 0 15px rgba(114, 59, 209, 0.6);
        }
        .header-logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }
        .header-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          display: inline-block;
          vertical-align: middle;
          background: linear-gradient(90deg, #F4A261 0%, #E76F51 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          margin: 0;
        }
        .header-description {
          font-size: 0.875rem;
          max-width: 90%;
          margin: 0.5rem auto 1.25rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }
        @media (min-width: 768px) {
          .header-description {
             max-width: 600px;
             font-size: 1rem;
          }
        }
        /* Redesigned search filter container */
        .search-filter-container {
          display: flex;
          max-width: 85%;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .search-input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          width: 100%;
          max-width: 350px;
          margin: 0 auto;
          padding: 0.375rem 0.375rem 0.375rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .search-input {
          flex-grow: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 0.875rem;
          padding: 0.375rem 0.25rem;
          width: 100%;
          outline: none;
        }
        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }
        .filter-button {
          background-color: #E76F51;
          color: white;
          border: none;
          border-radius: 9999px;
          padding: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 28px;
          height: 28px;
        }
        .filter-button.active {
          background-color: #F4A261;
        }
        /* Redesigned navigation to match screenshot */
        .menu-nav-container {
          position: sticky;
          top: 0;
          z-index: 40;
          background-color: white;
          padding: 0.75rem 0.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border-radius: 0;
          margin-top: 0;
        }
        .menu-nav-scroll {
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-behavior: smooth;
          padding: 0 0.5rem;
        }
        .menu-nav-scroll::-webkit-scrollbar {
          display: none;
        }
        .menu-nav-list {
          display: flex;
          gap: 0.5rem;
          padding: 0.25rem 0;
          margin: 0;
          white-space: nowrap;
          justify-content: flex-start;
        }
        .menu-nav-item {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b5563;
          background-color: #e5e7eb;
          border: none;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          text-align: center;
          flex-shrink: 0;
        }
        .menu-nav-item.active {
          background: #F4A261;
          color: white;
          font-weight: 600;
        }
        .menu-nav-item:hover:not(.active) {
          background-color: #d1d5db;
        }
        .menu-content-container {
          background: white;
          padding: 1rem;
          margin: 1rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          min-height: 60vh;
        }
         @media (min-width: 768px) {
           .menu-content-container {
             padding: 1.5rem;
             margin: 1.5rem auto;
             max-width: 900px;
           }
         }
        .menu-section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #F4A261;
          display: inline-block;
          scroll-margin-top: 80px;
        }
        .menu-item-card {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
          align-items: flex-start;
        }
        .menu-item-card:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .item-image-container {
          flex-shrink: 0;
        }
        .item-image {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .item-icon {
           width: 50px;
           height: 50px;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           background-color: #fef3c7;
           color: #F4A261;
           font-size: 1.25rem;
        }
        .item-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 50px;
        }
        .item-details {
           margin-bottom: 0.5rem;
        }
        .item-name {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.125rem;
          line-height: 1.3;
        }
        .item-description {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .item-price {
          font-size: 0.875rem;
          font-weight: 700;
          color: #c2410c;
          background: linear-gradient(90deg, #fed7aa, #fbbf24);
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          white-space: nowrap;
        }
        .item-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .tag-badge {
          font-size: 0.625rem;
          font-weight: 500;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          text-transform: capitalize;
          background-color: #dbeafe;
          color: #1e40af;
        }
        .tag-badge.allergen {
           background-color: #fee2e2;
           color: #991b1b;
        }
        .modal-content {
           background: white;
           border-radius: 1rem;
           padding: 1.5rem;
           box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        /* Modal media container with 3:4 aspect ratio */
        .modal-media-container {
          position: relative;
          width: 100%;
          padding-top: 133.33%; /* 3:4 aspect ratio (4/3 * 100%) */
          margin-bottom: 1.25rem;
          background-color: #f3f4f6;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .modal-media-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .modal-switch-button {
          position: absolute;
          bottom: 0.75rem;
          right: 0.75rem;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          border-radius: 0.375rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          backdrop-filter: blur(4px);
          transition: all 0.2s ease;
          z-index: 10;
        }
        .modal-switch-button:hover {
          background-color: rgba(0, 0, 0, 0.75);
        }
        .modal-close-button {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          border-radius: 9999px;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
          backdrop-filter: blur(4px);
          transition: all 0.2s ease;
        }
        .modal-close-button:hover {
          background-color: rgba(0, 0, 0, 0.7);
        }
        .modal-item-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        .modal-item-price {
          font-size: 1.125rem;
          font-weight: 600;
          color: #c2410c;
          background: linear-gradient(90deg, #fed7aa, #fbbf24);
          padding: 0.375rem 0.875rem;
          border-radius: 9999px;
          display: inline-block;
          margin-bottom: 1rem;
        }
        .modal-item-description {
          font-size: 0.875rem;
          line-height: 1.5;
          color: #4b5563;
          margin-bottom: 1.25rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-section-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
      `}</style>

      {/* Header with blurred background elements */}
      <header className="public-menu-header">
        {/* Decorative blurred elements */}
        <div className="header-blur-element header-blur-1"></div>
        <div className="header-blur-element header-blur-2"></div>
        <div className="header-blur-element header-blur-3"></div>
        <div className="header-pattern"></div>
        
        <div className="header-content">
          {/* Logo and Title */}
          <div className="flex items-center justify-center mb-3">
              {menu.logoUrl ? (
              <div className="header-logo-container">
                  <img src={menu.logoUrl} alt={`${menu.name} Logo`} className="header-logo" />
              </div>
              ) : (
               <div className="w-10 h-10 mr-3"></div> // Placeholder for spacing if no logo
              )}
              <h1 className="header-title">{menu.name}</h1>
          </div>

          {/* Description */}
          {menu.description && <p className="header-description">{menu.description}</p>}

          {/* Search with attached filter button */}
          <div className="search-input-wrapper">
            <MagnifyingGlassIcon className="h-4 w-4 text-white opacity-70 mr-1" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              onClick={() => setIsFilterVisible(!isFilterVisible)} 
              className={`filter-button ${isFilterVisible ? 'active' : ''}`}
              aria-label="Toggle filters"
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation - redesigned to match screenshot */}
      {filteredSections.length > 0 && (
        <div className="menu-nav-container">
            <div id="tabsScroller" className="menu-nav-scroll">
                <div className="menu-nav-list">
                  {filteredSections.map((section, index) => (
                    <button
                      key={section.id}
                      data-section-id={section.id}
                      onClick={() => handleSectionClick(section.id, index)}
                      className={`menu-nav-item ${activeSection === section.id ? 'active' : ''}`}
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
            </div>
        </div>
      )}

      {/* Content Area */}
      <main className="menu-content-container">
        {/* Filter Display Section (Example) */}
        {/* You would integrate the actual filter UI logic here */}
        {isFilterVisible && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-2">Filters</h3>
             <div>
                <h4 className="text-sm font-medium mb-1">Dietary Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {availableDietaryTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleDietaryTag(tag.id)}
                      className={`tag-badge ${selectedDietaryTags.includes(tag.id) ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
             </div>
             <div className="mt-2">
                 <h4 className="text-sm font-medium mb-1">Exclude Allergens</h4>
                 <div className="flex flex-wrap gap-2">
                   {availableAllergens.map(allergen => (
                     <button
                       key={allergen.id}
                       onClick={() => toggleAllergen(allergen.id)}
                       className={`tag-badge allergen ${selectedAllergens.includes(allergen.id) ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'}`}
                     >
                       {allergen.name}
                     </button>
                   ))}
                 </div>
              </div>
            {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-3 text-sm text-blue-600 hover:underline">Clear Filters</button>
            )}
          </div>
        )}

        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <section
              key={section.id}
              id={`section-${section.id}`}
              ref={(el) => (sectionRefs.current[section.id] = el)}
              className="mb-6" // Add margin between sections
            >
              <h2 className="menu-section-title">{section.name}</h2>
              <div className="space-y-4"> {/* Use space-y for spacing instead of grid */}
                {section.items.map((item) => (
                  <div key={item.id} className="menu-item-card" onClick={() => openItemModal(item)}>
                     {/* Image or Icon */}
                     <div className="item-image-container">
                       {item.imageUrl ? (
                         <img src={item.imageUrl} alt={item.name} className="item-image" />
                       ) : item.icon ? (
                         <div className="item-icon">
                            <i className={`fa ${item.icon}`}></i> {/* Render FontAwesome icon */}
                         </div>
                       ) : (
                          <div className="item-icon bg-gray-200"> {/* Placeholder */}
                             <i className="fa fa-utensils text-gray-500"></i>
                          </div>
                       )}
                     </div>

                     {/* Content: Name, Desc, Price, Tags */}
                     <div className="item-content">
                         {/* Top Part: Name & Description */}
                         <div className="item-details">
                             <h3 className="item-name">{item.name}</h3>
                             {item.description && <p className="item-description">{item.description}</p>}
                         </div>

                         {/* Bottom Part: Price & Tags */}
                         <div className="item-footer">
                           {item.price && (
                             <span className="item-price">
                               {formatPrice(item.price, menu || undefined)}
                             </span>
                           )}
                           <div className="item-tags">
                             {item.dietaryTags?.map(tag => (
                               <span key={tag.id} className="tag-badge">{tag.name}</span>
                             ))}
                             {item.allergens?.map(allergen => (
                               <span key={allergen.id} className="tag-badge allergen">{allergen.name}</span>
                             ))}
                           </div>
                         </div>
                     </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>No menu items match your current search or filter criteria.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-blue-600 hover:underline">
                Clear Filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div ref={modalRef} className="modal-content max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            {/* Media Section */}
            {(selectedItem.imageUrl || selectedItem.videoUrl) && (
              <div className="modal-media-container">
                {showVideo && selectedItem.videoUrl && !videoError ? (
                  (() => {
                    const videoInfo = getVideoEmbedUrl(selectedItem.videoUrl);
                    if (videoInfo?.type === 'youtube' || videoInfo?.type === 'vimeo') {
                      return (
                        <iframe
                          src={videoInfo.embedUrl}
                          title={selectedItem.name}
                          className="modal-media-content"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      );
                    } else if (videoInfo?.type === 'direct') {
                      return (
                        <video
                          src={videoInfo.embedUrl}
                          controls
                          className="modal-media-content"
                          onError={() => {
                            console.error("Video failed to load:", videoInfo.embedUrl);
                            setVideoError(true);
                            setShowVideo(false);
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      );
                    } else {
                      setVideoError(true);
                      setShowVideo(false);
                      return null;
                    }
                  })()
                ) : selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="modal-media-content"
                    onError={() => {
                      // Hide image container if image fails to load
                      const container = document.querySelector('.modal-media-container');
                      if (container) container.classList.add('hidden');
                    }}
                  />
                ) : null}

                {/* Media Toggle Button */}
                {selectedItem.imageUrl && selectedItem.videoUrl && !videoError && (
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className="modal-switch-button"
                  >
                    {showVideo ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z"></path>
                        </svg>
                        <span>View Photo</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>Play Video</span>
                      </>
                    )}
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="modal-close-button"
                  aria-label="Close modal"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            )}

            {/* Item Details */}
            <h2 className="modal-item-name">{selectedItem.name}</h2>
            
            {selectedItem.price && (
              <div className="modal-item-price">
                {formatPrice(selectedItem.price, menu || undefined)}
              </div>
            )}
            
            {selectedItem.description && (
              <p className="modal-item-description">{selectedItem.description}</p>
            )}

            {/* Tags */}
            <div className="space-y-4">
              {selectedItem.dietaryTags && selectedItem.dietaryTags.length > 0 && (
                <div>
                  <h4 className="modal-section-title">Dietary Info</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.dietaryTags.map(tag => (
                      <span key={tag.id} className="tag-badge">{tag.name}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                <div>
                  <h4 className="modal-section-title">Allergens</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.allergens.map(allergen => (
                      <span key={allergen.id} className="tag-badge allergen">{allergen.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="back-to-top fixed bottom-4 right-4 bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300 opacity-0 pointer-events-none"
        aria-label="Back to top"
      >
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
      </button>
      <style>{`
        .back-to-top.visible {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>

    </div> // Close main div
  );
};

export default PublicMenuPage;