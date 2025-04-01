import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getPublicMenu } from 'wasp/client/operations';
import { Menu, MenuSection as MenuSectionType, MenuItem, assertMenu, DietaryTag, Allergen, formatPrice } from './types';
import NoImagesMenuItem from './components/NoImagesMenuItem';
import MenuSection from './components/MenuSection';
import MenuNavigation from './components/MenuNavigation';

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
  
  // Default to 'zvezda' template for this design
  useEffect(() => {
    if (menu) {
      // Try to get the template from localStorage
      const savedTemplate = localStorage.getItem(`menu_template_${menu.id}`);
      if (savedTemplate && (savedTemplate === 'default' || savedTemplate === 'no-images' || savedTemplate === 'zvezda')) {
        // Update the menu object with the saved template
        menu.template = savedTemplate;
      } else {
        // Set 'zvezda' as the default template
        menu.template = 'zvezda';
        localStorage.setItem(`menu_template_${menu.id}`, 'zvezda');
      }
      console.log('Using template:', menu.template);
    }
  }, [menu]);
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
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

  // Modify handleSectionClick to ensure the tab is visible
  const handleSectionClick = useCallback((sectionId: string, index: number) => {
    setActiveSection(sectionId);
    setActiveSectionIndex(index);
    
    // Use the id attribute for smooth scrolling to the section
    const sectionElement = document.getElementById(`section-${sectionId}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Find and scroll the tab into view
    setTimeout(() => {
      const activeTab = document.querySelector(`.zvezda-tab[data-section-id="${sectionId}"], .menu-nav-item[data-section-id="${sectionId}"]`);
      const tabsScroller = document.getElementById('tabsScroller');
      
      if (activeTab && tabsScroller) {
        // Check if the tab is fully visible
        if (!isElementVisible(tabsScroller, activeTab)) {
          // Calculate the scroll position to center the active tab
          const scrollLeft = 
            activeTab.getBoundingClientRect().left - 
            tabsScroller.getBoundingClientRect().left + 
            tabsScroller.scrollLeft - 
            (tabsScroller.clientWidth / 2) + 
            (activeTab.clientWidth / 2);
          
          tabsScroller.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  }, []);

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

  // Modify the useEffect that handles scroll position detection to also scroll the navigation
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
              const activeTab = document.querySelector('.zvezda-tab.active, .menu-nav-item.active');
              const tabsScroller = document.getElementById('tabsScroller');
              
              if (activeTab && tabsScroller) {
                // The position of the active tab relative to the scroller
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
    <div className="min-h-screen font-sans">
      {/* Add a style tag to ensure this page is completely standalone */}
      <style>{`
        body {
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          color: #333;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          margin: 0;
          padding: 0;
        }
        .zvezda-header {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          padding: 2rem 1rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .zvezda-star {
          color: #f59e0b;
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .zvezda-title {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 2.5rem;
          letter-spacing: 0.1em;
          color: white;
          text-transform: uppercase;
          line-height: 1;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .zvezda-tabs-container, .menu-section-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          background-color: #2d2d2d;
          padding: 0.5rem 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .scroll-button {
          display: none; /* Hidden by default, shown on larger screens */
          background-color: #2d2d2d;
          color: white;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: absolute;
          z-index: 41;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.2s;
          opacity: 0.9;
        }
        .scroll-button:hover {
          background-color: #3d3d3d;
          opacity: 1;
        }
        .scroll-left {
          left: 10px;
        }
        .scroll-right {
          right: 10px;
        }
        .zvezda-tabs-wrapper, .menu-section-scroll {
          overflow-x: auto;
          scrollbar-width: thin;
          -ms-overflow-style: none; /* Hide scrollbar for IE and Edge */
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          padding-left: 0.25rem !important; /* Ensure first section is visible */
          padding-right: 1rem;
          white-space: nowrap;
        }
        .zvezda-tabs-wrapper::-webkit-scrollbar, .menu-section-scroll::-webkit-scrollbar {
          display: none;
        }
        .zvezda-tabs, .menu-nav-item {
          display: flex;
          gap: 0.375rem;
          padding: 0.5rem 0;
          margin: 0;
          white-space: nowrap;
          position: relative;
        }
        .zvezda-tab, .menu-nav-item {
          padding: 0.5rem 0.75rem; /* Smaller padding for more compact buttons */
          font-size: 0.85rem; /* Smaller font to fit more buttons */
          margin-right: 0.25rem; /* Add spacing between buttons */
        }
        .zvezda-tab.active, .menu-nav-item.active {
          background-color: #f59e0b;
          color: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .zvezda-section-title, .menu-nav-item:not(.active) {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 3px solid #f59e0b;
          display: inline-block;
          scroll-margin-top: 90px;
        }
        .zvezda-menu-container {
          background: white;
          padding: 2rem 1rem;
          margin-top: 2rem;
          border-radius: 2rem 2rem 0 0;
          min-height: 70vh;
          transition: margin-left 0.3s ease-in-out;
        }
        .zvezda-menu-section {
          display: grid;
          gap: 2rem;
        }
        .zvezda-menu-item {
          display: flex;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        .zvezda-menu-item:last-child {
          border-bottom: none;
        }
        .zvezda-item-image {
          width: 90px;
          height: 90px;
          border-radius: 8px;
          object-fit: cover;
          margin-right: 1rem;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .zvezda-item-content {
          flex: 1;
        }
        .zvezda-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.25rem;
        }
        .zvezda-item-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
          padding-right: 1rem;
        }
        .zvezda-item-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f59e0b;
          white-space: nowrap;
        }
        .zvezda-item-description {
          font-size: 1rem;
          color: #666;
          margin-top: 0.25rem;
          margin-bottom: 0.5rem;
        }
        .zvezda-item-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .zvezda-tag {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          display: flex;
          align-items: center;
        }
        .zvezda-dietary-tag {
          background-color: #dcfce7;
          color: #16a34a;
        }
        .zvezda-allergen-tag {
          background-color: #fee2e2;
          color: #dc2626;
        }
        .zvezda-search-container {
          background-color: #2d2d2d;
          padding: 1rem;
          position: relative;
          z-index: 30;
        }
        .zvezda-search-inner {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 0.75rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .zvezda-search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 0.375rem;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          color: #1a1a1a;
        }
        .zvezda-search-input:focus {
          outline: 2px solid #f59e0b;
        }
        .zvezda-filter-button, .menu-section-scroll {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 0.375rem;
          color: white;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .zvezda-filter-button:hover, .menu-section-scroll {
          background: rgba(255, 255, 255, 0.3);
        }
        .zvezda-filter-badge, .menu-section-scroll {
          background: #f59e0b;
          color: white;
          font-size: 0.75rem;
          font-weight: bold;
          width: 1.25rem;
          height: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
        }
        .zvezda-filters-panel, .menu-section-scroll {
          background: #1a1a1a;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 0.5rem;
          animation: fadeIn 0.3s ease;
        }
        .zvezda-filter-group-title, .menu-section-scroll {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        .zvezda-filter-options, .menu-section-scroll {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .zvezda-filter-option, .menu-section-scroll {
          padding: 0.375rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .zvezda-dietary-option, .menu-section-scroll {
          background: rgba(22, 163, 74, 0.2);
          color: #dcfce7;
        }
        .zvezda-dietary-option.active, .menu-section-scroll {
          background: #16a34a;
          color: white;
        }
        .zvezda-allergen-option, .menu-section-scroll {
          background: rgba(220, 38, 38, 0.2);
          color: #fee2e2;
        }
        .zvezda-allergen-option.active, .menu-section-scroll {
          background: #dc2626;
          color: white;
        }
        .zvezda-clear-filters, .menu-section-scroll {
          padding: 0.375rem 0.625rem;
          color: #f59e0b;
          font-size: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
        }
        .zvezda-clear-filters:hover, .menu-section-scroll {
          color: #fbbf24;
        }
        .header-wave {
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 20px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' opacity='.1' fill='%23FFFFFF'%3E%3C/path%3E%3Cpath d='M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z' opacity='.2' fill='%23FFFFFF'%3E%3C/path%3E%3Cpath d='M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z' fill='%23FFFFFF'%3E%3C/path%3E%3C/svg%3E") no-repeat;
          background-size: cover;
        }
        .back-to-top {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 40px;
          height: 40px;
          background-color: #f59e0b;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          z-index: 50;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .back-to-top.visible {
          opacity: 1;
        }
        .back-to-top:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        @media (min-width: 768px) {
          .zvezda-menu-container {
            max-width: 1200px;
            margin: 2rem auto 0;
            padding: 2rem;
          }
          .zvezda-menu-section {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
            gap: 2rem;
          }
        }
        @media (max-width: 767px) {
          .zvezda-menu-container {
            margin-left: 0 !important;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {menu && menu.template === 'zvezda' ? (
        <>
          {/* Zvezda Header */}
          <header className="zvezda-header">
            <div className="zvezda-star">★</div>
            <h1 className="zvezda-title">{menu.name}</h1>
            {menu.description && (
              <p className="text-center text-white mt-3 max-w-md mx-auto text-sm md:text-base font-light opacity-90">
                {menu.description}
              </p>
            )}
            <div className="header-wave"></div>
          </header>

          {/* Zvezda Search & Filter */}
          <div className="zvezda-search-container">
            <div className="zvezda-search-inner">
              <input
                type="text"
                placeholder="Search menu items..."
                className="zvezda-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className="zvezda-filter-button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="zvezda-filter-badge">
                    {selectedDietaryTags.length + selectedAllergens.length + (searchTerm ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Options */}
            {isFilterVisible && (
              <div className="zvezda-filters-panel">
                <div>
                  <h3 className="zvezda-filter-group-title">Dietary Preferences</h3>
                  <div className="zvezda-filter-options">
                    {availableDietaryTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleDietaryTag(tag.id)}
                        className={`zvezda-filter-option zvezda-dietary-option ${
                          selectedDietaryTags.includes(tag.id) ? 'active' : ''
                        }`}
                      >
                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                        {tag.name}
                      </button>
                    ))}
                    {availableDietaryTags.length === 0 && (
                      <span className="text-white text-opacity-50 text-xs">No dietary options available</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="zvezda-filter-group-title">Exclude Allergens</h3>
                  <div className="zvezda-filter-options">
                    {availableAllergens.map(allergen => (
                      <button
                        key={allergen.id}
                        onClick={() => toggleAllergen(allergen.id)}
                        className={`zvezda-filter-option zvezda-allergen-option ${
                          selectedAllergens.includes(allergen.id) ? 'active' : ''
                        }`}
                      >
                        {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                        {allergen.name}
                      </button>
                    ))}
                    {availableAllergens.length === 0 && (
                      <span className="text-white text-opacity-50 text-xs">No allergen options available</span>
                    )}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="zvezda-clear-filters"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Menu Navigation */}
          <MenuNavigation
            sections={filteredSections}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
          />

          {/* Zvezda Menu Content */}
          <main className="zvezda-menu-container mt-6">
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <div 
                  key={section.id} 
                  ref={(el) => { sectionRefs.current[section.id] = el; }}
                  className="mb-12"
                >
                  <h2 
                    id={`section-${section.id}`} 
                    className="zvezda-section-title"
                  >
                    {section.name}
                  </h2>
                  <div className="zvezda-menu-section">
                    {section.items.map((item) => (
                      <div 
                        key={item.id} 
                        className="zvezda-menu-item cursor-pointer"
                        onClick={() => openItemModal(item)}
                      >
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="zvezda-item-image"
                            onError={(e) => {
                              const imgElement = e.currentTarget;
                              imgElement.src = 'https://via.placeholder.com/90x90?text=No+Image';
                            }}
                          />
                        )}
                        <div className="zvezda-item-content">
                          <div className="zvezda-item-header">
                            <h3 className="zvezda-item-name flex items-center gap-2">
                              {item.name}
                              {item.videoUrl && (
                                <span className="text-amber-500 flex items-center gap-1" title="Watch video">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </span>
                              )}
                            </h3>
                            <div className="zvezda-item-price">${formatPrice(item.price)}</div>
                          </div>
                          {item.description && (
                            <p className="zvezda-item-description">{item.description}</p>
                          )}

                          {/* Dietary Tags & Allergens */}
                          <div className="zvezda-item-tags">
                            {item.dietaryTags && item.dietaryTags.length > 0 && 
                              item.dietaryTags.map(tag => (
                                <span key={tag.id} className="zvezda-tag zvezda-dietary-tag">
                                  {tag.icon && <span className="mr-1">{tag.icon}</span>}
                                  {tag.name}
                                </span>
                              ))
                            }
                            {item.allergens && item.allergens.length > 0 && 
                              item.allergens.map(allergen => (
                                <span key={allergen.id} className="zvezda-tag zvezda-allergen-tag">
                                  {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                                  {allergen.name}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg mt-4">
                <p className="text-gray-500">No items found with the current filters</p>
              </div>
            )}
          </main>
        </>
      ) : (
        <>
          {/* Visible Restaurant Header */}
          <header className="visible-header w-full text-white">
            <div className="relative py-6 px-4 flex flex-col items-center justify-center min-h-[150px] md:min-h-[180px]">
              <div className="z-10 transform transition-all duration-300">
                <div className="logo-placeholder mb-3 mx-auto">
                  <svg className="w-10 h-10 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h1 className="restaurant-title text-center text-3xl md:text-4xl lg:text-5xl mb-5">
                  {menu.name}
                </h1>
                
                {menu.description && (
                  <p className="text-center text-white mt-3 max-w-md mx-auto text-sm md:text-base font-light opacity-90">
                    {menu.description}
                  </p>
                )}
              </div>
              
              <div className="header-wave"></div>
              
              {/* Decorative elements */}
              <div className="absolute top-1/3 left-10 w-6 h-6 bg-white opacity-10 rounded-full transform animate-pulse"></div>
              <div className="absolute top-2/3 right-10 w-4 h-4 bg-white opacity-5 rounded-full transform animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-1/4 left-1/4 w-8 h-8 bg-white opacity-10 rounded-full transform animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute top-1/4 right-1/3 w-3 h-3 bg-white opacity-15 rounded-full transform animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>
          </header>
          
          {/* Menu Navigation */}
          <MenuNavigation
            sections={filteredSections}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
          />
          
          {/* Menu Content */}
          <main className="max-w-7xl mx-auto px-4 py-4 ml-64">
            {filteredSections.length > 0 ? (
              filteredSections.map((section, sectionIndex) => (
                <MenuSection
                  key={section.id}
                  section={section}
                  menu={menu}
                  template={menu.template || 'default'}
                  onItemClick={openItemModal}
                />
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg mt-4">
                <p className="text-gray-500">No items found with the current filters</p>
              </div>
            )}
          </main>
        </>
      )}
      
      {/* Item Modal/Popup - Improved implementation */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-75 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          {/* Close button - Moved outside the modal content */}
          <button 
            className="fixed top-4 right-4 z-[60] bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
            onClick={() => setSelectedItem(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div 
            ref={modalRef}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
            style={{animation: 'modalFadeIn 0.2s ease-out'}}
          >
            <div className="flex flex-col">
              {/* Media Section - Only show if there's media content */}
              {(selectedItem.imageUrl || selectedItem.videoUrl) && (
                <div className="relative aspect-video bg-gray-900">
                  {showVideo && selectedItem.videoUrl ? (
                    <div className="w-full h-full">
                      {(() => {
                        const videoInfo = getVideoEmbedUrl(selectedItem.videoUrl);
                        if (videoInfo && (videoInfo.type === 'youtube' || videoInfo.type === 'vimeo')) {
                          return (
                            <iframe
                              src={videoInfo.embedUrl}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            ></iframe>
                          );
                        } else {
                          return (
                            <video 
                              className="w-full h-full" 
                              controls 
                              playsInline
                              autoPlay
                            >
                              <source src={selectedItem.videoUrl} type="video/mp4" />
                              <source src={selectedItem.videoUrl} type="video/webm" />
                              Your browser does not support the video tag.
                            </video>
                          );
                        }
                      })()}
                    </div>
                  ) : selectedItem.imageUrl && (
                    <img 
                      src={selectedItem.imageUrl} 
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Media toggle button - Only show if both image and video are available */}
                  {selectedItem.videoUrl && selectedItem.imageUrl && (
                    <button 
                      className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVideo(!showVideo);
                      }}
                    >
                      {showVideo ? (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                          <span>View Photo</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Watch Video</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Content Section */}
              <div className="p-6 space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                    <span className="text-2xl font-bold text-amber-500">
                      ${formatPrice(selectedItem.price)}
                    </span>
                  </div>
                  {selectedItem.description && (
                    <p className="text-gray-600 text-base">{selectedItem.description}</p>
                  )}
                </div>

                {/* Dietary Information */}
                {((selectedItem.dietaryTags && selectedItem.dietaryTags.length > 0) || 
                  (selectedItem.allergens && selectedItem.allergens.length > 0)) && (
                  <div className="space-y-4">
                    {selectedItem.dietaryTags && selectedItem.dietaryTags.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Dietary Options</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.dietaryTags.map(tag => (
                            <span 
                              key={tag.id}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                            >
                              {tag.icon && <span className="mr-1">{tag.icon}</span>}
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Contains Allergens</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.allergens.map(allergen => (
                            <span 
                              key={allergen.id}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                            >
                              {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                              {allergen.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">{menu.name}</h3>
              {menu.description && (
                <p className="mt-1 text-gray-400 text-sm">{menu.description}</p>
              )}
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} {menu.name}. All rights reserved.</p>
            <p className="mt-1">Powered by <a href="#" className="text-amber-400 hover:text-amber-300">OpenSaaS Menu</a></p>
          </div>
        </div>
      </footer>

      {/* Quick Filter Bar for No-Images Template */}
      {menu.template === 'no-images' && (
        <div className="quick-filter-bar">
          <button
            className={`quick-filter-button ${!hasActiveFilters ? 'active' : ''}`}
            onClick={clearFilters}
          >
            All Items
          </button>
          {availableDietaryTags.slice(0, 5).map(tag => (
            <button
              key={tag.id}
              className={`quick-filter-button ${selectedDietaryTags.includes(tag.id) ? 'active' : ''}`}
              onClick={() => toggleDietaryTag(tag.id)}
            >
              {tag.icon && <span className="mr-1">{tag.icon}</span>}
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Back to Top Button */}
      <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
};

export default PublicMenuPage;