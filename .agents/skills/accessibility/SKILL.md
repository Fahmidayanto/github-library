---
name: accessibility
description: Design, implement, and audit inclusive digital products using WCAG 2.2 Level AA standards for Web, iOS, and Android.
---

# Accessibility

Design, implement, and audit inclusive digital products using WCAG 2.2 Level AA standards. Use this skill to generate semantic ARIA for Web and accessibility traits for Web and Native platforms (iOS/Android).

## Scope

This skill covers accessibility for:
- **Web** — semantic HTML, ARIA attributes, keyboard navigation, focus management, screen reader support, color contrast, and WCAG 2.2 Level AA compliance.
- **iOS (SwiftUI/UIKit)** — accessibility traits, labels, hints, dynamic type, and VoiceOver support.
- **Android (Jetpack Compose/Views)** — content descriptions, semantics, TalkBack support, and touch target sizing.

## Core Principles

1. **Semantics first** — use native semantic elements before adding ARIA. Native elements carry built-in roles, states, and keyboard behavior.
2. **Don't override native behavior** — only add ARIA when a native element cannot express the needed semantics.
3. **Keyboard operable** — every interactive element must be reachable and operable via keyboard.
4. **Visible focus** — focus indicators must be clearly visible.
5. **Contrast** — text and UI components must meet WCAG 2.2 AA contrast ratios (4.5:1 for normal text, 3:1 for large text and UI components).
6. **Reduced motion** — respect `prefers-reduced-motion` and provide non-animated alternatives.

## Web (HTML/ARIA)

### Semantic Landmarks
- Use `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<section>`, `<article>` for structure.
- Use exactly one `<main>` per page.
- Use `<h1>`–`<h6>` in a logical, non-skipping hierarchy.

### ARIA Usage Rules
- **First rule of ARIA**: if you can use a native HTML element with the semantics you need, use it.
- Use `role` only when no native element exists.
- Never remove focusability from interactive elements.
- Use `aria-label` only when there is no visible text label.
- Use `aria-describedby` to associate descriptions.
- Use `aria-live` for dynamic content updates (polite for non-critical, assertive for critical).

### Forms
- Every input must have an associated `<label>`.
- Use `aria-invalid` and `aria-describedby` for validation errors.
- Group related controls with `<fieldset>` and `<legend>`.
- Provide clear error messages that are announced to screen readers.

### Keyboard Navigation
- Ensure all interactive elements are focusable via Tab.
- Implement arrow-key navigation for composite widgets (menus, tabs, grids).
- Provide visible focus styles (`:focus-visible`).
- Avoid keyboard traps — users must be able to Tab out of any component.

### Focus Management
- Manage focus for modals, dialogs, and single-page transitions.
- Trap focus within open modals.
- Return focus to the triggering element when a modal closes.

### Color & Contrast
- Normal text: 4.5:1 minimum contrast ratio.
- Large text (18pt/24px or 14pt bold/18.66px): 3:1 minimum.
- UI components and graphical objects: 3:1 minimum.
- Never rely on color alone to convey information — pair with text, icons, or patterns.

### Motion
- Respect `prefers-reduced-motion`.
- Provide alternatives for content that relies on motion.
- Avoid flashing content more than 3 times per second (WCAG 2.3.1).

## iOS (SwiftUI / UIKit)

### SwiftUI
- Use `.accessibilityLabel(_:)` to provide a label.
- Use `.accessibilityValue(_:)` for dynamic values.
- Use `.accessibilityHint(_:)` for hints.
- Use `.accessibilityElement(children: .combine)` to combine child elements.
- Use `.accessibilityAddTraits(_:)` for traits like `.isButton`, `.isHeader`, `.isSelected`.
- Support Dynamic Type by using system fonts and scalable text styles.
- Respect `@Environment(\.accessibilityReduceMotion)`.

### UIKit
- Set `accessibilityLabel`, `accessibilityValue`, `accessibilityHint`, `accessibilityTraits`.
- Use `isAccessibilityElement` appropriately.
- Support Dynamic Type with `UIFontMetrics` and scalable fonts.

## Android (Compose / Views)

### Jetpack Compose
- Use `Modifier.semantics { contentDescription = "..." }`.
- Use `Modifier.semantics { role = Role.Button }`.
- Use `Modifier.clearAndSetSemantics {}` to combine children.
- Use `Modifier.testTagsAsResourceId()` for testing.
- Support font scaling with `sp` units.
- Respect `LocalAccessibilityManager` for reduced motion.

### Views
- Set `android:contentDescription`.
- Use `android:importantForAccessibility`.
- Ensure touch targets are at least 48dp.
- Support font scaling with `sp` units.

## Audit Checklist

- [ ] All interactive elements are keyboard operable.
- [ ] Visible focus indicators present.
- [ ] All images have appropriate alt text or are marked decorative.
- [ ] Form inputs have associated labels.
- [ ] Color contrast meets WCAG 2.2 AA.
- [ ] No reliance on color alone.
- [ ] `prefers-reduced-motion` respected.
- [ ] Screen reader announces dynamic content appropriately.
- [ ] Touch targets meet minimum size (Android 48dp, iOS 44pt).
- [ ] Text scales without breaking layout.
