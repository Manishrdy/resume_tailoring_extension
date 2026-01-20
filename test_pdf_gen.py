
import json
import os
import sys

# Add backend to python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from src.models.resume import Resume
from src.services.template_document_generator import get_template_generator

def generate_pdf_from_json():
    import tkinter as tk
    from tkinter import filedialog

    # Initialize tkinter root and hide window
    root = tk.Tk()
    root.withdraw()

    print("Please select a JSON resume file...")
    json_path = filedialog.askopenfilename(
        title="Select JSON Resume",
        filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
    )

    if not json_path:
        print("No file selected. Exiting.")
        return

    # Create output filename based on input
    input_filename = os.path.basename(json_path)
    output_filename = os.path.splitext(input_filename)[0] + "_manish_style.pdf"
    
    # Path to the output PDF file
    output_pdf_path = os.path.join(os.path.dirname(json_path), output_filename)

    print(f"Loading JSON from: {json_path}")
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Extract the tailored resume part
        if "tailoredResume" not in data:
            print("Error: JSON does not contain 'tailoredResume' key.")
            return

        resume_data = data["tailoredResume"]
        
        # Instantiate Resume model
        print("Parsing JSON data into Resume model...")
        resume = Resume(**resume_data)
        
        # Initialize the generator
        print("Initializing TemplateDocumentGenerator...")
        # template_dir defaults to backend/templates which is what we want
        generator = get_template_generator()
        
        # Generate PDF
        template_name = "resume_template_manish_style.html"
        print(f"Generating PDF for {resume.personalInfo.name} using {template_name}...")
        pdf_bytes = generator.generate_pdf(resume, template_name=template_name)
        
        # Save PDF to file
        with open(output_pdf_path, "wb") as f:
            f.write(pdf_bytes)
            
        print(f"Success! PDF computed and saved to: {os.path.abspath(output_pdf_path)}")
        print(f"PDF Size: {len(pdf_bytes)} bytes")

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    generate_pdf_from_json()
