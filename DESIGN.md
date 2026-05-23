# Design

## Visual Style

The app uses a restrained developer-utility workbench style. The default experience is dark, compact, and precise, with tinted neutrals, one cool accent, and semantic colors reserved for diff state.

## Color

Use OKLCH tokens. Avoid pure black and white; neutrals are slightly blue-tinted. The primary accent is a clear cyan-blue used for focus, active navigation, and selected controls. Added, removed, and changed states use green, red, and amber with subdued background tints.

## Typography

Use the system UI stack for interface text and a native monospace stack for JSON, paths, counters, and compact controls. Product UI hierarchy should be modest: compact labels, medium-weight section titles, and stable editor line height.

## Layout

The primary surface is a focused two-pane workbench. A compact sticky command bar sits above two equal JSON panes. Controls should wrap without overlapping, and the panes should remain the dominant visual element on desktop.

## Components

Panels use small radii, subtle borders, and minimal shadow. Buttons are utilitarian with clear hover, focus, disabled, and active states. Theme selection is secondary and should not compete with diff navigation. JSON panes include labels, local toolbars, status badges, and in-surface empty placeholders.

## Motion

Use short 150-200 ms transitions for color, border, background, and transform feedback only. Avoid decorative choreography and layout animation.

## Responsive Behavior

Desktop is the primary target. At narrower widths, panes stack vertically, the swap action rotates, and the command bar wraps. Text must remain readable and controls must not overlap.
