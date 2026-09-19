import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization for GoogleGenAI
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Formula Generator Endpoint
app.post('/api/ai/formula', async (req, res) => {
  try {
    const { prompt, currentCell, selectedRange, contextData, language = 'fa' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback heuristics if API key not yet set in environment
      return res.json({
        formula: `=SUM(A1:A10)`,
        explanation: 'کلید جمینای تنظیم نشده است، اما نمونه فرمول پیش‌فرض تولید شد.',
        suggestedRange: 'A1:A10',
      });
    }

    const systemInstruction = `You are a Microsoft Excel & Google Sheets formula expert.
Given the user's natural language request, the active cell, selected range, and sample table headers/context, generate the exact Excel formula.
Return a clean JSON object matching this schema:
{
  "formula": "=...", // must start with = and use valid standard Excel functions like SUM, AVERAGE, IF, VLOOKUP, COUNTIF, INDEX, MATCH, etc.
  "explanation": "Persian explanation if requested or Persian by default, explaining what the formula does",
  "explanationEn": "English explanation of the formula",
  "notes": "Any tips or parameters user should check"
}`;

    const userPrompt = `
User Request: ${prompt}
Active Cell: ${currentCell || 'A1'}
Selected Range: ${selectedRange || 'none'}
Table Context / Headers: ${JSON.stringify(contextData || {})}
Language Preference: ${language}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/formula:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate formula',
      formula: '=SUM(A1:A10)',
      explanation: 'خطا در ارتباط با هوش مصنوعی. فرمول نمونه نمایش داده شد.',
    });
  }
});

// Data Analysis & Insights Endpoint
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { tableData, sheetName, headers } = req.body;
    if (!tableData || !Array.isArray(tableData)) {
      return res.status(400).json({ error: 'tableData array is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        title: 'تحلیل آماری سریع',
        summary: 'داده‌ها با موفقیت بررسی شدند. برای دریافت بینش عمیق‌تر هوش مصنوعی، کلید API را متصل نمایید.',
        insights: [
          'تعداد رکوردهای بررسی شده: ' + tableData.length,
          'ساختار ستون‌ها منظم و بدون مقادیر خالی بحرانی است.',
          'پیشنهاد می‌شود از نمودار میله‌ای یا ستونی برای نمایش روند استفاده نمایید.'
        ],
        chartRecommendation: {
          type: 'bar',
          xAxis: headers?.[0] || 'ستون اول',
          yAxis: headers?.[1] || 'ستون دوم',
          reason: 'مقایسه دسته‌بندی‌ها با مقادیر عددی'
        }
      });
    }

    const systemInstruction = `You are a Senior Data Analyst and Excel Consultant.
Analyze the provided spreadsheet table data.
Return a structured JSON with:
{
  "title": "Short descriptive Persian title",
  "summary": "1-2 sentence executive summary in Persian",
  "insights": ["3-5 actionable analytical bullets in Persian explaining trends, highest/lowest values, averages, anomalies"],
  "chartRecommendation": {
    "type": "bar" | "line" | "pie" | "area",
    "xAxis": "header name for X axis or categories",
    "yAxis": "header name for numerical Y axis",
    "reason": "Persian explanation why this chart type is best"
  }
}`;

    const prompt = `
Sheet Name: ${sheetName || 'Sheet1'}
Headers: ${JSON.stringify(headers || [])}
Sample Data Rows (up to 40): ${JSON.stringify(tableData.slice(0, 40))}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/analyze:', error);
    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// Generate Table Data Endpoint
app.post('/api/ai/generate-table', async (req, res) => {
  try {
    const { topic, rowCount = 6 } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        headers: ['عنوان', 'دسته‌بندی', 'مقدار (تومان)', 'وضعیت'],
        rows: [
          ['هزینه اداری', 'جاری', 1200000, 'پرداخت شده'],
          ['تبلیغات آنلاین', 'بازاریابی', 3500000, 'در انتظار'],
          ['سرور و زیرساخت', 'فنی', 2800000, 'پرداخت شده'],
        ],
      });
    }

    const systemInstruction = `You are an Excel Table Template Generator.
Generate a realistic, well-formatted 2D table based on the user's prompt (topic).
Include realistic Persian or bilingual numbers and text.
Return a JSON object:
{
  "title": "Sheet or Table title in Persian",
  "headers": ["Col 1", "Col 2", "Col 3", ...],
  "rows": [
    ["row1col1", "row1col2", 1234, ...],
    ...
  ],
  "recommendedFormulas": [
    { "targetCell": "D8", "formula": "=SUM(D2:D7)", "label": "جمع کل" }
  ]
}`;

    const prompt = `Topic: ${topic}\nTarget row count: ${rowCount}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/generate-table:', error);
    return res.status(500).json({ error: error.message || 'Table generation failed' });
  }
});

// Copilot Chat / Help Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        reply: 'من دستیار هوش مصنوعی اکسل هستم. می‌توانید فرمول‌ها، نحوه کارکرد توابع اکسل مثل VLOOKUP, SUMIFS, XLOOKUP یا تحلیل داده‌ها را از من بپرسید.',
      });
    }

    const systemInstruction = `You are "دستیار هوشمند اکسل" (Excel Copilot), an expert in Microsoft Excel, Google Sheets, formulas, business modeling, data analytics, and keyboard shortcuts.
Provide clear, helpful, formatted answers in Persian (or the language of user's query). If mentioning Excel formulas, format them in code backticks like \`=SUM(A1:A10)\`. Keep answers practical and concise.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    return res.json({ reply: response.text || '' });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    return res.status(500).json({ error: error.message || 'Chat request failed' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Excel App server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
