The tech stack for this project is NextJS with Typescript, Tailwindcss, and MUI. If we decide to add a database, Supabase seems like a good choice.

We will also be working with the decentralized protocols of Bitcoin, Lightning, and Nostr.

The development goal is to create well-documented standards for how to gate content, including multiple steps or levels, behind a paywall, and implement these standards in an application. Toward this end, we should strive to create code that is simple, focused, and generic.

Front-end and UX development should strive to intuitively guide users toward the next step.

Do not write more code than what is asked for in each prompt. New functions should come with unit tests. After updating any logic, check whether existing unit tests need to be updated. If so, do it.

Comment non-obvious code and ensure everything is understandable to a mid-level developer.
- When writing complex logic, add an inline `# Reason:` comment explaining the why, not just the what.

There is a TASKS.md file with a list of tasks related to the project. You will be assigned one task at a time. If you encounter an error while working on the task, update the task with the reason for the issue and mark the task as PAUSED. If you are able to complete the task, mark the task COMPLETE and add a list of the changes made under the task in TASKS.md. Add new sub-tasks or TODOs discovered during development to TASK.md under a “Discovered During Work” section.

Never assume missing context. Ask questions if uncertain.

Always confirm file paths and module names exist before referencing them in code or tests.