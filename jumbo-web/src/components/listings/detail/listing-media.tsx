import { Play, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ListingMediaProps {
  images: string[];
}

export function ListingMedia({ images }: ListingMediaProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-muted aspect-video md:aspect-auto md:h-full">
      {images && images.length > 0 ? (
        <Image
          src={images[0]}
          alt="Listing Image"
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="size-10 mb-2" />
          <span>No images available</span>
        </div>
      )}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium backdrop-blur-md hover:bg-background">
          <ImageIcon className="size-3" />
          {images.length} Photos
        </button>
        <button className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium backdrop-blur-md hover:bg-background">
          <Play className="size-3" />
          Video
        </button>
      </div>
    </div>
  );
}

