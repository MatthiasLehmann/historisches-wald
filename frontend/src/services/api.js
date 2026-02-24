/**
 * API Service for Historisches Wald
 * Handles all backend communication
 */

const API_BASE = '/api';

/**
 * Fetch all documents with optional filters
 * @param {Object} params - Query parameters (search, category, page, etc)
 * @returns {Promise<Object>} - Array of documents and pagination info
 */
export const fetchDocuments = async (params = {}) => {
    try {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${API_BASE}/documents?${query}` : `${API_BASE}/documents`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch documents:', error);
        throw error;
    }
};

/**
 * Fetch a single document by ID
 * @param {string} id - Document ID
 * @returns {Promise<Object>} - Document details
 */
export const fetchDocumentById = async (id) => {
    try {
        const documents = await fetchDocuments();
        return documents.find((doc) => doc.id === id) ?? null;
    } catch (error) {
        console.error(`Failed to fetch document ${id}:`, error);
        throw error;
    }
};

/**
 * Fetch all categories
 * @returns {Promise<Array>} - List of categories
 */
export const fetchCategories = async () => {
    try {
        const response = await fetch(`${API_BASE}/categories`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        throw error;
    }
};
