/**
 * ALIF Medical Education Platform - Link Manager (Static Version)
 * For GitHub Pages Deployment
 */

class LinkManager {
    constructor() {
        this.courses = [];
        this.coursesRegistry = '/courses/courses-registry.json';
        this.isInitialized = false;
        this.cache = new Map();
    }

    // Initialize - with error handling for static hosting
    async init() {
        if (this.isInitialized) return this.courses;
        
        try {
            console.log('🔗 Loading courses registry...');
            const response = await fetch(this.coursesRegistry);
            
            if (!response.ok) {
                console.warn('⚠️ Registry not found, using fallback');
                return this.loadFallbackCourses();
            }
            
            const data = await response.json();
            this.courses = data.courses || [];
            
            // Cache the data
            this.cache.set('courses', this.courses);
            
            console.log(`✅ Loaded ${this.courses.length} courses`);
            this.isInitialized = true;
            
            return this.courses;
            
        } catch (error) {
            console.error('❌ Failed to load registry:', error);
            return this.loadFallbackCourses();
        }
    }

    // Load fallback courses from hardcoded data
    loadFallbackCourses() {
        this.courses = [
            {
                id: 'nursingsph2017',
                title: 'SPH-Nursing-2017',
                type: 'exam',
                year: '2017',
                difficulty: 'intermediate',
                description: '2017 nursing by mohammed',
                questions: 34,
                rating: 4.5,
                jsonFile: 'nursingsph2017.json',
                page: 'index.html?course=nursingsph2017',
                featured: true,
                icon: 'fas fa-user-nurse',
                color: '#3b82f6'
            }
        ];
        return this.courses;
    }

    // Get all courses
    async getAllCourses() {
        if (!this.isInitialized) {
            await this.init();
        }
        return this.courses;
    }

    // Filter courses (static-friendly)
    async filterCourses(filters = {}) {
        const courses = await this.getAllCourses();
        
        return courses.filter(course => {
            // Search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchable = [
                    course.title,
                    course.description,
                    course.year,
                    course.type,
                    course.difficulty
                ].join(' ').toLowerCase();
                
                if (!searchable.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Type filter
            if (filters.type && filters.type !== 'all') {
                if (course.type !== filters.type) return false;
            }
            
            // Year filter
            if (filters.year && filters.year !== 'all') {
                if (course.year !== filters.year) return false;
            }
            
            // Difficulty filter
            if (filters.difficulty && filters.difficulty !== 'all') {
                if (course.difficulty !== filters.difficulty) return false;
            }
            
            return true;
        });
    }

    // Get course by ID
    async getCourse(id) {
        const courses = await this.getAllCourses();
        return courses.find(course => course.id === id);
    }

    // Generate course URL
    getCourseUrl(courseId) {
        return `index.html?course=${courseId}`;
    }

    // Simple navigation (no database needed)
    navigateToCourse(courseId) {
        window.location.href = this.getCourseUrl(courseId);
    }
}

// Create global instance
if (!window.linkManager) {
    window.linkManager = new LinkManager();
    
    // Auto-initialize
    document.addEventListener('DOMContentLoaded', () => {
        window.linkManager.init().catch(console.error);
    });
}

// For direct script inclusion
console.log('✅ Link Manager loaded');