import sys
import json
import os
from pathlib import Path

# Add project root to sys.path to allow importing workflow
# Assumes this script is in server/bridge.py and workflow.py is in root
sys.path.append(str(Path(__file__).resolve().parent.parent))

try:
    from workflow import generate_infographic, BASE_DIR
except ImportError as e:
    # Output error as JSON so Node.js can parse it
    print(json.dumps({"success": False, "error": f"ImportError: {str(e)}"}))
    sys.exit(1)

def main():
    try:
        # Read JSON from stdin
        input_data = sys.stdin.read()
        if not input_data:
            raise ValueError("No input data provided")
        
        params = json.loads(input_data)
        
        text = params.get("text")
        style = params.get("style", "craft-handmade")
        layout = params.get("layout", "bento-grid")
        image_count = params.get("imageCount", 1)
        language = params.get("language", "zh")
        
        # Calculate aspect ratio based on layout or default
        aspect = params.get("aspect", "landscape") 

        # Call workflow
        # Note: workflow currently generates one image at a time.
        # For a proper implementation with multiple images, we might need to parallelize this
        # or update workflow.py. For now, we'll generate one and replicate if needed,
        # or just return one.
        
        # Ensure outputs directory exists
        output_root = BASE_DIR / "outputs"
        output_root.mkdir(parents=True, exist_ok=True)

        result = generate_infographic(
            text=text,
            language=language,
            layout=layout,
            style=style,
            aspect=aspect,
            output_root=output_root
        )
        
        # Construct response matching the frontend expectation
        images = []
        
        # Since workflow only generates one image, we add it.
        # If imageCount > 1, we might ideally want to run it multiple times, 
        # but that would be slow and expensive. 
        # For now, we return the single generated image.
        images.append({
            "url": result["image_url"],
            "index": 0,
            "title": result["title"],
            "layout": result["layout"],
            "aspect": result["aspect"]
        })

        response = {
            "success": True,
            "data": {
                "images": images,
                "layout": result["layout"],
                "aspect": result["aspect"],
                "title": result["title"]
            }
        }
        
        print(json.dumps(response))
        
    except Exception as e:
        # Catch all errors and return as JSON
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
