# The AI models

All five are open, permissively licensed, and pinned by SHA-256 in
[`src/ml/models.ts`](../src/ml/models.ts). `npm run verify-models` downloads each one and
checks it.

| Model | Job | File | SHA-256 | License | Source |
|---|---|---|---|---|---|
| YuNet (2023-03) | face and eye detection | `/models/face_detection_yunet_2023mar.onnx` (0.2 MB) | `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4` | MIT | [OpenCV Zoo](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet) |
| MODNet, int8 | cutting out people | `/models/modnet_quantized.onnx` (6.6 MB) | `92e49898c3e05a6d7a944fc67a8cb87c4aad754ffb6ebd949528c7d1105fee3a` | Apache-2.0 | [Xenova/modnet](https://huggingface.co/Xenova/modnet) |
| ISNet general-use, int8 | cutting out objects, pets, groups | Hugging Face, commit `5349b617911fd60c619b52f32e2b593517b78df3` (46 MB) | `5039225b9a4ac3df55f185d24b7a92d640c86cc4747002d7f23351e394de03a6` | Apache-2.0 | [Ko033/isnet-general-use-onnx](https://huggingface.co/Ko033/isnet-general-use-onnx) |
| Real-ESRGAN general x4v3 | upscaling | `/models/realesr-general-x4v3.onnx` (4.9 MB) | `f788518cc66e302bc9b6946016e989dd9374f1012d5b6c0c7e753904ef3f99e4` | BSD-3-Clause | [xinntao/Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN), converted by [`scripts/export-upscaler.py`](../scripts/export-upscaler.py) |
| MI-GAN (pipeline v2) | removing objects | Hugging Face, commit `406830d0fa60666da0071c342ad2fbc8f30c5c64` (28 MB) | `6f1f3530a1a2324b19752018ce756088b07973cda8d7d890034ace5c8a48c40b` | MIT | [andraniksargsyan/migan](https://huggingface.co/andraniksargsyan/migan), by the model's author |

The upscaler is converted from the official weights with our own script, so you can rebuild
it and get the same hash:

```sh
curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth
python scripts/export-upscaler.py realesr-general-x4v3.pth realesr-general-x4v3.onnx
shasum -a 256 realesr-general-x4v3.onnx
```

## Runtime

[ONNX Runtime Web](https://github.com/microsoft/onnxruntime) 1.30.0 (MIT), from jsDelivr,
checked with Subresource Integrity `sha384-N94xSNjPDbfBJj4+QINst0nbHpcCm8kc1qNlIP/wA0muqjR3aVyIuDkMeccPrLvQ`.

## Why these models

- They're small enough to download in a browser and run on a phone.
- Their licences allow commercial use. Popular alternatives with non-commercial weights
  (e.g. RMBG) or copyleft code (e.g. AGPL background-removal libraries) were ruled out.
- BiRefNet was tried for "HD" cut-outs and dropped: it ran out of memory in WebAssembly
  and exceeded WebGPU shader limits in browsers. HD instead runs MODNet at a higher resolution.

## Changing a model

A model change is a change to `models.ts`: new URL, new SHA-256, in a public commit. The
app refuses any file that doesn't match the hash written there.
