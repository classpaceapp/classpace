import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: string;
  image?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://classpace.co';
const DEFAULT_TITLE = 'Classpace - Learn and Teach Anything. Together.';
const DEFAULT_DESCRIPTION = 'AI-powered shared workspaces for teachers and learners. Create interactive courses, collaborate in real-time, and transform education with intelligent tools.';
const DEFAULT_IMAGE = `${BASE_URL}/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png`;

const SEO = ({ 
  title, 
  description = DEFAULT_DESCRIPTION, 
  canonical,
  type = 'website',
  image = DEFAULT_IMAGE,
  noIndex = false
}: SEOProps) => {
  const fullTitle = title ? `${title} | Classpace` : DEFAULT_TITLE;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="Classpace" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
