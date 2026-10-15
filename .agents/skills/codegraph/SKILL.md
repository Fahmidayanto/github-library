---
name: codegraph
description: Codebase structural extraction, tree-sitter AST symbol indexing, relationship mapping, and graph-based retrieval for code analysis.
---

# CodeGraph Skill

Use CodeGraph to analyze codebase structure, navigate dependencies, extract symbols, and build structural graphs across source files.

## Features & Capabilities
1. **Tree-Sitter Parsing**: Extract functions, classes, interfaces, types, imports, and exports per file.
2. **Symbol Relationship Mapping**: Map callers, callees, inheritance, imports, and module dependencies.
3. **Graph Retrieval & Search**: Perform graph-based code queries to locate exact definitions and dependent components.
4. **Multi-Language Support**: Extract structures across Python, TypeScript, JavaScript, Rust, Go, Java, C++, and SQL.

## Usage Guidelines
- When analyzing codebase architecture, construct or query symbol dependency graphs first.
- Trace upstream data providers and downstream call sites before refactoring or modifying signatures.
- Prefer precise AST symbol references over brute-force text grepping for complex structural questions.
