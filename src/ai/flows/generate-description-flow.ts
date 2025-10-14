'use server';
/**
 * @fileOverview Flow to generate a compelling description for a volunteer opportunity.
 *
 * - generateDescription - A function that takes keywords and generates a description.
 * - GenerateDescriptionInput - The input type for the generateDescription function.
 * - GenerateDescriptionOutput - The return type for the generateDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDescriptionInputSchema = z.object({
  keywords: z
    .string()
    .describe('A few keywords or a short phrase describing the volunteer opportunity.'),
});
export type GenerateDescriptionInput = z.infer<
  typeof GenerateDescriptionInputSchema
>;

const GenerateDescriptionOutputSchema = z.object({
  shortDescription: z
    .string()
    .describe('A concise, one-sentence summary of the opportunity.'),
  longDescription: z
    .string()
    .describe(
      'A detailed, engaging, and well-structured description for the volunteer opportunity, written in a friendly and inviting tone.'
    ),
});
export type GenerateDescriptionOutput = z.infer<
  typeof GenerateDescriptionOutputSchema
>;

export async function generateDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionOutput> {
  return generateDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  input: { schema: GenerateDescriptionInputSchema },
  output: { schema: GenerateDescriptionOutputSchema },
  prompt: `You are an expert copywriter for non-profit organizations. Your task is to write a compelling and detailed description for a volunteer opportunity based on a few keywords.

The tone should be inspiring, friendly, and clear. The description should attract potential volunteers by highlighting the impact they can make.

Generate a short, one-sentence summary and a longer, more detailed description based on the following keywords: {{{keywords}}}`,
});

const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescriptionFlow',
    inputSchema: GenerateDescriptionInputSchema,
    outputSchema: GenerateDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
