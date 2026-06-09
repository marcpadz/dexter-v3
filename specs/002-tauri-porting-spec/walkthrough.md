# Walkthrough: Porting Ask Dexter to macOS Native (Tauri)

We have successfully created the comprehensive **Technical Specification Document** for porting the **Ask Dexter** web application into a local-first, offline-capable macOS-native desktop application using Tauri.

## Changes Made
1. **Repository Research & Analysis**:
   - Analyzed architecture from open-source references: `janhq/jan`, `pewdiepie-archdaemon/odysseus`, `openyak/openyak`, and `rowboatlabs/rowboat`.
   - Identified and documented UI anti-patterns, feature gaps, and hardware detection mechanisms.
2. **Technical Specifications & ADRs**:
   - Prepared seven Architecture Decision Records (ADRs) covering frontend framework, vector database, knowledge graphs, embedded browsers, conflict-free sync, offline entitlements, and the Pi SDK.
3. **Data & Component Diagrams**:
   - Created an ASCII Entity-Relationship Diagram (ERD) detailing relational, vector, and graph databases.
   - Built a component layout showing Tauri-to-WKWebView IPC message routing and workspace controls.
4. **Risk & Roadmap planning**:
   - Authored risk mitigations (security sandboxing, VRAM limits, memory leaks) and drafted a 90-day execution plan.

## Approved Specification File
- [technical_specification.md](file:///Volumes/Marc's SSD/Dev/2026/v2/specs/002-tauri-porting-spec/technical_specification.md)

All deliverables have been approved.
