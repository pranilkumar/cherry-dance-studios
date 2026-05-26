// Type declarations for assets imported into TypeScript/TSX files.

// CSS side-effect imports
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Next.js processes local image imports into StaticImageData objects.
interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
}

declare module '*.svg' {
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.png' {
  const data: StaticImageData;
  export default data;
}

declare module '*.jpg' {
  const data: StaticImageData;
  export default data;
}

declare module '*.JPG' {
  const data: StaticImageData;
  export default data;
}

declare module '*.jpeg' {
  const data: StaticImageData;
  export default data;
}

declare module '*.JPEG' {
  const data: StaticImageData;
  export default data;
}

declare module '*.webp' {
  const data: StaticImageData;
  export default data;
}

declare module '*.gif' {
  const data: StaticImageData;
  export default data;
}
