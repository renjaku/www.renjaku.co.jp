type SiteData = {
  title: string;
  url: string;
  contactPage: string;
  corporateNumber: string;
  employees: number;
  representative: string;
  established: string;
  capitalStock: number;
  address: {
    country: string;
    postalCode: string;
    locality: string;
    region: string;
    streetAddress: string;
  };
};

export function createSchemas(site: SiteData) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.title,
      url: site.url,
      address: {
        "@type": "PostalAddress",
        addressCountry: site.address.country,
        postalCode: site.address.postalCode,
        addressLocality: site.address.locality,
        addressRegion: site.address.region,
        streetAddress: site.address.streetAddress,
      },
      identifier: {
        "@type": "PropertyValue",
        propertyID: "corporateNumber",
        value: site.corporateNumber,
      },
      vatID: "T" + site.corporateNumber,
      numberOfEmployees: {
        "@type": "QuantitativeValue",
        value: site.employees,
      },
      founder: {
        "@type": "Person",
        name: site.representative,
      },
      foundingDate: site.established,
      contactPoint: {
        "@type": "ContactPoint",
        email: null,
        telephone: null,
        url: new URL(site.contactPage, site.url).href,
      },
      additionalProperty: [
        {
          "@type": "PropertyValue",
          propertyID: "capitalStock",
          value: site.capitalStock,
        },
      ],
    },
  ];
}

