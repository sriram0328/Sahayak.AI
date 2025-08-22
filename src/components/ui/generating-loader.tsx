import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GeneratingLoaderProps {
  className?: string;
  children: React.ReactNode;
}

export function GeneratingLoader({ className, children }: GeneratingLoaderProps) {
  return (
    <Card className={cn("flex flex-col items-center justify-center text-center p-8", className)}>
        <CardContent className="flex flex-col items-center justify-center p-0">
            <div className="relative flex items-center justify-center mb-4">
                <div className="w-20 h-20 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                <div className="absolute flex items-center justify-center w-full h-full text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.9 4.8-4.8 1.9 4.8 1.9 1.9 4.8 1.9-4.8 4.8-1.9-4.8-1.9L12 3zM21 12l-1.9 4.8-4.8 1.9 4.8 1.9 1.9 4.8 1.9-4.8 4.8-1.9-4.8-1.9L21 12zM3 12l-1.9 4.8-4.8 1.9 4.8 1.9 1.9 4.8 1.9-4.8 4.8-1.9-4.8-1.9L3 12z" /></svg>
                </div>
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground animate-pulse">{children}</p>
            <p className="text-sm text-muted-foreground">Please wait a moment...</p>
        </CardContent>
    </Card>
  );
}

export function FormSkeleton() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    )
}
