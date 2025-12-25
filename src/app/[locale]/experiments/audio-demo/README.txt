generated using LLM to demonstrate library and hooks. put audio file in public/audio/ and call it whatever, then change the filename set in page.tsx to match.
the following file types are supported:
  ✓ OGG Vorbis (.ogg)
  ✓ MP3 (.mp3)
  ✓ WAV (.wav)
  ✓ FLAC (.flac) - lossless, high quality
  ✓ AAC/M4A (.m4a, .aac)

it should load the file into memory, then you just gotta press the Play Spatial Audio button and it should come out from
the sphere.

i got a working prototype in my initial run, but then when i tried to get realtime spatial audio editing it failed. asked claude to help and it told me my code was trash so it rewrote ~30% of the lib file. the hook is still mine tho

X Tone.js -> Web Audio API -> PositionalAudio
O PositionalAudio (initializes first) <- Tone.js