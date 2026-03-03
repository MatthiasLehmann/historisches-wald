/**
 * API Service for Historisches Wald
 * Handles all backend communication
 */

const API_BASE = '/api';

const handleResponse = async (response) => {
    if (!response.ok) {
        let message = `API Error: ${response.status}`;
        try {
            const errorBody = await response.json();
            if (errorBody?.message) {
                message = errorBody.message;
            }
        } catch {
            // ignore json parsing issues for error responses
        }
        throw new Error(message);
    }
    if (response.status === 204) {
        return null;
    }
    return await response.json();
};

const serializeParams = (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }
        if (Array.isArray(value)) {
            if (value.length > 0) {
                query.set(key, value.join(','));
            }
            return;
        }
        query.set(key, value);
    });
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

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

        return await handleResponse(response);
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

        return await handleResponse(response);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        throw error;
    }
};

export const fetchImages = async (params = {}) => {
    try {
        const query = serializeParams(params);
        const response = await fetch(`${API_BASE}/images${query}`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Failed to fetch images:', error);
        throw error;
    }
};

const mutateImage = async (endpoint, method, body) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return handleResponse(response);
};

export const createImageAsset = async (payload) => mutateImage('/images', 'POST', payload);

export const updateImageAsset = async (id, payload) => mutateImage(`/images/${id}`, 'PUT', payload);

export const deleteImageAsset = async (id) => {
    const response = await fetch(`${API_BASE}/images/${id}`, { method: 'DELETE' });
    return handleResponse(response);
};

export const importRemoteImage = async (payload) => mutateImage('/images/import-url', 'POST', payload);

export const addImageReviewComment = async (id, payload) =>
    mutateImage(`/images/${id}/review/comment`, 'POST', payload);

export const updateImageReviewStatus = async (id, payload) =>
    mutateImage(`/images/${id}/review/status`, 'PUT', payload);

export const completeImageReview = async (id, payload) =>
    mutateImage(`/images/${id}/review/complete`, 'PUT', payload);

export const fetchPdfs = async (params = {}) => {
    try {
        const query = serializeParams(params);
        const response = await fetch(`${API_BASE}/pdfs${query}`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Failed to fetch PDFs:', error);
        throw error;
    }
};

const mutatePdf = async (endpoint, method, body) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return handleResponse(response);
};

export const createPdfAsset = async (payload) => mutatePdf('/pdfs', 'POST', payload);

export const updatePdfAsset = async (id, payload) => mutatePdf(`/pdfs/${id}`, 'PUT', payload);

export const deletePdfAsset = async (id) => {
    const response = await fetch(`${API_BASE}/pdfs/${id}`, { method: 'DELETE' });
    return handleResponse(response);
};

export const importRemotePdf = async (payload) => mutatePdf('/pdfs/import-url', 'POST', payload);

export const addPdfReviewComment = async (id, payload) =>
    mutatePdf(`/pdfs/${id}/review/comment`, 'POST', payload);

export const updatePdfReviewStatus = async (id, payload) =>
    mutatePdf(`/pdfs/${id}/review/status`, 'PUT', payload);

export const completePdfReview = async (id, payload) =>
    mutatePdf(`/pdfs/${id}/review/complete`, 'PUT', payload);

const mutateJson = async (url, method, body) => {
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return handleResponse(response);
};

export const fetchAlbums = async () => {
    const response = await fetch(`${API_BASE}/albums`);
    return handleResponse(response);
};

export const fetchAlbumById = async (id) => {
    const response = await fetch(`${API_BASE}/albums/${id}`);
    return handleResponse(response);
};

export const createAlbum = async (payload) =>
    mutateJson(`${API_BASE}/albums`, 'POST', payload);

export const updateAlbum = async (id, payload) =>
    mutateJson(`${API_BASE}/albums/${id}`, 'PUT', payload);

export const fetchAlbumPhotos = async (id) => {
    const response = await fetch(`${API_BASE}/albums/${id}/photos`);
    return handleResponse(response);
};

export const fetchPhotos = async (params = {}) => {
    const query = serializeParams(params);
    const response = await fetch(`${API_BASE}/photos${query}`);
    return handleResponse(response);
};

const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result || '';
            const parts = typeof result === 'string' ? result.split(',') : [];
            resolve(parts.length > 1 ? parts[1] : result);
        };
        reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
        reader.readAsDataURL(file);
    });

export const uploadAlbumPhoto = async (albumId, payload) => {
    if (!albumId) {
        throw new Error('Album-ID fehlt.');
    }
    if (!(payload?.file instanceof File)) {
        throw new Error('Bitte wählen Sie eine Bilddatei aus.');
    }
    const file = payload.file;
    const base64 = await readFileAsBase64(file);
    const response = await fetch(`${API_BASE}/albums/${albumId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: payload?.name?.trim() || file.name,
            description: payload?.description?.trim() || '',
            date_taken: payload?.date_taken?.trim() || '',
            set_as_cover: Boolean(payload?.setAsCover),
            file: {
                name: file.name,
                type: file.type,
                data: base64
            }
        })
    });
    return handleResponse(response);
};

export const fetchPhotoById = async (id) => {
    const response = await fetch(`${API_BASE}/photos/${id}`);
    return handleResponse(response);
};

export const updatePhoto = async (id, payload) =>
    mutateJson(`${API_BASE}/photos/${id}`, 'PUT', payload);

export const fetchPhotoAlbums = async (id) => {
    const response = await fetch(`${API_BASE}/photos/${id}/albums`);
    return handleResponse(response);
};

export const fetchDashboardSummary = async () => {
    const response = await fetch(`${API_BASE}/dashboard/summary`);
    return handleResponse(response);
};
