# AGENTS.md

Instructions for coding agents working in sen-reveal-app.

## Components

Keep a component's template, styles and code in separate files, named after the `.ts` file, in a
folder of their own:

```
round/sen-reveal/ask/
  ask.view.ts
  ask.view.html       # templateUrl
  ask.view.scss       # styleUrl
  ask.view.spec.ts
```

The only exception is a template of 1-3 lines, which may stay inline.

A component with separate files always gets its own folder: one component per folder, next to
nothing but that component's files. A helper shared by several components stays outside, in the
folder that holds them.

This applies to new components and to any component moved to this layout on request. Do not
convert other existing components as a side effect of unrelated work.
