'use client';

/**
 * ImageUpload (Req 5.5, 5.6): shows the current image, or a placeholder when
 * the S3 URL is unreachable / missing. Selecting a file passes it up to the
 * parent form (the actual upload flows through RTK Query on submit).
 */

import { useState } from 'react';

interface ImageUploadProps {
  imageUrl: string | null;
  onSelect?: (file: File) => void;
}

const PLACEHOLDER_LABEL = 'Image unavailable';

export function ImageUpload({ imageUrl, onSelect }: ImageUploadProps) {
  const [broken, setBroken] = useState(false);
  const showPlaceholder = !imageUrl || broken;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-32 w-32 items-center justify-center rounded-md bg-icon-bg">
        {showPlaceholder ? (
          <span data-testid="image-placeholder" className="text-xs text-offwhite">
            {PLACEHOLDER_LABEL}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Product"
            onError={() => setBroken(true)}
            className="h-full w-full rounded-md object-cover"
          />
        )}
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Upload product image"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onSelect) onSelect(file);
        }}
        className="text-sm text-offwhite"
      />
    </div>
  );
}
