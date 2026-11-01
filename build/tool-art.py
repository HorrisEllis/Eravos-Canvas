# ERAVOS tool card paintings (3.88): one small animated SVG scene per tool, 240 × 150 (16:10, the ＋ Add card and the tool page).
# Asked: "make more artwork like this. for each thumbnail". python3 build/tool-art.py <tools.json: [{id,label,accent}]> <out dir>
# Each tool: a sky (its kind of time), Bob Ross mountains, water when it suits, and a landmark for what it does (MOTIF), lit in its accent.
# A new tool without a MOTIF entry gets fireflies at night. Copy each <id>.svg to its folder as art.svg and add "art": "art.svg" to tool.json files.
import random, math, os, json, sys, hashlib
W, H = 240, 150
STYLE = ('<style>.tw{animation:tw 3.2s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}'
 '.pu{animation:pu 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.sh{animation:sh 2.6s ease-in-out infinite alternate}'
 '.rise{animation:rise 2.6s ease-in infinite}.sw{animation:sw 8s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}'
 '.fl{animation:fl 9s linear infinite}.dr{animation:dr 14s ease-in-out infinite alternate}.spin{animation:spin 30s linear infinite;transform-box:fill-box;transform-origin:center}'
 '@keyframes tw{from{opacity:.25;transform:scale(.7)}to{opacity:1;transform:scale(1.15)}}@keyframes pu{0%,100%{opacity:.18;transform:scale(.85)}50%{opacity:.8;transform:scale(1.12)}}'
 '@keyframes sh{from{opacity:.25}to{opacity:.95}}@keyframes rise{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-30px)}}'
 '@keyframes sw{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}@keyframes fl{to{stroke-dashoffset:-300}}@keyframes dr{from{transform:translateX(-6px)}to{transform:translateX(6px)}}'
 '@keyframes spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>')
def hx(c): c=c.lstrip('#'); return [int(c[i:i+2],16) for i in (0,2,4)]
def mix(a,b,t): A,B=hx(a),hx(b); return '#'+''.join('%02x'%round(A[i]+(B[i]-A[i])*t) for i in range(3))
SKIES = {
 'night':  ['#050818', '#141a48', '#2c2a6a'],
 'dusk':   ['#120a35', '#4a1f6e', '#c4547e'],
 'sunset': ['#1b1446', '#b44b8c', '#ffb36b'],
 'dawn':   ['#1a1450', '#7a3f9a', '#ff9a8a'],
 'aurora': ['#030a14', '#0f2a3a', '#1f4a52'],
 'violet': ['#0d0828', '#3a2470', '#9a6ac0'],
}
def sky(id, kind, acc):
    a,b,c = SKIES[kind]; b = mix(b, acc, .18)
    return f'<linearGradient id="{id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{a}"/><stop offset=".62" stop-color="{b}"/><stop offset="1" stop-color="{c}"/></linearGradient>'
def stars(rng, n, y1, col='#eef3ff'):
    return ''.join(f'<circle class="tw" style="animation-delay:-{rng.uniform(0,4):.1f}s" cx="{rng.uniform(3,W-3):.1f}" cy="{rng.uniform(3,y1):.1f}" r="{rng.uniform(.35,1.2):.2f}" fill="{col}"/>' for _ in range(n))
def spark(x,y,s,col='#fff3c4',d=1):
    p=f'M{x} {y-s}Q{x+s*.18} {y-s*.18} {x+s} {y}Q{x+s*.18} {y+s*.18} {x} {y+s}Q{x-s*.18} {y+s*.18} {x-s} {y}Q{x-s*.18} {y-s*.18} {x} {y-s}Z'
    return f'<g class="tw" style="animation-delay:-{d}s"><circle cx="{x}" cy="{y}" r="{s*1.5}" fill="{col}" opacity=".18"/><path d="{p}" fill="{col}"/></g>'
def ridge(rng, base, amp, col, n=7, snow=None):
    xs=sorted([0,W]+[rng.uniform(10,W-10) for _ in range(n)]); pts=[]; peaks=[]
    for i,x in enumerate(xs):
        y=base-(amp*rng.uniform(.45,1) if i%2 else amp*rng.uniform(0,.3)); pts.append((x,y))
        if i%2: peaks.append((x,y))
    o=f'<path d="M0 {H}L'+'L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)+f'L{W} {H}Z" fill="{col}"/><polyline points="'+' '.join(f'{x:.1f},{y:.1f}' for x,y in pts)+'" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width=".8"/>'
    if snow:
        for x,y in peaks:
            if y<base-amp*.6: o+=f'<path d="M{x:.1f} {y:.1f}l5 4.2-2.8-.8-2.2 2.6-2.4-2.8-2.8.8Z" fill="{snow}" opacity=".85"/>'
    return o
def pine(x,y,s,col): return f'<path d="M{x} {y}l{-s*.55:.1f} {s*.9:.1f}h{s*.3:.1f}l{-s*.35:.1f} {s*.6:.1f}h{s*.3:.1f}l{-s*.4:.1f} {s*.6:.1f}h{s*1.4:.1f}l{-s*.4:.1f} {-s*.6:.1f}h{s*.3:.1f}l{-s*.35:.1f} {-s*.6:.1f}h{s*.3:.1f}Z" fill="{col}"/>'
def ground(col,y0=136): return f'<path d="M0 {H}L0 {y0}C60 {y0-8} 120 {y0-6} 170 {y0+2}S220 {y0-2} {W} {y0-4}L{W} {H}Z" fill="{col}"/>'
def trees(rng,col,y=124):
    return ''.join(pine(x,y+rng.uniform(-2,4),s,col) for x,s in [(rng.uniform(6,20),rng.uniform(10,15)),(rng.uniform(22,34),rng.uniform(7,10)),(rng.uniform(206,222),rng.uniform(10,15)),(rng.uniform(224,236),rng.uniform(7,10))])
def lake(id,y,top,bot): return f'<rect y="{y}" width="{W}" height="{H-y}" fill="url(#{id})"/>', f'<linearGradient id="{id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bot}"/></linearGradient>'
def glow(id,c,a=.6): return f'<radialGradient id="{id}"><stop offset="0" stop-color="{c}" stop-opacity="{a}"/><stop offset="1" stop-color="{c}" stop-opacity="0"/></radialGradient>'
def moon(x,y,r,skyc): return f'<circle cx="{x}" cy="{y}" r="{r*2.6}" fill="url(#mglow)"/><circle cx="{x}" cy="{y}" r="{r}" fill="#ffe69a"/><circle cx="{x+r*.45:.1f}" cy="{y-r*.25:.1f}" r="{r*.88:.1f}" fill="{skyc}"/>'
def sun(x,y,r): return f'<circle cx="{x}" cy="{y}" r="{r*3}" fill="url(#sglow)"/><circle cx="{x}" cy="{y}" r="{r}" fill="#fff0c2"/>'
def wave(y,a,f,ph,col,w,op,cls='',x0=0,x1=W):
    pts=' '.join(f'{x},{y+a*math.sin((x-x0)/(x1-x0)*math.pi*2*f+ph)*math.sin((x-x0)/(x1-x0)*math.pi):.1f}' for x in range(x0,x1+1,4))
    return f'<polyline class="{cls}" points="{pts}" fill="none" stroke="{col}" stroke-width="{w}" opacity="{op}" stroke-linecap="round"/>'
DK='#06061a'
# ---------------------------------------------------------------- the landmarks (what the tool does, as a thing in the scene)
def m_waves(r,a):   # oscillators: glowing waves across the sky
    return '<g filter="url(#blur)">'+wave(46,12,2,0,a,6,'.45','pu')+wave(52,9,3,1,'#ff6fa8',4,'.4','pu')+'</g>'+wave(46,12,2,0,'#fff',.8,'.8')+wave(52,9,3,1,'#ffe0f0',.6,'.6')
def m_wobble(r,a):  # wobble: an aurora ribbon that breathes
    return '<g filter="url(#blur)">'+''.join(wave(40+i*7,10-i*2,1.5+i*.5,i,c,7-i*2,'.5','pu') for i,c in enumerate([a,'#ff6fa8','#b06bff']))+'</g>'
def m_sub(r,a):     # sub: a vast low moon rising from the lake, rings under the water
    return f'<circle cx="120" cy="118" r="34" fill="url(#ag)"/><circle cx="120" cy="118" r="16" fill="{mix(a,"#ffffff",.5)}" opacity=".9"/>'+''.join(f'<ellipse class="pu" style="animation-delay:-{i*1.3}s" cx="120" cy="128" rx="{20+i*20}" ry="{3+i*2.4}" fill="none" stroke="{a}" stroke-width="1" opacity=".55"/>' for i in range(3))
def m_forge(r,a):   # forge: an anvil on a rock with sparks flying
    sp=''.join(f'<circle class="rise" style="animation-delay:-{i*.3:.1f}s" cx="{120+r.uniform(-14,14):.1f}" cy="{104+r.uniform(-3,3):.1f}" r="{r.uniform(.6,1.4):.1f}" fill="{r.choice([a,"#ffd27a","#ff8a3d"])}"/>' for i in range(12))
    return f'<circle cx="120" cy="104" r="36" fill="url(#ag)"/><path d="M100 104h44q-6 6-14 7v8h8v6h-32v-6h8v-8q-10-1-14-7z" fill="{DK}"/><rect x="104" y="100" width="34" height="5" rx="1" fill="{mix(a,"#ffb36b",.5)}" opacity=".7"/>'+sp
def m_drums(r,a):   # rhythm: standing stones in a row, each lit in turn
    return ''.join(f'<g><path d="M{40+i*24} 130v-{18+(i%3)*6}q8-6 16 0v{18+(i%3)*6}z" fill="{DK}"/><circle class="sh" style="animation-delay:-{i*.35:.2f}s" cx="{48+i*24}" cy="{122-(i%3)*6}" r="3" fill="{a}"/></g>' for i in range(7))
def m_fire(r,a):    # groove: a campfire with sparks and a tent
    sp=''.join(f'<circle class="rise" style="animation-delay:-{i*.3:.1f}s" cx="{120+r.uniform(-6,6):.1f}" cy="{116+r.uniform(-2,2):.1f}" r="{r.uniform(.6,1.2):.1f}" fill="#ffc46b"/>' for i in range(8))
    return f'<g transform="translate(120 128)"><circle r="30" fill="url(#ag)"/><path d="M-6 0Q-8 -10 -2 -16Q-1 -9 3 -12Q2 -6 7 -4Q6 0 0 1Z" fill="#ff8a3d"/><path d="M-3 0Q-4 -6 0 -10Q1 -5 3 -6Q3 -1 0 1Z" fill="#ffd36b"/><path d="M-10 2h20M-8 4l16-5M8 4l-16-5" stroke="#3a1d0f" stroke-width="2.2" stroke-linecap="round"/></g><path d="M150 134L163 114L176 134Z" fill="#2a1d18"/>'+sp
def m_ripples(r,a): # echo/delay: a stone's ripples repeating on the lake
    return ''.join(f'<ellipse class="pu" style="animation-delay:-{i*.9}s" cx="120" cy="124" rx="{10+i*16}" ry="{2.4+i*2.2}" fill="none" stroke="{a}" stroke-width="{1.4-i*.2:.1f}" opacity="{.8-i*.12:.2f}"/>' for i in range(5))
def m_curtain(r,a): # filters/phaser: aurora curtains
    return '<g filter="url(#blur)">'+''.join(f'<path class="pu" style="animation-delay:-{i*.7:.1f}s" d="M{20+i*40} 20q10 30 0 70" stroke="{[a,"#ff6fa8","#b06bff","#7af0ff","#38ffd0"][i%5]}" stroke-width="16" opacity=".35" fill="none"/>' for i in range(6))+'</g>'
def m_storm(r,a):   # destroyer: a storm cloud and lightning
    bolt=f'<path class="sh" d="M126 40l-12 26h10l-8 24 22-32h-11l9-18z" fill="{mix(a,"#ffffff",.4)}"/>'
    return f'<g fill="#0c0a1e"><ellipse cx="110" cy="38" rx="44" ry="14"/><ellipse cx="140" cy="32" rx="30" ry="14"/><ellipse cx="86" cy="34" rx="24" ry="10"/></g><circle cx="122" cy="70" r="40" fill="url(#ag)"/>'+bolt
def m_peaks(r,a):   # EQ: the range drawn as a glowing curve
    return wave(70,22,1.5,.6,a,2.4,'.95','',10,230)+wave(70,22,1.5,.6,'#fff',.6,'.7','',10,230)+''.join(f'<circle cx="{x}" cy="{70+22*math.sin((x-10)/220*math.pi*3+.6)*math.sin((x-10)/220*math.pi):.1f}" r="3" fill="{a}"/>' for x in [40,90,140,190])
def m_tide(r,a):    # dynamics/sidechain: a waterfall into a pool
    return f'<path d="M106 60h28v70h-28z" fill="url(#fall)"/>'+''.join(f'<path class="fl" style="animation-delay:-{i}s" d="M{110+i*5} 60V130" stroke="#fff" stroke-opacity=".35" stroke-width="1" stroke-dasharray="8 10"/>' for i in range(5))+'<ellipse class="pu" cx="120" cy="132" rx="30" ry="4" fill="#fff" opacity=".3"/>'
def m_ruin(r,a):    # haunt: a ruined arch in mist, a ghost light
    return f'<path d="M92 132V84q28-30 56 0v48h-10V90q-18-18-36 0v42z" fill="{DK}"/><circle class="pu" cx="120" cy="104" r="6" fill="{a}"/><rect class="dr" x="0" y="112" width="240" height="14" fill="#d8d4ff" opacity=".12"/>'
def m_shoot(r,a):   # pitch: shooting stars arcing
    return ''.join(f'<path class="sh" style="animation-delay:-{i*.7}s" d="M{40+i*55} {30+i*8}q30 10 50 34" stroke="{c}" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="{90+i*55}" cy="{64+i*8}" r="2" fill="#fff"/>' for i,c in enumerate([a,'#ff6fa8','#ffb36b']))
def m_crystal(r,a): # xenharmonic: a crystal with sacred geometry
    pts=[(120+math.cos(t)*24,70+math.sin(t)*24) for t in [i*math.pi/3 for i in range(6)]]
    lines=''.join(f'<path d="M{p[0]:.1f} {p[1]:.1f}L{q[0]:.1f} {q[1]:.1f}" stroke="{a}" stroke-width=".7" opacity=".6"/>' for i,p in enumerate(pts) for q in pts[i+1:])
    return f'<g class="spin">{lines}</g><path d="M120 50l12 24-12 30-12-30z" fill="{mix(a,"#ffffff",.3)}" opacity=".85"/><circle cx="120" cy="74" r="30" fill="url(#ag)"/>'
def m_cloud(r,a):   # granular: a glitter cloud
    return f'<ellipse cx="120" cy="56" rx="70" ry="22" fill="url(#ag)"/>'+''.join(f'<circle class="tw" style="animation-delay:-{r.uniform(0,4):.1f}s" cx="{120+r.gauss(0,36):.1f}" cy="{56+r.gauss(0,11):.1f}" r="{r.uniform(.4,1.6):.2f}" fill="{r.choice([a,"#ffffff","#ffd27a","#ff9ad0"])}"/>' for _ in range(110))
def m_moons(r,a):   # LFO: the moon's phases across the sky
    out=''
    for i in range(5):
        x=40+i*40; ph=(i-2)*5
        out+=f'<g class="sh" style="animation-delay:-{i*.5}s"><circle cx="{x}" cy="46" r="8" fill="#ffe69a"/><circle cx="{x+ph}" cy="44" r="8" fill="url(#sk)"/></g>'
    return out
def m_breath(r,a):  # breath: someone sitting still, rings opening
    return ''.join(f'<ellipse class="pu" style="animation-delay:-{i*1.3}s" cx="120" cy="126" rx="{14+i*18}" ry="{2.6+i*2.4}" fill="none" stroke="{a}" stroke-width=".9"/>' for i in range(3))+f'<g fill="{DK}"><circle cx="120" cy="117" r="2.8"/><path d="M114.5 127Q115 120 120 119.8Q125 120 125.5 127Z"/></g>'
def m_compass(r,a): # XY / analysers: a star compass
    return f'<g class="spin" style="animation-duration:60s"><circle cx="120" cy="70" r="26" fill="none" stroke="{a}" stroke-width=".8" opacity=".6"/><path d="M120 40l5 30-5 30-5-30z" fill="{a}" opacity=".8"/><path d="M90 70l30-5 30 5-30 5z" fill="#ffe7b0" opacity=".6"/></g><circle cx="120" cy="70" r="3" fill="#fff"/>'
def m_lanterns(r,a):# automation: a path of lanterns over the hills
    return ''.join(f'<g><path d="M{30+i*36} 130v-{12+i*3}" stroke="{DK}" stroke-width="1.4"/><circle class="sh" style="animation-delay:-{i*.4}s" cx="{30+i*36}" cy="{118-i*3}" r="3.4" fill="{a}"/><circle cx="{30+i*36}" cy="{118-i*3}" r="9" fill="url(#ag)"/></g>' for i in range(6))
def m_lighthouse(r,a): # mix / master: a lighthouse sweeping its beam over the sea
    return f'<path class="sh" d="M126 62L240 40V84Z" fill="url(#beam)" opacity=".5"/><path d="M114 132l4-66h8l4 66z" fill="{DK}"/><rect x="112" y="58" width="20" height="10" fill="{a}"/><circle cx="122" cy="63" r="14" fill="url(#ag)"/><path d="M110 58l12-9 12 9z" fill="{DK}"/>'
def m_rivers(r,a):  # mixer/channel: streams meeting in a lake
    return ''.join(f'<path class="fl" d="M{20+i*50} 80Q{60+i*30} 110 120 126" stroke="{c}" stroke-width="2" fill="none" stroke-dasharray="10 6" opacity=".8"/>' for i,c in enumerate([a,'#7af0ff','#ff6fa8','#ffb36b']))
def m_stairs(r,a):  # arp: a stairway of stars
    return ''.join(f'<rect class="sh" style="animation-delay:-{i*.25:.2f}s" x="{40+i*20}" y="{120-i*11}" width="14" height="3" rx="1" fill="{a}"/><circle cx="{47+i*20}" cy="{116-i*11}" r="1.6" fill="#fff"/>' for i in range(8))
def m_triad(r,a):   # chords: three stars stacked, linked
    pts=[(96,70),(120,46),(144,70)]
    return ''.join(f'<path d="M{p[0]} {p[1]}L{q[0]} {q[1]}" stroke="{a}" stroke-width=".8" opacity=".7"/>' for p,q in [(pts[0],pts[1]),(pts[1],pts[2]),(pts[0],pts[2])])+''.join(spark(x,y,5,c,i) for i,((x,y),c) in enumerate(zip(pts,[a,'#ff6fa8','#ffd27a'])))
def m_river(r,a):   # bassline: a river winding down to the lake
    return f'<path class="fl" d="M100 76Q160 92 110 104T130 130" stroke="{a}" stroke-width="5" fill="none" opacity=".75" stroke-dasharray="20 6"/><path d="M100 76Q160 92 110 104T130 130" stroke="#fff" stroke-width="1" fill="none" opacity=".4"/>'
def m_road(r,a):    # timeline: a road to the horizon with milestones
    return f'<path d="M100 150L118 90h4L140 150z" fill="#141228"/>'+''.join(f'<rect x="{119.4}" y="{96+i*12}" width="1.2" height="{3+i*1.5}" fill="{a}" class="sh" style="animation-delay:-{i*.3}s"/>' for i in range(5))
def m_drop(r,a):    # drop builder: a cliff and a waterfall falling into the dark
    cliff = f'<path d="M0 150V96l18-6 22 4 26-8 20 5 18-3 4 6 2 56z" fill="{DK}"/><path d="M146 150l2-50 10-4 24 6 30-8 28 4v52z" fill="{DK}"/>'
    fall = f'<path d="M110 92h36v58h-36z" fill="url(#fall)" opacity=".85"/>'+''.join(f'<path class="fl" style="animation-delay:-{i}s" d="M{113+i*5} 92V150" stroke="#fff" stroke-opacity=".4" stroke-dasharray="9 9"/>' for i in range(6))
    return fall + cliff + '<ellipse class="pu" cx="128" cy="140" rx="34" ry="7" fill="#fff" opacity=".28"/>' + spark(128, 70, 5, a, 2)
def m_tower(r,a):   # recorder / session: a radio tower sending rings
    return f'<path d="M114 132l6-70 6 70z M116 110h8 M117 96h6" stroke="{DK}" stroke-width="2" fill="{DK}"/><circle class="sh" cx="120" cy="60" r="3" fill="{a}"/>'+''.join(f'<path class="pu" style="animation-delay:-{i*1.2}s" d="M{110-i*10} {54-i*6}a{14+i*10} {14+i*10} 0 0 1 {20+i*20} 0" stroke="{a}" fill="none" stroke-width="1"/>' for i in range(3))
def m_cathedral(r,a): # organ / coven: a cathedral with a rose window
    return f'<path d="M84 132V80l12-14 12 14v-16l12-20 12 20v16l12-14 12 14v52z" fill="{DK}"/><circle cx="120" cy="84" r="9" fill="{a}" opacity=".85"/><circle cx="120" cy="84" r="20" fill="url(#ag)"/><path d="M120 75v18M111 84h18M114 78l12 12M126 78l-12 12" stroke="{DK}" stroke-width="1"/>'
def m_palms(r,a):   # dub station: an island with palms
    def palm(x,y,s,f): return f'<path d="M{x} {y}q{2*f} -{s*.5} {f*s*.15} -{s}" stroke="{DK}" stroke-width="2.4" fill="none"/><g class="sw" fill="{DK}">'+''.join(f'<path d="M{x+f*s*.15} {y-s}q{math.cos(t)*s*.35:.1f} {math.sin(t)*s*.35-4:.1f} {math.cos(t)*s*.6:.1f} {math.sin(t)*s*.45+2:.1f}q{-math.cos(t)*s*.2:.1f} -4 {-math.cos(t)*s*.6:.1f} {-math.sin(t)*s*.45-2:.1f}Z"/>' for t in [-2.9,-2.2,-1.2,-.4,.3])+'</g>'
    return f'<ellipse cx="120" cy="132" rx="50" ry="8" fill="{DK}"/>'+palm(110,130,36,1)+palm(132,130,28,-1)
def m_synthwave(r,a): # retro poly: a striped sun over a grid
    stripes=''.join(f'<rect x="88" y="{62+i*6}" width="64" height="{1+i*.5:.1f}" fill="url(#sk)"/>' for i in range(5))
    grid=''.join(f'<path d="M{120+(i-6)*8} 104L{120+(i-6)*40} 150" stroke="{a}" stroke-width=".7" opacity=".7"/>' for i in range(13))+''.join(f'<path d="M0 {104+i*i*1.6:.1f}H240" stroke="{a}" stroke-width=".7" opacity=".6"/>' for i in range(1,9))
    return f'<circle cx="120" cy="74" r="32" fill="url(#sun2)"/>'+stripes+f'<rect y="104" width="240" height="46" fill="#120a28"/>'+grid
def m_fireflies(r,a): # particle field: fireflies over a meadow
    return ''.join(f'<circle class="tw" style="animation-delay:-{r.uniform(0,4):.1f}s" cx="{r.uniform(10,230):.1f}" cy="{r.uniform(70,130):.1f}" r="{r.uniform(.8,2):.1f}" fill="{r.choice([a,"#fff3a0","#c8ff9a"])}"/>' for _ in range(40))
def m_feather(r,a): # voice & words: birds over the water
    return ''.join(f'<path class="dr" style="animation-delay:-{i}s" d="M{60+i*30} {50+i%2*10}q5-5 10 0q5-5 10 0" stroke="{DK}" stroke-width="1.6" fill="none"/>' for i in range(5))
def m_jar(r,a):     # sample player / clip maker: a jar of light on a stump
    return f'<rect x="108" y="116" width="24" height="16" fill="#2a1d18"/><path d="M110 116v-26q0-4 4-4h12q4 0 4 4v26z" fill="{a}" opacity=".18" stroke="#cfd8ff" stroke-opacity=".5"/><rect x="112" y="82" width="16" height="4" fill="#5a3a24"/>'+''.join(f'<circle class="tw" style="animation-delay:-{i*.4}s" cx="{114+r.uniform(0,12):.1f}" cy="{92+r.uniform(0,20):.1f}" r="1.6" fill="{mix(a,"#fff3a0",.5)}"/>' for i in range(7))+f'<circle cx="120" cy="102" r="24" fill="url(#ag)"/>'
def m_telescope(r,a): # analysis / coach: a telescope on a hill pointing up
    return f'<g fill="{DK}"><path d="M110 104L138 84l3 4-28 20z"/><circle cx="140" cy="85" r="3"/><path d="M120 100l-8 32M120 100l8 32M120 100v32" stroke="{DK}" stroke-width="1.6"/></g><path d="M141 84L190 40" stroke="{a}" stroke-width=".7" stroke-dasharray="2 3" opacity=".7"/>'+spark(192,38,4,a)
def m_castle(r,a):  # suite hub: a castle with lit windows
    return f'<path d="M86 132V90h10v-8h8v8h10V78h12v12h10v-8h8v8h10v42z" fill="{DK}"/>'+''.join(f'<rect class="sh" style="animation-delay:-{i*.4}s" x="{94+i*12}" y="104" width="4" height="6" fill="{a}"/>' for i in range(5))
def m_aura(r,a):    # embodiment: a figure with an aura
    return f'<circle class="pu" cx="120" cy="96" r="26" fill="url(#ag)"/><g fill="{DK}"><circle cx="120" cy="88" r="5"/><path d="M110 132q0-30 10-32q10 2 10 32z"/></g>'
def m_orb(r,a):     # ai: a crystal orb on a pedestal under a network
    nodes=[(40,30),(80,20),(120,36),(160,22),(200,32),(100,56),(150,58)]
    return ''.join(f'<path d="M{nodes[i][0]} {nodes[i][1]}L{nodes[j][0]} {nodes[j][1]}" stroke="#ffd48a" stroke-width=".6" opacity=".5"/>' for i,j in [(0,1),(1,2),(2,3),(3,4),(2,5),(2,6),(5,6)])+''.join(f'<circle class="tw" cx="{x}" cy="{y}" r="1.6" fill="#ffe7b0"/>' for x,y in nodes)+f'<path d="M110 134h20l-3-10h-14z" fill="{DK}"/><circle cx="120" cy="112" r="16" fill="url(#ag)"/><circle class="pu" cx="120" cy="112" r="9" fill="{a}" opacity=".5"/>'
def m_runes(r,a):   # code: a rune stone
    return f'<path d="M100 134L102 74Q118 64 136 74L140 134Z" fill="#0b1826"/><circle cx="120" cy="96" r="32" fill="url(#ag)"/>'+''.join(f'<path class="sh" style="animation-delay:-{i*.35:.2f}s" d="M{108+(i%3)*9} {80+(i//3)*9}l{r.choice([3,-3])} 3l{r.choice([3,-3])} 3" stroke="{a}" stroke-width="1.2" fill="none"/>' for i in range(12))
def m_easel(r,a):   # image: an easel with a painting
    return f'<g stroke="#2a1a14" stroke-width="2" stroke-linecap="round"><path d="M104 134L116 82M136 134L124 82M120 134V90"/></g><rect x="100" y="76" width="40" height="30" rx="1" fill="#f6efe2"/><rect x="102" y="78" width="36" height="26" fill="url(#sk)"/><path d="M102 100l9-9 6 6 7-10 14 13z" fill="{a}" opacity=".8"/>'
def m_screen(r,a):  # video: a drive-in screen and projector beam
    return f'<path d="M196 128L120 82V114Z" fill="url(#beam)" opacity=".45"/><rect x="78" y="76" width="64" height="38" fill="{DK}"/><rect x="81" y="79" width="58" height="32" fill="url(#sk)"/><path d="M84 108l12-12 8 8 10-14 22 18z" fill="{a}" opacity=".8"/><rect x="196" y="124" width="10" height="8" fill="{DK}"/>'
MOTIF = {
 'eravos.agents.ai-step': (m_orb,'violet'), 'eravos.coding.code-cell': (m_runes,'aurora'), 'eravos.image.image-adjust': (m_easel,'sunset'), 'eravos.video.video-clip': (m_screen,'aurora'),
 'eravos.harmonic-analyzer': (m_telescope,'night'), 'eravos.bass-drop-builder': (m_drop,'dusk'), 'eravos.song-recorder': (m_tower,'dusk'), 'eravos.timeline': (m_road,'sunset'),
 'eravos.acid-synth': (m_waves,'aurora'), 'eravos.bass-forge': (m_forge,'dusk'), 'eravos.bass-gen': (m_river,'violet'), 'eravos.reese-bass': (m_sub,'night'), 'eravos.sub-engine': (m_sub,'violet'), 'eravos.wobble-bass': (m_wobble,'dusk'),
 'eravos.pads': (m_drums,'night'), 'eravos.sequencer': (m_drums,'aurora'),
 'eravos.fx-destroyer': (m_storm,'night'), 'eravos.fx-dynamics': (m_tide,'dusk'), 'eravos.fx-echo': (m_ripples,'night'), 'eravos.fx-eq': (m_peaks,'sunset'), 'eravos.fx-filter': (m_curtain,'aurora'),
 'eravos.fx-glitch': (m_storm,'violet'), 'eravos.fx-haunt': (m_ruin,'violet'), 'eravos.fx-moddelay': (m_ripples,'aurora'), 'eravos.fx-phaser': (m_curtain,'violet'), 'eravos.fx-pitch': (m_shoot,'night'), 'eravos.fx-squash': (m_tide,'sunset'),
 'eravos.embodiment-lab': (m_aura,'violet'), 'eravos.arp': (m_stairs,'night'), 'eravos.chord-gen': (m_triad,'dawn'), 'eravos.edm-lab': (m_castle,'dusk'), 'eravos.groove-gen': (m_fire,'night'),
 'eravos.coven': (m_cathedral,'night'), 'eravos.dub-station': (m_palms,'dusk'), 'eravos.organ': (m_cathedral,'violet'), 'eravos.retro-poly': (m_synthwave,'dusk'),
 'eravos.channel': (m_rivers,'night'), 'eravos.master-fx': (m_lighthouse,'dusk'), 'eravos.mixer': (m_rivers,'aurora'), 'eravos.sidechain-compressor': (m_tide,'night'),
 'eravos.breath': (m_breath,'violet'), 'eravos.lfo': (m_moons,'night'), 'eravos.macro-automation': (m_lanterns,'dusk'), 'eravos.xy-pad': (m_compass,'night'),
 'eravos.drum-forge': (m_forge,'night'), 'eravos.fx-box': (m_forge,'violet'), 'eravos.curve-synth': (m_waves,'sunset'), 'eravos.pad-forge': (m_cloud,'dawn'), 'eravos.supersaw': (m_waves,'night'),
 'eravos.coach': (m_telescope,'dawn'), 'eravos.session': (m_tower,'night'), 'eravos.suite-hub': (m_castle,'night'),
 'eravos.granular': (m_cloud,'aurora'), 'eravos.syn-env': (m_peaks,'violet'), 'eravos.syn-osc': (m_waves,'aurora'), 'eravos.syn-partials': (m_stairs,'sunset'),
 'eravos.contrast-analyser': (m_compass,'aurora'), 'eravos.midi-mapper': (m_lanterns,'night'), 'eravos.particle-field': (m_fireflies,'night'),
 'eravos.clip-maker': (m_jar,'night'), 'eravos.sample-player': (m_jar,'violet'), 'eravos.lyric-rhythm': (m_feather,'dawn'),
 'eravos.wub-filter': (m_curtain,'dusk'), 'eravos.wub-osc': (m_wobble,'night'), 'eravos.wub-rate': (m_moons,'violet'), 'eravos.wub-sub': (m_sub,'dusk'),
 'eravos.ratio-lattice': (m_crystal,'night'), 'eravos.recursive-spectra': (m_crystal,'aurora'), 'eravos.xen-synth': (m_crystal,'violet'),
}
WATER = {m_sub, m_ripples, m_breath, m_lighthouse, m_rivers, m_palms, m_river}
def paint(tid, label, accent):
    motif, kind = MOTIF.get(tid, (m_fireflies, 'night'))
    acc = accent if accent and accent.startswith('#') and len(accent) == 7 else '#00d4ff'
    if acc.lower() in ('#ffffff',): acc = '#ffd27a'
    r = random.Random(int(hashlib.md5(tid.encode()).hexdigest()[:8], 16))
    top = SKIES[kind][0]; skyc = mix(SKIES[kind][1], acc, .18)
    defs = sky('sk', kind, acc) + glow('ag', acc, .55) + glow('mglow', '#ffd86b', .45) + glow('sglow', '#ffd27a', .7) + '<filter id="blur" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>' + \
      '<linearGradient id="fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe8ff"/><stop offset="1" stop-color="' + acc + '" stop-opacity=".4"/></linearGradient>' + \
      '<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></linearGradient>' + \
      '<linearGradient id="sun2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset=".6" stop-color="#ff6fa8"/><stop offset="1" stop-color="#b06bff"/></linearGradient>'
    body = f'<rect width="{W}" height="{H}" fill="url(#sk)"/>' + stars(r, 55 if kind in ('night', 'aurora', 'violet') else 25, 80)
    if kind in ('night', 'violet') and motif not in (m_moons, m_storm, m_sub): body += moon(r.choice([30, 206]), r.uniform(18, 28), 7, top)
    if kind in ('sunset', 'dawn', 'dusk') and motif not in (m_synthwave, m_drop, m_storm): body += sun(r.choice([48, 192]), 98, 9)
    body += spark(r.uniform(20, 220), r.uniform(10, 30), 3, '#fff3c4', 1)
    far = mix(SKIES[kind][1], '#1a1f50', .55); near = mix(far, '#05061a', .55)
    if motif not in (m_synthwave,):
        body += ridge(r, 104, r.uniform(16, 28), far, 6, mix('#d8e0ff', acc, .2))
    sky_motifs = (m_waves, m_wobble, m_curtain, m_storm, m_shoot, m_cloud, m_moons, m_stairs, m_triad, m_peaks, m_crystal, m_orb, m_compass, m_feather)
    if motif in sky_motifs: body += motif(r, acc)
    if motif in WATER:
        lk, lg = lake('lk', 108, mix(SKIES[kind][2], acc, .25), '#07081a'); defs += lg; body += lk
    if motif not in (m_synthwave, m_drop): body += ridge(r, 118, 10, near, 6) if motif not in WATER else ''
    if motif not in sky_motifs: body += motif(r, acc)
    if motif not in (m_synthwave, m_drop): body += ground(DK, 138) + trees(r, DK)
    elif motif is m_drop: body += trees(r, DK, 120)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="{label}: a painting">'
            f'{STYLE}<defs>{defs}</defs>{body}</svg>')
if __name__ == '__main__':
    tools = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    for t in tools: open(os.path.join(out, t['id'] + '.svg'), 'w').write(paint(t['id'], t['label'], t.get('accent')))
    print(len(tools))
