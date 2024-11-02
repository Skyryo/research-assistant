import { config } from 'dotenv';
import { OpenAI } from 'openai';
import XLSX from 'xlsx';

// Load environment variables
config();

// OpenAI API key setup
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CompanyInfo {
  industry?: string;
  size?: string;
  revenue?: string;
  website_url?: string;
  description?: string;
}

async function getCompanyInfo(companyName: string): Promise<string> {
  const prompt = `Provide the following information for ${companyName}: industry, size, revenue, website_url, brief description. Format the response as a JSON object with these keys.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini-2024-07-18', // Adjust the model name if necessary
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that provides accurate company information.',
      },
      { role: 'user', content: prompt },
    ],
  });

  return response.choices[0].message.content || '';
}

function parseGptResponse(response: string): CompanyInfo | null {
  try {
    // Remove any leading/trailing whitespace and newlines
    response = response.trim();

    // Remove any markdown code block indicators
    response = response.replace(/```json\s*|\s*```/g, '');

    // Ensure the response starts with '{' and ends with '}'
    if (!response.startsWith('{')) {
      response = '{' + response;
    }
    if (!response.endsWith('}')) {
      response = response + '}';
    }

    // Parse the JSON
    return JSON.parse(response);
  } catch (e) {
    console.error(`Error parsing response: ${e}`);
    console.log(`Raw response: ${response}`);
    // Attempt to extract key-value pairs manually
    return manualParse(response);
  }
}

function manualParse(response: string): CompanyInfo | null {
  const result: CompanyInfo = {};
  const lines = response.split('\n');
  for (const line of lines) {
    const parts = line.split(':', 2);
    if (parts.length === 2) {
      const key = parts[0].trim().replace(/"/g, '') as keyof CompanyInfo;
      const value = parts[1].trim().replace(/,$/g, '').replace(/"/g, '');
      result[key] = value;
    }
  }
  return Object.keys(result).length ? result : null;
}

function writeToExcel(
  data: Record<string, CompanyInfo | null>,
  filename: string = 'company_info.xlsx',
): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Company Name', 'Industry', 'Size', 'Revenue', 'Website URL', 'Description'],
  ]);

  for (const [company, info] of Object.entries(data)) {
    if (info) {
      XLSX.utils.sheet_add_aoa(
        ws,
        [
          [
            company,
            info.industry || '',
            info.size || '',
            info.revenue || '',
            info.website_url || '',
            info.description || '',
          ],
        ],
        { origin: -1 },
      );
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Company Information');
  XLSX.writeFile(wb, filename);
  console.log(`Data written to ${filename}`);
}

async function main() {
  const companies = ['Apple', 'Microsoft', 'Amazon']; // Example list of companies
  const allData: Record<string, CompanyInfo | null> = {};

  for (const company of companies) {
    console.log(`Collecting information for ${company}...`);
    try {
      const gptResponse = await getCompanyInfo(company);
      const parsedData = parseGptResponse(gptResponse);
      if (parsedData) {
        allData[company] = parsedData;
      } else {
        console.log(`Failed to parse data for ${company}`);
      }
    } catch (e) {
      console.error(`Error processing ${company}: ${e}`);
    }
  }

  writeToExcel(allData);
}

main().catch(console.error);
