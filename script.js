/**
 * Play. Learn. Vote. - Technical GDD Scripts
 * Focus: A11y State Management, Stable Physics Simulation, Professional Micro-Interactions
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. Global View Navigation (Sidebar) with ARIA support & Focus Management
    // =========================================================================
    const navButtons = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetViewId = btn.getAttribute('data-view-target');

            // Reset states
            navButtons.forEach(b => {
                b.classList.remove('active');
                b.removeAttribute('aria-current'); // Fix 6: Removed invalid aria-current="false"
            });
            viewSections.forEach(v => v.classList.remove('active'));

            // Activate Target
            btn.classList.add('active');
            btn.setAttribute('aria-current', 'page');

            const targetView = document.getElementById(targetViewId);
            if (targetView) {
                targetView.classList.add('active');
                
                // Accessibility: Move focus to the new section's header
                const heading = targetView.querySelector('h2');
                if (heading) {
                    heading.setAttribute('tabindex', '-1');
                    heading.focus({ preventScroll: true });
                }
            }

            // Force D3.js dimension recalculation if map becomes visible
            if (targetViewId === 'network-view') {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (typeof initNetwork === 'function') initNetwork();
                    });
                });
            }

            // Reset scroll position for the new view
            const mainContent = document.getElementById('main-content');
            if (mainContent) mainContent.scrollTop = 0;

            // Close mobile menu if open
            closeMobileMenu();
        });
    });

    // =========================================================================
    // 2. Language Switcher (Functional State Management)
    // =========================================================================
    const langButtons = document.querySelectorAll('.lang-btn');
    
    // UI Dictionary for the app shell (Content files handle the rest)
    const uiDictionary = {
        en: { docs: "Documentation", arch: "Architecture", design: "Design Systems", pdf: "Save as PDF", menu: "Menu" },
        si: { docs: "ලේඛනගත කිරීම", arch: "ගෘහ නිර්මාණ ශිල්පය", design: "නිර්මාණ පද්ධති", pdf: "PDF ලෙස සුරකින්න", menu: "මෙනුව" },
        ta: { docs: "ஆவணங்கள்", arch: "கட்டிடக்கலை", design: "வடிவமைப்பு அமைப்புகள்", pdf: "PDF ஆக சேமிக்கவும்", menu: "பட்டியல்" }
    };

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedLang = btn.getAttribute('data-lang');

            // Update button states
            langButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            // Update document lang attribute to trigger CSS font swaps (Noto Sans Sinhala/Tamil)
            document.documentElement.lang = selectedLang;

            // Update UI Shell text
            const dict = uiDictionary[selectedLang];
            if (dict) {
                const docsLabel = document.getElementById('nav-docs-label');
                const archLabel = document.getElementById('nav-arch-label');
                const designLabel = document.getElementById('nav-design-label');
                const pdfBtnText = document.querySelector('.pdf-btn');
                const menuBtnText = document.querySelector('.mobile-menu-btn');

                if (docsLabel) docsLabel.textContent = dict.docs;
                if (archLabel) archLabel.textContent = dict.arch;
                if (designLabel) designLabel.textContent = dict.design;
                
                if (pdfBtnText) {
                    // Preserve SVG icon, update text
                    const svg = pdfBtnText.querySelector('svg');
                    pdfBtnText.innerHTML = '';
                    if (svg) pdfBtnText.appendChild(svg);
                    pdfBtnText.appendChild(document.createTextNode(' ' + dict.pdf));
                }

                if (menuBtnText) {
                    const svg = menuBtnText.querySelector('svg');
                    menuBtnText.innerHTML = '';
                    if (svg) menuBtnText.appendChild(svg);
                    menuBtnText.appendChild(document.createTextNode(' ' + dict.menu));
                }
            }
            
            // In a full build, this would also trigger the content.json fetch/re-render
            console.log(`Language switched to: ${selectedLang} - Event fired for gameState updater`);
        });
    });

    // =========================================================================
    // 3. Scoped Tab Navigation (Internal Sections) with keyboard support
    // =========================================================================
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => activateTab(btn));

        // Arrow key navigation between tabs (ARIA pattern)
        btn.addEventListener('keydown', (e) => {
            const tabsContainer = btn.closest('[role="tablist"]');
            if (!tabsContainer) return;
            const tabs = Array.from(tabsContainer.querySelectorAll('.tab-btn'));
            const idx = tabs.indexOf(btn);

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const next = tabs[(idx + 1) % tabs.length];
                next.focus();
                activateTab(next);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
                prev.focus();
                activateTab(prev);
            } else if (e.key === 'Home') {
                e.preventDefault();
                tabs[0].focus();
                activateTab(tabs[0]);
            } else if (e.key === 'End') {
                e.preventDefault();
                tabs[tabs.length - 1].focus();
                activateTab(tabs[tabs.length - 1]);
            }
        });
    });

    function activateTab(btn) {
        const targetId = btn.getAttribute('data-tab-target');
        const tabsContainer = btn.closest('[role="tablist"]');
        if (!tabsContainer) return;

        let contentContainer;
        const nextSib = tabsContainer.nextElementSibling;
        
        // Fix 4: Log nextSib to validate tab container resolution
        console.log('activateTab nextSib:', nextSib);
        
        if (nextSib && nextSib.classList.contains('tab-content-container')) {
            contentContainer = nextSib;
        } else {
            const parent = tabsContainer.parentElement;
            contentContainer = parent ? parent.querySelector('.tab-content-container') : null;
        }

        tabsContainer.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });

        if (contentContainer) {
            contentContainer.querySelectorAll('.sub-tab-content').forEach(panel => {
                panel.classList.remove('active');
            });
        }

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
    }

    // =========================================================================
    // 4. Interactive Logic Trees (Consequences)
    // =========================================================================
    const interactButtons = document.querySelectorAll('.btn-interact');

    interactButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const consequence = this.querySelector('.consequence');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            // Close siblings
            const siblings = this.closest('.choices').querySelectorAll('.btn-interact');
            siblings.forEach(sib => {
                if (sib !== this) {
                    sib.setAttribute('aria-expanded', 'false');
                    const sibCons = sib.querySelector('.consequence');
                    if (sibCons) sibCons.classList.remove('show');
                }
            });

            // Toggle current
            if (consequence) {
                if (isExpanded) {
                    this.setAttribute('aria-expanded', 'false');
                    consequence.classList.remove('show');
                } else {
                    this.setAttribute('aria-expanded', 'true');
                    consequence.classList.add('show');
                }
            }
        });
    });

    // =========================================================================
    // 5. D3.js Systems Network Map - Stabilized
    // =========================================================================

    const themeColors = {
        character: "#2563EB",  // Blue
        npc:       "#64748B",  // Slate 500
        location:  "#D97706",  // Amber
        scenario:  "#0F172A"   // Slate 900
    };

    const gameData = {
        nodes: [
            { id: "karunasena", shortName: "Karuna",   label: "Karunasena",          type: "character", role: "First-time voter (Curiosity)" },
            { id: "kamala",     shortName: "Kamala",   label: "Kamala",               type: "character", role: "School teacher (Network)" },
            { id: "kumaran",    shortName: "Kumaran",  label: "Kumaran",              type: "character", role: "Tamil migrant worker (Persistence)" },
            { id: "mahinda",    shortName: "Mahinda",  label: "Mahinda Bandara",      type: "npc", role: "Incumbent politician" },
            { id: "elderly",    shortName: "Soma",     label: "Aunty Soma",           type: "npc", role: "Voter with 1983 card" },
            { id: "nandadasa",  shortName: "Nanda",    label: "Nandadasa",            type: "npc", role: "Grama Sevaka" },
            { id: "shopkeeper", shortName: "Mudalali", label: "Mudalali Perera",      type: "npc", role: "Information hub" },
            { id: "sirisena",   shortName: "Sirisena", label: "Uncle Sirisena",       type: "npc", role: "Misinformation vector" },
            { id: "police",     shortName: "Sergeant", label: "Sgt. Wickramasinghe",  type: "npc", role: "Election law authority" },
            { id: "queue",      shortName: "Queue",    label: "Queue People",         type: "npc", role: "Election day metrics" },
            { id: "grama_office",   shortName: "Office",  label: "Grama Office",         type: "location", role: "Registration & Bureaucracy" },
            { id: "police_station", shortName: "Police",  label: "Police Station",        type: "location", role: "Law & Violations" },
            { id: "shop",           shortName: "Shop",    label: "Junction Shop",         type: "location", role: "Community Rumors" },
            { id: "unfixed_road",   shortName: "Road",    label: "Unfixed Road",          type: "location", role: "Systemic metaphor" },
            { id: "polling_station",shortName: "Polling", label: "Polling Station",       type: "location", role: "Election day venue" },
            { id: "campaign_tent",  shortName: "Tent",    label: "Campaign Tent",         type: "location", role: "Political promises" },
            { id: "ec_board",       shortName: "Board",   label: "EC Notice Board",       type: "location", role: "Verification authority" },
            { id: "registration",  shortName: "Reg.",     label: "Voter Registration", type: "scenario", role: "Week 1-4 Window" },
            { id: "misinformation", shortName: "Misinfo",  label: "Misinfo Eval",       type: "scenario", role: "4 Types to evaluate" },
            { id: "manifesto",     shortName: "Manifesto", label: "Manifesto Check",    type: "scenario", role: "Comparison mechanic" },
            { id: "election_day",  shortName: "Voting",    label: "Election Day",        type: "scenario", role: "Consequence resolution" }
        ],
        links: [
            { source: "karunasena", target: "sirisena",       type: "conflict"  },
            { source: "karunasena", target: "grama_office",   type: "location"  },
            { source: "kamala",     target: "shop",           type: "location"  },
            { source: "kamala",     target: "ec_board",       type: "trust"     },
            { source: "kumaran",    target: "grama_office",   type: "conflict"  },
            { source: "kumaran",    target: "police_station", type: "influence" },
            { source: "mahinda",    target: "unfixed_road",   type: "influence" },
            { source: "mahinda",    target: "campaign_tent",  type: "location"  },
            { source: "elderly",    target: "polling_station",type: "location"  },
            { source: "nandadasa",  target: "grama_office",   type: "location"  },
            { source: "nandadasa",  target: "registration",   type: "influence" },
            { source: "shopkeeper", target: "shop",           type: "location"  },
            { source: "sirisena",   target: "misinformation", type: "influence" },
            { source: "police",     target: "police_station", type: "location"  },
            { source: "queue",      target: "polling_station",type: "location"  },
            { source: "grama_office",   target: "registration",  type: "location"  },
            { source: "shop",           target: "misinformation", type: "location" },
            { source: "ec_board",       target: "misinformation", type: "trust"    },
            { source: "polling_station",target: "election_day",   type: "location" },
            { source: "campaign_tent",  target: "manifesto",      type: "location" }
        ]
    };

    gameData.nodes.forEach(n => { n.color = themeColors[n.type] || "#334155"; });

    const container = document.getElementById('network');
    
    // Fix 2: Wrap all D3 initialization inside an if block rather than a return statement
    if (container) {

        let rect   = container.getBoundingClientRect();
        let width  = rect.width  || 780;
        let height = rect.height || 520;
        let networkInitialized = false;

        const svg = d3.select('#network').append('svg')
            .style('width',  '100%')
            .style('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const simulation = d3.forceSimulation(gameData.nodes)
            .force('link',      d3.forceLink(gameData.links).id(d => d.id).distance(130))
            .force('charge',    d3.forceManyBody().strength(-620))
            .force('collision', d3.forceCollide().radius(52))
            .force('center',    d3.forceCenter(width / 2, height / 2))
            .alphaDecay(0.02);

        const g = svg.append('g');

        const zoomBehavior = d3.zoom()
            .extent([[0, 0], [2000, 2000]])
            .scaleExtent([0.25, 3])
            .on('zoom', (e) => g.attr('transform', e.transform));

        svg.call(zoomBehavior);

        const linkColorMap = {
            trust:     '#059669',  // Green
            conflict:  '#DC2626',  // Red
            influence: '#94A3B8',  // Slate
            location:  '#D97706'   // Amber
        };

        const links = g.selectAll('line')
            .data(gameData.links)
            .enter().append('line')
            .attr('class', d => `link line-${d.type}`)
            .attr('stroke-width', d => d.type === 'trust' ? 2.5 : d.type === 'location' ? 2 : 1.5)
            .attr('stroke', d => linkColorMap[d.type] || '#94A3B8')
            .attr('stroke-dasharray', d => d.type === 'conflict' ? '5,3' : null)
            .attr('stroke-opacity', 0.5);

        const nodes = g.selectAll('g.node')
            .data(gameData.nodes)
            .enter().append('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')
            .call(buildDrag(simulation));

        nodes.append('circle')
            .attr('r', d => d.type === 'character' ? 22 : d.type === 'scenario' ? 19 : 16)
            .attr('fill', d => d.color)
            .style('stroke', '#FFFFFF')
            .style('stroke-width', '2.5px')
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))')
            .style('transition', 'r 0.2s, stroke-width 0.2s');

        nodes.append('text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .text(d => d.shortName.charAt(0))
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', d => d.type === 'character' ? '11px' : '9px')
            .style('font-weight', '700')
            .style('fill', '#FFFFFF')
            .style('pointer-events', 'none')
            .style('user-select', 'none');

        nodes.append('text')
            .attr('dy', d => (d.type === 'character' ? 22 : d.type === 'scenario' ? 19 : 16) + 14)
            .attr('text-anchor', 'middle')
            .text(d => d.shortName)
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('fill', '#0F172A')
            .style('paint-order', 'stroke')
            .style('stroke', '#fff')
            .style('stroke-width', '3px')
            .style('pointer-events', 'none')
            .style('user-select', 'none');

        simulation.on('tick', () => {
            links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            nodes.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        function buildDrag(sim) {
            return d3.drag()
                .on('start', (e, d) => {
                    if (!e.active) sim.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
                .on('end',  (e, d) => {
                    if (!e.active) sim.alphaTarget(0);
                    d.fx = null; d.fy = null;
                });
        }

        nodes.on('click', (event, d) => {
            event.stopPropagation();

            nodes.select('circle')
                .style('stroke', '#FFFFFF')
                .style('stroke-width', '2.5px');
            nodes.style('opacity', 1);
            links.style('stroke-opacity', 0.4);

            d3.select(event.currentTarget).select('circle')
                .style('stroke', '#0F172A')
                .style('stroke-width', '4px');

            const connectedIds = new Set();
            connectedIds.add(d.id);
            gameData.links.forEach(l => {
                const srcId = typeof l.source === 'object' ? l.source.id : l.source;
                const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
                if (srcId === d.id || tgtId === d.id) {
                    connectedIds.add(srcId);
                    connectedIds.add(tgtId);
                }
            });

            nodes.style('opacity', n => connectedIds.has(n.id) ? 1 : 0.15);
            links.style('stroke-opacity', l => {
                const srcId = typeof l.source === 'object' ? l.source.id : l.source;
                const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
                return (srcId === d.id || tgtId === d.id) ? 0.9 : 0.05;
            });

            const panel = document.getElementById('selectedInfo');
            if (!panel) return;

            const conns = gameData.links
                .filter(l => {
                    const srcId = typeof l.source === 'object' ? l.source.id : l.source;
                    const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
                    return srcId === d.id || tgtId === d.id;
                })
                .map(l => {
                    const srcId = typeof l.source === 'object' ? l.source.id : l.source;
                    const peer  = srcId === d.id ? l.target : l.source;
                    const peerId = typeof peer === 'object' ? peer.id : peer;
                    const peerNode = gameData.nodes.find(n => n.id === peerId);
                    return { node: peerNode, type: l.type };
                })
                .filter(c => c.node);

            const typeColors = { trust: '#059669', conflict: '#DC2626', influence: '#94A3B8', location: '#D97706' };
            const typeLabels = { trust: 'Trust', conflict: 'Conflict', influence: 'Influence', location: 'Access' };

            // Basic HTML sanitizer for node injection
            const escapeHTML = str => String(str).replace(/[&<>'"]/g, 
                tag => ({
                    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
                }[tag])
            );

            const safeLabel = escapeHTML(d.label);
            const safeRole = escapeHTML(d.role);

            const connList = conns.length
                ? `<div style="margin-top:12px;border-top:1px solid var(--border-base);padding-top:10px;">
                    <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);font-weight:700;">Connections (${conns.length})</span>
                    <ul style="list-style:none;padding:0;margin-top:8px;display:flex;flex-direction:column;gap:4px;">
                        ${conns.map(c => `
                            <li style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;background:var(--bg-main);border:1px solid var(--border-base);border-radius:5px;font-size:12px;">
                                <span style="font-weight:600;color:var(--text-core);">${escapeHTML(c.node.label)}</span>
                                <span style="font-size:10px;font-weight:600;color:${typeColors[c.type] || '#94A3B8'};text-transform:uppercase;letter-spacing:0.05em;">${typeLabels[c.type] || c.type}</span>
                            </li>`).join('')}
                    </ul>
                   </div>`
                : '';

            const typeChip = `<span style="display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${themeColors[d.type]};background:${d.type === 'character' ? '#EFF6FF' : d.type === 'npc' ? '#F8FAFC' : d.type === 'location' ? '#FFFBEB' : '#F1F5F9'};padding:2px 8px;border-radius:100px;border:1px solid ${d.type === 'character' ? '#BFDBFE' : d.type === 'npc' ? '#E2E8F0' : d.type === 'location' ? '#FDE68A' : '#CBD5E1'};">${escapeHTML(d.type)}</span>`;

            panel.innerHTML = `
                <div style="padding:10px;background:var(--bg-main);border:1px solid var(--border-base);border-radius:8px;">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
                        <h4 style="font-size:14px;margin:0;color:var(--text-core);line-height:1.3;">${safeLabel}</h4>
                        ${typeChip}
                    </div>
                    <p style="margin:0;font-size:12px;color:var(--text-muted);line-height:1.5;">${safeRole}</p>
                    ${connList}
                </div>`;

            const infoTabBtn = document.querySelector('[data-tab-target="info-tab"]');
            if (infoTabBtn && !infoTabBtn.classList.contains('active')) {
                infoTabBtn.click();
            }
        });

        // UX Fix: Clicking background resets visual state AND switches sidebar back to Legend
        svg.on('click', () => {
            nodes.select('circle').style('stroke', '#FFFFFF').style('stroke-width', '2.5px');
            nodes.style('opacity', 1);
            links.style('stroke-opacity', 0.4);
            
            const panel = document.getElementById('selectedInfo');
            if (panel) {
                panel.innerHTML = `<p class="empty-state">Click on any node to view GDD details and system linkages.</p>`;
            }

            const legendTabBtn = document.querySelector('[data-tab-target="legend-tab"]');
            if (legendTabBtn && !legendTabBtn.classList.contains('active')) {
                legendTabBtn.click();
            }
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                const filter = btn.dataset.filter;
                const typeMap = {
                    characters: ['character', 'npc'],
                    locations:  ['location'],
                    scenarios:  ['scenario']
                };

                nodes.style('opacity', d =>
                    filter === 'all' || (typeMap[filter] && typeMap[filter].includes(d.type)) ? 1 : 0.06
                );
                links.style('stroke-opacity', 0.35);
                nodes.select('circle').style('stroke', '#FFFFFF').style('stroke-width', '2.5px');
            });
        });

        // Fix 5: Corrected zoom reset logic to not cancel itself out with d3.zoomIdentity
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
                if (allBtn) { allBtn.classList.add('active'); allBtn.setAttribute('aria-pressed', 'true'); }

                const panel = document.getElementById('selectedInfo');
                if (panel) panel.innerHTML = `<p class="empty-state">Click on any node to view GDD details and system linkages.</p>`;

                // Smooth transition back to true origin, then restart simulation to naturally center
                svg.transition()
                   .duration(750)
                   .call(zoomBehavior.transform, d3.zoomIdentity);
                   
                simulation.alpha(0.8).restart();
                nodes.style('opacity', 1).select('circle')
                    .style('stroke', '#FFFFFF')
                    .style('stroke-width', '2.5px');
                links.style('stroke-opacity', 0.5);
            });
        }

        // Logic Fix: Prevents D3 from initializing its physics engine while the container is hidden (width=0)
        // Ensure this logic resets position coordinates if triggering for the first time
        window.initNetwork = function() {
            if (!container) return;
            
            // Measure real width. If 0 (hidden), abort.
            const measuredRect = container.getBoundingClientRect();
            const measuredW = measuredRect.width  || 780;
            const measuredH = measuredRect.height || 580;

            if (measuredW < 10) return;

            width  = measuredW;
            height = measuredH;

            svg.attr('viewBox', `0 0 ${width} ${height}`);
            simulation.force('center', d3.forceCenter(width / 2, height / 2));

            if (!networkInitialized) {
                // Fix 1: Properly disperse nodes upon first render so they aren't stuck at (0,0)
                gameData.nodes.forEach(n => {
                    n.x = width / 2 + (Math.random() - 0.5) * 100;
                    n.y = height / 2 + (Math.random() - 0.5) * 100;
                    n.vx = 0;
                    n.vy = 0;
                });

                // Give layout engine a tiny delay to finish painting before starting physics
                setTimeout(() => {
                    simulation.alpha(1).restart();
                    networkInitialized = true;
                }, 50);
            } else {
                simulation.alpha(0.3).restart();
            }
        };

        // Call initNetwork on resize, but only if the map view is actually visible
        window.addEventListener('resize', () => {
            const networkView = document.getElementById('network-view');
            if (networkView && networkView.classList.contains('active')) {
                initNetwork();
            }
        });

        // Check if network is visible on initial load
        setTimeout(() => {
            const networkView = document.getElementById('network-view');
            if (networkView && networkView.classList.contains('active')) {
                initNetwork();
            }
        }, 200);

    } // END OF D3 if(container) BLOCK

    // =========================================================================
    // 6. Mobile Navigation Menu
    // =========================================================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navSection    = document.getElementById('navSection');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function closeMobileMenu() {
        if (!navSection) return;
        navSection.classList.remove('open');
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('visible');
            setTimeout(() => { sidebarOverlay.style.display = 'none'; }, 200);
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = navSection && navSection.classList.contains('open');
            if (isOpen) {
                closeMobileMenu();
            } else {
                if (navSection) navSection.classList.add('open');
                mobileMenuBtn.setAttribute('aria-expanded', 'true');
                if (sidebarOverlay) {
                    sidebarOverlay.style.display = 'block';
                    requestAnimationFrame(() => sidebarOverlay.classList.add('visible'));
                }
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }

    // =========================================================================
    // 7. Back-to-Top Button
    // =========================================================================
    const mainContent = document.getElementById('main-content');
    const backToTop   = document.getElementById('backToTop');

    if (mainContent && backToTop) {
        mainContent.addEventListener('scroll', () => {
            if (mainContent.scrollTop > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }, { passive: true });

        backToTop.addEventListener('click', () => {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // =========================================================================
    // 8. PDF / Print Export (Cleaned up dead code)
    // =========================================================================
    const pdfBtn = document.getElementById('pdfExportBtn');

    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            // CSS @media print handles displaying all hidden sections automatically
            window.print();
        });
    }

});
