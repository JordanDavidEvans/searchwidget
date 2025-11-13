# Duda Search Widget

This repository contains the source assets for a custom Duda search widget. The widget renders a responsive search bar that filters a developer-defined list of destinations in real-time.

## Files

| File | Description |
| --- | --- |
| `widget.html` | Widget markup and data bindings for content and design editor values. |
| `widget.js` | Client-side filtering logic for the search bar. |
| `widget.scss` | Base styles and shared layout tokens for the widget. |
| `desktop-tablet.scss` | Responsive refinements for tablet and desktop breakpoints (≥768px). |
| `mobile.scss` | Responsive refinements for handheld breakpoints (≤767px). |

## Content Editor Configuration

Create the following content editor fields so the widget can bind dynamic text and list data:

1. **Search Text Group** (single fields)
   - `searchLabel` (Text): Label that sits above the input. Example: `Search the knowledge base`.
   - `searchPlaceholder` (Text): Placeholder text shown in the input. Example: `Search by title, topic, or slug`.
   - `searchHint` (Rich Text or Text): Assistive hint displayed below the input. Example: `Results update as you type.`
   - `noResultsText` (Text): Message displayed when no matches are found. Example: `No matching pages yet. Try another keyword.`

2. **Result List**
   - List variable name: `pageList` (List)
   - Item fields for each entry:
     - `titleName` (Text): The title rendered for the result link.
     - `descText` (Text): Supporting description text displayed under the title.
     - `linkDest` (URL / Internal Page Selector): Destination slug or full URL. This value becomes the link target.

Populate at least one list item to ensure the widget renders meaningful defaults when JavaScript is unavailable.

## Design Editor Configuration

Expose the following design settings so site builders can match branding requirements:

- `backgroundColor` (Color Picker): Applies to the widget container background.
- `textColor` (Color Picker): Sets the default text color for labels, descriptions, and the empty state message.
- `accentColor` (Color Picker): Used for focus rings and hover states on search results.
- `borderRadius` (Slider / Numeric Input): Controls the rounding applied to the container and result cards (measured in pixels).

Make sure the design settings inject their values into the widget scope as CSS custom properties, matching the names used in `widget.html`.

## Behavior Overview

- The widget loads the configured `pageList` items and filters them as the user types.
- Title, description, and slug fields are searched to maximize discoverability.
- The "No results" message is announced via `aria-live` for accessibility and is only shown when no matches are available.
- Base styling is defined in `widget.scss`, while `desktop-tablet.scss` and `mobile.scss` layer breakpoint-specific adjustments.

## Development Notes

- SCSS files assume the Duda pipeline will compile them to CSS. Maintain the import order in `widget.scss` if you add more partials.
- JavaScript avoids framework dependencies and uses the Duda widget API (`widget.on('ready', ...)`) for initialization.
- When adjusting markup or styles, keep accessibility attributes (labels, hints, and live regions) intact.
