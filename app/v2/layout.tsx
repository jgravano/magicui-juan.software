import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JUAN GRAVANO — THE GALLERY',
  description: 'Enter the gallery. Explore the work.',
};

export default function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
