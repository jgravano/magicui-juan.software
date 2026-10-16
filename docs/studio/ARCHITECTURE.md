# Studio

`studio.juan.software` serves the authenticated workspace. `/studio` and every nested Studio route return 404 on all other production hosts. Local development still allows localhost. GitHub identity 100961009 is the only authorized owner. The private canvas and library API both verify the signed, HttpOnly session independently.

## Workflow

- The library contains notebook projects, each with an independent draft and immutable named versions.
- Editing autosaves the draft after inactivity. A local recovery copy survives interrupted writes. The editor reports whether a save reached the server. Writes rebase onto the latest library; when drafts diverge, the other draft is preserved as a version before saving. Request IDs deduplicate retried operations.
- A version is a checkpoint of design settings (materials, dimensions, print and lighting), with a small rendered thumbnail. Physical pose and handwritten strokes are not part of the design snapshot. Handwriting is disabled in managed Studio mode.
- Previewing a saved version does not replace the draft. Restore copies the version into the draft; an uncheckpointed draft is first preserved as “Antes de restaurar”.
- Publishing chooses an immutable version for `/001`, with an explicit preview dialog naming the replacement. It does not publish the moving draft. Older versions can be republished.
- New projects are notebook explorations based on the current public design. At this stage there is one publication slot, `/001`; they do not automatically create home items or new numbered routes.

## Files and boundaries

- `src/components/studio/StudioWorkspace.tsx`: library, workspace, recovery, version history and publish interaction.
- `src/lib/studio/library.ts`: pure state transitions and input validation; no access to storage.
- `src/lib/studio/storage.ts`: private Blob store, consistent reads and ETag conditional writes. Reads explicitly request identity encoding: compressed Blob responses carry weak ETags that would reject every conditional overwrite. Locally, development uses ignored `.studio-data/library.json` with serialized atomic writes. Production never falls back to ephemeral filesystem persistence.
- `/studio/api/library`: authenticated reads, authenticated same-origin writes, revision checking for legacy clients, automatic conflict recovery for current clients and explicit failure responses.
- `/api/experiments/001`: only the published encoded preset, never drafts or library metadata. Server cache is invalidated after publication; on storage outage, the built-in original remains available.
- `public/cuaderno-object/notebook.js`: physics and rendering remain imperative. An origin/source-checked postMessage bridge transfers only design snapshots between the shell and authenticated iframe. Existing standalone public preset links still work.

## Deployment

The Vercel project is connected to private Blob store `juan-studio` (`store_xCNkqaA3OoLsDnjW`, IAD1). `BLOB_STORE_ID` and Vercel OIDC provide server credentials; no storage tokens are sent to browsers. Hobby storage limits apply. The index is bounded to 3 MB, 24 projects and 100 checkpoints per project. This is a small personal library, not a multi-tenant CMS.

## Verification

`node --test tests/studio-*.test.mjs tests/notebook-share.test.mjs tests/notebook-interactions.test.mjs`

Tests cover publication isolation, restoration backups, independent projects, invalid presets, concurrent initial and subsequent writes, owner-only access and cross-origin rejection. The production build checks TypeScript. Browser QA covers editing, saving, preview, restoring, publishing locally, creating a project and reloading it, plus desktop/iPad portrait/iPad landscape/mobile layouts. Actual iPad touch hardware remains a separate check.

## Product design tools

The inspector selects one component at a time. The format is in millimetres (50 mm per scene unit); paper physics, covers, paper block, binding and elastic adapt to its dimensions. The perforation layout is shared by the paper textures, paper block, covers and binding. Manual inset changes the binding width to keep the cover crossing aligned. Close hole spacing is flagged as a design warning, not manufacturing validation.

`design-tools.js` owns format presets, locked-ratio resizing, hole layout and the generated editable design prompt. Dimension overlays and front view are workspace tools, never public UI or stored design changes. The prompt uses current configuration and can be edited/copied locally; no generation service is contacted.

Preset v2 appends the design fields; v1 links and stored versions still decode with default dimensions. Existing published state is not rewritten by deploying the editor. New settings participate in drafts, versions, preview, share links and explicit publication.

Tasks are tracked in GitHub Issues; see [BACKLOG.md](BACKLOG.md). Manufacturing specifications and supplier management are deferred in #9. Further design work is listed in #10.
