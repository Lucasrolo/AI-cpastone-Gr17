export const API_URL = 'http://localhost:8000';

export const predictDisease = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);

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
