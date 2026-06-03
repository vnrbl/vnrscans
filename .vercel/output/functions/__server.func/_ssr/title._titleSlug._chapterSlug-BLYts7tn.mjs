import { j as jsxRuntimeExports } from "../_libs/react.mjs";
const SplitErrorComponent = ({
  error
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid min-h-screen place-items-center bg-background p-4 text-center text-muted-foreground", children: [
  "Couldn't open this chapter: ",
  error.message
] });
export {
  SplitErrorComponent as errorComponent
};
