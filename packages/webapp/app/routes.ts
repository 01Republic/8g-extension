import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("layouts/sidebar.tsx", [
    index("routes/workflows.tsx"),
    route("/workflow-builder/:workflowId?", "routes/workflow-builder.tsx"),
  ]),
  route("/api/generate-jsonata", "routes/api.generate-jsonata.tsx"),
] satisfies RouteConfig;
