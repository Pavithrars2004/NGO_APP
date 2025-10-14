'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpportunityCard } from '@/components/opportunity-card';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { Opportunity, OpportunityCategory } from '@/lib/types';
import { Search } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

const allCategories: OpportunityCategory[] = ['Environment', 'Education', 'Healthcare', 'Community Development', 'Animal Welfare'];

export default function OpportunitiesPage() {
  const { firestore } = useFirebase();

  const opportunitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'opportunities'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: opportunities, isLoading } = useCollection<Opportunity>(opportunitiesQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('');

  const uniqueLocations = useMemo(() => {
    if (!opportunities) return ['all'];
    const locations = new Set(opportunities.map(op => op.location));
    return ['all', ...Array.from(locations)];
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    if (!opportunities) return [];
    return opportunities.filter((opportunity: Opportunity) => {
      const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) || opportunity.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'all' || opportunity.category === category;
      const matchesLocation = location === '' || location === 'all' || opportunity.location === location;
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [opportunities, searchTerm, category, location]);

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center bg-card shadow-md rounded-xl p-8 md:p-12 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight">
          Find Your Cause. Make a Difference.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse through a wide range of volunteer opportunities and join a cause you are passionate about. Your help can change lives.
        </p>
      </section>

      <div className="mb-8 p-4 bg-card rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search opportunities..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
                {uniqueLocations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc === 'all' ? 'All Locations' : loc}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="flex flex-col h-full overflow-hidden">
                    <CardHeader className="p-0 relative">
                        <div className="w-full h-48 bg-muted animate-pulse" />
                    </CardHeader>
                    <CardContent className="flex-grow pt-6">
                        <div className="h-6 w-3/4 mb-2 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                        <div className="h-4 w-2/3 mt-1 bg-muted animate-pulse rounded" />
                    </CardContent>
                    <CardFooter>
                        <div className="h-10 w-full bg-muted animate-pulse rounded" />
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}

      {!isLoading && filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredOpportunities.map((opportunity: Opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        !isLoading && <div className="text-center py-16 bg-card rounded-lg shadow-sm border">
          <p className="text-muted-foreground text-lg">No opportunities found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
