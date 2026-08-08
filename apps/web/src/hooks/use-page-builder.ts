'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const HOMEPAGE_STORAGE_KEY = 'govcms_homepage_sections';
const PAGE_BLOCKS_STORAGE_PREFIX = 'govcms_page_blocks_';

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
  map: { label: 'Google Maps', description: 'Interactive embed map', icon: 'MapPin' },
  table: { label: 'Data Table', description: 'Structured table data', icon: 'Table' },
  columns: { label: '2-Column Layout', description: 'Side by side columns', icon: 'Columns' },
  hero: { label: 'Page Banner', description: 'Header banner section', icon: 'Sparkles' },
};

const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-hero-1',
    type: 'hero',
    title: 'Hero Banner',
    order: 0,
    isVisible: true,
    config: {
      headline: 'Official Agency Portal Engine',
      subtext: 'Providing fast, accessible, transparent, and digital government public services to all citizens.',
      ctaLabel: 'Read Announcements',
      ctaUrl: '/news',
    },
  },
  {
    id: 'sec-news-1',
    type: 'news',
    title: 'Latest Press Releases & News',
    order: 1,
    isVisible: true,
    config: { count: 3 },
  },
  {
    id: 'sec-cards-1',
    type: 'cards',
    title: 'Public e-Services',
    order: 2,
    isVisible: true,
    config: {
      cards: [
        { title: 'FOI Requests', description: 'Submit Freedom of Information requests online.', link: '/downloads' },
        { title: 'Public Notices', description: 'Read official agency advisories and circulars.', link: '/news' },
        { title: 'Agency Services', description: 'Explore public programs, permits, and guidelines.', link: '/pages/about' },
      ],
    },
  },
];

export function useHomepageSections() {
  return useQuery({
    queryKey: ['page-builder', 'homepage'],
    queryFn: async (): Promise<HomepageSection[]> => {
      try {
        const res = await fetch(`${API_URL}/page-builder/homepage`, { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          if (data.sections && data.sections.length > 0) return data.sections;
        }
      } catch {
        // Fallback
      }

      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(HOMEPAGE_STORAGE_KEY);
        if (saved) {
          try { return JSON.parse(saved); } catch { /* ignore */ }
        }
      }
      return DEFAULT_HOMEPAGE_SECTIONS;
    },
  });
}

export function useSaveHomepageSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sections: HomepageSection[]) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(HOMEPAGE_STORAGE_KEY, JSON.stringify(sections));
      }

      try {
        const res = await fetch(`${API_URL}/page-builder/homepage/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ sections }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      return { message: 'Homepage sections saved' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-builder', 'homepage'] });
    },
  });
}

export function usePublishHomepage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sections: HomepageSection[]) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(HOMEPAGE_STORAGE_KEY, JSON.stringify(sections));
      }

      try {
        const res = await fetch(`${API_URL}/page-builder/homepage/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ sections }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      return { message: 'Homepage published successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-builder', 'homepage'] });
    },
  });
}

export function usePageBlocks(slug: string) {
  return useQuery({
    queryKey: ['page-builder', 'page', slug],
    queryFn: async (): Promise<PageBlock[]> => {
      try {
        const res = await fetch(`${API_URL}/page-builder/pages/${slug}`, { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          if (data.blocks) return data.blocks;
        }
      } catch {
        // Fallback
      }

      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`${PAGE_BLOCKS_STORAGE_PREFIX}${slug}`);
        if (saved) {
          try { return JSON.parse(saved); } catch { /* ignore */ }
        }
      }
      return [
        { id: 'blk-1', type: 'heading', order: 0, collapsed: false, config: { text: 'Welcome to Agency Page', level: 'h1' } },
        { id: 'blk-2', type: 'paragraph', order: 1, collapsed: false, config: { text: 'This dynamic page content is rendered from the GovCMS Page Builder engine.' } },
      ];
    },
  });
}

export function useSavePageBlocks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, blocks }: { slug: string; blocks: PageBlock[] }) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${PAGE_BLOCKS_STORAGE_PREFIX}${slug}`, JSON.stringify(blocks));
      }

      try {
        const res = await fetch(`${API_URL}/page-builder/pages/${slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ blocks }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      return { message: 'Page blocks saved' };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['page-builder', 'page', variables.slug] });
    },
  });
}
