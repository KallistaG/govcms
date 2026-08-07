'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// ─── Type Definitions ─────────────────────────────────────────────────────────

export type SectionType = 'hero' | 'carousel' | 'news' | 'cards' | 'gallery' | 'statistics' | 'contact' | 'map' | 'footer';

export interface HomepageSection {
  id: string;
  type: SectionType;
  title: string;
  order: number;
  isVisible: boolean;
  config: Record<string, unknown>;
}

export type BlockType = 'heading' | 'paragraph' | 'image' | 'gallery' | 'cards' | 'accordion' | 'quote' | 'divider' | 'video' | 'pdf' | 'button' | 'download' | 'map' | 'table' | 'columns' | 'hero';

export interface PageBlock {
  id: string;
  type: BlockType;
  order: number;
  collapsed: boolean;
  config: Record<string, unknown>;
}

// ─── Default Sections & Blocks ────────────────────────────────────────────────

export const SECTION_TYPE_META: Record<SectionType, { label: string; description: string; icon: string }> = {
  hero: { label: 'Hero Banner', description: 'Full-width banner with headline, subtext and CTA', icon: 'Sparkles' },
  carousel: { label: 'Image Carousel', description: 'Sliding image showcase with auto-play', icon: 'Images' },
  news: { label: 'News & Press Releases', description: 'Latest agency news articles grid', icon: 'Newspaper' },
  cards: { label: 'Service Cards', description: 'Grid of agency service cards with icons', icon: 'LayoutGrid' },
  gallery: { label: 'Photo Gallery', description: 'Responsive masonry image gallery', icon: 'Image' },
  statistics: { label: 'Statistics Counter', description: 'Animated agency KPI numbers', icon: 'BarChart3' },
  contact: { label: 'Contact Form', description: 'Inquiry form with name, email, message', icon: 'Mail' },
  map: { label: 'Office Location Map', description: 'Interactive map showing agency location', icon: 'MapPin' },
  footer: { label: 'Footer Section', description: 'Bottom footer with links and copyright', icon: 'PanelBottom' },
};

export const BLOCK_TYPE_META: Record<BlockType, { label: string; description: string; icon: string }> = {
  heading: { label: 'Heading', description: 'Page section heading (H1, H2, H3)', icon: 'Heading' },
  paragraph: { label: 'Paragraph', description: 'Rich text paragraph content', icon: 'AlignLeft' },
  image: { label: 'Image', description: 'Single image with caption', icon: 'Image' },
  gallery: { label: 'Gallery', description: 'Multi-image responsive gallery', icon: 'Images' },
  cards: { label: 'Cards', description: 'Grid of content cards', icon: 'LayoutGrid' },
  accordion: { label: 'Accordion / FAQ', description: 'Collapsible details sections', icon: 'ListCollapse' },
  quote: { label: 'Blockquote', description: 'Styled quotation block', icon: 'Quote' },
  divider: { label: 'Divider', description: 'Horizontal rule separator', icon: 'Minus' },
  video: { label: 'Video Embed', description: 'YouTube or hosted video', icon: 'Video' },
  pdf: { label: 'PDF Document', description: 'Embedded PDF viewer', icon: 'FileText' },
  button: { label: 'CTA Button', description: 'Call-to-action button link', icon: 'MousePointer' },
  download: { label: 'Download Card', description: 'File download link card', icon: 'Download' },
  map: { label: 'Map', description: 'Embedded location map', icon: 'MapPin' },
  table: { label: 'Data Table', description: 'Structured data table', icon: 'Table' },
  columns: { label: 'Columns Layout', description: 'Multi-column flex container', icon: 'Columns3' },
  hero: { label: 'Hero Banner', description: 'Full-width hero block', icon: 'Sparkles' },
};

// ─── Demo In-Memory State ─────────────────────────────────────────────────────

let demoSections: HomepageSection[] = [
  { id: 'sec-1', type: 'hero', title: 'Agency Hero Banner', order: 0, isVisible: true, config: { headline: 'Department of Information and Communications Technology', subtext: 'Empowering Filipinos through innovative ICT solutions', ctaLabel: 'Learn More', ctaUrl: '/about' } },
  { id: 'sec-2', type: 'news', title: 'Latest Press Releases', order: 1, isVisible: true, config: { count: 6 } },
  { id: 'sec-3', type: 'cards', title: 'Government Services', order: 2, isVisible: true, config: { columns: 3 } },
  { id: 'sec-4', type: 'statistics', title: 'Agency Performance', order: 3, isVisible: true, config: { items: [{ label: 'Citizens Served', value: '2.4M' }, { label: 'Projects', value: '128' }, { label: 'Offices', value: '84' }] } },
  { id: 'sec-5', type: 'contact', title: 'Contact Our Office', order: 4, isVisible: true, config: {} },
  { id: 'sec-6', type: 'footer', title: 'Footer', order: 5, isVisible: true, config: {} },
];

let demoBlocks: PageBlock[] = [
  { id: 'blk-1', type: 'hero', order: 0, collapsed: false, config: { headline: 'About Our Agency', subtext: 'Learn about our mandate, mission and vision' } },
  { id: 'blk-2', type: 'heading', order: 1, collapsed: false, config: { level: 2, text: 'Our Mission and Vision' } },
  { id: 'blk-3', type: 'paragraph', order: 2, collapsed: false, config: { text: 'To empower every Filipino through innovative, accessible, and transformative information and communications technology services.' } },
  { id: 'blk-4', type: 'image', order: 3, collapsed: false, config: { src: '/placeholder-office.jpg', alt: 'Agency headquarters', caption: 'DICT Main Office, Quezon City' } },
  { id: 'blk-5', type: 'accordion', order: 4, collapsed: false, config: { items: [{ title: 'What services do you offer?', content: 'We offer a range of ICT-related services including digital literacy programs, connectivity projects, and cybersecurity initiatives.' }, { title: 'How can I contact your office?', content: 'You may reach us through our official email or visit any of our regional offices.' }] } },
  { id: 'blk-6', type: 'table', order: 5, collapsed: false, config: { headers: ['Region', 'Office', 'Contact'], rows: [['NCR', 'Main Office', '(02) 1234-5678'], ['Region IV', 'Calabarzon Branch', '(049) 876-5432']] } },
  { id: 'blk-7', type: 'button', order: 6, collapsed: false, config: { label: 'Download Annual Report', url: '/downloads/annual-report-2025.pdf', variant: 'primary' } },
];

// ─── Homepage Section Hooks ───────────────────────────────────────────────────

export function useHomepageSections() {
  return useQuery({
    queryKey: ['homepage-sections'],
    queryFn: async (): Promise<HomepageSection[]> => {
      try {
        const res = await fetch(`${API_URL}/page-builder/homepage`, { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          if (data && data.sections) return data.sections;
        }
      } catch { /* fallback */ }
      return [...demoSections];
    },
  });
}

export function useSaveHomepageSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sections: HomepageSection[]) => {
      demoSections = sections;
      try {
        const res = await fetch(`${API_URL}/page-builder/homepage/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ sections }),
        });
        if (res.ok) return await res.json();
      } catch { /* fallback */ }
      return { message: 'Saved' };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['homepage-sections'] }),
  });
}

export function usePublishHomepage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`${API_URL}/page-builder/homepage/publish`, {
          method: 'POST',
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch { /* fallback */ }
      return { message: 'Published' };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['homepage-sections'] }),
  });
}

// ─── Block Page Builder Hooks ─────────────────────────────────────────────────

export function usePageBlocks(slug: string) {
  return useQuery({
    queryKey: ['page-blocks', slug],
    queryFn: async (): Promise<PageBlock[]> => {
      try {
        const res = await fetch(`${API_URL}/page-builder/pages/${slug}`, { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          if (data && data.blocks) return data.blocks;
        }
      } catch { /* fallback */ }
      return [...demoBlocks];
    },
  });
}

export function useSavePageBlocks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, title, blocks }: { slug: string; title: string; blocks: PageBlock[] }) => {
      demoBlocks = blocks;
      try {
        const res = await fetch(`${API_URL}/page-builder/pages/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ title, blocks }),
        });
        if (res.ok) return await res.json();
      } catch { /* fallback */ }
      return { message: 'Saved' };
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['page-blocks', vars.slug] }),
  });
}

export function usePublishPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      try {
        const res = await fetch(`${API_URL}/page-builder/pages/${slug}/publish`, {
          method: 'POST',
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch { /* fallback */ }
      return { message: 'Published' };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['page-blocks'] }),
  });
}
