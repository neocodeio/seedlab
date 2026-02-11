import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'profile';
    author?: string;
    publishedTime?: string;
}

export const SEO = ({
    title,
    description,
    image = '/favicon.png?v=2',
    url = window.location.href,
    type = 'website',
    author,
    publishedTime
}: SEOProps) => {
    const siteTitle = 'SeedLab';
    const fullTitle = `${title} | ${siteTitle}`;
    const fullImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Article Specific */}
            {publishedTime && <meta property="article:published_time" content={publishedTime} />}
            {author && <meta name="author" content={author} />}
        </Helmet>
    );
};
