# MDX Styling System - Consolidated & Optimized

## 🎯 **Architecture Overview**

This is a **consolidated, best-practice MDX styling system** with clear separation of concerns:

```
📁 mdx/
├── 📄 index.ts              # Central exports (use this for imports)
├── 📄 mdx-provider.tsx      # Layout + spacing system  
├── 📄 mdx-components.tsx    # MDX component overrides
├── 📄 mdx-styles.ts         # Typography + content styles
├── 📄 mdx-typography.tsx    # Standalone typography components
└── 📁 blocks/               # Rich content blocks
```

## 📖 **How to Use**

### **1. Simple Import (Recommended)**
```tsx
import { MDXContentProvider, mdxStyles } from '@/components/mdx'
```

### **2. In Your Route/Layout**
```tsx
<MDXContentProvider>
  <YourMDXContent />
</MDXContentProvider>
```

### **3. Custom Components (Outside MDX)**
```tsx
import { H1, Lead, Text } from '@/components/mdx'

<H1>Custom heading outside MDX</H1>
<Lead>Lead text with proper styling</Lead>
```

## 🏗️ **System Architecture**

### **Separation of Concerns:**

1. **`mdx-provider.tsx`** - Spacing & Layout
   - Global spacing between elements (`[&>h1+*]:mt-8`)
   - No typography styles
   
2. **`mdx-styles.ts`** - Typography & Content  
   - Font weights, line heights, colors
   - No spacing (handled by provider)
   
3. **`mdx-components.tsx`** - Width Control & Components
   - Text content → `TextContent` wrapper (narrow)
   - Code blocks → `CodeContent` wrapper (wider)
   - Media → Full width (no wrapper)

4. **`index.css`** - Base Typography
   - Font sizes using CSS custom properties
   - Global element defaults

## 🎨 **Styling Patterns**

### **Text Content (Narrow Layout)**
```tsx
// Automatic via MDX
<h1>This gets TextContent wrapper</h1>
<p>This paragraph is narrow for readability</p>

// Manual usage
<TextContent>
  <div>Custom narrow content</div>
</TextContent>
```

### **Code Content (Medium Width)**  
```tsx
// Automatic for code blocks
<pre><code>This gets CodeContent wrapper</code></pre>

// Manual usage  
<CodeContent>
  <ProjectMeta tech={[...]} duration="6 months" />
</CodeContent>
```

### **Full Width Media**
```tsx
// Automatic - no wrapper
<img src="..." />
<ImageBlock src="..." />
<VideoBlock src="..." />
```

## 📐 **Width Hierarchy**

```
┌─────────────────────────────────────────────────────────────┐
│                    Full Container Width                     │
├─────────────────────────────────────────────────────────────┤
│        ┌─────────────────────────────────────┐              │
│        │      TextContent (max-w-2xl)       │              │
│        │   Headings, paragraphs, lists      │              │
│        └─────────────────────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│            ┌─────────────────────────────────────────┐      │
│            │    CodeContent (max-w-4xl)             │      │
│            │  Code blocks, ProjectMeta, etc.        │      │
│            └─────────────────────────────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                    Full Width Media                         │
│              Images, Videos, Tables, Grids                  │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ **Performance Optimizations**

1. **Removed Unused Imports** - No more unused typography components
2. **Direct Tailwind Classes** - Replaced Container wrappers with `mx-auto max-w-*`
3. **Consolidated Styles** - Single source of truth for each concern
4. **Eliminated Conflicts** - No more spacing battles between systems

## 🧪 **Example Usage**

```tsx
// ✅ Good - Use central import
import { MDXContentProvider, H1, Lead } from '@/components/mdx'

// ✅ Good - Custom components outside MDX
<H1>Page Title</H1>
<Lead>This is lead text</Lead>

// ✅ Good - MDX content
<MDXContentProvider>
  <YourMDXComponent />
</MDXContentProvider>

// ❌ Avoid - Direct style imports
import { mdxStyles } from '@/components/mdx/mdx-styles'
```

## 🔧 **Customization**

### **Adjust Text Width:**
```tsx
// In mdx-components.tsx
const TextContent = ({ children }) => (
  <div className="mx-auto max-w-3xl">{children}</div> // Change max-w-2xl
)
```

### **Modify Spacing:**
```tsx
// In mdx-provider.tsx  
'[&>h1+*]:mt-10',  // Change from mt-8
```

### **Update Typography:**
```tsx
// In mdx-styles.ts
h1: 'font-black scroll-m-20',  // Change from font-bold
```

This system is **maintainable**, **performant**, and follows **React/TypeScript best practices**! 🚀