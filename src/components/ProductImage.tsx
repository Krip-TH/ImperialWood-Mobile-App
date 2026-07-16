import { useEffect, useState } from 'react';
import { Image, ImageResizeMode, ImageStyle, StyleProp } from 'react-native';

import type { Product } from '@/context/AppContext';

type Props = {
  product: Product;
  style: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
};

export default function ProductImage({ product, style, resizeMode = 'cover' }: Props) {
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFailedImageIds((current) => {
      if (!current.has(product.id)) return current;
      const updated = new Set(current);
      updated.delete(product.id);
      return updated;
    });
  }, [product.id, product.image_url]);

  const remoteImageFailed = failedImageIds.has(product.id);
  const genericFallback = require('../../assets/products/imperial-classic-oak-door.jpg');
  const source = product.image_url && !remoteImageFailed
    ? { uri: `${product.image_url}?v=3` }
    : genericFallback;

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        console.log('Image load failed:', product.id, product.image_url);
        setFailedImageIds((current) => {
          const updated = new Set(current);
          updated.add(product.id);
          return updated;
        });
      }}
    />
  );
}
