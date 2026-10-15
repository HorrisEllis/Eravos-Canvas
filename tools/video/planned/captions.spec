# spec_id: eravos.organism.captions · version 1.0.0 · phase P38 · status planned · category clips
identity:
  id: eravos.video.captions ; label: Captions ; icon: 💬 ; accent: "#ffd6a5"
  comp_intent: Subtitles for a clip — type or import them, time them to speech, style them, burn them in or export SRT/VTT.
  novelty: Caption timing aided by speech/silence detection (speech-to-text via an optional model pack or AI Step).
engine: cue list {start, end, text, style} ; auto-split by silence gaps ; optional transcription (Whisper-class ONNX pack, or route audio → AI Step) ; styles (font, size, outline, box, position, karaoke word highlight) ; export SRT, VTT ; burn-in via canvas compositing in Video Clip export
config: cues ; style ; language
hooks: data_in (text/transcript) ; data_out cues (json) ; asset_out (srt/vtt)
ui: cue list synced with the video playhead ; style panel
tests: SRT export/import round-trip identical ; cue end ≥ start enforced
