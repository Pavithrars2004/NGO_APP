'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, Clock, Users } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, addDoc, query, where } from 'firebase/firestore';
import type { Opportunity, Application } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';

const applySchema = z.object({
  name: z.string().min(2, { message: "Your name is required." }),
  email: z.string().email({ message: "A valid email is required." }),
});

type ApplyFormValues = z.infer<typeof applySchema>;


export default function OpportunityDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const opportunityRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'opportunities', id as string);
  }, [firestore, id]);

  const { data: opportunity, isLoading: isLoadingOpportunity } = useDoc<Opportunity>(opportunityRef);

  const applicationsQuery = useMemoFirebase(() => {
      if (!firestore || !id) return null;
      return query(collection(firestore, 'applications'), where('opportunityId', '==', id));
  }, [firestore, id]);

  const { data: applications, isLoading: isLoadingApplications } = useCollection<Application>(applicationsQuery);

  const approvedCount = useMemo(() => {
      if (!applications) return 0;
      return applications.filter(app => app.status === 'Approved').length;
  }, [applications]);

  const applicationsCollectionRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'applications');
  }, [firestore]);
  
  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });


  const handleApply = async (values: ApplyFormValues) => {
    if (!applicationsCollectionRef || !opportunity) {
        toast({
            title: "Error",
            description: "Could not connect to the database.",
            variant: "destructive",
        });
        return;
    }
    
    const newApplication: Omit<Application, 'id'> = {
      volunteerName: values.name,
      volunteerEmail: values.email,
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      opportunityNgo: opportunity.ngo,
      status: 'Pending',
      appliedDate: new Date().toISOString(),
    };

    try {
        await addDoc(applicationsCollectionRef, newApplication);
        toast({
            title: "Application Submitted!",
            description: `Your application for "${opportunity.title}" has been sent.`,
        });
        setIsModalOpen(false);
        form.reset();
    } catch(e) {
        console.error(e);
        toast({
            title: "Application Failed",
            description: "There was an error submitting your application.",
            variant: "destructive",
        });
    }
  };

  if (isLoadingOpportunity) {
    return (
        <div className="container mx-auto px-4 py-8">
             <div className="h-10 w-48 bg-muted animate-pulse rounded mb-6" />
             <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2">
                    <div className="relative h-64 md:h-full min-h-[300px] bg-muted animate-pulse" />
                    <div className="p-8 flex flex-col">
                        <div className="w-24 h-6 bg-muted animate-pulse rounded-full mb-2" />
                        <div className="h-9 w-3/4 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
                        <div className="mt-6 flex-grow space-y-3">
                            <div className="h-5 w-full bg-muted animate-pulse rounded" />
                            <div className="h-5 w-5/6 bg-muted animate-pulse rounded" />
                            <div className="h-5 w-full bg-muted animate-pulse rounded" />
                        </div>
                         <div className="mt-8">
                            <div className="h-12 w-full bg-muted animate-pulse rounded" />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
  }

  if (!opportunity) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold">Opportunity not found.</h1>
            <Button onClick={() => router.push('/')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Opportunities
            </Button>
        </div>
    );
  }


  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all opportunities
        </Button>
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="relative h-64 md:h-full min-h-[300px]">
              <Image
                src={opportunity.imageUrl}
                alt={opportunity.title}
                fill
                className="object-cover"
                data-ai-hint={opportunity.imageHint}
              />
            </div>
            <div className="p-8 flex flex-col">
              <CardHeader className="p-0">
                <Badge className="w-fit mb-2">{opportunity.category}</Badge>
                <CardTitle className="text-3xl font-headline text-primary">{opportunity.title}</CardTitle>
                <p className="text-lg font-semibold text-muted-foreground">{opportunity.ngo}</p>
              </CardHeader>
              <CardContent className="p-0 mt-6 flex-grow">
                <p className="text-foreground/80">{opportunity.longDescription}</p>
                <div className="mt-6 space-y-3 border-t pt-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-medium">{opportunity.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="font-medium">{new Date(opportunity.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-medium">{opportunity.timeCommitment}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-0 mt-8 flex-col items-start gap-4">
                 <div className="flex items-center gap-3 text-sm text-muted-foreground border rounded-lg p-3 w-full justify-center bg-muted/50">
                    <Users className="h-5 w-5 text-green-600" />
                     {isLoadingApplications ? (
                       <Skeleton className="h-5 w-48" />
                     ) : (
                       <span className="font-medium text-base">
                         <span className="font-bold text-green-600">{approvedCount}</span> approved volunteer{approvedCount === 1 ? '' : 's'} joining!
                       </span>
                     )}
                  </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full text-lg py-6" variant="default">Apply Now</Button>
                    </DialogTrigger>
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply for {opportunity.title}</DialogTitle>
                        <DialogDescription>
                            Please enter your details to apply. The NGO will use this to contact you.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleApply)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="jane.doe@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                            </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                    </DialogContent>
                </Dialog>
              </CardFooter>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
