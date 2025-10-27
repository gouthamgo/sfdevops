# Claude Code Configuration

This directory contains configuration and custom commands for Claude Code.

## Directory Structure

```
.claude/
├── commands/              # Custom slash commands
│   ├── write-page.md     # Template for writing documentation pages
│   ├── create-project.md # Template for creating project showcases
│   └── review-content.md # Content review checklist
├── settings.local.json    # Local Claude Code settings
└── README.md             # This file
```

## Custom Slash Commands

### `/write-page`
Template for writing comprehensive documentation pages following the project's content principles.

**Usage**: Type `/write-page` in Claude Code to get the template.

### `/create-project`
Template for creating portfolio project showcases with consistent structure.

**Usage**: Type `/create-project` in Claude Code to get the template.

### `/review-content`
Checklist for reviewing content quality, ensuring it meets learning objectives.

**Usage**: Type `/review-content` in Claude Code to review a page.

## Adding New Commands

To add a new custom command:

1. Create a new `.md` file in `.claude/commands/`
2. Name it descriptively (e.g., `my-command.md`)
3. The file content becomes the command prompt
4. Use it with `/my-command` in Claude Code

## Settings

`settings.local.json` contains user-specific Claude Code settings that override defaults.

## Git

The `.claude/` directory is tracked in git to share custom commands and configuration across the team. Session data and cache are excluded via `.gitignore`.
