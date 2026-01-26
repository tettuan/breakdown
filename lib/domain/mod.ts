/**
 * @fileoverview Domain Module - Unified exports for all domain components
 *
 * This module provides centralized exports for all domain components
 * following Domain-Driven Design principles. It organizes domain components
 * into clear layers and boundaries.
 *
 * @module domain
 */

// Core Domain - The most important business logic
export * from "./core/mod.ts";

// Error Domain - Unified error handling across the domain
export * from "./errors/mod.ts";
