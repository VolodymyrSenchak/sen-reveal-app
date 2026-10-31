# AGENTS.md

Instructions for coding agents working in sen-reveal-app.

## Components

Keep a component's template, styles and code in separate files, named after the `.ts` file:

```
join-session.page.ts
join-session.page.html    # templateUrl
join-session.page.scss    # styleUrl
```

The only exception is a template of 1-3 lines, which may stay inline.

This applies to new components and to any component moved to this layout on request. Do not
convert other existing components as a side effect of unrelated work.
