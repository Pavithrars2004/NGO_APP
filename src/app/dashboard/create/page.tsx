'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { OpportunityCategory } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { generateDescription } from '@/ai/flows/generate-description-flow';
import { Wand2, Loader2 } from 'lucide-react';

const allCategories: OpportunityCategory[] = ['Environment', 'Education', 'Healthcare', 'Community Development', 'Animal Welfare'];

const opportunitySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  ngo: z.string().min(2, 'Organization name is required.'),
  description: z.string().min(10, 'A short description is required.'),
  longDescription: z.string().min(50, 'A detailed description of at least 50 characters is required.'),
  location: z.string().min(2, 'Location is required.'),
  date: z.string().min(1, 'Date is required.'),
  timeCommitment: z.string().min(2, 'Time commitment is required.'),
  category: z.enum(allCategories, { required_error: 'Please select a category.' }),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

export default function CreateOpportunityPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState('');

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: '',
      ngo: '',
      description: '',
      longDescription: '',
      location: '',
      date: '',
      timeCommitment: '',
    },
  });

  const handleGenerateDescription = async () => {
    if (!keywords) {
      toast({
        title: 'Keywords required',
        description: 'Please enter some keywords to generate a description.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateDescription({ keywords });
      form.setValue('description', result.shortDescription);
      form.setValue('longDescription', result.longDescription, { shouldValidate: true });
      toast({
        title: 'Description Generated!',
        description: 'The AI has created a description for you.',
      });
    } catch (error) {
      console.error('AI Generation Error:', error);
      toast({
        title: 'Generation Failed',
        description: 'There was an error generating the description.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: OpportunityFormValues) => {
    if (!firestore) {
      toast({ title: 'Error', description: 'Database not available.', variant: 'destructive' });
      return;
    }

    const opportunitiesCollection = collection(firestore, 'opportunities');
    
    const categoryHint = data.category.toLowerCase().split(' ')[0];
    const placeholderImage = PlaceHolderImages.find(img => img.id.includes(categoryHint)) || PlaceHolderImages[0];

    const newOpportunity = {
        ...data,
        imageUrl: placeholderImage.imageUrl,
        imageHint: placeholderImage.imageHint,
    };

    // Use the non-blocking function to add the document.
    // This function handles the promise and potential errors internally.
    addDocumentNonBlocking(opportunitiesCollection, newOpportunity);

    toast({
        title: 'Opportunity Posting!',
        description: 'Your new opportunity is now being submitted.',
    });
    
    // Redirect immediately, letting the write happen in the background.
    router.push('/');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-2">
                <h3 className="text-lg font-medium">AI Content Generation</h3>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Enter keywords (e.g. 'beach cleanup south shore')"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                    />
                    <Button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="whitespace-nowrap">
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                        Generate Descriptions
                    </Button>
                </div>
                 <p className="text-sm text-muted-foreground">
                    Use our AI to write compelling short and long descriptions for your opportunity.
                </p>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opportunity Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Annual Beach Cleanup" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ngo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Organization's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The Ocean Savers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief, one-sentence summary of the opportunity." {...field} />
                  </FormControl>
                  <FormDescription>This is the first thing volunteers will see in the list.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea rows={6} placeholder="Provide a full description of the role, responsibilities, and impact." {...field} />
                  </FormControl>
                   <FormDescription>Be descriptive! This is your chance to attract passionate volunteers.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-8">
                <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Miami, FL" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {allCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., October 26, 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="timeCommitment"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Time Commitment</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 9 AM - 1 PM" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full md:w-auto">
              {form.formState.isSubmitting ? 'Posting...' : 'Post Opportunity'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
