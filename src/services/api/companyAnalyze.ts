export async function analyzeCompany(companyName: string, query: string, additionalContext = {}) {
  try {
    const response = await fetch('http://127.0.0.1:8000/analyze', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: companyName,
        query: query,
        additional_context: additionalContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('APIリクエストエラー:', error);
    throw error;
  }
}
