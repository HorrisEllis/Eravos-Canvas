# ERAVOS — the Start as screens (SS0, 2026-11-20). A preview first; today's Start stays until he says yes.
# his words (2026-11-20, verbatim):
#   "i want a workshop domain in the start maybe? can we make a new start screen?
#    like maybe:
#    the list of domains. i want the same sort of theme. I want it animated like the current one is but i dont want it crowded with starts unless
#    you actually select a domain first. So like domain screen first, then animated transition into the next screen, which would be the tool
#    selection screen, which needs to be organized better.
#    with a open catalog button on the top, open mutation lab.
#    maybe like a starts screen for setups for any genre we can, music in relation to some of the most popular as a demo for each genre. then any
#    tool selected from the domains populates the catagories. animated transitions between screens completely dynamically changes fluidly through
#    the screens. like beautiful transitions. I want the beautiful art like the thumbnails."
#
# identity: the Start, as a sequence of screens (tools/core/start/: window.StartScreen) — domain-free core: every word, picture and list comes from
#   the catalog (domains, tools, categories, thumbnails), the recipes (setups and their paintings) and FieldBoard (tools that explode).
# theme: today's Start, kept — the dark panel, ERAVOS in its gradient, the paintings (animated SVGs: twinkle, flow, pulse), dashed card edges.
# the screens:
#   S1 DOMAINS   only the domains (each its painting) + WORKSHOP (a domain of its own: a new painting) + Empty canvas. Nothing else: no setups, no
#                tools, until a domain is chosen ("not crowded").
#   S2 A DOMAIN  its painting as a banner; START WITH A GENRE — the setups of this domain (each its painting: a demo per genre, as many as exist);
#                TOOLS — the domain's categories (a rail, with counts) and the chosen category's tools (each its thumbnail); a tool clicked is
#                installed if needed and put on the canvas; a setup clicked builds it (Recipes.run, as today).
#   S3 WORKSHOP  the Field (a tool exploded: every tool with a board), the Workshop (where it opens from), the Mutation Lab.
#   S4 MUTATION LAB  what it does and where it stands (shown as a preview; lands on his yes, CG4b) — the tools and the parts each is made of.
#   always on top: ERAVOS · the path (ERAVOS › MUSIC PRODUCTION › …) · ⧉ OPEN CATALOG (today's catalog, AddMenu) · ⚄ MUTATION LAB · ✕
# motion (FieldMotion, shared): screen to screen nothing jumps — the chosen card's painting grows into the next screen's banner while the others
#   fall away, then the new screen's content cascades in; back reverses it; a category change flows the cards out and the new ones in.
#   Reduced motion → at once.
# phases: SS0 this spec · SS1 the preview, built in core, opened by hand (StartScreen.open()), filmed · SS2 on his yes: the Start button opens it
#   (today's bootScreen kept as a fallback until then) · SS3 genre demos for every genre the songbooks have (a setup per genre, its painting)
# open: whether "any tool selected from the domains populates the catagories" means picking tools to build a canvas (a basket) — asked.
