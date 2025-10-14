import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock } from 'lucide-react';
import type { Opportunity } from '@/lib/types';
import { cn } from '@/lib/utils';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const categoryColors: Record<string, string> = {
    'Environment': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    'Education': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
    'Healthcare': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
    'Community Development': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800',
    'Animal Welfare': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
};


export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="p-0 relative">
        <Link href={`/opportunity/${opportunity.id}`}>
          <Image
            src={opportunity.imageUrl}
            alt={opportunity.title}
            width={600}
            height={400}
            className="w-full h-48 object-cover"
            data-ai-hint={opportunity.imageHint}
          />
        </Link>
        <Badge className={cn("absolute top-3 right-3", categoryColors[opportunity.category] || 'bg-gray-100 text-gray-800')}>
            {opportunity.category}
        </Badge>
      </CardHeader>
      <CardContent className="flex-grow pt-6">
        <CardTitle className="mb-2 text-xl font-headline">
          <Link href={`/opportunity/${opportunity.id}`} className="hover:text-primary transition-colors">
            {opportunity.title}
          </Link>
        </CardTitle>
        <p className="text-muted-foreground text-sm line-clamp-2">{opportunity.description}</p>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{opportunity.location}</span>
            </div>
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{opportunity.date}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{opportunity.timeCommitment}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/opportunity/${opportunity.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
