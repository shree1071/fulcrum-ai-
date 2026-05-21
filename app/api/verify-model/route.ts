import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ 
      error: "Google API key not configured",
      verified: false 
    }, { status: 400 });
  }

  try {
    const { imageData, topic, simConfig } = await req.json();

    const prompt = `You are a physics verification AI. Analyze this 3D simulation screenshot.

Topic: ${topic}
Expected simulation type: ${simConfig?.simType || 'unknown'}
Parameters: ${JSON.stringify(simConfig?.parameters || {}, null, 2)}

Does the visual representation accurately reflect the physics concept? 
Are the proportions and behaviors correct?
Provide a brief verification report.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/png",
                  data: imageData.split(',')[1] // Remove data:image/png;base64, prefix
                }
              }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const verification = data.candidates?.[0]?.content?.parts?.[0]?.text || "No verification available";

    return NextResponse.json({
      verified: true,
      report: verification
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      verified: false
    }, { status: 500 });
  }
}
