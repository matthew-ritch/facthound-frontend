import { MetadataRoute } from 'next'
import { ThreadInfo } from '../components/threads'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let threads: ThreadInfo[] = [];
  
  try {
    const res = await fetch(
      process.env.BACKEND_URL + `/api/questions/threadlist`,
      { next: { revalidate: 3600 } } // Revalidate every hour
    );
    
    if (!res.ok) throw new Error('Failed to fetch');
    threads = await res.json();
  } catch (error) {
    console.error('Failed to fetch threads for sitemap:', error);
    threads = [];
  }

  const baseUrl = 'https://facthound.xyz';
  const currentDate = new Date().toISOString();

  const threadUrls = threads.map((thread) => ({
    url: `${baseUrl}/thread/${thread.id}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 1,
    } as const,
    {
      url: `${baseUrl}/createthread`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    } as const,
    ...threadUrls
  ]
}