# spec_id: eravos.piano · version 0.1.0 · status building · template eravos.tool/1
identity:
  id: eravos.piano ; label: Piano ; domain: music ; category: sound-sources
  purpose: <one sentence — what someone can do with it>
ports:
  in:  [piano.hook.in  (event piano:input)]
  out: [piano.hook.out (event piano:value {value})]
params:
  amount: number 0..1 def 0.5
  mode: enum [a, b] def a
behaviour:
  - emits piano:value whenever amount or mode changes, or on poke
needs: units [] · tools [] · permissions [bus_publish, bus_subscribe]
packs: accepts [presets] · ships [factory]
acceptance (each must pass before status → built):
  - setting amount emits exactly one piano:value with that value
  - standard: unmount leaves zero subscribers/ports/wires; params clamp; every shipped pack preset loads
