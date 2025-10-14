'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Application } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';


type GroupedApplications = {
  [opportunityTitle: string]: {
    ngo: string;
    applications: Application[];
  };
};

export default function AdminPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const applicationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'applications'), orderBy('appliedDate', 'desc'));
  }, [firestore]);

  const { data: applications, isLoading } = useCollection<Application>(applicationsQuery);

  const groupedApplications = useMemo(() => {
    if (!applications) return {};
    return applications.reduce((acc, app) => {
      const { opportunityTitle, opportunityNgo } = app;
      if (!acc[opportunityTitle]) {
        acc[opportunityTitle] = {
          ngo: opportunityNgo,
          applications: [],
        };
      }
      acc[opportunityTitle].applications.push(app);
      return acc;
    }, {} as GroupedApplications);
  }, [applications]);

  const handleStatusChange = (applicationId: string, newStatus: 'Approved' | 'Rejected') => {
    if (!firestore) {
      toast({ title: 'Error', description: 'Database not available.', variant: 'destructive' });
      return;
    }

    const appRef = doc(firestore, 'applications', applicationId);
    const updateData = { status: newStatus };

    updateDocumentNonBlocking(appRef, updateData);

    toast({
      title: 'Status Update Initiated',
      description: `The application status for ${applicationId} is being updated.`,
    });
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
      <Card>
        <CardHeader>
          <CardTitle>Manage Applications</CardTitle>
          <p className="text-muted-foreground">
            View and respond to volunteer applications. Applications are grouped by opportunity. Expand each section to see the applicants and manage their status.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {!isLoading && Object.keys(groupedApplications).length === 0 && (
            <div className="text-center py-16 bg-muted rounded-lg">
              <p className="text-lg text-muted-foreground">No applications have been submitted yet.</p>
            </div>
          )}

          {!isLoading && Object.keys(groupedApplications).length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(groupedApplications).map(([title, data]) => {
                const approvedCount = data.applications.filter(a => a.status === 'Approved').length;
                return (
                  <AccordionItem value={title} key={title}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex justify-between items-center w-full pr-4">
                          <div>
                            <h3 className="text-lg font-semibold text-primary">{title}</h3>
                            <p className="text-sm text-muted-foreground text-left">by {data.ngo}</p>
                          </div>
                           <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            {approvedCount} Approved
                          </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Volunteer</TableHead>
                            <TableHead>Applied On</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.applications.map((app) => (
                            <TableRow key={app.id}>
                              <TableCell>
                                <div className="font-medium">{app.volunteerName}</div>
                                <div className="text-sm text-muted-foreground">{app.volunteerEmail}</div>
                              </TableCell>
                              <TableCell>{new Date(app.appliedDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("capitalize", getStatusBadgeVariant(app.status))}>
                                  {app.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {app.status === 'Pending' && (
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(app.id, 'Approved')}>Approve</Button>
                                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(app.id, 'Rejected')}>Reject</Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
