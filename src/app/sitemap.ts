import { MetadataRoute } from 'next'
import { ThreadInfo } from '../components/threads'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    let threads: Array<ThreadInfo> = [];
    try {
        const res = await fetch(
            process.env.BACKEND_URL + `/api/questions/threadlist`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        threads = data.threads;
        if (!Array.isArray(threads)) {
            throw new Error('Invalid threads data');
        }
    } catch (error) {
        console.error('Failed to fetch threads for sitemap:', error);
        threads = [];
    }

    const baseUrl = 'https://facthound.xyz';
    const currentDate = new Date().toISOString();

    const urls = threads.map((thread) => ({
        url: `${baseUrl}/thread/${thread.id}/${thread.topic.toLowerCase().trim().split(' ').join('+')}`,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }))
    return [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/createthread`,
            lastModified: currentDate,
            changeFrequency: 'yearly',
            priority: 0.8,
        },
        ...urls
    ]
}
