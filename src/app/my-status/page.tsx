'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Application } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusSearchSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type StatusSearchFormValues = z.infer<typeof statusSearchSchema>;

type ApplicationWithId = Application & { id: string };

export default function MyStatusPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithId[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const form = useForm<StatusSearchFormValues>({
    resolver: zodResolver(statusSearchSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSearch = async (values: StatusSearchFormValues) => {
    if (!firestore) {
      toast({ title: 'Error', description: 'Database not available.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    setApplications([]);

    try {
      const applicationsRef = collection(firestore, 'applications');
      const q = query(applicationsRef, where('volunteerEmail', '==', values.email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      const foundApplications = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Application) }));
      setApplications(foundApplications);
      
      if(foundApplications.length === 0) {
        toast({ title: 'No applications found', description: 'We could not find any applications associated with that email.' });
      }

    } catch (error) {
      console.error("Error searching applications:", error);
      toast({ title: 'Search Failed', description: 'There was an error searching for your applications.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: Application['status']) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case 'Pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Check Your Application Status</CardTitle>
          <CardDescription>
            Enter the email address you used to apply to see the status of your volunteer applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="flex gap-2 mb-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="sr-only">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage className="mt-2" />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
                <span className="ml-2 hidden md:inline">Search</span>
              </Button>
            </form>
          </Form>

          <div className="space-y-4">
            {isLoading && (
                 <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    <p className="mt-2">Searching for applications...</p>
                </div>
            )}
            
            {!isLoading && hasSearched && applications.length === 0 && (
                 <div className="text-center py-8 bg-muted rounded-lg">
                    <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium">No Applications Found</p>
                    <p className="text-muted-foreground">Check the email address you entered and try again.</p>
                </div>
            )}

            {!isLoading && applications.length > 0 && (
              <div className="border rounded-lg">
                <ul className="divide-y">
                  {applications.map(app => (
                    <li key={app.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-primary">{app.opportunityTitle}</p>
                        <p className="text-sm text-muted-foreground">Applied on: {new Date(app.appliedDate).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className={cn("capitalize", getStatusBadgeVariant(app.status))}>
                        {app.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
