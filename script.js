// NASA API Configuration
const NASA_API_KEY = 'ifH3dphAGpmpd01DsoHjiyMFJF1DZHZcf5E18iIR';
const APOD_BASE_URL = 'https://api.nasa.gov/planetary/apod';

// Add real-time data sources
const PEOPLE_IN_SPACE_URL = 'http://api.open-notify.org/astros.json';
const LAUNCH_LIBRARY_URL = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/';

// DOM Elements
const startDateInput = document.getElementById('start-date');
const fetchButton = document.getElementById('fetch-button');
const galleryGrid = document.getElementById('gallery-grid');
const galleryTitle = document.querySelector('.gallery h2');

// Utility function to format date for NASA API (YYYY-MM-DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Generate array of 9 consecutive dates starting from given date
function generateDateRange(startDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 9; i++) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

// Fetch APOD data for a single date
async function fetchSingleAPOD(date) {
    const dateString = formatDate(date);
    const url = `${APOD_BASE_URL}?api_key=${NASA_API_KEY}&date=${dateString}`;
    
    console.log(`Fetching APOD for ${dateString}...`);
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`API Error for ${dateString}: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        console.log(`Successfully fetched APOD for ${dateString}`);
        return data;
        
    } catch (error) {
        console.error(`Network error for ${dateString}:`, error);
        return null;
    }
}

// Fetch APOD data for multiple dates
async function fetchMultipleAPODs(startDate) {
    const dates = generateDateRange(startDate);
    console.log('Fetching APODs for dates:', dates.map(d => formatDate(d)));
    
    const promises = dates.map(date => fetchSingleAPOD(date));
    
    try {
        const results = await Promise.all(promises);
        const validResults = results.filter(result => result !== null);
        
        console.log(`Successfully fetched ${validResults.length} out of ${dates.length} APODs`);
        return validResults;
        
    } catch (error) {
        console.error('Error in fetchMultipleAPODs:', error);
        return [];
    }
}

// Create a single APOD card element
function createAPODCard(apodData) {
    const card = document.createElement('div');
    card.className = 'apod-card';
    
    // Handle media content (image or video)
    let mediaHTML;
    if (apodData.media_type === 'video') {
        mediaHTML = `
            <div style="width: 100%; height: 220px; background: linear-gradient(45deg, #1a2332, #243040); border-radius: 10px; margin-bottom: 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #4a9eff; border: 2px dashed #4a9eff;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎥</div>
                <div style="font-size: 0.9rem; text-align: center;">Video Content<br><small>Click to view</small></div>
            </div>
        `;
    } else {
        mediaHTML = `
            <img src="${apodData.url}" 
                 alt="${apodData.title}" 
                 loading="lazy"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/400x220/1a2332/4a9eff?text=Image+Unavailable';">
        `;
    }
    
    // Create card HTML
    card.innerHTML = `
        ${mediaHTML}
        <h3>${apodData.title}</h3>
        <p class="date">${apodData.date}</p>
        <p class="explanation">${apodData.explanation}</p>
    `;
    
    // Add click event for modal
    card.addEventListener('click', () => openModal(apodData));
    
    return card;
}

// Function to show initial message
function showInitialMessage() {
    galleryGrid.innerHTML = `
        <div class="initial-message">
            <div class="text">Please select a date to see the Astronomy Picture of the Day</div>
        </div>
    `;
    galleryTitle.style.display = 'block';
}

// Display APOD cards in gallery
function displayAPODGallery(apodDataArray) {
    console.log('Displaying gallery with', apodDataArray.length, 'items');
    
    // Clear existing content
    galleryGrid.innerHTML = '';
    
    if (apodDataArray.length === 0) {
        galleryGrid.innerHTML = `
            <div class="error-message">
                <strong>No APOD data found</strong><br>
                Please try a different date range or check your internet connection.
            </div>
        `;
        galleryTitle.style.display = 'none';
        return;
    }
    
    // Show gallery title
    galleryTitle.style.display = 'block';
    
    // Create and append cards
    apodDataArray.forEach((apodData, index) => {
        const card = createAPODCard(apodData);
        galleryGrid.appendChild(card);
        
        // Add staggered animation
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.5s ease';
            
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        }, index * 100);
    });
    
    // Reset date input after successful gallery display
    setTimeout(() => {
        startDateInput.value = '';
    }, 1000);
    
    // Scroll to gallery
    setTimeout(() => {
        document.getElementById('gallery').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 500);
}

// Show loading state
function showLoadingState() {
    galleryGrid.innerHTML = `
        <div class="loading-message">
            <div style="font-size: 2rem; margin-bottom: 1rem;">🚀</div>
            <div>Loading NASA APOD data...</div>
            <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">Fetching 9 images from space</div>
        </div>
    `;
    galleryTitle.style.display = 'block';
}

// Open modal with APOD details - Completely rewritten
function openModal(apodData) {
    // Remove existing modal if present
    const existingModal = document.getElementById('custom-apod-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create new modal structure
    const newModal = document.createElement('div');
    newModal.id = 'custom-apod-modal';
    newModal.className = 'custom-modal-overlay';
    
    // Create modal content based on media type
    let mediaContent;
    if (apodData.media_type === 'video') {
        mediaContent = `
            <div class="custom-modal-video">
                <div class="video-placeholder">
                    <div class="video-icon">🎬</div>
                    <h3>Video Content</h3>
                    <p>Click to view on NASA's website</p>
                    <button class="view-video-btn" onclick="window.open('${apodData.url}', '_blank')">
                        Watch Video
                    </button>
                </div>
            </div>
        `;
    } else {
        mediaContent = `
            <div class="custom-modal-image">
                <img src="${apodData.url}" alt="${apodData.title}" loading="lazy" />
                <div class="image-controls">
                    <button class="zoom-btn" onclick="toggleImageZoom(this)">🔍</button>
                    <button class="fullscreen-btn" onclick="openImageFullscreen('${apodData.url}')">⛶</button>
                </div>
            </div>
        `;
    }
    
    newModal.innerHTML = `
        <div class="custom-modal-container">
            <div class="custom-modal-header">
                <div class="modal-title-section">
                    <h2>${apodData.title}</h2>
                    <div class="modal-date-badge">${apodData.date}</div>
                </div>
                <button class="custom-modal-close" onclick="closeCustomModal()">
                    <span>×</span>
                </button>
            </div>
            
            <div class="custom-modal-body">
                <div class="modal-media-section">
                    ${mediaContent}
                </div>
                
                <div class="modal-text-section">
                    <div class="explanation-header">
                        <h3>About this image</h3>
                        <div class="explanation-meta">
                            <span class="media-type-badge">${apodData.media_type}</span>
                        </div>
                    </div>
                    <div class="explanation-content">
                        <p>${apodData.explanation}</p>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="action-btn primary" onclick="window.open('${apodData.url}', '_blank')">
                            View Original
                        </button>
                        <button class="action-btn secondary" onclick="shareAPOD('${apodData.title}', '${apodData.url}')">
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(newModal);
    
    // Add animation and show
    requestAnimationFrame(() => {
        newModal.classList.add('show');
    });
    
    // Close on overlay click
    newModal.addEventListener('click', (e) => {
        if (e.target === newModal) {
            closeCustomModal();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', handleModalKeydown);
}

// Close modal with animation - Completely rewritten
function closeCustomModal() {
    const customModal = document.getElementById('custom-apod-modal');
    if (customModal) {
        customModal.classList.remove('show');
        customModal.classList.add('hide');
        
        setTimeout(() => {
            customModal.remove();
            document.removeEventListener('keydown', handleModalKeydown);
        }, 300);
    }
}

// Handle keyboard events for modal
function handleModalKeydown(e) {
    if (e.key === 'Escape') {
        closeCustomModal();
    }
}

// Toggle image zoom
function toggleImageZoom(button) {
    const image = button.closest('.custom-modal-image').querySelector('img');
    image.classList.toggle('zoomed');
    button.textContent = image.classList.contains('zoomed') ? '🔍-' : '🔍';
}

// Open image in fullscreen
function openImageFullscreen(imageUrl) {
    const fullscreenDiv = document.createElement('div');
    fullscreenDiv.className = 'fullscreen-image-viewer';
    fullscreenDiv.innerHTML = `
        <img src="${imageUrl}" alt="Fullscreen view" />
        <button class="fullscreen-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(fullscreenDiv);
}

// Share APOD function
function shareAPOD(title, url) {
    if (navigator.share) {
        navigator.share({
            title: `NASA APOD: ${title}`,
            text: `Check out this amazing space image from NASA!`,
            url: url
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            // Show temporary message
            const message = document.createElement('div');
            message.className = 'share-message';
            message.textContent = 'Link copied to clipboard!';
            document.body.appendChild(message);
            
            setTimeout(() => {
                message.remove();
            }, 2000);
        });
    }
}

// Update the closeModalWithAnimation function to ensure compatibility
function closeModalWithAnimation() {
    closeCustomModal();
}

// Set default date to today
function setDefaultDate() {
    const today = new Date();
    startDateInput.value = formatDate(today);
}

// Main fetch function
async function handleFetchAPODs() {
    const startDateValue = startDateInput.value;
    
    if (!startDateValue) {
        alert('Please select a start date');
        return;
    }
    
    console.log('Starting APOD fetch process...');
    
    // Update button state
    fetchButton.textContent = 'Loading...';
    fetchButton.disabled = true;
    
    // Show loading state
    showLoadingState();
    
    try {
        const startDate = new Date(startDateValue);
        console.log('Start date:', formatDate(startDate));
        
        const apodData = await fetchMultipleAPODs(startDate);
        displayAPODGallery(apodData);
        
    } catch (error) {
        console.error('Error in handleFetchAPODs:', error);
        galleryGrid.innerHTML = `
            <div class="error-message">
                <strong>Oops! Something went wrong</strong><br>
                ${error.message || 'Please try again later'}
            </div>
        `;
    } finally {
        // Reset button state
        fetchButton.textContent = 'Engage Stargate';
        fetchButton.disabled = false;
    }
}

// News API Configuration
const SPACEFLIGHT_NEWS_URL = 'https://api.spaceflightnewsapi.net/v4/articles/';

// Fetch space news
async function fetchSpaceNews() {
    try {
        const response = await fetch(`${SPACEFLIGHT_NEWS_URL}?limit=6`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching space news:', error);
        return [];
    }
}

// Display news cards with moderate enhancements
function displayNews(newsArray) {
    const newsContainer = document.getElementById('news-container');
    
    if (newsArray.length === 0) {
        newsContainer.innerHTML = '<div class="error-message" style="grid-column: 1 / -1;">Unable to load space news at this time.</div>';
        return;
    }
    
    // Clear loading message
    newsContainer.innerHTML = '';
    
    // Create featured news section
    const featuredNews = document.createElement('div');
    featuredNews.className = 'featured-news';
    
    // Create sidebar
    const newsSidebar = document.createElement('div');
    newsSidebar.className = 'news-sidebar';
    
    // Add sidebar header
    newsSidebar.innerHTML = `
        <div class="sidebar-header">
            <h4>🚀 Latest Updates</h4>
        </div>
        <div class="news-list"></div>
    `;
    
    const newsList = newsSidebar.querySelector('.news-list');
    
    newsArray.forEach((article, index) => {
        const publishDate = new Date(article.published_at);
        const isRecent = publishDate > new Date(Date.now() - 24 * 60 * 60 * 1000);
        const timeAgo = getTimeAgo(publishDate);
        
        if (index === 0) {
            // Enhanced featured article
            const featuredArticle = document.createElement('div');
            featuredArticle.className = 'featured-article';
            
            featuredArticle.innerHTML = `
                <img src="${article.image_url}" alt="${article.title}" onerror="this.src='https://via.placeholder.com/600x300/1a2332/ffffff?text=Featured+Space+News'">
                <div class="featured-content">
                    ${isRecent ? '<span class="breaking-badge">🔥 Breaking</span>' : ''}
                    <h3>${article.title}</h3>
                    <p class="date">${timeAgo}</p>
                    <p class="summary">${article.summary}</p>
                    <span class="read-more">Read Full Article</span>
                </div>
            `;
            
            featuredArticle.addEventListener('click', () => {
                window.open(article.url, '_blank');
            });
            
            featuredNews.appendChild(featuredArticle);
            
        } else if (index <= 5) {
            // Enhanced sidebar news items
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            
            // Truncate title to fit the space better (max 45 characters)
            const truncatedTitle = article.title.length > 45 
                ? article.title.substring(0, 42) + '...' 
                : article.title;
            
            newsItem.innerHTML = `
                <img src="${article.image_url}" alt="${article.title}" onerror="this.src='https://via.placeholder.com/80x60/1a2332/ffffff?text=News'">
                <div class="news-item-content">
                    <h5 title="${article.title}">${truncatedTitle}</h5>
                    <p class="date">${timeAgo}</p>
                </div>
            `;
            
            newsItem.addEventListener('click', () => {
                window.open(article.url, '_blank');
            });
            
            newsList.appendChild(newsItem);
        }
    });
    
    // Add sections to container
    newsContainer.appendChild(featuredNews);
    newsContainer.appendChild(newsSidebar);
    
    // Enhanced staggered animations
    setTimeout(() => {
        featuredNews.style.opacity = '0';
        featuredNews.style.transform = 'translateY(20px)';
        featuredNews.style.transition = 'all 0.6s ease';
        
        requestAnimationFrame(() => {
            featuredNews.style.opacity = '1';
            featuredNews.style.transform = 'translateY(0)';
        });
    }, 100);
    
    setTimeout(() => {
        newsSidebar.style.opacity = '0';
        newsSidebar.style.transform = 'translateX(20px)';
        newsSidebar.style.transition = 'all 0.6s ease';
        
        requestAnimationFrame(() => {
            newsSidebar.style.opacity = '1';
            newsSidebar.style.transform = 'translateX(0)';
        });
    }, 300);
}

// Helper function to get time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }
}

// Initialize news
async function initializeNews() {
    const news = await fetchSpaceNews();
    displayNews(news);
}

// Statistics Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000; // 2 seconds
                const increment = target / (duration / 16); // 60fps
                let current = 0;
                
                counter.classList.add('counting');
                
                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.textContent = Math.floor(current).toLocaleString();
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target.toLocaleString();
                        counter.classList.remove('counting');
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// Timeline Tab Switching
function initializeTimelineTabs() {
    const tabs = document.querySelectorAll('.timeline-tab');
    const timelines = {
        historic: document.getElementById('historic-timeline'),
        upcoming: document.getElementById('upcoming-timeline')
    };
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all timelines
            Object.values(timelines).forEach(timeline => {
                timeline.classList.add('hidden');
            });
            
            // Show selected timeline
            const selectedTab = tab.getAttribute('data-tab');
            timelines[selectedTab].classList.remove('hidden');
            
            // Add animation to timeline items
            const items = timelines[selectedTab].querySelectorAll('.timeline-item');
            items.forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                item.style.transition = 'all 0.4s ease';
                
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 100);
            });
        });
    });
}

// Add real-time data fetching functions
async function fetchRealPeopleInSpace() {
    try {
        const response = await fetch(PEOPLE_IN_SPACE_URL);
        const data = await response.json();
        
        // Update the astronauts stat with real current count
        const astronautStat = document.querySelector('[data-target="350"]');
        if (astronautStat) {
            const newTarget = data.number + 340; // Add base number to current people
            astronautStat.setAttribute('data-target', newTarget);
            console.log(`Updated people in space: ${data.number} (displayed as ${newTarget})`);
        }
        
        return data.number;
    } catch (error) {
        console.error('Error fetching people in space data:', error);
        return null;
    }
}

async function fetchRealUpcomingLaunches() {
    try {
        const response = await fetch(`${LAUNCH_LIBRARY_URL}?limit=4`);
        const data = await response.json();
        
        const upcomingTimeline = document.getElementById('upcoming-timeline');
        if (upcomingTimeline && data.results && data.results.length > 0) {
            upcomingTimeline.innerHTML = '';
            
            data.results.forEach(launch => {
                const launchDate = new Date(launch.net);
                const year = launchDate.getFullYear();
                const timelineItem = document.createElement('div');
                timelineItem.className = 'timeline-item upcoming';
                
                // Determine status color
                let statusClass = 'mission-status';
                const status = launch.status.name.toLowerCase();
                if (status.includes('go')) statusClass += ' status-go';
                else if (status.includes('hold')) statusClass += ' status-hold';
                
                timelineItem.innerHTML = `
                    <div class="timeline-year">${year}</div>
                    <div class="timeline-content">
                        <h4>${launch.name}</h4>
                        <p>${launch.mission?.description || launch.rocket?.configuration?.description || 'Upcoming space mission'}</p>
                        <div class="${statusClass}">${launch.status.name}</div>
                    </div>
                `;
                
                upcomingTimeline.appendChild(timelineItem);
            });
            
            console.log('Updated upcoming launches with real data');
        }
    } catch (error) {
        console.error('Error fetching upcoming launches:', error);
        // Keep static data if API fails
    }
}

// Update exoplanet count with more recent data
function updateExoplanetCount() {
    const exoplanetStat = document.querySelector('[data-target="5400"]');
    if (exoplanetStat) {
        // More recent estimate as of 2024
        exoplanetStat.setAttribute('data-target', '5500');
    }
}

// Initialize real-time data
async function initializeRealTimeData() {
    console.log('Initializing real-time data...');
    
    // Fetch real people in space count
    await fetchRealPeopleInSpace();
    
    // Fetch real upcoming launches  
    await fetchRealUpcomingLaunches();
    
    // Update exoplanet count
    updateExoplanetCount();
    
    console.log('Real-time data initialization complete');
}

// Set up periodic updates
function setupPeriodicUpdates() {
    // Update people in space every 5 minutes
    setInterval(async () => {
        await fetchRealPeopleInSpace();
        console.log('Updated people in space count');
    }, 5 * 60 * 1000);
    
    // Update news every 30 minutes
    setInterval(async () => {
        await initializeNews();
        console.log('Refreshed news data');
    }, 30 * 60 * 1000);
    
    // Update launches every 6 hours
    setInterval(async () => {
        await fetchRealUpcomingLaunches();
        console.log('Updated upcoming launches');
    }, 6 * 60 * 60 * 1000);
}

// Update the main DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    setDefaultDate();
    showInitialMessage();
    
    // Initialize with static data first
    await initializeNews();
    animateCounters();
    initializeTimelineTabs();
    initializeMissionCards();
    
    // Then load real-time data
    await initializeRealTimeData();
    
    // Re-animate counters with updated data
    setTimeout(() => {
        animateCounters();
    }, 1000);
    
    // Setup periodic updates
    setupPeriodicUpdates();
    
    console.log('NASA Universe Portal fully initialized with real-time data');
});

// Event Listeners - Updated to work with new modal system
fetchButton.addEventListener('click', handleFetchAPODs);

// Remove old modal event listeners since we handle them in the new modal
// closeModal.addEventListener('click', closeModalWithAnimation);
// modal.addEventListener('click', (e) => {
//     if (e.target === modal) {
//         closeModalWithAnimation();
//     }
// });

// Newsletter form (basic implementation)
document.getElementById('newsletter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    alert(`Thank you for subscribing with email: ${email}`);
    e.target.reset();
});

// Enhanced Newsletter form implementation
document.getElementById('newsletter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const form = e.target;
    const emailInput = form.querySelector('input[type="email"]');
    const submitButton = form.querySelector('.newsletter-submit');
    const submitText = submitButton.querySelector('.submit-text');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const email = emailInput.value.trim();
    
    // Hide previous messages
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        errorMessage.style.display = 'block';
        emailInput.style.borderColor = '#fc3d21';
        emailInput.focus();
        return;
    }
    
    // Reset border color
    emailInput.style.borderColor = '#4a9eff';
    
    // Simulate loading state
    submitButton.disabled = true;
    submitText.textContent = 'Subscribing...';
    submitButton.style.background = 'linear-gradient(135deg, #6b7280, #9ca3af)';
    
    // Simulate API call
    setTimeout(() => {
        // Show success message
        successMessage.style.display = 'block';
        
        // Reset form
        form.reset();
        
        // Reset button
        submitButton.disabled = false;
        submitText.textContent = 'Subscribe';
        submitButton.style.background = 'linear-gradient(135deg, #fc3d21, #ff6b47)';
        
        // Add celebration effect
        createCelebrationEffect();
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
        
    }, 2000);
});

// Create celebration effect
function createCelebrationEffect() {
    const newsletter = document.querySelector('.newsletter');
    
    // Create floating particles
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: linear-gradient(45deg, #4a9eff, #fc3d21);
            border-radius: 50%;
            pointer-events: none;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: celebrate 3s ease-out forwards;
            z-index: 100;
        `;
        
        newsletter.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 3000);
    }
}

// Add celebrate animation to CSS
const celebrateCSS = `
@keyframes celebrate {
    0% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    100% {
        opacity: 0;
        transform: translateY(-100px) scale(0);
    }
}
`;

// Insert the CSS
const style = document.createElement('style');
style.textContent = celebrateCSS;
document.head.appendChild(style);

// Add typing animation to email placeholder
function initializePlaceholderAnimation() {
    const emailInput = document.querySelector('.newsletter input[type="email"]');
    const placeholders = [
        'Enter your email address',
        'astronaut@space.com',
        'explorer@universe.com',
        'stargazer@cosmos.com'
    ];
    
    let currentIndex = 0;
    
    setInterval(() => {
        currentIndex = (currentIndex + 1) % placeholders.length;
        emailInput.placeholder = placeholders[currentIndex];
    }, 4000);
}

// Initialize placeholder animation on load
document.addEventListener('DOMContentLoaded', () => {
    setDefaultDate();
    showInitialMessage(); // Show initial message on page load
    initializePlaceholderAnimation();
    console.log('NASA Universe Portal initialized');
});

// Mission Cards Enhancement
function initializeMissionCards() {
    const missionCards = document.querySelectorAll('.mission');
    
    missionCards.forEach((card, index) => {
        // Add entrance animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        
        // Staggered entrance animation
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
        
        // Enhanced hover effects
        card.addEventListener('mouseenter', () => {
            // Add glow effect
            card.style.boxShadow = '0 20px 40px rgba(74, 158, 255, 0.3), 0 0 20px rgba(74, 158, 255, 0.2)';
            
            // Animate progress bar
            const progressBar = card.querySelector('.mission-progress-bar');
            if (progressBar) {
                setTimeout(() => {
                    progressBar.style.width = card.style.getPropertyValue('--progress') || '75%';
                }, 100);
            }
        });
        
        card.addEventListener('mouseleave', () => {
            const progressBar = card.querySelector('.mission-progress-bar');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        });
        
        // CTA button click handler
        const ctaButton = card.querySelector('.mission-cta');
        if (ctaButton) {
            ctaButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Create ripple effect
                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    width: 20px;
                    height: 20px;
                    animation: ripple 0.6s linear;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                `;
                
                ctaButton.style.position = 'relative';
                ctaButton.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                    // Trigger the parent link
                    const parentLink = card.closest('a');
                    if (parentLink) {
                        window.open(parentLink.href, '_blank');
                    }
                }, 300);
            });
        }
    });
}

// Add ripple animation CSS
const rippleCSS = `
@keyframes ripple {
    0% {
        width: 20px;
        height: 20px;
        opacity: 1;
    }
    100% {
        width: 60px;
        height: 60px;
        opacity: 0;
    }
}
`;

const rippleStyle = document.createElement('style');
rippleStyle.textContent = rippleCSS;
document.head.appendChild(rippleStyle);

// Add enhanced modal CSS styles
const modalStyles = `
<style>
/* Custom Modal Styles */
.custom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(10, 18, 30, 0.97);
    backdrop-filter: blur(10px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(.4,0,.2,1);
}

.custom-modal-overlay.show {
    opacity: 1;
    visibility: visible;
}

.custom-modal-overlay.hide {
    opacity: 0;
    visibility: hidden;
}

.custom-modal-container {
    background: linear-gradient(145deg, #1a2332 80%, #243040 100%);
    border-radius: 18px;
    max-width: 96vw;
    max-height: 92vh;
    width: 950px;
    min-width: 320px;
    min-height: 320px;
    overflow: hidden;
    box-shadow: 0 30px 60px 0 rgba(0,0,0,0.7), 0 1.5px 6px 0 rgba(74,158,255,0.08);
    transform: scale(0.93) translateY(40px);
    transition: all 0.3s cubic-bezier(.4,0,.2,1);
    border: 1.5px solid rgba(74, 158, 255, 0.13);
    display: flex;
    flex-direction: column;
}

.custom-modal-overlay.show .custom-modal-container {
    transform: scale(1) translateY(0);
}

.custom-modal-header {
    padding: 20px 28px 16px 28px;
    border-bottom: 1px solid rgba(74, 158, 255, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(90deg, rgba(74, 158, 255, 0.08), rgba(252, 61, 33, 0.06));
}

.modal-title-section h2 {
    color: #fff;
    margin: 0 0 6px 0;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
}

.modal-date-badge {
    background: linear-gradient(135deg, #4a9eff, #fc3d21);
    color: white;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
    margin-top: 2px;
    display: inline-block;
}

.custom-modal-close {
    background: rgba(255,255,255,0.13);
    border: none;
    color: #fff;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s;
    outline: none;
}
.custom-modal-close:hover {
    background: rgba(252, 61, 33, 0.85);
    transform: rotate(90deg) scale(1.08);
}

.custom-modal-body {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 0;
    flex: 1 1 auto;
    min-height: 0;
    max-height: calc(92vh - 70px);
    overflow: hidden;
}

.modal-media-section {
    background: linear-gradient(135deg, rgba(26, 35, 50, 0.93), rgba(36, 48, 64, 0.93));
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    min-width: 0;
    min-height: 0;
    height: 100%;
    width: 100%;
}

.custom-modal-image,
.custom-modal-video {
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.custom-modal-image img {
    display: block;
    max-width: 98%;
    max-height: 92%;
    width: auto;
    height: auto;
    margin: auto;
    border-radius: 14px;
    box-shadow: 0 8px 32px 0 rgba(74,158,255,0.13), 0 2px 8px 0 rgba(0,0,0,0.18);
    border: 2px solid rgba(74,158,255,0.13);
    background: #101828;
    object-fit: contain;
    transition: all 0.3s;
    cursor: zoom-in;
}

.custom-modal-image img.zoomed {
    transform: scale(1.45);
    cursor: zoom-out;
    z-index: 2;
    box-shadow: 0 0 0 6px rgba(74,158,255,0.13), 0 8px 32px 0 rgba(74,158,255,0.18);
}

.image-controls {
    position: absolute;
    top: 14px;
    right: 14px;
    display: flex;
    gap: 8px;
    z-index: 3;
}

.zoom-btn, .fullscreen-btn {
    background: rgba(0, 0, 0, 0.72);
    border: none;
    color: white;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.1rem;
    transition: all 0.2s;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
}
.zoom-btn:hover, .fullscreen-btn:hover {
    background: rgba(74, 158, 255, 0.92);
    transform: scale(1.13);
}

.custom-modal-video {
    align-items: center;
    justify-content: center;
    min-height: 0;
    min-width: 0;
}
.video-placeholder {
    text-align: center;
    padding: 40px 20px;
    border: 2px dashed rgba(74, 158, 255, 0.5);
    border-radius: 15px;
    background: rgba(74, 158, 255, 0.05);
    width: 100%;
    max-width: 350px;
    margin: auto;
}
.video-icon {
    font-size: 3.5rem;
    margin-bottom: 12px;
}
.video-placeholder h3 {
    color: #4a9eff;
    margin: 0 0 8px 0;
    font-size: 1.2rem;
}
.video-placeholder p {
    color: #cccccc;
    margin: 0 0 18px 0;
}
.view-video-btn {
    background: linear-gradient(135deg, #4a9eff, #fc3d21);
    border: none;
    color: white;
    padding: 10px 22px;
    border-radius: 22px;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.2s;
}
.view-video-btn:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 16px rgba(74, 158, 255, 0.18);
}

.modal-text-section {
    padding: 28px 24px 24px 24px;
    overflow-y: auto;
    background: linear-gradient(145deg, rgba(36, 48, 64, 0.93), rgba(26, 35, 50, 0.93));
    height: 100%;
    min-width: 0;
    min-height: 0;
    max-height: 100%;
    scrollbar-width: thin;
    scrollbar-color: #4a9eff #222b3a;
}
.modal-text-section::-webkit-scrollbar {
    width: 8px;
    background: #222b3a;
}
.modal-text-section::-webkit-scrollbar-thumb {
    background: #4a9eff;
    border-radius: 8px;
}

.explanation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(74, 158, 255, 0.13);
}
.explanation-header h3 {
    color: #fff;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
}
.media-type-badge {
    background: rgba(74, 158, 255, 0.18);
    color: #4a9eff;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.8rem;
    text-transform: uppercase;
    font-weight: 500;
}
.explanation-content {
    margin-bottom: 28px;
}
.explanation-content p {
    color: #e0e0e0;
    line-height: 1.7;
    font-size: 1rem;
    margin: 0;
    word-break: break-word;
}

.modal-actions {
    display: flex;
    gap: 14px;
    padding-top: 16px;
    border-top: 1px solid rgba(74, 158, 255, 0.09);
}
.action-btn {
    padding: 11px 22px;
    border: none;
    border-radius: 22px;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.2s;
    flex: 1;
}
.action-btn.primary {
    background: linear-gradient(135deg, #4a9eff, #fc3d21);
    color: white;
}
.action-btn.secondary {
    background: rgba(74, 158, 255, 0.11);
    color: #4a9eff;
    border: 1px solid rgba(74, 158, 255, 0.22);
}
.action-btn:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.13);
}

.fullscreen-image-viewer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(10, 18, 30, 0.98);
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
}
.fullscreen-image-viewer img {
    max-width: 97vw;
    max-height: 97vh;
    border-radius: 10px;
    box-shadow: 0 8px 32px 0 rgba(74,158,255,0.13);
    background: #101828;
}
.fullscreen-close {
    position: absolute;
    top: 18px;
    right: 18px;
    background: rgba(255, 255, 255, 0.13);
    border: none;
    color: white;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.5rem;
    z-index: 2;
}

.share-message {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4a9eff, #fc3d21);
    color: white;
    padding: 15px 25px;
    border-radius: 25px;
    z-index: 1200;
    font-weight: 600;
    animation: slideInUp 0.3s ease;
}

@keyframes slideInUp {
    from {
        transform: translateY(100px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* Responsive Design */
@media (max-width: 1024px) {
    .custom-modal-container {
        width: 99vw;
        min-width: 0;
        max-width: 99vw;
    }
    .custom-modal-body {
        grid-template-columns: 1fr 1fr;
    }
}
@media (max-width: 768px) {
    .custom-modal-container {
        width: 99vw;
        margin: 10px;
        min-width: 0;
        max-width: 99vw;
        border-radius: 12px;
    }
    .custom-modal-header {
        padding: 14px 12px 10px 12px;
    }
    .custom-modal-body {
        grid-template-columns: 1fr;
        max-height: 75vh;
        min-height: 0;
    }
    .modal-media-section {
        padding: 0;
        min-height: 180px;
        max-height: 40vh;
        height: 40vh;
    }
    .custom-modal-image img {
        max-height: 95%;
        max-width: 98%;
    }
    .modal-text-section {
        padding: 18px 10px 12px 10px;
        max-height: 35vh;
        min-height: 0;
    }
    .modal-actions {
        flex-direction: column;
        gap: 10px;
    }
}
</style>
`;

// Insert modal styles into document headument head
document.head.insertAdjacentHTML('beforeend', modalStyles);

// Make modal functions globally accessible
window.closeCustomModal = closeCustomModal;
window.toggleImageZoom = toggleImageZoom;
window.openImageFullscreen = openImageFullscreen;
window.shareAPOD = shareAPOD;
