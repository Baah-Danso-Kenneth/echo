import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format a date string to relative time (e.g., "2h ago")
 */
export function formatRelativeTime(dateString: string): string {
    try {
        const date = new Date(dateString);
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
        return dateString;
    }
}

/**
 * Format a date string to a full date
 */
export function formatFullDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return format(date, 'PPpp'); // e.g., "Apr 29, 2021, 12:00:00 PM"
    } catch (error) {
        return dateString;
    }
}

/**
 * Format a date string to short format
 */
export function formatShortDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return format(date, 'MMM d, yyyy'); // e.g., "Apr 29, 2021"
    } catch (error) {
        return dateString;
    }
}
