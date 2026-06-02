import React from "react";
import DynamicPackageSelector from "./DynamicPackageSelector";

const SERVICE_TYPE_MAP: Record<string, string> = {
  views:       "youtube_views",
  likes:       "youtube_likes",
  subscribers: "youtube_subscribers",
  comments:    "youtube_comments",
  "shorts-likes": "youtube_shorts_likes",
  "shorts-views":  "youtube_shorts_views",
};

const CATEGORY_NAME_MAP: Record<string, string> = {
  views:       "YouTube Views",
  likes:       "YouTube Likes",
  subscribers: "YouTube Subscribers",
  comments:    "YouTube Comments",
  "shorts-likes": "YouTube Shorts Likes",
  "shorts-views":  "YouTube Shorts Views",
};

interface ServiceSelectionComponentProps {
  serviceType: string;
}

const ServiceSelectionComponent: React.FC<ServiceSelectionComponentProps> = ({
  serviceType,
}) => {
  const backendType  = SERVICE_TYPE_MAP[serviceType]   ?? serviceType;
  const categoryName = CATEGORY_NAME_MAP[serviceType]  ?? serviceType;

  return (
    <DynamicPackageSelector
      serviceType={backendType}
      categoryName={categoryName}
      title={`Buy ${categoryName}`}
    />
  );
};

export default ServiceSelectionComponent;
