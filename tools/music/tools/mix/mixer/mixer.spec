# spec_id: eravos.mixer · version 0.1.0 · status building · template eravos.tool/1
identity:
  id: eravos.mixer ; label: Mixer ; domain: music ; category: mix
  purpose: <one sentence — what someone can do with it>
ports:
  in:  [mixer.hook.in  (event mixer:input)]
  out: [mixer.hook.out (event mixer:value {value})]
params:
  amount: number 0..1 def 0.5
  mode: enum [a, b] def a
behaviour:
  - emits mixer:value whenever amount or mode changes, or on poke
needs: units [] · tools [] · permissions [bus_publish, bus_subscribe]
packs: accepts [presets] · ships [factory]
acceptance (each must pass before status → built):
  - setting amount emits exactly one mixer:value with that value
  - standard: unmount leaves zero subscribers/ports/wires; params clamp; every shipped pack preset loads
