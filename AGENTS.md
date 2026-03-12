# Survivor 50 Tracker - Agent Instructions

Welcome to the Survivor 50 Tracker project! When working on this repository, please adhere to the following guidelines, design systems, and business logic to ensure consistency and a premium user experience.

## 1. Design System & Aesthetics
*   **Theme**: `Deep Jungle Dark Mode`. The app is designed to have a premium, tribal, and highly immersive feel.
*   **Card Styles**: Implement a `glassmorphism` effect on contestant cards (semi-transparent backgrounds with background blur and subtle borders).
*   **Typography**: Use a high-impact serif font for the main headings to feel cinematic, and a clean, legible sans-serif for body text and data points.
*   **Mobile Responsiveness**: On mobile devices, ensure the layout shifts cleanly to a single-column view with large, easily tappable buttons for all interactive elements.

## 2. Component Guidelines
*   **Contestant List**: Rendered as a responsive grid.
*   **Contestant Cards**: Each card must display badges for the player's `"Original Season"` and `"Total Days Played"`. Also, ensure specific visual distinctions and tags for "Medically Evacuated" players.
*   **Specific Name Overrides**: Ensure Benjamin "Coach" Wade is displayed simply as "Coach" on his player tile.
*   **Filtering**: Utilize the `Era Filter Bar` for sorting and isolating contestants by their respective Survivor eras.

## 3. Interactive Features
*   **Hype Meter**: Players have a "Hype Meter" feature. The state of this meter MUST be persisted using `localStorage` so user selections are not lost on refresh.
*   **Countdown Timer**: Maintain the countdown timer component located in the hero section.

## 4. Game Mechanics & Logic
Survivor 50 features complex custom mechanics that need to be parsed and displayed accurately:
*   **Multi-player Adventures**: Adventures can have varying outcomes depending on player choices. The tracking logic must account for branching results rather than simple pass/fail states.
*   **Billie Eilish Boomerang Idol**: This specific advantage has unique "gifting" and "return" mechanics. When updating advantage states, ensure the logic handles the idol returning to a previous owner under specific conditions.

## 5. Development Workflow
*   **Framework**: Built with Vite and React.
*   Always test components for visual consistency against the "Deep Jungle" theme.
*   When editing data structures (like adding new metadata fields to the contestants), ensure backward compatibility with local storage or provide a migration path.
