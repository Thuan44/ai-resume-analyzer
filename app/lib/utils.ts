import clsx, { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export const generateUUID = () => crypto.randomUUID()

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}