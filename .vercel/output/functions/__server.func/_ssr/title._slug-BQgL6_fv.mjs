import { j as jsxRuntimeExports } from "../_libs/react.mjs";
const SplitErrorComponent = ({
  error
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-8 py-16 text-center text-muted-foreground", children: [
  "Couldn't load this series: ",
  error.message
] });
export {
  SplitErrorComponent as errorComponent
};
