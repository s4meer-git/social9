# Social9 launch ad: script, storyboard and AI video prompts

**Format:** 30 s hero spot, plus 15 s and 6 s cut-downs.
**Aspect ratios:** 9:16 for Reels, Shorts and TikTok. 16:9 for YouTube and the website. 1:1 for feed.
**Tone:** warm, bright, real. It should feel like a shot-on-iPhone moment, not a corporate tech ad. Real people, real festivals, real pets. The product moments are fast, satisfying and almost magical, but never "AI sparkly".
**Music:** upbeat Indian-pop/lo-fi crossover around 100–110 BPM, with a dhol accent on every product "snap". The edit cuts on the beat.
**Sound design:**
- a crisp *zip* when a background cuts away
- a soft *pop* for each sticker landing
- a whoosh when a frame resizes
**End card:** the social9 logo, then "Make every photo post-ready.", then "Free · in your browser · social9.s4meer.com".

---

## 30-second hero spot

| # | Time | Shot (what we see) | Product moment / on-screen text | Audio |
|---|---|---|---|---|
| 1 | 0.0–3.0 | **Diwali night, rooftop.** Two friends light sparklers, laughing. One holds up a phone to take a photo. Handheld, golden fairy lights, shallow depth of field. | The phone screen fills the frame: the photo they just took. | Music starts. Sparkler crackle. |
| 2 | 3.0–6.0 | The phone screen shows the photo. Behind the two friends, a cousin is mid-yawn in the corner. Friend 1: *"Bro, delete Ravi."* | A thumb taps **Hide faces**. A glowing ring finds each face. A **sunglasses sticker** drops onto Ravi's face with a bounce. | Laugh, then *pop*. |
| 3 | 6.0–9.5 | **Bright living room, morning.** A young woman on the floor hugs her golden retriever, who licks her cheek. Natural window light. | Snap-zoom into her phone. She taps **Remove background**. A white scan line sweeps across. The room peels away and a **pink-to-violet gradient** appears behind her and the dog, hair and fur intact. | *zip* on the scan, then a dhol hit. |
| 4 | 9.5–13.0 | **College office / co-working.** A guy in a kurta is in front of a messy whiteboard, holding his phone for a selfie. On-screen caption: "LinkedIn tomorrow 😬". | He taps **Profile picture**. His face snaps to center. The background becomes a soft studio gradient. A **ring draws itself** around the circle. Label: "LinkedIn · 400 × 400". | Rising synth, then *ding*. |
| 5 | 13.0–17.0 | **Holi, street.** A girl throws pink and yellow colour into the air, laughing, slow motion at 120 fps. | The same photo **morphs through frames**: 9:16 Story, then 4:5 Post, then 16:9 Thumbnail, with platform icons flicking past. | Three quick *whoosh*es on the beat. |
| 6 | 17.0–20.0 | **Graduation lawn, golden hour.** A grad blows confetti toward the camera. | The phone shows **Remove location data**. A GPS pin and "12 Aug, 18:42" get struck through. Text: "Your photos never leave your device." | Music drops to a single pad. |
| 7 | 20.0–25.0 | **Montage on the beat.** Six quick cuts of finished posts appearing in feeds: Instagram grid, WhatsApp DP, YouTube thumbnail, LinkedIn header, a story with a cat, a Diwali family photo. | Each lands with a tiny scale-bounce. | Full music, dhol fills. |
| 8 | 25.0–30.0 | End card on warm cream. A floating collage of the results gently drifts. | **social9.** "Make every photo post-ready." "Free · in your browser · social9.s4meer.com" | Button-click SFX, music button. |

**Voice-over (optional, 22 words, warm and playful):**
> "Hide the cousin. Lose the messy room. Nail the LinkedIn pic. Every size, every app. Free, private, right in your browser. Social9."

### 15-second cut
Shots 2, 3, 4, 5 (fast), then the end card. VO: "Hide faces. Swap backgrounds. Perfect profile pics. Every size. Social9, free in your browser."

### 6-second bumper
Shot 3 only (the dog cut-out with the scan line), then the logo. Text: "Background? Gone. social9.s4meer.com".

---

## Shot-by-shot AI video prompts

These prompts are written for **Google Veo 3**, **Kling 2.x**, **Sora** or **Runway Gen-4**. Generate the live-action plates with AI, then composite the real UI on top in an editor (CapCut, Premiere or After Effects) using the screen recordings below. Keep every product moment as **real UI**, so the ad stays honest.

Add this to every prompt:
- **Style suffix:** *"shot on iPhone 16 Pro, natural skin texture, true-to-life colour, shallow depth of field, subtle handheld motion, 24fps, no text, no logos"*.
- **Negative prompt (where supported):** *"plastic skin, extra fingers, warped faces, text, watermark, logo, oversaturated, CGI look"*.

1. **Diwali rooftop:** "Two Indian friends in their early twenties on a rooftop at night during Diwali, lighting sparklers, laughing, warm fairy lights and diyas on the parapet, city lights bokeh in the background, one friend raises a phone to take a selfie, candid and joyful."
2. **Phone over-the-shoulder:** "Over-the-shoulder close-up of a phone screen showing a group photo of friends at a Diwali party, a thumb hovering over the screen, warm ambient light, shallow focus on the screen."
3. **Woman + golden retriever:** "A young Indian woman sitting on a living-room rug in morning window light, hugging her golden retriever who licks her cheek, she laughs with eyes closed, cosy plants and a sofa behind, candid lifestyle moment."
4. **Kurta selfie:** "A young Indian man in a pastel kurta in a bright co-working space with a messy whiteboard behind him, holding his phone at arm's length for a selfie, slightly nervous smile then confident grin."
5. **Holi throw (slow motion):** "Slow motion, a young woman on a sunlit street during Holi throwing pink and yellow powder into the air, colour clouds swirling around her, laughing, hair moving, 120fps look."
6. **Graduation confetti:** "Golden hour on a university lawn, a graduate in cap and gown blowing confetti toward the camera, sun flare, joyful, slow motion."
7. **End-card plate:** "Soft cream background with gentle out-of-focus warm light, slow drifting, minimal, for a logo end card."

## Screen recordings for the product moments

The site already contains looping, code-driven explainer scenes. Record them at 2× for crisp inserts:
- **Background cut-out (scan line):** Home → "See it in motion" → Remove background.
- **Faces → stickers:** Home → "See it in motion" → Hide faces.
- **Resize morph:** Home → "See it in motion" → Every size.
- **Profile picture ring:** Home → "See it in motion" → Profile picture.

Ready-made MP4 versions of these four scenes are in `public/reel/video/`, regenerated by `scripts/record-reel.mjs`.

## Casting and wardrobe notes

- Cast a diverse group of Indian Gen-Z faces.
- **Festive scenes:** saturated jewel tones. Saffron, pink and emerald kurtas and sarees.
- **Everyday scenes:** soft neutrals, so the brand gradient pops when it appears.
- **Pets:** a golden retriever and a cat. Both read instantly at thumbnail size.

## Captions (for sound-off viewing)

- **0:03** "When your cousin photobombs 🙈". Use an emoji only in social captions, never in the product UI.
- **0:06** "Background? Gone."
- **0:10** "LinkedIn-ready in 5 sec"
- **0:13** "Every size. One tap."
- **0:17** "Your photos never leave your phone."
- **0:25** "social9.s4meer.com · free"
