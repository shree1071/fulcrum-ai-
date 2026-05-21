import { NextRequest } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const runtime = 'edge';

function createSSE(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { question, topic, simConfig } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const contextPrompt = `You are a physics tutor. Answer questions about the current simulation.

Topic: ${topic}
Current simulation parameters: ${JSON.stringify(simConfig?.parameters || {}, null, 2)}

User question: ${question}

Provide a clear, concise answer with relevant physics equations and explanations.`;

        if (!GROQ_API_KEY) {
          throw new Error("GROQ_API_KEY not configured");
        }

        const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'user', content: contextPrompt }
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (!apiResponse.ok) {
          throw new Error(`Groq API error: ${apiResponse.statusText}`);
        }

        const reader = apiResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  
                  if (content) {
                    controller.enqueue(encoder.encode(createSSE({
                      type: "token",
                      content
                    })));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }

        controller.enqueue(encoder.encode(createSSE({ type: "done" })));
        controller.close();

      } catch (error: any) {
        controller.enqueue(encoder.encode(createSSE({
          type: "error",
          message: error.message
        })));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
