// Use the deployed API URL if available, otherwise fallback to local server
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Predict the disease of a plant leaf image.
 * @param {File} imageFile  - The image file to analyse
 * @param {string} plantName - The plant selected by the user (e.g. "tomato")
 */
export const predictDisease = async (imageFile, plantName) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('plant', plantName.toLowerCase());

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server returned error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling prediction API:', error);
    throw error;
  }
};

export const fetchDiseases = async () => {
  try {
    const response = await fetch(`${API_URL}/diseases`);
    if (!response.ok) {
      throw new Error(`Server returned error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching diseases API:', error);
    throw error;
  }
};

export const fetchSupportedPlants = async () => {
  try {
    const response = await fetch(`${API_URL}/plants`);
    if (!response.ok) {
      throw new Error(`Server returned error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching supported plants:', error);
    throw error;
  }
};

export const identifyPlantType = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await fetch(`${API_URL}/identify`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server returned error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling identify API:', error);
    throw error;
  }
};
