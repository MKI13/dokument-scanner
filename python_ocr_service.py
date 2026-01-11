#!/usr/bin/env python3
"""
VERBESSERTER OCR SERVICE MIT OPENCV
Bessere Bildvorverarbeitung für höhere Erkennungsrate
"""

import sys
import json
import cv2
import numpy as np
import pytesseract
from PIL import Image
import os

# Tesseract Config
os.environ['TESSDATA_PREFIX'] = os.path.expanduser('~/.termux/tessdata')

def preprocess_image(image_path):
    """
    Verbesserte Bildvorverarbeitung für OCR
    """
    # Lade Bild
    img = cv2.imread(image_path)
    
    if img is None:
        raise ValueError(f"Konnte Bild nicht laden: {image_path}")
    
    # 1. Konvertiere zu Graustufen
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Rauschentfernung (Bilateral Filter - erhält Kanten)
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)
    
    # 3. Kontrast erhöhen (CLAHE - Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(denoised)
    
    # 4. Adaptive Schwellwertbildung (für besseren Text)
    thresh = cv2.adaptiveThreshold(
        enhanced, 255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 
        11, 2
    )
    
    # 5. Morphologische Operationen (entfernt kleine Störungen)
    kernel = np.ones((1, 1), np.uint8)
    morphed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    # 6. Kantenerkennung verbessern
    sharpening_kernel = np.array([[-1,-1,-1],
                                   [-1, 9,-1],
                                   [-1,-1,-1]])
    sharpened = cv2.filter2D(morphed, -1, sharpening_kernel)
    
    return sharpened

def perform_ocr(image_path, lang='deu'):
    """
    OCR mit verbessertem Tesseract
    """
    try:
        # Vorverarbeitung
        preprocessed = preprocess_image(image_path)
        
        # Tesseract Config für beste Qualität
        custom_config = r'--oem 1 --psm 3'  # LSTM + Auto page segmentation
        
        # OCR
        text = pytesseract.image_to_string(
            preprocessed,
            lang=lang,
            config=custom_config
        )
        
        # Confidence berechnen
        data = pytesseract.image_to_data(
            preprocessed,
            lang=lang,
            config=custom_config,
            output_type=pytesseract.Output.DICT
        )
        
        # Durchschnittliche Confidence
        confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        return {
            'text': text.strip(),
            'confidence': round(avg_confidence, 2),
            'success': True
        }
        
    except Exception as e:
        return {
            'text': '',
            'confidence': 0,
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Kein Bildpfad angegeben'}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    lang = sys.argv[2] if len(sys.argv) > 2 else 'deu'
    
    result = perform_ocr(image_path, lang)
    print(json.dumps(result, ensure_ascii=False))
