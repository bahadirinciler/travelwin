#!/bin/sh
# Casa Di Datça görsellerini kaynaktan yeniden üretir (rötuş + web boyutu).
T="$(cd "$(dirname "$0")" && pwd)"; R="$T/.retouch-bin"; [ -x "$R" ] || swiftc -O "$T/retouch.swift" -o "$R" || exit 1; O="$HOME/Desktop/GORSELLER/CASADIDATCA/OTEL FOTOĞRAF"; D="$HOME/travelwin/assets/casadidatca"
mkdir -p "$D/gallery" "$D/thumbs" "$D/rooms" "$D/story"
run(){ Q=$Q "$R" "$O/$1" "$D/$2" $3 $4 $5 $6 $7 >/dev/null || echo "FAIL $2"; }
Q=0.7 run "DIŞ ALAN/IMG_6771.jpg" hero.jpg fit 2000
for p in "DIŞ ALAN/IMG_6735.jpg:havuz-aksam" "DIŞ ALAN/IMG_6531.jpg:tas-villa" "DRONE/DJI_0982.jpg:drone-gunbatimi" "RESTORANT/IMG_6707.jpg:restoran-teras" "RESTORANT/RC407958.jpg:kahvalti" "ORTAK ALAN/IMG_6639.jpg:salon-manzara" "ORTAK ALAN/IMG_6651.jpg:somine-kutuphane" "DIŞ ALAN/RC407942.jpg:tas-kemer" "DIŞ ALAN/IMG_6799.jpg:bahce-yolu" "DIŞ ALAN/IMG_6743.jpg:havuz-gece"; do
  src="${p%%:*}"; n="${p##*:}"
  Q=0.68 run "$src" "gallery/$n.jpg" fit 1600
  Q=0.66 run "$src" "thumbs/$n.jpg" fit 640
done
for p in "AREZZO/IMG_6308.jpg:arezzo" "CİNQUE TERRE/IMG_6587.jpg:cinque-terre" "GARDA/IMG_6410.jpg:garda" "İSEO-COMO-MAGİORE/IMG_6376.jpg:iseo" "LERİCCİ/IMG_6330.jpg:lerici" "LUCCA/IMG_6241.jpg:lucca" "ORVİETO/IMG_6262.jpg:orvieto" "PORTOFİNO/IMG_6575.jpg:portofino" "ELBA/WhatsApp Image 2026-06-10 at 23.07.27 (1).jpeg:elba"; do
  Q=0.68 run "${p%%:*}" "rooms/${p##*:}.jpg" fit 1100
done
for p in "DIŞ ALAN/IMG_6771.jpg:villa-aksam:0.5" "DIŞ ALAN/IMG_6735.jpg:havuz:0.55" "RESTORANT/IMG_6707.jpg:restoran:0.5" "RESTORANT/RC407958.jpg:kahvalti:0.42" "DIŞ ALAN/RC407860.jpg:yesil-kapi:0.5" "DIŞ ALAN/RC407942.jpg:tas-kemer:0.45" "DRONE/DJI_0982.jpg:drone:0.45" "CİNQUE TERRE/IMG_6587.jpg:oda:0.55"; do
  src="${p%%:*}"; rest="${p#*:}"; n="${rest%%:*}"; fx="${rest##*:}"
  Q=0.74 run "$src" "story/$n.jpg" cover 1080 1920 $fx 0.5
done
mkdir -p "$D/story/thumbs"
for f in "$D"/story/*.jpg; do sips -Z 640 -s formatOptions 70 "$f" --out "$D/story/thumbs/$(basename "$f")" >/dev/null; done
# Capri (bahçe evi) — telefon çekimi, ayrı klasörde
C="$HOME/Desktop/GORSELLER/CASADIDATCA/OTEL FOTOĞRAF.../CAPRİ"
runc(){ Q=$Q "$R" "$C/$1" "$D/$2" $3 $4 $5 $6 $7 >/dev/null || echo "FAIL $2"; }
Q=0.7 runc "IMG_20250621_120052.jpg" rooms/capri.jpg fit 1100
Q=0.68 runc "IMG_20250621_120052.jpg" gallery/capri-veranda.jpg fit 1600
Q=0.66 runc "IMG_20250621_120052.jpg" thumbs/capri-veranda.jpg fit 640
Q=0.74 runc "IMG_20250621_115839.jpg" story/capri-bahce.jpg cover 1080 1920 0.5 0.5
sips -Z 640 -s formatOptions 70 "$D/story/capri-bahce.jpg" --out "$D/story/thumbs/capri-bahce.jpg" >/dev/null
