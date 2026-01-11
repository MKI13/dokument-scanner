#!/usr/bin/env python3
"""
⚡ ULTRA-OPTIMIERTES TESSERACT
Maximale Bildverbesserung
"""

import sys
import json
import pytesseract
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
import os

os.environ['TESSDATA_PREFIX'] = os.path.expanduser('~/.termux/tessdata')

def ultra_preprocess(image_path):
    """Extreme Bildoptimierung"""
    img = Image.open(image_path)
    
    # 1. Größe erhöhen (2x)
    width, height = img.size
    img = img.resize((width * 2, height * 2), Image.LANCZOS)
    
    # 2. Graustufen
    img = img.convert('L')
    
    # 3. Auto-Kontrast
    img = ImageOps.autocontrast(img, cutoff=1)
    
    # 4. Extreme Kontrast-Erhöhung
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.5)
    
    # 5. Schärfe maximieren
    for _ in range(2):
        img = img.filter(ImageFilter.SHARPEN)
    
    # 6. Helligkeit
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(1.3)
    
    # 7. Rauschentfernung
    img = img.filter(ImageFilter.MedianFilter(size=3))
    
    # 8. Unsharp Mask
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
    
    return img

def extract_with_multiple_psm(img):
    """Teste verschiedene Modi"""
    configs = [
        ('--oem 1 --psm 3', 'Auto'),
        ('--oem 1 --psm 6', 'Block'),
        ('--oem 1 --psm 4', 'Column'),
        ('--oem 1 --psm 11', 'Sparse'),
    ]
    
    best_result = None
    best_conf = 0
    
    for config, name in configs:
        try:
            text = pytesseract.image_to_string(img, lang='deu', config=config)
            data = pytesseract.image_to_data(img, lang='deu', config=config,
                                            output_type=pytesseract.Output.DICT)
            
            confs = [int(c) for c in data['conf'] if int(c) > 0]
            avg_conf = sum(confs) / len(confs) if confs else 0
            
            print(f"  PSM {name}: {avg_conf:.1f}%", file=sys.stderr)
            
            if avg_conf > best_conf:
                best_conf = avg_conf
                best_result = {
                    'text': text.strip(),
                    'confidence': avg_conf,
                    'psm': name
                }
        except:
            continue
    
    return best_result

def perform_ocr(image_path):
    try:
        print("🔧 Ultra-Optimierung...", file=sys.stderr)
        img = ultra_preprocess(image_path)
        
        print("🔍 Teste Modi...", file=sys.stderr)
        result = extract_with_multiple_psm(img)
        
        if not result:
            return {'success': False, 'error': 'Keine Erkennung'}
        
        print(f"✅ Bester: {result['psm']} ({result['confidence']:.1f}%)", file=sys.stderr)
        
        return {
            'text': result['text'],
            'confidence': round(result['confidence'], 2),
            'success': True,
            'method': f"Tesseract Ultra (PSM {result['psm']})"
        }
    except Exception as e:
        return {'text': '', 'confidence': 0, 'success': False, 'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Kein Bildpfad'}))
        sys.exit(1)
    
    result = perform_ocr(sys.argv[1])
    print(json.dumps(result, ensure_ascii=False))
