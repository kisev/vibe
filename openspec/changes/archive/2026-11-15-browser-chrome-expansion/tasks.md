# Tasks

- [x] 1. A command grows/shrinks the chrome webview to fit the blocked list and resizes the page below it.
  - `browser_set_chrome_expanded` stores the per-session flag and re-applies the bounds through `child_bounds(size, scale, expanded)`; `BLOCKED_LIST_H = 200.0` (logical) is the growth.
- [x] 2. The chrome renders the blocked list in the expanded region; the shield toggles it; Allow keeps working and collapses the list.
  - The Radix `Popover` is replaced by an in-chrome `role="region"` of `BLOCKED_LIST_HEIGHT`; the shield sets `aria-expanded` and calls the command; Allow collapses, and an effect collapses when the list empties, the policy becomes `trusted-site`, or the chrome unmounts/closes.
- [x] 3. The policy is cached and updated by the settings command; the resource filter is always installed and consults the cache, so open windows follow the change.
  - `browser_policy::POLICY` (`RwLock`) is seeded by `seed_policy` in setup and replaced by `save_policy`, which also emits `browser-policy`; `blocks_resource` and navigation gating read the cache; `install_resource_interceptor` is unconditional on Windows.
- [x] 4. Page bounds are applied after creation and on a scale-factor change, not only on resize.
  - `build_session_window` calls `resize_children` from the window's physical `inner_size`, and `WindowEvent::ScaleFactorChanged` now resizes too.
- [x] 5. Tests: expansion math, open-window policy change, initial bounds.
  - Rust: `initial_and_expanded_bounds_are_physical`, `expansion_adds_the_blocked_list_height_and_shrinks_the_page`, `bounds_never_overflow_a_window_shorter_than_the_chrome`, `cached_policy_decides_resource_requests_without_the_store`. TS: region toggle, Allow collapse, live trusted-site hide, empty-list hide.
