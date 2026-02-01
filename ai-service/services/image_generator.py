"""
Image Generator Service - Crime Scene Photos using Google Gemini

Generates atmospheric black & white crime scene photographs in CIA dossier style
using Google's Gemini API (Imagen 3).

Each scenario gets 3 images:
1. Crime scene overview
2. Primary evidence (murder weapon or main clue)
3. Secondary evidence
"""

import os
import asyncio
import logging
import base64
import time
from typing import Optional

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


# === Prompt Templates ===
# NOTE: Prompts explicitly mention "mystery game" and "fictional" to help with safety filters
# - Emphasize theatrical/game context
# - Focus on "investigation scene" rather than "crime scene"
# - Documentary/archival aesthetic for immersion

GAME_CONTEXT = "For a fictional murder mystery detective game, theatrical prop photo:"

SCENE_OVERVIEW_TEMPLATE = """{game_context} RAW candid photograph, black and white, classified FBI case file photo, 1960s aesthetic. {location_description}. Police investigation tape cordoning off the area. Detectives examining the scene with flashlights. {additional_details}. Harsh camera flash, heavy film grain, gritty texture, high contrast, 35mm documentary photograph, cinematic, 8k --ar 4:3"""

EVIDENCE_PHOTO_TEMPLATE = """{game_context} RAW candid photograph, black and white forensic evidence photo, classified FBI case file style, 1960s aesthetic. Close-up of {evidence_description} next to yellow evidence marker labeled {marker_number}. {context}. Harsh camera flash, heavy film grain, gritty texture, high contrast, 35mm documentary photograph, cinematic, 8k --ar 4:3"""


class ImageGenerator:
    """
    Generates crime scene photographs using Google Gemini's Imagen 3.
    
    Creates 3 atmospheric images per scenario:
    - Scene overview with victim
    - Primary evidence close-up
    - Secondary evidence close-up
    """
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        self.enabled = bool(self.api_key)
        self.client: Optional[genai.Client] = None
        
        if self.enabled:
            self.client = genai.Client(api_key=self.api_key)
            logger.info("✅ ImageGenerator initialized with Gemini API")
        else:
            logger.warning("⚠️ ImageGenerator disabled - GOOGLE_GEMINI_API_KEY not set")
    
    async def generate_crime_scene_images(self, scenario: dict) -> list[str]:
        """
        Generate 3 crime scene images for a scenario.
        
        Args:
            scenario: The full scenario dict with setting, victim, solution, etc.
            
        Returns:
            List of 3 base64-encoded images, or empty list if generation fails.
        """
        if not self.enabled or not self.client:
            logger.warning("Image generation skipped - API not configured")
            return []
        
        start_time = time.time()
        logger.info("=" * 60)
        logger.info("📸 STARTING IMAGE GENERATION")
        logger.info("=" * 60)
        
        try:
            # Build prompts from scenario
            prompts = self._build_prompts(scenario)
            
            logger.info(f"Generated {len(prompts)} prompts:")
            for i, prompt in enumerate(prompts, 1):
                logger.info(f"  {i}. {prompt[:80]}...")
            
            # Generate images in parallel
            images = await self._generate_images_parallel(prompts)
            
            duration = time.time() - start_time
            logger.info(f"✅ Image generation complete in {duration:.2f}s")
            logger.info(f"   Generated {len(images)} images")
            logger.info("=" * 60)
            
            return images
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"❌ Image generation failed after {duration:.2f}s: {e}")
            return []
    
    def _build_prompts(self, scenario: dict) -> list[str]:
        """
        Build 3 image prompts from scenario data.
        
        Extracts relevant information and creates prompts for:
        1. Crime scene overview
        2. Murder weapon / primary evidence
        3. Secondary evidence from critical clues
        """
        setting = scenario.get("setting", "")
        victim = scenario.get("victim", {})
        solution = scenario.get("solution", {})
        
        victim_name = victim.get("name", "the victim")
        victim_role = victim.get("role", "")
        weapon = solution.get("weapon", "a blunt object")
        critical_clues = solution.get("critical_clues", [])
        
        # Extract location from setting (first sentence usually)
        location = self._extract_location(setting)
        
        prompts = []
        
        # 1. Scene Overview - Investigation scene for mystery game
        scene_prompt = SCENE_OVERVIEW_TEMPLATE.format(
            game_context=GAME_CONTEXT,
            location_description=location,
            additional_details=f"Papers and personal effects scattered nearby. Overturned furniture suggesting a struggle"
        )
        prompts.append(scene_prompt)
        
        # 2. Primary Evidence - Murder Weapon
        weapon_prompt = EVIDENCE_PHOTO_TEMPLATE.format(
            game_context=GAME_CONTEXT,
            evidence_description=self._translate_to_english(weapon),
            marker_number="1",
            context="Found at the scene. Forensic ruler placed for scale"
        )
        prompts.append(weapon_prompt)
        
        # 3. Secondary Evidence - First critical clue
        if critical_clues:
            secondary_evidence = self._extract_evidence_from_clue(critical_clues[0])
            secondary_prompt = EVIDENCE_PHOTO_TEMPLATE.format(
                game_context=GAME_CONTEXT,
                evidence_description=secondary_evidence,
                marker_number="2",
                context="Recovered from the investigation area. Bagged for forensic analysis"
            )
            prompts.append(secondary_prompt)
        else:
            # Fallback if no clues
            fallback_prompt = EVIDENCE_PHOTO_TEMPLATE.format(
                game_context=GAME_CONTEXT,
                evidence_description="a torn document with partial text visible",
                marker_number="2",
                context="Found at the scene. Paper appears recently handled"
            )
            prompts.append(fallback_prompt)
        
        return prompts
    
    def _extract_location(self, setting: str) -> str:
        """Extract and translate location description from setting."""
        # Take first sentence or first 100 chars
        if "." in setting:
            location = setting.split(".")[0]
        else:
            location = setting[:100]
        
        # Simple German to English translations for common terms
        translations = {
            "Büro": "office",
            "Villa": "mansion",
            "Haus": "house",
            "Zimmer": "room",
            "Wohnung": "apartment",
            "Firma": "company building",
            "Hotel": "hotel",
            "Restaurant": "restaurant",
            "Keller": "basement",
            "Dachboden": "attic",
            "Garten": "garden",
            "Garage": "garage",
            "Bibliothek": "library",
            "Arbeitszimmer": "study",
            "Schlafzimmer": "bedroom",
            "Wohnzimmer": "living room",
            "Küche": "kitchen",
        }
        
        result = location
        for german, english in translations.items():
            result = result.replace(german, english)
        
        # If still mostly German, provide generic description
        if any(c in result for c in "äöüÄÖÜß"):
            return "A dimly lit interior space"
        
        return result
    
    def _translate_to_english(self, text: str) -> str:
        """Translate common German evidence terms to English."""
        translations = {
            "Messer": "knife",
            "Pistole": "pistol",
            "Revolver": "revolver",
            "Seil": "rope",
            "Gift": "poison vial",
            "Hammer": "hammer",
            "Axt": "axe",
            "Schere": "scissors",
            "Brieföffner": "letter opener",
            "Kerzenständer": "candlestick",
            "Trophäe": "trophy",
            "Statue": "statue",
            "Vase": "vase",
            "Flasche": "bottle",
            "Glas": "glass",
            "Kabel": "cable",
            "Schnur": "cord",
            "Kissen": "pillow",
            "Bronze": "bronze",
            "Auszeichnung": "award",
        }
        
        result = text
        for german, english in translations.items():
            if german.lower() in result.lower():
                result = result.replace(german, english).replace(german.lower(), english)
        
        # If still has German characters, provide generic
        if any(c in result for c in "äöüÄÖÜß"):
            return "a heavy blunt object"
        
        return result
    
    def _extract_evidence_from_clue(self, clue: str) -> str:
        """Extract a physical evidence description from a clue text."""
        # Common evidence patterns
        evidence_keywords = [
            ("Zugangskarte", "an electronic access card"),
            ("Karte", "an ID card"),
            ("E-Mail", "a printed email document"),
            ("Brief", "a handwritten letter"),
            ("Foto", "a photograph"),
            ("Blut", "stained fabric sample"),
            ("Fingerabdruck", "fingerprint evidence card"),
            ("Schuh", "a shoe print cast"),
            ("Haar", "hair sample in evidence bag"),
            ("Faser", "fabric fiber sample"),
            ("Glas", "glass fragments in evidence bag"),
            ("Papier", "torn paper documents"),
            ("Notiz", "a handwritten note"),
            ("Kalender", "a calendar page"),
            ("Telefon", "a mobile phone"),
            ("Schlüssel", "a set of keys"),
            ("Uhr", "a wristwatch"),
            ("Ring", "a ring"),
            ("Schmuck", "jewelry"),
            ("Tasche", "a bag or purse"),
            ("Handschuh", "a glove"),
        ]
        
        clue_lower = clue.lower()
        for german, english in evidence_keywords:
            if german.lower() in clue_lower:
                return english
        
        # Default fallback
        return "a document with handwritten notes"
    
    async def _generate_images_parallel(self, prompts: list[str]) -> list[str]:
        """Generate multiple images in parallel."""
        tasks = [self._generate_single_image(prompt, i) for i, prompt in enumerate(prompts)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out failures
        images = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Image {i+1} failed: {result}")
            elif result:
                images.append(result)
        
        return images
    
    async def _generate_single_image(self, prompt: str, index: int) -> Optional[str]:
        """Generate a single image and return as base64."""
        if not self.client:
            return None
            
        start_time = time.time()
        logger.info(f"  → Generating image {index + 1}...")
        
        try:
            # Use Imagen 4 model for image generation
            response = await asyncio.to_thread(
                self.client.models.generate_images,
                model="imagen-4.0-generate-001",
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="4:3",
                    safety_filter_level="BLOCK_LOW_AND_ABOVE",
                )
            )
            
            duration = time.time() - start_time
            
            if response.generated_images:
                image = response.generated_images[0]
                # Image data is already base64 encoded
                image_base64 = base64.b64encode(image.image.image_bytes).decode('utf-8')
                logger.info(f"  ✓ Image {index + 1} generated in {duration:.2f}s")
                return f"data:image/png;base64,{image_base64}"
            else:
                logger.warning(f"  ⚠️ Image {index + 1}: No image returned")
                return None
                
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"  ✗ Image {index + 1} failed after {duration:.2f}s: {e}")
            return None


# Singleton instance
_image_generator: Optional[ImageGenerator] = None


def get_image_generator() -> ImageGenerator:
    """Get or create the singleton ImageGenerator instance."""
    global _image_generator
    if _image_generator is None:
        _image_generator = ImageGenerator()
    return _image_generator
