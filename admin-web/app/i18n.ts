import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Idioma por defecto para Colombia
  const locale = 'es';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
