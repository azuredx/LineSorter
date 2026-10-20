# Line Sorter Helper

A client-side JavaScript mod for Mindustry build 160 and newer. It changes the local player's conveyor build plans while dragging a line. It does not add blocks or change existing world tiles.

## What it does

With a normal or titanium conveyor selected, straight lines follow a repeating pattern:

`conveyor → inverted sorter → inverted sorter`

On a turn, the mod uses a regular sorter only if the preceding tile is a conveyor. Consecutive turns alternate between a regular sorter and a conveyor. Any run of three sorters is broken by a conveyor. Mindustry's bridge and junction substitutions are preserved.

The pattern starts over for each new line. It is visible while dragging and applied to the build queue after release.

## Controls

- Click the small **sort on / sort off** button on the left side of the HUD, or press **F8**. The setting is saved.
- Hold **Ctrl** while dragging diagonally to make a stepped line with turns.

## Install

Once the [GitHub repository](https://github.com/azuredx/LineSorter) appears in Mindustry's Mod Browser, install it there. To test it earlier, use **Mods → Import Mod → Import From GitHub** and enter `azuredx/LineSorter`, or import a ZIP containing this repository's files. Restart Mindustry when prompted.

The mod works on the local player's plans and still requires the usual block unlocks, resources, and building permissions. Script support is required on the device.

## Publish in Mindustry's Mod Browser

1. Use the public [azuredx/LineSorter](https://github.com/azuredx/LineSorter) repository. Put `mod.hjson`, `icon.png`, and `scripts/main.js` at the paths shown here, with `mod.hjson` at the repository root.
2. In GitHub's **About → Topics** section, add the exact topic **`mindustry-mod`**. Do not use a versioned topic instead.
3. Push the files to the repository's default branch. For this JavaScript mod, a GitHub release is optional: the browser uses the latest default-branch commit unless a game-version-specific release applies.
4. Wait for the [MindustryMods index](https://github.com/Anuken/MindustryMods) to refresh (normally within a few hours), then find **Line Sorter Helper** in the in-game Mod Browser.
5. For later updates, increase the three-part `version` in `mod.hjson` and push the new files. The game uses that version to detect updates.

`minGameVersion: 160` declares the supported game build. `hidden: true` marks this script-only mod as multiplayer-compatible; it does **not** hide it from the Mod Browser. `hideBrowser: true` would hide it and is intentionally absent.

The browser listing itself is automatic. Do not submit a pull request to the MindustryMods index to add this mod.
