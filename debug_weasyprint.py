"""
Debug script to test WeasyPrint directly.
"""
import sys
import os

# Add backend to python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

print("=" * 60)
print("WeasyPrint Debug Script")
print("=" * 60)

# Test 1: Check if WeasyPrint can be imported
print("\n[Test 1] Importing WeasyPrint...")
try:
    from weasyprint import HTML, CSS
    print("  SUCCESS: WeasyPrint imported successfully")
except Exception as e:
    print(f"  FAILED: {type(e).__name__}: {e}")
    sys.exit(1)

# Test 2: Try to render a minimal HTML document
print("\n[Test 2] Rendering minimal HTML...")
minimal_html = """
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Hello World</h1><p>This is a test.</p></body>
</html>
"""

try:
    html_obj = HTML(string=minimal_html)
    pdf_bytes = html_obj.write_pdf()
    print(f"  SUCCESS: Generated PDF with {len(pdf_bytes)} bytes")
except Exception as e:
    print(f"  FAILED: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Try to render with flexbox (which the template uses)
print("\n[Test 3] Rendering HTML with Flexbox CSS...")
flexbox_html = """
<!DOCTYPE html>
<html>
<head>
<style>
.container { display: flex; justify-content: space-between; }
.left { font-weight: bold; }
.right { text-align: right; }
</style>
</head>
<body>
<div class="container">
    <span class="left">Left Content</span>
    <span class="right">Right Content</span>
</div>
</body>
</html>
"""

try:
    html_obj = HTML(string=flexbox_html)
    pdf_bytes = html_obj.write_pdf()
    print(f"  SUCCESS: Generated PDF with {len(pdf_bytes)} bytes")
except Exception as e:
    print(f"  FAILED: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Try to render the actual template
print("\n[Test 4] Rendering actual Manish Style template...")
try:
    from jinja2 import Environment, FileSystemLoader
    from src.models.resume import Resume
    import json

    # Load a sample JSON
    json_path = r"backend\artifacts\Manish_Reddy\manish-backend-engineer-2026\20260117-185158-general\Manish_Reddy_Tailored_2026-01-17.json"
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    resume_data = data["tailoredResume"]
    resume = Resume(**resume_data)
    
    # Setup Jinja2
    template_dir = "backend/templates"
    jinja_env = Environment(loader=FileSystemLoader(template_dir))
    template = jinja_env.get_template("resume_template_manish_style.html")
    
    # Prepare data (simplified)
    template_data = resume.model_dump()
    
    # Map description -> bullets
    for exp in template_data.get('experience', []):
        if 'description' in exp:
            exp['bullets'] = exp['description']
    
    # Render HTML
    html_content = template.render(**template_data)
    print(f"  HTML rendered: {len(html_content)} characters")
    
    # Convert to PDF
    html_obj = HTML(string=html_content, base_url=template_dir)
    pdf_bytes = html_obj.write_pdf()
    
    # Save for inspection
    with open("debug_output.pdf", "wb") as f:
        f.write(pdf_bytes)
    
    print(f"  SUCCESS: Generated PDF with {len(pdf_bytes)} bytes")
    print(f"  Saved to: debug_output.pdf")

except Exception as e:
    print(f"  FAILED: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Debug complete.")
print("=" * 60)
