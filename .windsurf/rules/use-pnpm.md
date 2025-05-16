---
trigger: model_decision
description: To install dependencies or run npm commands or install shadcn components
globs: 
---

To install dependencies, use `pnpm` instead of `npm`, since `pnpm` is default package manager in this project. To run command or install shadcn components, use `pnpm dlx`. For example: `pnpm dlx shadcn@latest add popover`