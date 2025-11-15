/**
 * Client-side image resizing utility
 * Resizes images to max width/height, handles EXIF orientation, and compresses to JPEG quality
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Get EXIF orientation from image
 * Returns orientation value (1-8) or 1 if not found
 */
function getOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(1); // Not a JPEG
        return;
      }
      
      const length = view.byteLength;
      let offset = 2;
      
      while (offset < length) {
        if (view.getUint16(offset, false) !== 0xFFE1) {
          offset += 2;
          continue;
        }
        
        const marker = view.getUint16(offset + 2, false);
        if (marker !== 0x4578) { // "Ex" in ASCII
          offset += 2;
          continue;
        }
        
        const exifLength = view.getUint16(offset, false);
        if (offset + exifLength > length) {
          resolve(1);
          return;
        }
        
        const tiffOffset = offset + 4;
        const isLittleEndian = view.getUint16(tiffOffset, false) === 0x4949;
        
        if (view.getUint32(tiffOffset + 4, isLittleEndian) !== 0x002A) {
          resolve(1);
          return;
        }
        
        const ifdOffset = view.getUint32(tiffOffset + 8, isLittleEndian);
        const ifdPointer = tiffOffset + ifdOffset;
        const tagCount = view.getUint16(ifdPointer, isLittleEndian);
        
        for (let i = 0; i < tagCount; i++) {
          const tagOffset = ifdPointer + 2 + (i * 12);
          if (view.getUint16(tagOffset, isLittleEndian) === 0x0112) { // Orientation tag
            const orientation = view.getUint16(tagOffset + 8, isLittleEndian);
            resolve(orientation);
            return;
          }
        }
        
        resolve(1);
        return;
      }
      
      resolve(1);
    };
    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024)); // Read first 64KB
  });
}

/**
 * Apply EXIF orientation transformation to canvas context
 */
function applyOrientation(ctx: CanvasRenderingContext2D, orientation: number, width: number, height: number) {
  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      // Orientation 1 or unknown - no transformation
      break;
  }
}

/**
 * Resize and compress an image file with EXIF orientation handling
 * @param file - Original image file
 * @param maxWidth - Maximum width (default: 1200)
 * @param quality - JPEG quality 0-1 (default: 0.78)
 * @returns Resized and compressed File object
 */
export async function resizeImageFile(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.78
): Promise<File> {
  return new Promise(async (resolve, reject) => {
    // Get EXIF orientation
    const orientation = await getOrientation(file);
    const needsRotation = orientation >= 5 && orientation <= 8;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate dimensions - swap if rotated
        let width = img.width;
        let height = img.height;
        
        if (needsRotation) {
          [width, height] = [height, width];
        }

        // Calculate new dimensions preserving aspect ratio
        let newWidth = width;
        let newHeight = height;

        if (width > maxWidth || height > maxWidth) {
          const ratio = Math.min(maxWidth / width, maxWidth / height);
          newWidth = Math.round(width * ratio);
          newHeight = Math.round(height * ratio);
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Apply EXIF orientation transformation
        ctx.save();
        applyOrientation(ctx, orientation, newWidth, newHeight);
        
        // Draw image (swap dimensions if rotated)
        if (needsRotation) {
          ctx.drawImage(img, 0, 0, newHeight, newWidth);
        } else {
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
        }
        
        ctx.restore();

        // Convert to blob with specified quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Ensure file size is under 2MB
            if (blob.size > 2 * 1024 * 1024) {
              // Try lower quality
              canvas.toBlob(
                (lowerQualityBlob) => {
                  if (!lowerQualityBlob) {
                    reject(new Error('Failed to create blob with lower quality'));
                    return;
                  }
                  
                  const resizedFile = new File(
                    [lowerQualityBlob],
                    file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                    {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    }
                  );
                  
                  console.log(
                    `Image resized: ${file.size} bytes → ${resizedFile.size} bytes ` +
                    `(${((1 - resizedFile.size / file.size) * 100).toFixed(1)}% reduction, orientation: ${orientation})`
                  );
                  
                  resolve(resizedFile);
                },
                'image/jpeg',
                Math.max(0.5, quality - 0.2)
              );
              return;
            }

            // Create new File with original name (change extension to .jpg)
            const resizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.jpg',
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            console.log(
              `Image resized: ${file.size} bytes → ${resizedFile.size} bytes ` +
              `(${((1 - resizedFile.size / file.size) * 100).toFixed(1)}% reduction, orientation: ${orientation})`
            );

            resolve(resizedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}


