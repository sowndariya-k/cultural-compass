document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const eventsList = document.getElementById('eventList');
    const eventInfoBox = document.getElementById('infoBox');
    const regionFilter = document.getElementById('regionFilter');
    const monthFilter = document.getElementById('monthFilter');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading events...';

    // State
    let currentEvents = [];
    let selectedEvent = null;

    // Initialize
    loadEvents();

    // Event Listeners
    applyFiltersBtn.addEventListener('click', loadEvents);
    eventsList.addEventListener('click', handleEventClick);

    // Functions
    async function loadEvents() {
        try {
            eventsList.innerHTML = '';
            eventsList.appendChild(loadingElement);

            const region = regionFilter.value;
            const month = monthFilter.value;

            // Call calendar_ai API to generate events
            const response = await fetch('/api/calendar_ai/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    region: region,
                    month: month
                })
            });

            if (!response.ok) {
                throw new Error('Failed to load events');
            }

            const data = await response.json();
            currentEvents = data.events;
            displayEvents(currentEvents);
        } catch (error) {
            showError('Failed to load events. Please try again later.');
        } finally {
            loadingElement.remove();
        }
    }

    function displayEvents(events) {
        eventsList.innerHTML = '';
        
        if (events.length === 0) {
            eventsList.innerHTML = '<p class="no-events">No events found matching your criteria.</p>';
            return;
        }

        events.forEach(event => {
            const eventItem = createEventItem(event);
            eventsList.appendChild(eventItem);
        });
    }

    function createEventItem(event) {
        const li = document.createElement('li');
        li.className = 'event-item';
        li.dataset.id = event.id;

        const content = document.createElement('div');
        content.className = 'event-content';

        const title = document.createElement('h3');
        title.textContent = event.title;

        const location = document.createElement('div');
        location.className = 'event-location';
        location.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${event.location}`;

        const date = document.createElement('div');
        date.className = 'event-date';
        date.innerHTML = `<i class="far fa-calendar"></i> ${formatDate(event.date)}`;

        // Add cultural significance indicator if available
        if (event.cultural_significance) {
            const significance = document.createElement('div');
            significance.className = 'event-significance';
            significance.innerHTML = `<i class="fas fa-star"></i> ${event.cultural_significance}`;
            content.appendChild(significance);
        }

        content.appendChild(title);
        content.appendChild(location);
        li.appendChild(content);
        li.appendChild(date);

        return li;
    }

    async function handleEventClick(e) {
        const eventItem = e.target.closest('.event-item');
        if (!eventItem) return;

        const eventId = eventItem.dataset.id;
        const event = currentEvents.find(e => e.id === eventId);
        
        if (event) {
            selectedEvent = event;
            await displayEventDetails(event);
        }
    }

    async function displayEventDetails(event) {
        try {
            // Show loading state
            eventInfoBox.style.display = 'block';
            eventInfoBox.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i> Loading event details...
                </div>
            `;

            // Get AI-generated cultural context
            const response = await fetch('/api/calendar_ai/context', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_id: event.id,
                    event_name: event.title,
                    location: event.location,
                    date: event.date
                })
            });

            if (!response.ok) {
                throw new Error('Failed to load event details');
            }

            const context = await response.json();

            // Display event details with AI-generated context
            eventInfoBox.innerHTML = `
                <h2><i class="fas fa-info-circle"></i> Cultural Significance</h2>
                <div class="event-details">
                    <h3>${event.title}</h3>
                    <div class="event-meta">
                        <span><i class="far fa-calendar"></i> ${formatDate(event.date)}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                    </div>
                    <div class="cultural-context">
                        <h4><i class="fas fa-landmark"></i> Cultural Context</h4>
                        <p>${context.cultural_context}</p>
                    </div>
                    <div class="traditions">
                        <h4><i class="fas fa-hands-praying"></i> Traditions</h4>
                        <p>${context.traditions}</p>
                    </div>
                    <div class="significance">
                        <h4><i class="fas fa-star"></i> Significance</h4>
                        <p>${context.significance}</p>
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-primary" onclick="shareEvent('${event.id}')">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                        <button class="btn btn-secondary" onclick="saveEvent('${event.id}')">
                            <i class="far fa-bookmark"></i> Save
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading event details:', error);
            eventInfoBox.innerHTML = `
                <div class="error">
                    Failed to load event details. Please try again.
                </div>
            `;
        }
    }

    function formatDate(dateString) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error';
        errorElement.textContent = message;
        eventsList.appendChild(errorElement);
    }

    // Global functions for event actions
    window.shareEvent = async function(eventId) {
        try {
            const event = currentEvents.find(e => e.id === eventId);
            if (!event) return;

            // Get AI-generated share message
            const response = await fetch('/api/calendar_ai/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_id: eventId,
                    event_name: event.title
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate share message');
            }

            const shareData = await response.json();

            if (navigator.share) {
                await navigator.share({
                    title: event.title,
                    text: shareData.message,
                    url: window.location.href + `?event=${eventId}`
                });
            } else {
                // Fallback for browsers that don't support Web Share API
                const shareUrl = window.location.href + `?event=${eventId}`;
                await navigator.clipboard.writeText(shareData.message + '\n' + shareUrl);
                alert('Event details copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing event:', error);
            alert('Failed to share event. Please try again.');
        }
    };

    window.saveEvent = async function(eventId) {
        try {
            const response = await fetch('/api/calendar_ai/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    event_id: eventId,
                    user_id: getUserId() // You'll need to implement this function
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save event');
            }

            const result = await response.json();
            if (result.success) {
                alert('Event saved successfully!');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Failed to save event. Please try again.');
        }
    };

    // Helper function to get user ID
    function getUserId() {
        // Implement your user authentication logic here
        return localStorage.getItem('userId') || null;
    }
}); 