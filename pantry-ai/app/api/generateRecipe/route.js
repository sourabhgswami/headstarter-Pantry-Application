import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  const { ingredients } = await req.json();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Create a recipe using only these ingredients: ${ingredients}. Provide a short, precise description that includes the recipe name and simple instructions. Avoid using any additional ingredients.`,
        },
      ],
      max_tokens: 100, // Limit the response length
      temperature: 0.7,
    });

    const recipe = completion.choices[0].message.content.trim();
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Error generating recipe:', error);
    return NextResponse.json({ message: 'Error generating recipe' }, { status: 500 });
  }
}
