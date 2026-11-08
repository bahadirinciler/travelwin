// Turizmlink rötuş aracı: CoreImage ile hafif rötuş + kırpma + boyutlandırma + JPEG.
// Kullanım: retouch <girdi> <çıktı> fit <uzunKenar>
//           retouch <girdi> <çıktı> cover <genişlik> <yükseklik> <odakX 0..1> <odakY 0..1>
import Foundation
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let a = CommandLine.arguments
guard a.count >= 5 else { print("usage"); exit(1) }
let inURL = URL(fileURLWithPath: a[1]), outURL = URL(fileURLWithPath: a[2])
let ctx = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
guard var img = CIImage(contentsOf: inURL, options: [.applyOrientationProperty: true]) else { print("read fail"); exit(2) }

func lanczos(_ i: CIImage, _ s: CGFloat) -> CIImage {
  let f = CIFilter(name: "CILanczosScaleTransform")!
  f.setValue(i, forKey: kCIInputImageKey); f.setValue(s, forKey: kCIInputScaleKey); f.setValue(1.0, forKey: kCIInputAspectRatioKey)
  return f.outputImage!
}

// 1) Rötuş: gölgeleri hafif aç, parlakları koru, canlılık, hafif kontrast
if let f = CIFilter(name: "CIHighlightShadowAdjust") { f.setValue(img, forKey: kCIInputImageKey); f.setValue(0.18, forKey: "inputShadowAmount"); f.setValue(0.92, forKey: "inputHighlightAmount"); img = f.outputImage! }
if let f = CIFilter(name: "CIVibrance") { f.setValue(img, forKey: kCIInputImageKey); f.setValue(0.14, forKey: "inputAmount"); img = f.outputImage! }
if let f = CIFilter(name: "CIColorControls") { f.setValue(img, forKey: kCIInputImageKey); f.setValue(1.04, forKey: "inputContrast"); f.setValue(1.0, forKey: "inputSaturation"); f.setValue(0.005, forKey: "inputBrightness"); img = f.outputImage! }

// 2) Kırp / boyutlandır
let ext = img.extent
var scale: CGFloat = 1
if a[3] == "fit" {
  let L = CGFloat(Double(a[4])!)
  scale = min(1, L / max(ext.width, ext.height))
  img = lanczos(img, scale)
} else {
  let W = CGFloat(Double(a[4])!), H = CGFloat(Double(a[5])!)
  let fx = CGFloat(Double(a[6])!), fy = CGFloat(Double(a[7])!)
  let target = W / H
  var cw = ext.width, ch = ext.height
  if cw / ch > target { cw = ch * target } else { ch = cw / target }
  let cx = ext.minX + (ext.width - cw) * fx
  let cy = ext.minY + (ext.height - ch) * (1 - fy) // CI y-ekseni alttan
  img = img.cropped(to: CGRect(x: cx, y: cy, width: cw, height: ch))
  img = img.transformed(by: CGAffineTransform(translationX: -cx, y: -cy))
  scale = W / cw
  img = lanczos(img, scale)
}
// Lanczos kalitesinde küçültme sonrası hafif keskinlik
if let f = CIFilter(name: "CISharpenLuminance") { f.setValue(img, forKey: kCIInputImageKey); f.setValue(0.32, forKey: "inputSharpness"); img = f.outputImage! }
let out = img.cropped(to: CGRect(x: 0, y: 0, width: floor(img.extent.width), height: floor(img.extent.height)))
guard let cg = ctx.createCGImage(out, from: out.extent) else { print("render fail"); exit(3) }
let dest = CGImageDestinationCreateWithURL(outURL as CFURL, UTType.jpeg.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, cg, [kCGImageDestinationLossyCompressionQuality: Double(ProcessInfo.processInfo.environment["Q"] ?? "0.78")!, kCGImagePropertyOrientation: 1] as CFDictionary)
CGImageDestinationFinalize(dest)
print("ok \(cg.width)x\(cg.height)")
