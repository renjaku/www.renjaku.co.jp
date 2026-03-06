export const prerenderRoutes = ["/", "/404"] as const;

export const sitemapRoutes = prerenderRoutes.filter((routePath) => routePath !== "/404");

