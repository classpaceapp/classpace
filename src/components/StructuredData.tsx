import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://classpace.co';

// Organization Schema
export const OrganizationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Classpace",
    "alternateName": "Classpace Inc",
    "url": BASE_URL,
    "logo": `${BASE_URL}/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png`,
    "description": "AI-powered shared workspaces for teachers and learners. Create interactive courses, collaborate in real-time, and transform education.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "600 N Broad St, Ste 5 #445",
      "addressLocality": "Middletown",
      "addressRegion": "Delaware",
      "postalCode": "19709",
      "addressCountry": "US"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "social@classpace.co",
      "contactType": "customer service"
    },
    "sameAs": [
      "https://www.instagram.com/classpace.co/",
      "https://www.linkedin.com/company/classpace-app/"
    ],
    "foundingDate": "2024"
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Website Schema
export const WebsiteSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Classpace",
    "url": BASE_URL,
    "description": "AI-powered shared workspaces for teachers and learners",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/login`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Breadcrumb Schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

export const BreadcrumbSchema = ({ items }: { items: BreadcrumbItem[] }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${BASE_URL}${item.url}`
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Software Application Schema (for the app itself)
export const SoftwareApplicationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Classpace",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "name": "Learn+ / Teach+",
        "price": "7",
        "priceCurrency": "USD",
        "priceValidUntil": "2025-12-31"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// FAQ Schema for pricing page
export const FAQSchema = ({ faqs }: { faqs: { question: string; answer: string }[] }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
