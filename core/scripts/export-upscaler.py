"""
Builds the upscaling model Social9 uses (public/models/realesr-general-x4v3.onnx) from the
official Real-ESRGAN weights, so anyone can rebuild it and compare hashes.

    pip install torch onnx
    curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth
    python export-upscaler.py realesr-general-x4v3.pth realesr-general-x4v3.onnx

The network is SRVGGNetCompact from Real-ESRGAN by Xintao Wang et al. (BSD-3-Clause):
https://github.com/xinntao/Real-ESRGAN/blob/master/realesrgan/archs/srvgg_arch.py
"""
import sys

import torch
from torch import nn
from torch.nn import functional as F


class SRVGGNetCompact(nn.Module):
    def __init__(self, num_feat=64, num_conv=32, upscale=4):
        super().__init__()
        self.upscale = upscale
        body = [nn.Conv2d(3, num_feat, 3, 1, 1), nn.PReLU(num_parameters=num_feat)]
        for _ in range(num_conv):
            body += [nn.Conv2d(num_feat, num_feat, 3, 1, 1), nn.PReLU(num_parameters=num_feat)]
        body.append(nn.Conv2d(num_feat, 3 * upscale * upscale, 3, 1, 1))
        self.body = nn.ModuleList(body)
        self.upsampler = nn.PixelShuffle(upscale)

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        return self.upsampler(out) + F.interpolate(x, scale_factor=self.upscale, mode="nearest")


def main(weights: str, out: str) -> None:
    state = torch.load(weights, map_location="cpu", weights_only=True)
    model = SRVGGNetCompact()
    model.load_state_dict(state.get("params", state), strict=True)
    model.eval()
    torch.onnx.export(
        model,
        torch.rand(1, 3, 64, 64),
        out,
        input_names=["input"],
        output_names=["output"],
        # any tile size: the app runs it on tiles of the photo
        dynamic_axes={"input": {2: "h", 3: "w"}, "output": {2: "h4", 3: "w4"}},
        opset_version=17,
        do_constant_folding=True,
        dynamo=False,
    )
    print("wrote", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
