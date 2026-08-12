const API_BASE = '/api/public';

const serializeParams = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let message = `Fehler ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
      }
    } catch {
      // Keep the generic message when the response has no JSON body.
    }
    throw new Error(message);
  }
  return response.json();
};

export const fetchHome = async () => {
  const response = await fetch(`${API_BASE}/home`);
  return handleResponse(response);
};

export const fetchDocuments = async (params = {}) => {
  const response = await fetch(`${API_BASE}/documents${serializeParams(params)}`);
  return handleResponse(response);
};

export const fetchDocument = async (id) => {
  const response = await fetch(`${API_BASE}/documents/${id}`);
  return handleResponse(response);
};

export const fetchAlbums = async (params = {}) => {
  const response = await fetch(`${API_BASE}/albums${serializeParams(params)}`);
  return handleResponse(response);
};

export const fetchAlbumPhotos = async (id, params = {}) => {
  const response = await fetch(`${API_BASE}/albums/${id}/photos${serializeParams(params)}`);
  return handleResponse(response);
};

export const fetchPhoto = async (id) => {
  const response = await fetch(`${API_BASE}/photos/${id}`);
  return handleResponse(response);
};

export const searchContent = async (params = {}) => {
  const response = await fetch(`${API_BASE}/search${serializeParams(params)}`);
  return handleResponse(response);
};
