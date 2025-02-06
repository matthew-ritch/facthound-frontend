import { MetadataRoute } from 'next'
// import { ThreadInfo } from '../components/threads'

export default function sitemap(): MetadataRoute.Sitemap {
    // let threads: ThreadInfo[] = [];

    // try {
    //     const res = await fetch(
    //         process.env.BACKEND_URL + `/api/questions/threadlist`,
    //         { next: { revalidate: 3600 } }
    //     );

    //     if (!res.ok) throw new Error('Failed to fetch');
    //     threads = await res.json();
    // } catch (error) {
    //     console.error('Failed to fetch threads for sitemap:', error);
    //     threads = [];
    // }

    const baseUrl = 'https://facthound.xyz';
    const currentDate = new Date().toISOString();

    // const urls = threads.map((thread) => ({
    //     url: `${baseUrl}/thread/${thread.id}`,
    //     lastModified: currentDate,
    //     changeFrequency: 'weekly' as const,
    //     priority: 0.6,
    // }))
    return [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/createthread`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 0.8,
        },
        // ...urls
    ]
}
