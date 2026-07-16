import { useEffect, useState } from 'react';
import { Image, ImageResizeMode, ImageStyle, StyleProp } from 'react-native';

import type { Product } from '@/context/AppContext';

type Props = {
  product: Product;
  style: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
};

export default function ProductImage({ product, style, resizeMode = 'cover' }: Props) {
  const [remoteFailed, setRemoteFailed] = useState(false);

  useEffect(() => setRemoteFailed(false), [product.image_url]);

  return (
    <Image
      source={product.image_url && !remoteFailed ? { uri: product.image_url } : product.image}
      style={style}
      resizeMode={resizeMode}
      onError={() => setRemoteFailed(true)}
    />
  );
}
