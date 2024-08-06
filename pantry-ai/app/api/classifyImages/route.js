import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is correctly set
});

export async function POST(req) {
  try {
    const { base64Image } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: 'Missing base64 image data' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Updated model name
      messages: [
        {
          role: "user",
          content: "Please provide a short description (max 20 words) of the item in this image.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            }
          ],
        },
      ],
      max_tokens: 40, // Set to a small number to ensure brevity
      temperature: 0.5, // Balanced temperature for a mix of creativity and accuracy
    });

    const description = response.choices[0].message.content.trim();
    return NextResponse.json({ description });
  } catch (error) {
    console.error('Error generating description:', error);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
