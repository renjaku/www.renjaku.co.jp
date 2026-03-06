import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("404", "routes/not-found.tsx"),
  route("*", "routes/not-found-splat.tsx"),
] satisfies RouteConfig;
