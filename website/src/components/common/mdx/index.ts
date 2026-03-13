// Centralized MDX exports for clean imports

// Re-export blocks for convenience
export { Callout } from "./blocks/callout";
export { ExampleContainer } from "./blocks/example-container.tsx";
// Alias for backwards compatibility with MDX files
export {
  ImageCarouselBlock,
  ImageCarouselBlock as ImageCarousel,
} from "./blocks/image-carousel";
export { ImageCompare } from "./blocks/image-compare";
export { ImageComparison, ImageGrid, MDXImage } from "./blocks/images";

// Content navigation
export { ContentAside } from "./content/content-aside";
export { ContentCard } from "./content/content-card";
export { ContentList } from "./content/content-list";
export { ContentNav } from "./content/content-nav";

// Content components and styles
export { mdxComponents } from "./mdx-components";
export { MDXContentProvider } from "./mdx-provider";
export { type CalloutType, mdxStyles } from "./mdx-styles";
