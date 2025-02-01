# auronia
Development instruction language tool for automated AI development using TypeScript and JSON.

> **Note**: This project is experimental and not yet in a fully functional state.


## Overview

Auronia is a library that converts Markdown documents to JSON format using TypeScript and Deno with AI composer, making them easily interpretable by AI systems.

When executed, it transforms development requirements written in Markdown into structured JSON that can serve as development instructions for AI.

Through learning the Auronia syntax, AI systems can interpret these JSON structures to understand development requirements and specifications.

The library is designed to work with AI development agents like Cursor and VSCode's Cline. The design is specifically optimized for Cursor and Cline as these are the primary tools used by the author. While the underlying AI model is based on Claude-3.5-sonnet, the syntax and structure are designed to be easily interpretable by other AI models as well.

## Key Features

- Markdown to JSON conversion optimized for AI interpretation
- TypeScript implementation with Deno runtime
- Structured format for automated AI development
- Learning-friendly syntax for AI systems
- Optimized for Cursor and Cline AI development agents
- Compatible with Claude-3.5-sonnet and other AI models

## Purpose

The goal is to bridge the gap between human-written specifications and AI-interpretable instructions by providing a standardized way to express development requirements that both humans and AI can work with effectively.

## Processing Overview

This library does not generate documentation based on rules by itself. Instead, it assists AI in generating documentation by providing a structured format that AI can easily interpret and work with.

## Future Prospects

This tool itself does not generate anything - it only optimizes for interpretation. As AI development progresses, some components may be integrated into IDEs, and the role of programming languages is likely to evolve.

Within this outlook, we aim to consistently build systems and release applications through natural language interaction with AI. The goal is to establish a workflow where development can be driven primarily through natural language specifications that both humans and AI can understand.

