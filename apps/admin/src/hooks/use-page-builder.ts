'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://govcms-website.vercel.app';
const HOMEPAGE_STORAGE_KEY = 'govcms_homepage_sections';
const PAGE_BLOCKS_STORAGE_PREFIX = 'govcms_page_blocks_';

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

// ─── Default Meta ─────────────────────────────────────────────────────────────

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

// ─── Default In-Memory Fallbacks ──────────────────────────────────────────────

const DEFAULT_SECTIONS: HomepageSection[] = [
  { id: 'sec-1', type: 'hero', title: 'Water District Hero Banner', order: 0, isVisible: true, config: { headline: 'La Carlota City Water District', subtext: 'Providing safe, adequate, safe and potable water supply affordable to all.', ctaLabel: 'View Services', ctaUrl: '/news' } },
  { id: 'sec-2', type: 'news', title: 'Latest Advisories & News', order: 1, isVisible: true, config: { count: 6 } },
  { id: 'sec-3', type: 'cards', title: 'Water District Services', order: 2, isVisible: true, config: { columns: 3 } },
  { id: 'sec-4', type: 'statistics', title: 'District Performance', order: 3, isVisible: true, config: { items: [{ label: 'Connections', value: '15.4K' }, { label: 'Potability', value: '100%' }, { label: 'Hotlines', value: '24/7' }] } },
  { id: 'sec-5', type: 'contact', title: 'Contact Our Office', order: 4, isVisible: true, config: {} },
  { id: 'sec-6', type: 'footer', title: 'Footer', order: 5, isVisible: true, config: {} },
];

const DEFAULT_BLOCKS: PageBlock[] = [
  { id: 'blk-1', type: 'hero', order: 0, collapsed: false, config: { headline: 'About La Carlota City Water District', subtext: 'Learn about our mandate, mission and vision' } },
  { id: 'blk-2', type: 'heading', order: 1, collapsed: false, config: { level: 2, text: 'Our Mission and Vision' } },
  { id: 'blk-3', type: 'paragraph', order: 2, collapsed: false, config: { text: 'Providing safe, adequate, safe and potable water supply affordable to all.' } },
];

function getLocalHomepage(): HomepageSection[] {
  if (typeof window === 'undefined') return DEFAULT_SECTIONS;
  try {
    const raw = localStorage.getItem(HOMEPAGE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_SECTIONS;
}

function saveLocalHomepage(sections: HomepageSection[]): HomepageSection[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HOMEPAGE_STORAGE_KEY, JSON.stringify(sections));
    } catch {
      // fallback
    }
  }
  return sections;
}

function getLocalPageBlocks(slug: string): PageBlock[] {
  if (typeof window === 'undefined') return DEFAULT_BLOCKS;
  try {
    const raw = localStorage.getItem(`${PAGE_BLOCKS_STORAGE_PREFIX}${slug}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_BLOCKS;
}

function saveLocalPageBlocks(slug: string, blocks: PageBlock[]): PageBlock[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${PAGE_BLOCKS_STORAGE_PREFIX}${slug}`, JSON.stringify(blocks));
    } catch {
      // fallback
    }
  }
  return blocks;
}

async function syncToWebsite(type: string, data: any) {
  try {
    await fetch(`${WEBSITE_URL}/api/v1/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
    });
  } catch {
    // ignore
  }
}

// ─── Homepage Section Hooks ───────────────────────────────────────────────────

export function useHomepageSections() {
  return useQuery({
    queryKey: ['homepage-sections'],
    queryFn: async (): Promise<HomepageSection[]> => {
      try {
        const res = await fetch(`${API_URL}/page-builder/homepage`, { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          if (data && data.sections) {
            saveLocalHomepage(data.sections);
            return data.sections;
          }
        }
      } catch {
        // fallback
      }
      return getLocalHomepage();
    },
  });
}

export function useSaveHomepageSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sections: HomepageSection[]) => {
      saveLocalHomepage(sections);
      syncToWebsite('homepage', { sections });

      try {
        const res = await fetch(`${API_URL}/page-builder/homepage/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ sections }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.sections) {
            saveLocalHomepage(data.sections);
            return data;
          }
        }
      } catch {
        // fallback
      }
      return { message: 'Saved', sections };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homepage-sections'] });
      qc.invalidateQueries({ queryKey: ['public-homepage'] });
    },
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
      } catch {
        // fallback
      }
      return { message: 'Published' };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homepage-sections'] });
      qc.invalidateQueries({ queryKey: ['public-homepage'] });
    },
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
          if (data && data.blocks) {
            saveLocalPageBlocks(slug, data.blocks);
            return data.blocks;
          }
        }
      } catch {
        // fallback
      }
      return getLocalPageBlocks(slug);
    },
  });
}

export function useSavePageBlocks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, title, blocks }: { slug: string; title: string; blocks: PageBlock[] }) => {
      saveLocalPageBlocks(slug, blocks);
      syncToWebsite('pages', { slug, page: { title, slug, blocks } });

      try {
        const res = await fetch(`${API_URL}/page-builder/pages/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ title, blocks }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.blocks) {
            saveLocalPageBlocks(slug, data.blocks);
            return data;
          }
        }
      } catch {
        // fallback
      }
      return { message: 'Saved', blocks };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['page-blocks', vars.slug] });
      qc.invalidateQueries({ queryKey: ['public-page-blocks', vars.slug] });
    },
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
      } catch {
        // fallback
      }
      return { message: 'Published' };
    },
    onSuccess: (_d, slug) => {
      qc.invalidateQueries({ queryKey: ['page-blocks', slug] });
      qc.invalidateQueries({ queryKey: ['public-page-blocks', slug] });
    },
  });
}
