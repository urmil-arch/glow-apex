import { Service } from "@/types";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function filterYouTubeServices(services:Service[]) {
  const subscriberKeywords = ['subscriber', 'subscribers'];
  const likeKeywords = ['like', 'likes'];
  const excludedViewTypes = ['adwords', 'live', 'native', 'retention', 'stream', 'concurrent', 'social ads'];

  return services.filter(service => {
    const category = service.category.toLowerCase();
    const name = service.name.toLowerCase();

    // Check for subscribers
    if (subscriberKeywords.some(kw => category.includes(kw) || name.includes(kw))) {
      return true;
    }

    // Check for likes
    if (likeKeywords.some(kw => category.includes(kw) || name.includes(kw))) {
      return true;
    }

    // Check for normal video views (exclude special types)
    if (category.includes('views') || name.includes('views')) {
      const isNormalView = !excludedViewTypes.some(excluded => 
        category.includes(excluded) || name.includes(excluded)
      );
      return isNormalView;
    }

    return false;
  });
}