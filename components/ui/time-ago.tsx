import { formatDistanceToNow, parseISO } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimeAgoProps {
  date: string | Date | number | null | undefined;
  className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  // Handle null or undefined dates
  if (date === null || date === undefined) {
    return <span className={className}>Unknown date</span>;
  }
  
  let dateObj: Date;
  
  try {
    // Handle different date formats
    if (typeof date === "string") {
      // Parse ISO string
      dateObj = parseISO(date);
    } else if (typeof date === "number") {
      // Convert epoch timestamp (in seconds or milliseconds) to Date
      // If timestamp is in seconds (10 digits), convert to milliseconds
      dateObj = new Date(date < 10000000000 ? date * 1000 : date);
    } else {
      // Assume it's already a Date object
      dateObj = date;
    }
    
    // Verify that dateObj is a valid Date
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      throw new Error("Invalid date");
    }
    
    // Format the relative time (e.g., "2 hours ago")
    const timeAgo = formatDistanceToNow(dateObj, { addSuffix: true });
    
    // Format the full UTC timestamp
    const fullTimestamp = dateObj.toUTCString();

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className={className}>
            <time dateTime={dateObj.toISOString()}>{timeAgo}</time>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs font-mono">{fullTimestamp}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } catch (error) {
    // If we can't parse the date, show a fallback
    return <span className={className}>{typeof date === "string" ? date : "Invalid date"}</span>;
  }
} 